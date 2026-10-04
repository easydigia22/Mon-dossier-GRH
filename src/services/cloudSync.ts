/**
 * Synchronisation de l'état applicatif avec Supabase.
 * Chaque collection correspond à une table ; seules les lignes modifiées sont envoyées.
 */

import { supabase } from './supabase';
import type { AppDatabaseState } from './db';

interface Collection {
  table: string;
  rows: (state: AppDatabaseState) => any[];
  /** Colonnes de liaison dérivées d'un objet (pour les index SQL) */
  extra?: (item: any) => Record<string, any>;
}

const COLLECTIONS: Collection[] = [
  { table: 'entreprises', rows: (s) => (s.entreprise ? [s.entreprise] : []) },
  { table: 'salaries', rows: (s) => s.salaries, extra: (i) => ({ matricule: i.matricule }) },
  { table: 'contrats', rows: (s) => s.contrats, extra: (i) => ({ salarie_id: i.salarieId }) },
  {
    table: 'evenements_presence',
    rows: (s) => s.evenementsPresence,
    extra: (i) => ({ salarie_id: i.salarieId, periode_mois: i.periodeMois ?? null })
  },
  { table: 'demandes_conges', rows: (s) => s.demandesConges, extra: (i) => ({ salarie_id: i.salarieId }) },
  {
    table: 'bulletins',
    rows: (s) => s.bulletins,
    extra: (i) => ({ salarie_id: i.salarieId, periode_mois: i.periodeMois })
  },
  { table: 'regles', rows: (s) => s.regles },
  { table: 'tentatives', rows: (s) => s.tentatives, extra: (i) => ({ mission_id: i.missionId }) },
  { table: 'classes', rows: (s) => s.classes, extra: (i) => ({ code_invitation: i.codeInvitation ?? null }) }
];

const PAGE_SIZE = 1000;
const UPSERT_CHUNK = 200;

/** Dernière version connue côté serveur : table -> (id -> JSON sérialisé) */
let synced: Record<string, Map<string, string>> = {};
let syncedParams: string | null = null;
let syncedUserId: string | null = null;
let queue: Promise<void> = Promise.resolve();

export const cloudEnabled = supabase !== null;

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function resetIfUserChanged(userId: string) {
  if (syncedUserId !== userId) {
    synced = {};
    syncedParams = null;
    syncedUserId = userId;
  }
}

async function fetchAll(table: string): Promise<any[]> {
  const out: any[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase!.from(table).select('id, data').range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return out;
}

/**
 * Charge l'état de l'utilisateur connecté. Retourne null si son espace est encore vide
 * (première connexion) ou si le cloud n'est pas disponible.
 */
export async function loadCloudState(): Promise<AppDatabaseState | null> {
  const userId = await currentUserId();
  if (!supabase || !userId) return null;
  resetIfUserChanged(userId);

  const results = await Promise.all(COLLECTIONS.map((c) => fetchAll(c.table)));
  const { data: paramsRow, error: paramsError } = await supabase
    .from('parametres_app')
    .select('data')
    .maybeSingle();
  if (paramsError) throw paramsError;

  const isEmpty = results.every((r) => r.length === 0) && !paramsRow;
  if (isEmpty) return null;

  const byTable: Record<string, any[]> = {};
  COLLECTIONS.forEach((c, idx) => {
    byTable[c.table] = results[idx].map((r) => r.data);
    synced[c.table] = new Map(results[idx].map((r) => [r.id as string, JSON.stringify(r.data)]));
  });
  syncedParams = paramsRow ? JSON.stringify(paramsRow.data) : null;

  return {
    version: 1,
    derniereSauvegarde: new Date().toISOString(),
    entreprise: byTable.entreprises[0],
    salaries: byTable.salaries,
    contrats: byTable.contrats,
    evenementsPresence: byTable.evenements_presence,
    demandesConges: byTable.demandes_conges,
    bulletins: byTable.bulletins,
    regles: byTable.regles,
    missions: [],
    tentatives: byTable.tentatives,
    classes: byTable.classes,
    parametresApp: paramsRow?.data
  };
}

async function pushDiff(state: AppDatabaseState): Promise<void> {
  const userId = await currentUserId();
  if (!supabase || !userId) return;
  resetIfUserChanged(userId);

  for (const col of COLLECTIONS) {
    const previous = synced[col.table] ?? new Map<string, string>();
    const next = new Map<string, string>();
    const toUpsert: any[] = [];

    for (const item of col.rows(state)) {
      const json = JSON.stringify(item);
      next.set(item.id, json);
      if (previous.get(item.id) !== json) {
        toUpsert.push({ user_id: userId, id: item.id, data: item, updated_at: new Date().toISOString(), ...col.extra?.(item) });
      }
    }
    const toDelete = [...previous.keys()].filter((id) => !next.has(id));

    for (let i = 0; i < toUpsert.length; i += UPSERT_CHUNK) {
      const { error } = await supabase.from(col.table).upsert(toUpsert.slice(i, i + UPSERT_CHUNK), { onConflict: 'user_id,id' });
      if (error) throw error;
    }
    for (let i = 0; i < toDelete.length; i += UPSERT_CHUNK) {
      const { error } = await supabase.from(col.table).delete().in('id', toDelete.slice(i, i + UPSERT_CHUNK));
      if (error) throw error;
    }
    // Ne mémoriser l'état qu'une fois la table entièrement synchronisée
    synced[col.table] = next;
  }

  const paramsJson = JSON.stringify(state.parametresApp);
  if (paramsJson !== syncedParams) {
    const { error } = await supabase
      .from('parametres_app')
      .upsert({ user_id: userId, data: state.parametresApp, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    syncedParams = paramsJson;
  }
}

/** Envoie les modifications vers Supabase ; les appels sont exécutés l'un après l'autre. */
export function saveCloudState(state: AppDatabaseState): Promise<void> {
  const run = queue.then(() => pushDiff(state));
  queue = run.catch(() => undefined);
  return run;
}

/** À appeler à la déconnexion pour ne pas mélanger les données de deux comptes. */
export function resetCloudCache() {
  synced = {};
  syncedParams = null;
  syncedUserId = null;
}

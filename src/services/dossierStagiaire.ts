/**
 * Chargement, côté formateur, du dossier de travail complet d'un stagiaire.
 * S'appuie sur les policies RLS "formateur_read_roster" (migration 20261014000000) :
 * sans droit, chaque requête renvoie simplement 0 ligne, sans erreur. Le filtre
 * .eq('user_id', ...) ne porte aucune sécurité (c'est la RLS qui décide) ; il évite
 * seulement de rapatrier d'autres dossiers.
 */

import { supabase } from './supabase';
import type {
  Entreprise, Salarie, Contrat, EvenementPresence, DemandeConge, BulletinPaie
} from '../types';

export interface DossierStagiaire {
  entreprise?: Entreprise;
  salaries: Salarie[];
  contrats: Contrat[];
  evenementsPresence: EvenementPresence[];
  demandesConges: DemandeConge[];
  bulletins: BulletinPaie[];
  /** ISO : fraîcheur affichée dans le bandeau de l'écran. */
  chargeLe: string;
}

const dossierVide = (): DossierStagiaire => ({
  entreprise: undefined,
  salaries: [],
  contrats: [],
  evenementsPresence: [],
  demandesConges: [],
  bulletins: [],
  chargeLe: new Date().toISOString()
});

export async function fetchDossierStagiaire(userId: string): Promise<DossierStagiaire> {
  if (!supabase) return dossierVide();

  const q = (table: string) => supabase!.from(table).select('data').eq('user_id', userId);

  const [ent, sal, con, pre, cng, bul] = await Promise.all([
    q('entreprises'),
    q('salaries'),
    q('contrats'),
    q('evenements_presence'),
    q('demandes_conges'),
    q('bulletins')
  ]);

  const premiereErreur = [ent, sal, con, pre, cng, bul].find((r) => r.error);
  if (premiereErreur?.error) throw premiereErreur.error;

  const lignes = <T>(r: { data: { data: unknown }[] | null }): T[] =>
    (r.data ?? []).map((row) => row.data as T);

  const entreprises = lignes<Entreprise>(ent);

  return {
    entreprise: entreprises[0],
    salaries: lignes<Salarie>(sal),
    contrats: lignes<Contrat>(con),
    evenementsPresence: lignes<EvenementPresence>(pre),
    demandesConges: lignes<DemandeConge>(cng),
    bulletins: lignes<BulletinPaie>(bul),
    chargeLe: new Date().toISOString()
  };
}

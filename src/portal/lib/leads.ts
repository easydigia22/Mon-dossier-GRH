/**
 * Accès Supabase aux leads du portail (newsletter + lead magnet).
 *
 * - Insertion publique (opt-in, consentement obligatoire).
 * - Aucune lecture publique : les leads ne sont lisibles que par un
 *   administrateur (RLS). Les fonctions de lecture ci-dessous n'ont de sens
 *   que dans l'espace admin.
 */
import { supabase } from '../../services/supabase';

const TABLE = 'portail_leads';

export type SourceLead = 'newsletter' | 'guide-paie' | 'autre';

export interface Lead {
  id: string;
  email: string;
  prenom?: string | null;
  source: SourceLead;
  createdAt: string;
}

export interface NouveauLead {
  email: string;
  prenom?: string;
  source: SourceLead;
  consentement: boolean;
}

/** Validation e-mail simple (défense de surface ; la base revérifie). */
export function emailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Enregistre un lead opt-in. Un doublon (même e-mail + même source) est traité
 * comme un succès silencieux (la personne est déjà inscrite).
 */
export async function soumettreLead(input: NouveauLead): Promise<void> {
  if (!supabase) {
    throw new Error("L'inscription n'est pas disponible pour le moment.");
  }
  if (!input.consentement) {
    throw new Error('Le consentement est requis.');
  }
  if (!emailValide(input.email)) {
    throw new Error('Adresse e-mail invalide.');
  }
  const { error } = await supabase.from(TABLE).insert({
    email: input.email.trim(),
    prenom: input.prenom?.trim() || null,
    source: input.source,
    consentement: true,
  });
  // 23505 = violation de contrainte unique → déjà inscrit : on considère que
  // c'est un succès (ne pas révéler l'existence du lead, ne pas bloquer l'UX).
  if (error && (error as any).code !== '23505') throw error;
}

/* -------------------------------------------------------------------------- */
/* Administration (lecture réservée admin via RLS).                           */
/* -------------------------------------------------------------------------- */

function versLead(row: any): Lead {
  return {
    id: row.id,
    email: row.email,
    prenom: row.prenom ?? null,
    source: row.source,
    createdAt: row.created_at,
  };
}

export async function fetchLeadsAdmin(): Promise<Lead[]> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, email, prenom, source, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(versLead);
}

export async function supprimerLead(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/** Construit un contenu CSV (séparateur « ; » pour Excel FR) à partir des leads. */
export function leadsVersCsv(leads: Lead[]): string {
  const entete = ['Email', 'Prénom', 'Source', 'Date'];
  const lignes = leads.map((l) => [
    l.email,
    l.prenom ?? '',
    l.source,
    new Date(l.createdAt).toLocaleString('fr-FR'),
  ]);
  const echappe = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [entete, ...lignes].map((cols) => cols.map(echappe).join(';')).join('\r\n');
}

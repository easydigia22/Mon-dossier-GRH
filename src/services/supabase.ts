import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retire espaces, BOM et caractères invisibles : une valeur collée avec un caractère non ASCII
// fait échouer fetch() ("String contains non ISO-8859-1 code point").
const clean = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const cleaned = value.replace(/[^\x21-\x7E]/g, '');
  return cleaned || undefined;
};

const url = clean(import.meta.env.VITE_SUPABASE_URL);
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

/**
 * Client Supabase côté navigateur (clé publique "anon" uniquement — la sécurité repose sur la RLS).
 * Null si les variables d'environnement sont absentes : l'application reste alors en mode local (IndexedDB).
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

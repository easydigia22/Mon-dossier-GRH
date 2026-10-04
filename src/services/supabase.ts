import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Client Supabase côté navigateur (clé publique "anon" uniquement — la sécurité repose sur la RLS).
 * Null si les variables d'environnement sont absentes : l'application reste alors en mode local (IndexedDB).
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

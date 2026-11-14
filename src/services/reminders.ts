import { supabase } from './supabase';

export interface ParametresRelance {
  active: boolean;
  delaiInactiviteJours: number;
  delaiEntreRelancesJours: number;
}

const DEFAUT: ParametresRelance = {
  active: false,
  delaiInactiviteJours: 7,
  delaiEntreRelancesJours: 7
};

export async function chargerParametresRelance(): Promise<ParametresRelance> {
  if (!supabase) return DEFAUT;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError ?? new Error('Session introuvable.');
  const { data, error } = await supabase
    .from('relance_parametres')
    .select('active, delai_inactivite_jours, delai_entre_relances_jours')
    .eq('formateur_id', auth.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEFAUT;
  return {
    active: data.active,
    delaiInactiviteJours: data.delai_inactivite_jours,
    delaiEntreRelancesJours: data.delai_entre_relances_jours
  };
}

export async function enregistrerParametresRelance(parametres: ParametresRelance): Promise<void> {
  if (!supabase) throw new Error('Les relances automatiques nécessitent une connexion cloud.');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError ?? new Error('Session introuvable.');
  const { error } = await supabase.from('relance_parametres').upsert({
    formateur_id: auth.user.id,
    active: parametres.active,
    delai_inactivite_jours: parametres.delaiInactiviteJours,
    delai_entre_relances_jours: parametres.delaiEntreRelancesJours,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

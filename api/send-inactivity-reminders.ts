/// <reference types="node" />
/**
 * Tâche Vercel quotidienne : relance par e-mail les stagiaires inactifs.
 * Secrets requis (Vercel uniquement) : CRON_SECRET, RESEND_API_KEY,
 * SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, SIMULRH_FROM_EMAIL.
 */

type RequestLike = { headers: Record<string, string | string[] | undefined> };
type ResponseLike = { status: (code: number) => ResponseLike; json: (body: unknown) => void };

interface Parametres {
  formateur_id: string;
  delai_inactivite_jours: number;
  delai_entre_relances_jours: number;
}
interface MembreClasse {
  stagiaire_user_id: string;
  classe_id: string;
  nom: string;
  prenom: string;
  joined_at: string;
}
interface Tentative { user_id: string; updated_at: string }
interface Profil { user_id: string; email: string | null }
interface Journal { stagiaire_user_id: string }

const SECONDES_PAR_JOUR = 86_400_000;

function estAutorise(req: RequestLike) {
  const recu = req.headers.authorization;
  const token = Array.isArray(recu) ? recu[0] : recu;
  return Boolean(process.env.CRON_SECRET && token === `Bearer ${process.env.CRON_SECRET}`);
}

function dateIlYA(jours: number) {
  return new Date(Date.now() - jours * SECONDES_PAR_JOUR).toISOString();
}

function endpoint(table: string, query: string) {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL est manquante.');
  return `${url}/rest/v1/${table}?${query}`;
}

async function lire<T>(table: string, query: string): Promise<T[]> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY est manquante.');
  const response = await fetch(endpoint(table, query), {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  if (!response.ok) throw new Error(`Lecture ${table} impossible (${response.status}).`);
  return response.json() as Promise<T[]>;
}

async function creerJournal(payload: Record<string, unknown>) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const response = await fetch(endpoint('relance_envois', ''), {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Journalisation impossible (${response.status}).`);
}

async function envoyerEmail(destinataire: string, prenom: string) {
  const key = process.env.RESEND_API_KEY;
  const expediteur = process.env.SIMULRH_FROM_EMAIL;
  if (!key || !expediteur) throw new Error('RESEND_API_KEY ou SIMULRH_FROM_EMAIL est manquante.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `SIMULRH <${expediteur}>`,
      to: [destinataire],
      subject: 'SIMULRH : reprenez votre parcours de formation',
      html: `<p>Bonjour ${prenom || 'cher stagiaire'},</p><p>Votre parcours SIMULRH n’a pas enregistré d’activité récente. Reprenez votre dernière mission pour continuer votre progression.</p><p><a href="https://simulrh.one">Accéder à SIMULRH</a></p><p>Vous recevez ce message car votre formateur a activé les relances pédagogiques.</p>`
    })
  });
  if (!response.ok) throw new Error(`Envoi Resend impossible (${response.status}).`);
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (!estAutorise(req)) return res.status(401).json({ ok: false });
  try {
    const parametres = await lire<Parametres>('relance_parametres', 'active=eq.true&select=formateur_id,delai_inactivite_jours,delai_entre_relances_jours');
    let envoyes = 0;

    for (const parametre of parametres) {
      const membres = await lire<MembreClasse>('classe_stagiaires', `classe_user_id=eq.${parametre.formateur_id}&select=stagiaire_user_id,classe_id,nom,prenom,joined_at`);
      if (!membres.length) continue;
      const ids = membres.map((m) => m.stagiaire_user_id).join(',');
      const filtreIds = `in.(${ids})`;
      const [tentatives, profils, journaux] = await Promise.all([
        lire<Tentative>('tentatives', `user_id=${filtreIds}&select=user_id,updated_at`),
        lire<Profil>('profiles', `user_id=${filtreIds}&select=user_id,email`),
        lire<Journal>('relance_envois', `formateur_id=eq.${parametre.formateur_id}&envoye_le=gte.${encodeURIComponent(dateIlYA(parametre.delai_entre_relances_jours))}&select=stagiaire_user_id`)
      ]);
      const derniereActivite = new Map<string, string>();
      for (const tentative of tentatives) {
        if (!derniereActivite.has(tentative.user_id) || derniereActivite.get(tentative.user_id)! < tentative.updated_at) derniereActivite.set(tentative.user_id, tentative.updated_at);
      }
      const emailParUser = new Map(profils.filter((p) => p.email).map((p) => [p.user_id, p.email!]));
      const dejaRelances = new Set(journaux.map((journal) => journal.stagiaire_user_id));

      for (const membre of membres) {
        const derniere = derniereActivite.get(membre.stagiaire_user_id) ?? membre.joined_at;
        const email = emailParUser.get(membre.stagiaire_user_id);
        if (!email || dejaRelances.has(membre.stagiaire_user_id) || new Date(derniere).getTime() > new Date(dateIlYA(parametre.delai_inactivite_jours)).getTime()) continue;
        try {
          await envoyerEmail(email, membre.prenom);
          await creerJournal({ formateur_id: parametre.formateur_id, stagiaire_user_id: membre.stagiaire_user_id, statut: 'envoye' });
          envoyes += 1;
        } catch (error) {
          await creerJournal({ formateur_id: parametre.formateur_id, stagiaire_user_id: membre.stagiaire_user_id, statut: 'echec', erreur: error instanceof Error ? error.message : 'Erreur inconnue' });
        }
      }
    }
    return res.status(200).json({ ok: true, envoyes });
  } catch (error) {
    return res.status(500).json({ ok: false, erreur: error instanceof Error ? error.message : 'Erreur inconnue' });
  }
}

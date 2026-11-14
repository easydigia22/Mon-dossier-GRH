/// <reference types="node" />

type RequestLike = { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown };
type ResponseLike = { status: (code: number) => ResponseLike; json: (body: unknown) => void };

const baseUrl = () => process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey = () => process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

async function authentifier(req: RequestLike): Promise<{ id: string } | null> {
  const authorization = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  if (!authorization || !baseUrl() || !anonKey()) return null;
  const response = await fetch(`${baseUrl()}/auth/v1/user`, { headers: { apikey: anonKey()!, Authorization: authorization } });
  if (!response.ok) return null;
  const user = await response.json() as { id: string };
  return user?.id ? user : null;
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const user = await authentifier(req);
  if (!user || !serviceKey() || !baseUrl()) return res.status(401).json({ ok: false });
  const payload = typeof req.body === 'object' && req.body ? req.body as { message?: unknown; classeId?: unknown } : {};
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  const classeId = typeof payload.classeId === 'string' && payload.classeId.trim() ? payload.classeId.trim() : null;
  if (message.length < 10 || message.length > 2000) return res.status(400).json({ ok: false, erreur: 'Message invalide.' });

  try {
    const headers = { apikey: serviceKey()!, Authorization: `Bearer ${serviceKey()!}`, 'Content-Type': 'application/json' };
    const filtreClasse = classeId ? `&classe_id=eq.${encodeURIComponent(classeId)}` : '';
    const membresResponse = await fetch(`${baseUrl()}/rest/v1/classe_stagiaires?classe_user_id=eq.${user.id}${filtreClasse}&select=stagiaire_user_id,prenom`, { headers });
    if (!membresResponse.ok) throw new Error('Lecture des stagiaires impossible.');
    const membres = await membresResponse.json() as { stagiaire_user_id: string; prenom: string }[];
    const ids = membres.map((m) => m.stagiaire_user_id);
    if (!ids.length) return res.status(200).json({ ok: true, envoyes: 0 });
    const profilsResponse = await fetch(`${baseUrl()}/rest/v1/profiles?user_id=in.(${ids.join(',')})&select=user_id,email`, { headers });
    if (!profilsResponse.ok) throw new Error('Lecture des e-mails impossible.');
    const profils = await profilsResponse.json() as { user_id: string; email: string | null }[];
    const emailParUser = new Map(profils.filter((p) => p.email).map((p) => [p.user_id, p.email!]));
    const resendKey = process.env.RESEND_API_KEY;
    const expediteur = process.env.SIMULRH_FROM_EMAIL;
    if (!resendKey || !expediteur) throw new Error('Configuration e-mail incomplète.');
    let envoyes = 0;
    for (const membre of membres) {
      const email = emailParUser.get(membre.stagiaire_user_id);
      if (!email) continue;
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: `SIMULRH <${expediteur}>`, to: [email], subject: 'Message de votre formateur — SIMULRH', html: `<p>Bonjour ${membre.prenom || ''},</p>${message.split('\n').map((line) => `<p>${line.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>`).join('')}<p><a href="https://simulrh.one">Accéder à SIMULRH</a></p>` })
      });
      if (response.ok) envoyes += 1;
    }
    return res.status(200).json({ ok: true, envoyes });
  } catch (error) {
    return res.status(500).json({ ok: false, erreur: error instanceof Error ? error.message : 'Erreur inconnue' });
  }
}

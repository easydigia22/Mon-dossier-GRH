import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Check, Loader2 } from 'lucide-react';
import { soumettreLead, emailValide } from '../lib/leads';

/* ==========================================================================
   NewsletterBlock — inscription opt-in « Restez informé ».

   Ne bloque aucun contenu : simple proposition volontaire. Consentement
   explicite obligatoire (loi 09-08 CNDP / RGPD), finalité indiquée, lien vers
   la politique de confidentialité. Les leads ne sont lisibles que par un admin.
========================================================================== */

export const NewsletterBlock: React.FC = () => {
  const [email, setEmail] = useState('');
  const [prenom, setPrenom] = useState('');
  const [consent, setConsent] = useState(false);
  const [etat, setEtat] = useState<'idle' | 'envoi' | 'ok' | 'erreur'>('idle');
  const [message, setMessage] = useState('');

  const valide = emailValide(email) && consent;

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valide || etat === 'envoi') return;
    setEtat('envoi');
    setMessage('');
    try {
      await soumettreLead({ email, prenom, source: 'newsletter', consentement: consent });
      setEtat('ok');
      setEmail('');
      setPrenom('');
      setConsent(false);
    } catch (err) {
      setEtat('erreur');
      setMessage(err instanceof Error ? err.message : "L'inscription a échoué. Réessayez plus tard.");
    }
  };

  return (
    <section className="bg-navy text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-teal-soft text-sm font-semibold uppercase tracking-wider mb-2">
            <Mail className="w-4 h-4" /> Newsletter
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Restez informé des nouveautés</h2>
          <p className="text-white/70 text-[15px] leading-relaxed">
            Nouveaux cours, mises à jour fiscales et paie, ressources à télécharger. Un e-mail
            occasionnel, aucune publicité. Désinscription à tout moment.
          </p>
        </div>

        {etat === 'ok' ? (
          <div className="bg-white/10 rounded-2xl p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal/30 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Inscription enregistrée. Merci !</p>
              <p className="text-white/70 text-sm">Vous recevrez nos prochaines nouveautés.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={envoyer} className="bg-white/10 rounded-2xl p-5 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                maxLength={60}
                placeholder="Prénom (facultatif)"
                className="w-full rounded-xl px-3 py-2.5 text-ink bg-white placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-teal"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Votre e-mail"
                className="w-full rounded-xl px-3 py-2.5 text-ink bg-white placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded"
              />
              <span className="text-[12.5px] text-white/75 leading-snug">
                J'accepte de recevoir la newsletter de SimulRH. Voir la{' '}
                <Link to="/confidentialite" className="underline hover:text-white">politique de confidentialité</Link>.
              </span>
            </label>
            {etat === 'erreur' && <p role="alert" className="text-[13px] text-red-200">{message}</p>}
            <button
              type="submit"
              disabled={!valide || etat === 'envoi'}
              className="inline-flex items-center gap-2 bg-teal hover:bg-[#108a80] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              {etat === 'envoi' ? <><Loader2 className="w-4 h-4 animate-spin" /> Inscription…</> : "S'inscrire"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

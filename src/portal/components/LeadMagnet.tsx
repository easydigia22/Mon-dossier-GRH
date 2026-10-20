import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileDown, Check, Loader2, Download } from 'lucide-react';
import { soumettreLead, emailValide } from '../lib/leads';

/* ==========================================================================
   LeadMagnet — « Recevez le guide PDF de la paie marocaine » contre un e-mail.

   Échange de valeur, volontaire. Après opt-in (consentement explicite), le
   téléchargement démarre. Le fichier est servi depuis /public (remplaçable).
========================================================================== */

/** Chemin du guide offert (dans public/). Remplace ce fichier quand tu veux. */
const GUIDE_URL = '/guides/guide-paie-maroc.pdf';
const GUIDE_NOM = 'Guide-paie-Maroc-SimulRH.pdf';

export const LeadMagnet: React.FC = () => {
  const [email, setEmail] = useState('');
  const [prenom, setPrenom] = useState('');
  const [consent, setConsent] = useState(false);
  const [etat, setEtat] = useState<'idle' | 'envoi' | 'ok' | 'erreur'>('idle');
  const [message, setMessage] = useState('');

  const valide = emailValide(email) && consent;

  const telecharger = () => {
    const a = document.createElement('a');
    a.href = GUIDE_URL;
    a.download = GUIDE_NOM;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valide || etat === 'envoi') return;
    setEtat('envoi');
    setMessage('');
    try {
      await soumettreLead({ email, prenom, source: 'guide-paie', consentement: consent });
      setEtat('ok');
      telecharger();
    } catch (err) {
      setEtat('erreur');
      setMessage(err instanceof Error ? err.message : "L'envoi a échoué. Réessayez plus tard.");
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-14">
      <div className="card-soft bg-white overflow-hidden grid md:grid-cols-2">
        <div className="p-8 sm:p-10 bg-teal-soft/50 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 text-teal text-sm font-semibold uppercase tracking-wider mb-3">
            <FileDown className="w-4 h-4" /> Guide gratuit
          </div>
          <h2 className="font-display text-2xl font-bold text-navy mb-3">
            Le guide de la paie au Maroc, en PDF
          </h2>
          <p className="text-ink/75 leading-relaxed text-[15px]">
            L'essentiel pour lire et établir un bulletin : CNSS, AMO, CIMR, barème de l'IR,
            cotisations et net à payer — expliqué pas à pas, avec un exemple chiffré.
          </p>
        </div>

        <div className="p-8 sm:p-10 flex flex-col justify-center">
          {etat === 'ok' ? (
            <div className="text-center">
              <div className="w-11 h-11 rounded-full bg-teal/10 text-teal flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-navy mb-1">C'est parti !</h3>
              <p className="text-sm text-ink/70 mb-4">
                Le téléchargement a démarré. S'il ne se lance pas, cliquez ci-dessous.
              </p>
              <button
                type="button"
                onClick={telecharger}
                className="inline-flex items-center gap-2 bg-teal hover:bg-[#108a80] text-white font-semibold rounded-xl px-5 py-2.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Télécharger le guide
              </button>
            </div>
          ) : (
            <form onSubmit={envoyer} className="space-y-3">
              <p className="text-sm text-ink/60 mb-1">Indiquez votre e-mail pour recevoir le guide :</p>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                maxLength={60}
                placeholder="Prénom (facultatif)"
                className="w-full rounded-xl border border-[#E3D9CB] px-3 py-2.5 text-ink bg-white focus:outline-none focus:ring-2 focus:ring-teal"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Votre e-mail"
                className="w-full rounded-xl border border-[#E3D9CB] px-3 py-2.5 text-ink bg-white focus:outline-none focus:ring-2 focus:ring-teal"
              />
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#E3D9CB] text-teal focus:ring-teal"
                />
                <span className="text-[12.5px] text-ink/70 leading-snug">
                  J'accepte de recevoir le guide et des informations de SimulRH. Voir la{' '}
                  <Link to="/confidentialite" className="text-teal underline">politique de confidentialité</Link>.
                </span>
              </label>
              {etat === 'erreur' && <p role="alert" className="text-[13px] text-red-600">{message}</p>}
              <button
                type="submit"
                disabled={!valide || etat === 'envoi'}
                className="inline-flex items-center gap-2 bg-teal hover:bg-[#108a80] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-5 py-2.5 transition-colors"
              >
                {etat === 'envoi' ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : <><FileDown className="w-4 h-4" /> Recevoir le guide</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

import React, { useEffect, useState } from 'react';
import { Star, Quote, Send, Check, Loader2 } from 'lucide-react';
import { Reveal } from './Reveal';
import { fetchAvisPublies, soumettreAvis, type Avis } from '../lib/avis';

/* ==========================================================================
   AvisSection — avis / témoignages du portail.

   PRINCIPE (identique aux toasts) : aucun avis inventé n'est présenté comme
   réel. Tant qu'aucun vrai avis validé n'existe en base, on affiche des
   EXEMPLES clairement étiquetés « Exemple » (placeholders), jamais passés pour
   authentiques. Les vrais avis arrivent via le formulaire ci-dessous, sont
   modérés (statut 'en_attente'), puis remplacent automatiquement les exemples.
========================================================================== */

/** Témoignages d'EXEMPLE — purement illustratifs, affichés tant qu'aucun vrai
 *  avis validé n'est disponible. Chacun est marqué « Exemple » à l'écran. */
const EXEMPLES: { texte: string; prenom: string; qualite: string }[] = [
  {
    texte:
      "Les cours de paie sont clairs et collent au contexte marocain : CNSS, IR, bulletins… J'ai enfin compris la logique de bout en bout.",
    prenom: 'Salma',
    qualite: 'stagiaire OFPPT',
  },
  {
    texte:
      "Le simulateur avec une entreprise fictive est parfait pour faire pratiquer mes stagiaires en conditions réelles, sans risque.",
    prenom: 'Youssef',
    qualite: 'formateur en gestion',
  },
  {
    texte:
      'Des ressources fiables et gratuites sur le droit du travail. Je m’en sers pour cadrer mes procédures RH au quotidien.',
    prenom: 'Khadija',
    qualite: 'responsable RH, PME',
  },
];

const Etoiles: React.FC<{ note: number }> = ({ note }) => (
  <div className="flex gap-0.5" aria-label={`Note : ${note} sur 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`w-4 h-4 ${n <= note ? 'fill-amber-400 text-amber-400' : 'text-ink/20'}`}
        aria-hidden="true"
      />
    ))}
  </div>
);

const CarteAvis: React.FC<{
  texte: string;
  prenom: string;
  qualite: string;
  note?: number | null;
  exemple?: boolean;
}> = ({ texte, prenom, qualite, note, exemple }) => (
  <div className="card-soft bg-white h-full p-6 relative flex flex-col">
    {exemple && (
      <span className="absolute top-3 right-3 text-[10.5px] font-semibold uppercase tracking-wide text-ink/50 bg-sand rounded-full px-2 py-0.5">
        Exemple
      </span>
    )}
    <Quote className="w-6 h-6 text-teal/40 mb-2 shrink-0" aria-hidden="true" />
    {note ? <div className="mb-2"><Etoiles note={note} /></div> : null}
    <p className="text-[14.5px] text-ink/85 leading-relaxed flex-1">« {texte} »</p>
    <p className="mt-4 text-sm font-semibold text-navy">
      {prenom}
      <span className="font-normal text-ink/60"> — {qualite}</span>
    </p>
  </div>
);

export const AvisSection: React.FC = () => {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    let actif = true;
    fetchAvisPublies()
      .then((a) => {
        if (actif) setAvis(a);
      })
      .finally(() => {
        if (actif) setCharge(true);
      });
    return () => {
      actif = false;
    };
  }, []);

  const aDesVraisAvis = avis.length > 0;
  const aMontrer = aDesVraisAvis
    ? avis.slice(0, 3).map((a) => ({ ...a, exemple: false }))
    : EXEMPLES.map((e) => ({ ...e, note: null as number | null, id: e.prenom, exemple: true }));

  return (
    <section className="bg-sand/60 border-y border-[#ECE3D6]">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold text-navy mb-1">Ce qu'on en dit</h2>
          <p className="text-ink/60">
            {aDesVraisAvis
              ? 'Les retours de celles et ceux qui utilisent le portail.'
              : 'Soyez parmi les premiers à partager votre expérience.'}
          </p>
        </div>

        {/* Mention honnête quand il n'y a pas encore de vrais avis. */}
        {charge && !aDesVraisAvis && (
          <p className="text-[13px] text-ink/55 bg-white/60 border border-[#ECE3D6] rounded-lg px-4 py-2.5 mb-6">
            Exemples illustratifs en attendant vos avis. Aucun témoignage réel n'est encore publié —
            le vôtre apparaîtra ici après validation.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aMontrer.map((a, i) => (
            <Reveal key={a.id} delay={i * 70} className="h-full">
              <CarteAvis
                texte={a.texte}
                prenom={a.prenom}
                qualite={a.qualite}
                note={a.note}
                exemple={a.exemple}
              />
            </Reveal>
          ))}
        </div>

        <div className="mt-10">
          <FormulaireAvis />
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Formulaire de soumission d'un avis (modéré avant publication).             */
/* -------------------------------------------------------------------------- */

const FormulaireAvis: React.FC = () => {
  const [prenom, setPrenom] = useState('');
  const [qualite, setQualite] = useState('');
  const [texte, setTexte] = useState('');
  const [note, setNote] = useState<number>(0);
  const [consent, setConsent] = useState(false);
  const [etat, setEtat] = useState<'idle' | 'envoi' | 'ok' | 'erreur'>('idle');
  const [message, setMessage] = useState('');

  const valide =
    prenom.trim().length >= 1 &&
    qualite.trim().length >= 1 &&
    texte.trim().length >= 10 &&
    consent;

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valide || etat === 'envoi') return;
    setEtat('envoi');
    setMessage('');
    try {
      await soumettreAvis({
        prenom,
        qualite,
        texte,
        note: note > 0 ? note : null,
        consentement: consent,
      });
      setEtat('ok');
      setPrenom('');
      setQualite('');
      setTexte('');
      setNote(0);
      setConsent(false);
    } catch (err) {
      setEtat('erreur');
      setMessage(
        err instanceof Error
          ? err.message
          : "Votre avis n'a pas pu être envoyé. Réessayez plus tard."
      );
    }
  };

  if (etat === 'ok') {
    return (
      <div className="card-soft bg-white p-6 max-w-2xl mx-auto text-center">
        <div className="w-11 h-11 rounded-full bg-teal/10 text-teal flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6" />
        </div>
        <h3 className="font-display text-lg font-bold text-navy mb-1">Merci pour votre retour !</h3>
        <p className="text-sm text-ink/70">
          Votre avis a bien été envoyé. Il sera publié après une courte validation.
        </p>
        <button
          type="button"
          onClick={() => setEtat('idle')}
          className="mt-4 text-teal font-semibold text-sm hover:underline"
        >
          Envoyer un autre avis
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} className="card-soft bg-white p-6 max-w-2xl mx-auto">
      <h3 className="font-display text-lg font-bold text-navy mb-1">Partagez votre avis</h3>
      <p className="text-sm text-ink/60 mb-5">
        Votre témoignage sera publié après validation. Aucune adresse e-mail demandée.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink/80">Prénom</span>
          <input
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            maxLength={60}
            required
            placeholder="Salma"
            className="mt-1 w-full rounded-xl border border-[#E3D9CB] px-3 py-2.5 text-ink bg-white focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink/80">Qualité</span>
          <input
            type="text"
            value={qualite}
            onChange={(e) => setQualite(e.target.value)}
            maxLength={80}
            required
            placeholder="stagiaire OFPPT, formateur, RH…"
            className="mt-1 w-full rounded-xl border border-[#E3D9CB] px-3 py-2.5 text-ink bg-white focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>
      </div>

      <label className="block mt-4">
        <span className="text-sm font-medium text-ink/80">Votre avis</span>
        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          maxLength={600}
          required
          rows={4}
          placeholder="Ce que le portail vous a apporté, concrètement…"
          className="mt-1 w-full rounded-xl border border-[#E3D9CB] px-3 py-2.5 text-ink bg-white focus:outline-none focus:ring-2 focus:ring-teal resize-y"
        />
        <span className="text-[12px] text-ink/45">{texte.trim().length}/600 — 10 caractères minimum</span>
      </label>

      <div className="mt-4">
        <span className="text-sm font-medium text-ink/80">Note (facultative)</span>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNote(note === n ? 0 : n)}
              aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
              className="p-0.5"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  n <= note ? 'fill-amber-400 text-amber-400' : 'text-ink/25 hover:text-amber-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-[#E3D9CB] text-teal focus:ring-teal"
        />
        <span className="text-[13px] text-ink/70 leading-snug">
          J'autorise la publication de mon prénom, de ma qualité et de mon avis sur le portail.
        </span>
      </label>

      {etat === 'erreur' && (
        <p role="alert" className="mt-4 text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!valide || etat === 'envoi'}
        className="mt-5 inline-flex items-center gap-2 bg-teal hover:bg-[#108a80] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3 transition-colors"
      >
        {etat === 'envoi' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Envoi…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Envoyer mon avis
          </>
        )}
      </button>
    </form>
  );
};

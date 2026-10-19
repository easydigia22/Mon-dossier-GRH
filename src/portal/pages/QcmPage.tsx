import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { useContenus } from '../content/ContentContext';
import { NotFoundPage } from './NotFoundPage';

/** QCM interactif : une réponse par question, score et explications. */
export const QcmPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { parSlug } = useContenus();
  const contenu = slug ? parSlug(slug) : undefined;
  const [reponses, setReponses] = useState<Record<number, number>>({});
  const [valide, setValide] = useState(false);

  useSeo({
    titre: contenu?.titre || 'QCM introuvable',
    description: contenu?.resume || "Ce QCM n'existe pas ou n'est plus disponible.",
  });

  if (!contenu || contenu.type !== 'qcm' || !contenu.questions) return <NotFoundPage />;
  const questions = contenu.questions;

  const score = questions.reduce((acc, q, i) => {
    const choix = reponses[i];
    return acc + (choix != null && q.options[choix]?.correcte ? 1 : 0);
  }, 0);
  const toutesRepondu = questions.every((_, i) => reponses[i] != null);

  const recommencer = () => {
    setReponses({});
    setValide(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/qcm" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-navy mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour aux QCM
      </Link>

      <h1 className="font-display text-3xl font-bold text-navy mb-2">{contenu.titre}</h1>
      <p className="text-ink/70 mb-8">{contenu.resume}</p>

      <ol className="space-y-6">
        {questions.map((q, qi) => {
          const choix = reponses[qi];
          return (
            <li key={qi} className="card-soft p-5">
              <p className="font-medium text-navy mb-3">{qi + 1}. {q.enonce}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const choisi = choix === oi;
                  const montrer = valide;
                  let style = 'border-[#E3D8C8] hover:bg-sand';
                  if (choisi && !montrer) style = 'border-teal bg-teal-soft';
                  if (montrer && opt.correcte) style = 'border-success bg-green-50';
                  else if (montrer && choisi && !opt.correcte) style = 'border-danger bg-red-50';
                  return (
                    <label key={oi} className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${style}`}>
                      <input
                        type="radio"
                        name={`q${qi}`}
                        checked={choisi}
                        disabled={valide}
                        onChange={() => setReponses((r) => ({ ...r, [qi]: oi }))}
                        className="accent-teal"
                      />
                      <span className="text-[14.5px] text-ink flex-1">{opt.texte}</span>
                      {valide && opt.correcte && <CheckCircle2 className="w-4 h-4 text-success" />}
                      {valide && choisi && !opt.correcte && <XCircle className="w-4 h-4 text-danger" />}
                    </label>
                  );
                })}
              </div>
              {valide && (
                <p className="mt-3 text-[13.5px] text-ink/75 bg-sand rounded-lg px-3 py-2 border border-[#ECE3D6]">
                  <strong>Explication —</strong> {q.explication}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex items-center gap-4">
        {!valide ? (
          <button
            onClick={() => setValide(true)}
            disabled={!toutesRepondu}
            className="bg-navy text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-navy-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Valider mes réponses
          </button>
        ) : (
          <>
            <div className="font-display text-xl font-bold text-navy">
              Score : {score} / {questions.length}
            </div>
            <button onClick={recommencer} className="inline-flex items-center gap-1.5 text-sm text-teal font-semibold hover:underline">
              <RotateCcw className="w-4 h-4" /> Recommencer
            </button>
          </>
        )}
        {!valide && !toutesRepondu && <span className="text-[13px] text-ink/50">Répondez à toutes les questions.</span>}
      </div>
    </div>
  );
};

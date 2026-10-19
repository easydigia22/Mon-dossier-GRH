import React from 'react';

/**
 * Mini-rendu Markdown (sans dépendance) pour les corps de cours et d'articles.
 * Gère : titres `##`, listes `1.`/`-`, gras `**…**`, et paragraphes.
 * Suffisant pour le contenu éditorial du portail ; un contenu riche (tableaux,
 * images) relèvera d'un éditeur dédié en Phase 3.
 */
function inline(texte: string): React.ReactNode {
  const parts = texte.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

export const Markdown: React.FC<{ source: string }> = ({ source }) => {
  const lignes = source.split('\n');
  const blocs: React.ReactNode[] = [];
  let liste: string[] = [];
  let ordonnee = false;

  const viderListe = (k: number) => {
    if (liste.length === 0) return;
    const items = liste.map((t, i) => <li key={i} className="mb-1">{inline(t)}</li>);
    blocs.push(
      ordonnee ? (
        <ol key={`l${k}`} className="list-decimal pl-6 my-3 text-[15px] leading-relaxed text-ink">{items}</ol>
      ) : (
        <ul key={`l${k}`} className="list-disc pl-6 my-3 text-[15px] leading-relaxed text-ink">{items}</ul>
      )
    );
    liste = [];
  };

  lignes.forEach((brut, i) => {
    const ligne = brut.trim();
    if (!ligne) {
      viderListe(i);
      return;
    }
    if (ligne.startsWith('## ')) {
      viderListe(i);
      blocs.push(<h2 key={i} className="font-display text-xl font-semibold text-navy mt-6 mb-2">{inline(ligne.slice(3))}</h2>);
      return;
    }
    const mOrd = ligne.match(/^(\d+)\.\s+(.*)$/);
    const mPuce = ligne.match(/^[-*]\s+(.*)$/);
    if (mOrd) {
      if (!ordonnee) viderListe(i);
      ordonnee = true;
      liste.push(mOrd[2]);
      return;
    }
    if (mPuce) {
      if (ordonnee) viderListe(i);
      ordonnee = false;
      liste.push(mPuce[1]);
      return;
    }
    viderListe(i);
    blocs.push(<p key={i} className="my-3 text-[15px] leading-relaxed text-ink">{inline(ligne)}</p>);
  });
  viderListe(lignes.length);

  return <div>{blocs}</div>;
};

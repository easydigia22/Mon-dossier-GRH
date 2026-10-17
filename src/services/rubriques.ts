import { RubriquePersonnalisee, RubriquesSalariePeriode } from '../types';

/**
 * Résultat de la répartition des rubriques saisies vers les trois familles
 * attendues par le moteur de calcul (`calculerBulletinPaie`).
 */
export interface RubriquesReparties {
  primesDiverses: { libelle: string; montant: number; imposable: boolean; cotisable: boolean }[];
  indemnitesNonImposables: { libelle: string; montant: number }[];
  avantagesEnNature: { libelle: string; montant: number }[];
}

/**
 * Répartit une liste de rubriques personnalisées selon leur `type` vers les
 * paramètres d'entrée du moteur de paie. C'est ce `type` qui garantit le bon
 * traitement fiscal et social :
 *  - `prime`              → imposable IR + cotisable CNSS/AMO
 *  - `indemnite_exoneree` → exonérée d'IR et hors assiette sociale
 *  - `avantage_nature`    → réintégré à l'assiette puis déduit du net
 */
export function repartirRubriques(rubriques: RubriquePersonnalisee[]): RubriquesReparties {
  const resultat: RubriquesReparties = {
    primesDiverses: [],
    indemnitesNonImposables: [],
    avantagesEnNature: []
  };

  for (const rubrique of rubriques) {
    const { libelle, montant, type } = rubrique;
    switch (type) {
      case 'prime':
        resultat.primesDiverses.push({ libelle, montant, imposable: true, cotisable: true });
        break;
      case 'indemnite_exoneree':
        resultat.indemnitesNonImposables.push({ libelle, montant });
        break;
      case 'avantage_nature':
        resultat.avantagesEnNature.push({ libelle, montant });
        break;
    }
  }

  return resultat;
}

/** Rubriques saisies pour un salarié sur une période (tableau vide si aucune). */
export function getRubriques(
  store: RubriquesSalariePeriode[],
  salarieId: string,
  periodeMois: string
): RubriquePersonnalisee[] {
  const entree = store.find((e) => e.salarieId === salarieId && e.periodeMois === periodeMois);
  return entree ? entree.rubriques : [];
}

/**
 * Ajoute une rubrique au couple salarié/période, de façon immutable (nouveau
 * tableau, nouvelles entrées) pour rester compatible avec l'état React.
 */
export function ajouterRubrique(
  store: RubriquesSalariePeriode[],
  salarieId: string,
  periodeMois: string,
  rubrique: RubriquePersonnalisee
): RubriquesSalariePeriode[] {
  const existe = store.some((e) => e.salarieId === salarieId && e.periodeMois === periodeMois);
  if (!existe) {
    return [...store, { salarieId, periodeMois, rubriques: [rubrique] }];
  }
  return store.map((e) =>
    e.salarieId === salarieId && e.periodeMois === periodeMois
      ? { ...e, rubriques: [...e.rubriques, rubrique] }
      : e
  );
}

/** Supprime la rubrique à l'index donné pour un salarié/période. */
export function supprimerRubrique(
  store: RubriquesSalariePeriode[],
  salarieId: string,
  periodeMois: string,
  index: number
): RubriquesSalariePeriode[] {
  return store.map((e) =>
    e.salarieId === salarieId && e.periodeMois === periodeMois
      ? { ...e, rubriques: e.rubriques.filter((_, i) => i !== index) }
      : e
  );
}

/** Ajoute une même rubrique à tous les salariés listés pour la période. */
export function appliquerRubriqueCategorie(
  store: RubriquesSalariePeriode[],
  salarieIds: string[],
  periodeMois: string,
  rubrique: RubriquePersonnalisee
): RubriquesSalariePeriode[] {
  return salarieIds.reduce(
    (acc, salarieId) => ajouterRubrique(acc, salarieId, periodeMois, rubrique),
    store
  );
}

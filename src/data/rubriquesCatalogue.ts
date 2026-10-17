import { TypeRubriquePersonnalisee } from '../types';

/**
 * Catalogue pédagogique de rubriques de paie marocaines préparamétrées.
 * Chaque entrée porte son `type`, ce qui fige son traitement fiscal et social
 * lors du calcul (voir `repartirRubriques`). Les montants restent saisis par
 * l'utilisateur : le catalogue ne fournit que le libellé et le bon type.
 */
export interface RubriqueCatalogue {
  libelle: string;
  type: TypeRubriquePersonnalisee;
  /** Montant indicatif proposé par défaut (modifiable à la saisie). */
  montantSuggere?: number;
  /** Note courte affichée pour guider le formateur/stagiaire. */
  note?: string;
}

export interface GroupeCatalogue {
  famille: string;
  rubriques: RubriqueCatalogue[];
}

export const CATALOGUE_RUBRIQUES: GroupeCatalogue[] = [
  {
    famille: 'Primes (imposables et cotisables)',
    rubriques: [
      { libelle: 'Prime de rendement', type: 'prime', note: 'Soumise à IR, CNSS et AMO.' },
      { libelle: 'Prime de responsabilité', type: 'prime' },
      { libelle: 'Prime de fonction', type: 'prime' },
      { libelle: 'Prime de caisse', type: 'prime' },
      { libelle: 'Prime d\'assiduité', type: 'prime' },
      { libelle: 'Gratification / 13e mois', type: 'prime' }
    ]
  },
  {
    famille: 'Indemnités exonérées',
    rubriques: [
      { libelle: 'Indemnité de transport', type: 'indemnite_exoneree', montantSuggere: 500, note: 'Exonérée dans la limite du plafond réglementaire.' },
      { libelle: 'Indemnité de panier / repas', type: 'indemnite_exoneree', note: 'Exonérée selon plafond en vigueur.' },
      { libelle: 'Indemnité de salissure', type: 'indemnite_exoneree' },
      { libelle: 'Indemnité de déplacement justifiée', type: 'indemnite_exoneree' }
    ]
  },
  {
    famille: 'Avantages en nature',
    rubriques: [
      { libelle: 'Voiture de fonction', type: 'avantage_nature', note: 'Réintégré à l\'assiette, puis déduit du net versé.' },
      { libelle: 'Logement de fonction', type: 'avantage_nature' }
    ]
  }
];

/** Libellé lisible pour chaque type de rubrique (UI). */
export const LIBELLE_TYPE_RUBRIQUE: Record<TypeRubriquePersonnalisee, string> = {
  prime: 'Prime (imposable + cotisable)',
  indemnite_exoneree: 'Indemnité exonérée',
  avantage_nature: 'Avantage en nature'
};

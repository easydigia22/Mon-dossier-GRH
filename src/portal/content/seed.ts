/**
 * Index de contenus de DÉMONSTRATION (Phase 1).
 *
 * ⚠️ Tous ces contenus portent `demo: true` et `statut: 'brouillon'`.
 * Ils servent UNIQUEMENT à éprouver la structure, la navigation, la recherche
 * et les gabarits. Ils ne sont JAMAIS publiables publiquement et les chiffres
 * qu'ils contiennent sont illustratifs — à remplacer par des contenus sourcés
 * et vérifiés (sources officielles marocaines) avant toute publication réelle.
 */
import type { Contenu } from './types';

const AUTEUR = 'Équipe SimulRH (démo)';

export const CONTENUS_DEMO: Contenu[] = [
  {
    id: 'demo-paie-lecture-bulletin',
    slug: 'lire-un-bulletin-de-paie-marocain',
    type: 'cours',
    rubrique: 'paie',
    titre: 'Lire un bulletin de paie marocain',
    resume:
      'Décomposer un bulletin ligne par ligne : brut, cotisations sociales, impôt sur le revenu et net à payer.',
    publics: ['etudiant', 'stagiaire', 'professionnel'],
    niveau: 'debutant',
    statut: 'brouillon',
    demo: true,
    datePublication: '2026-10-01',
    dateMiseAJour: '2026-10-15',
    auteur: AUTEUR,
    tags: ['bulletin', 'cnss', 'amo', 'ir', 'net à payer'],
    corps: [
      '## De quoi parle ce cours',
      "Ce cours explique comment lire un bulletin de paie, du salaire brut au net à payer. Les montants affichés ici sont des exemples pédagogiques.",
      '## Les grands blocs du bulletin',
      "1. **Éléments de rémunération** : salaire de base, primes, heures supplémentaires.",
      '2. **Cotisations salariales** : part retenue au salarié (sécurité sociale, assurance maladie, retraite complémentaire éventuelle).',
      "3. **Impôt sur le revenu** : calculé après abattements et déductions.",
      '4. **Net à payer** : ce que perçoit effectivement le salarié.',
      '## À vérifier avant publication',
      "Les taux et plafonds de cotisation et le barème de l'impôt doivent être repris des textes officiels en vigueur et datés.",
    ].join('\n\n'),
    sources: [
      {
        intitule: 'Taux et plafonds — à reprendre de la source officielle',
        statutTexte: 'en_vigueur',
        periodeApplication: 'à préciser',
        dateVerification: undefined,
      },
    ],
  },
  {
    id: 'demo-paie-exo-brut-net',
    slug: 'exercice-calcul-du-net-a-partir-du-brut',
    type: 'exercice',
    rubrique: 'paie',
    titre: 'Exercice — Du salaire brut au net',
    resume: "Calculez le net à payer d'un salarié à partir de son brut, étape par étape.",
    publics: ['stagiaire', 'etudiant'],
    niveau: 'intermediaire',
    statut: 'brouillon',
    demo: true,
    dateMiseAJour: '2026-10-10',
    auteur: AUTEUR,
    tags: ['exercice', 'brut', 'net'],
    enonce:
      "Un salarié a un salaire brut mensuel de 6 000 DH (exemple). En appliquant des taux de cotisation illustratifs (total 10 %) et un impôt illustratif de 300 DH, calculez le net à payer.",
    correction:
      "Cotisations : 6 000 × 10 % = 600 DH. Base imposable : 6 000 − 600 = 5 400 DH. Net = 5 400 − 300 = 5 100 DH. (Chiffres purement illustratifs : remplacer par les taux et le barème officiels avant publication.)",
  },
  {
    id: 'demo-paie-qcm-cotisations',
    slug: 'qcm-notions-de-cotisations-sociales',
    type: 'qcm',
    rubrique: 'paie',
    titre: 'QCM — Notions de cotisations sociales',
    resume: 'Vérifiez vos bases sur les cotisations sociales au Maroc.',
    publics: ['stagiaire', 'etudiant'],
    niveau: 'debutant',
    statut: 'brouillon',
    demo: true,
    dateMiseAJour: '2026-10-12',
    auteur: AUTEUR,
    tags: ['qcm', 'cotisations'],
    questions: [
      {
        enonce: 'Les cotisations salariales sont…',
        options: [
          { texte: 'Retenues sur le salaire du salarié', correcte: true },
          { texte: "Payées uniquement par l'employeur", correcte: false },
          { texte: 'Facultatives', correcte: false },
        ],
        explication:
          "Les cotisations salariales sont la part retenue sur le bulletin du salarié ; l'employeur verse en plus sa propre part patronale.",
      },
      {
        enonce: 'Le net à payer correspond à…',
        options: [
          { texte: 'Au salaire brut', correcte: false },
          { texte: 'Au brut diminué des cotisations salariales et de l\'impôt', correcte: true },
          { texte: 'Au brut augmenté des primes', correcte: false },
        ],
        explication:
          'Le net à payer est obtenu après déduction des cotisations salariales puis de l\'impôt sur le revenu.',
      },
    ],
  },
  {
    id: 'demo-droit-contrats',
    slug: 'les-types-de-contrats-de-travail',
    type: 'cours',
    rubrique: 'droit-du-travail',
    titre: 'Les types de contrats de travail',
    resume: 'CDI, CDD et autres formes : à quoi servent-ils et quelles sont leurs conditions.',
    publics: ['etudiant', 'stagiaire', 'professionnel'],
    niveau: 'debutant',
    statut: 'brouillon',
    demo: true,
    dateMiseAJour: '2026-10-08',
    auteur: AUTEUR,
    tags: ['contrat', 'cdi', 'cdd'],
    corps: [
      '## Panorama',
      "Le droit du travail marocain encadre plusieurs formes de contrats. Ce cours en présente la logique générale.",
      '## À vérifier avant publication',
      'Les conditions précises (durée, renouvellement, cas de recours) doivent être reprises du Code du travail avec la référence exacte des articles.',
    ].join('\n\n'),
    sources: [
      {
        intitule: 'Code du travail marocain — articles à citer précisément',
        statutTexte: 'en_vigueur',
        periodeApplication: 'à préciser',
      },
    ],
  },
  {
    id: 'demo-actu-exemple',
    slug: 'exemple-d-article-d-actualite',
    type: 'article',
    rubrique: 'actualites',
    titre: "Exemple d'article d'actualité (démo)",
    resume: "Gabarit d'article avec auteur, dates et sources — à remplacer par un contenu réel sourcé.",
    publics: ['professionnel', 'formateur'],
    niveau: 'intermediaire',
    statut: 'brouillon',
    demo: true,
    datePublication: '2026-10-14',
    dateMiseAJour: '2026-10-16',
    auteur: AUTEUR,
    tags: ['actualité', 'démo'],
    corps: [
      "Ceci est un **article de démonstration**. Il illustre la mise en page d'un article (chapô, corps, encadré sources) mais ne contient aucune information réelle.",
      'Un article publié devra indiquer sa ou ses sources, leur date et, pour toute mesure, si elle est proposée ou entrée en vigueur.',
    ].join('\n\n'),
    sources: [{ intitule: 'Source officielle à renseigner', url: undefined }],
  },
  {
    id: 'demo-ressource-modele',
    slug: 'modele-attestation-de-travail',
    type: 'ressource',
    rubrique: 'ressources',
    titre: "Modèle — Attestation de travail (gabarit démo)",
    resume: 'Gabarit de document à personnaliser. Exemple non contractuel.',
    publics: ['professionnel', 'formateur'],
    niveau: 'debutant',
    statut: 'brouillon',
    demo: true,
    dateMiseAJour: '2026-10-05',
    auteur: AUTEUR,
    tags: ['modèle', 'attestation'],
    fichierUrl: undefined,
  },
  {
    id: 'demo-grh-recrutement',
    slug: 'les-etapes-du-recrutement',
    type: 'cours',
    rubrique: 'grh',
    titre: 'Les étapes du recrutement',
    resume: 'Du besoin au choix du candidat : comprendre le processus de recrutement.',
    publics: ['etudiant', 'stagiaire', 'professionnel'],
    niveau: 'debutant',
    statut: 'brouillon',
    demo: true,
    dateMiseAJour: '2026-10-09',
    auteur: AUTEUR,
    tags: ['recrutement', 'grh'],
    corps: [
      '## Les grandes étapes',
      '1. Définition du besoin et de la fiche de poste.',
      '2. Sourcing et réception des candidatures.',
      '3. Présélection, entretiens, évaluation.',
      '4. Décision, proposition et intégration.',
    ].join('\n\n'),
  },
  {
    id: 'demo-fiscalite-intro',
    slug: 'comprendre-la-loi-de-finances',
    type: 'cours',
    rubrique: 'fiscalite',
    titre: "Comprendre une loi de finances",
    resume: "À quoi sert une loi de finances et comment lire les mesures qui concernent la paie.",
    publics: ['professionnel', 'formateur', 'etudiant'],
    niveau: 'intermediaire',
    statut: 'brouillon',
    demo: true,
    dateMiseAJour: '2026-10-11',
    auteur: AUTEUR,
    tags: ['loi de finances', 'fiscalité'],
    corps: [
      '## Rôle',
      "La loi de finances fixe chaque année les recettes et dépenses de l'État et peut modifier des règles fiscales.",
      '## À vérifier avant publication',
      "Toute mesure citée doit préciser l'année, la référence du texte, et si elle est proposée (projet) ou adoptée et en vigueur.",
    ].join('\n\n'),
    sources: [
      {
        intitule: 'Loi de finances de l\'année — référence exacte à citer',
        statutTexte: 'adopte',
        periodeApplication: 'à préciser',
      },
    ],
  },
];

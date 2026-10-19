/**
 * Modèle de contenu du portail SimulRH.
 *
 * NOTE IMPORTANTE — Phase 1 (préversion) :
 * Les contenus sont pour l'instant servis depuis un index statique (`seed.ts`),
 * tous marqués `demo: true` et donc NON publiables publiquement. En Phase 2,
 * ce module sera remplacé par un accès Supabase (table `contenus`) avec le même
 * contrat de types, de sorte que les pages n'aient pas à changer.
 */

/** Rubriques de premier niveau du portail (correspondent aux URLs /grh, /paie, …). */
export type Rubrique =
  | 'grh'
  | 'paie'
  | 'droit-du-travail'
  | 'fiscalite'
  | 'actualites'
  | 'ofppt'
  | 'ressources';

/** Nature pédagogique d'un contenu. */
export type TypeContenu = 'cours' | 'exercice' | 'qcm' | 'article' | 'ressource';

/** Public visé — sert aux filtres du catalogue. */
export type Public = 'etudiant' | 'stagiaire' | 'formateur' | 'professionnel';

/** Niveau de difficulté — sert aux filtres du catalogue. */
export type Niveau = 'debutant' | 'intermediaire' | 'avance';

/** Statut éditorial : seul `publie` est visible du public (jamais en Phase 1). */
export type StatutContenu = 'brouillon' | 'publie' | 'depublie';

/**
 * Référence vérifiable attachée à un contenu juridique / social / fiscal.
 * Le gabarit éditorial impose ces champs pour toute affirmation réglementaire
 * (exigence du cahier des charges : source + lien + date + période d'application).
 */
export interface Source {
  intitule: string;
  url?: string;
  /** Date à laquelle la règle a été vérifiée (ISO AAAA-MM-JJ). */
  dateVerification?: string;
  /** Période d'application du texte (ex. « à compter du 01/01/2025 »). */
  periodeApplication?: string;
  /** Un texte proposé mais non encore adopté/en vigueur doit être signalé. */
  statutTexte?: 'adopte' | 'propose' | 'en_vigueur';
}

export interface OptionQcm {
  texte: string;
  correcte: boolean;
}

export interface QuestionQcm {
  enonce: string;
  options: OptionQcm[];
  /** Explication affichée après réponse, quelle que soit l'option choisie. */
  explication: string;
}

export interface Contenu {
  id: string;
  slug: string;
  type: TypeContenu;
  rubrique: Rubrique;
  titre: string;
  /** Résumé court affiché dans les listes et les cartes. */
  resume: string;
  publics: Public[];
  niveau: Niveau;
  statut: StatutContenu;
  /**
   * Contenu de démonstration. TOUJOURS `true` en Phase 1. Un contenu `demo`
   * n'est jamais considéré comme publiable publiquement, même si `statut` dit
   * autre chose — voir `estPublic()` dans `store.ts`.
   */
  demo: boolean;
  datePublication?: string;
  dateMiseAJour?: string;
  auteur?: string;
  tags?: string[];
  sources?: Source[];
  /** Corps du cours / de l'article en Markdown léger (sections). */
  corps?: string;
  /** Pour un exercice : énoncé puis correction affichable à la demande. */
  enonce?: string;
  correction?: string;
  /** Pour un QCM. */
  questions?: QuestionQcm[];
  /** Pour une ressource téléchargeable (gabarit, fiche). */
  fichierUrl?: string;
}

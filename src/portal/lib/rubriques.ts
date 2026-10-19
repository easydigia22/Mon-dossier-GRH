import {
  Users, Calculator, Gavel, Receipt, Newspaper, GraduationCap, Folder,
  type LucideIcon,
} from 'lucide-react';
import type { Rubrique } from '../content/types';

export interface RubriqueMeta {
  cle: Rubrique;
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Photo d'illustration (en-tête des cartes de rubrique). */
  image: string;
  /** Vidéo d'illustration optionnelle, affichée en fond du bandeau de rubrique. */
  video?: string;
  /** Sous-thèmes présentés sur la page de rubrique (structure éditoriale). */
  sousThemes: string[];
}

export const RUBRIQUES: RubriqueMeta[] = [
  {
    cle: 'grh',
    path: '/grh',
    label: 'GRH',
    description: 'Recrutement, compétences, formation, évaluation et administration du personnel.',
    icon: Users,
    image: '/portal/rubriques/grh.jpg',
    sousThemes: ['Recrutement', 'Gestion des compétences', 'Formation', 'Évaluation', 'Administration du personnel'],
  },
  {
    cle: 'paie',
    path: '/paie',
    label: 'Paie au Maroc',
    description: 'Cours, lecture du bulletin, cas pratiques, exercices corrigés et outils de simulation.',
    icon: Calculator,
    image: '/portal/rubriques/paie.jpg',
    video: '/portal/rubriques/paie.mp4',
    sousThemes: ['Cours de paie', 'Lecture du bulletin', 'Cas pratiques', 'Exercices corrigés', 'Simulateurs'],
  },
  {
    cle: 'droit-du-travail',
    path: '/droit-du-travail',
    label: 'Droit du travail',
    description: 'Contrats, durée du travail, congés, rupture du contrat et relations professionnelles.',
    icon: Gavel,
    image: '/portal/rubriques/droit-du-travail.jpg',
    sousThemes: ['Contrats', 'Durée du travail', 'Congés', 'Rupture du contrat', 'Relations professionnelles'],
  },
  {
    cle: 'fiscalite',
    path: '/fiscalite',
    label: 'Fiscalité & lois de finances',
    description: 'Dossiers classés par année, explications pédagogiques et cas pratiques.',
    icon: Receipt,
    image: '/portal/rubriques/fiscalite.jpg',
    sousThemes: ['Lois de finances par année', 'Impôt sur le revenu', 'Explications pédagogiques', 'Cas pratiques'],
  },
  {
    cle: 'actualites',
    path: '/actualites',
    label: 'Actualités',
    description: 'Articles économiques et financiers classés par thème, date et source.',
    icon: Newspaper,
    image: '/portal/rubriques/actualites.jpg',
    sousThemes: ['Social', 'Fiscal', 'Économie', 'Entreprise'],
  },
  {
    cle: 'ofppt',
    path: '/ofppt',
    label: 'Espace OFPPT',
    description: 'Ressources organisées par filière, module et niveau lorsque les correspondances sont vérifiées.',
    icon: GraduationCap,
    image: '/portal/rubriques/ofppt.jpg',
    sousThemes: ['Par filière', 'Par module', 'Par niveau'],
  },
  {
    cle: 'ressources',
    path: '/ressources',
    label: 'Ressources pro',
    description: 'Modèles, fiches pratiques, tableaux et documents téléchargeables.',
    icon: Folder,
    image: '/portal/rubriques/ressources.jpg',
    sousThemes: ['Modèles de documents', 'Fiches pratiques', 'Tableaux', 'Check-lists'],
  },
];

export function rubriqueMeta(cle: Rubrique): RubriqueMeta | undefined {
  return RUBRIQUES.find((r) => r.cle === cle);
}

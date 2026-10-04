/**
 * Modèle de données pédagogique - Mon Dossier Administratif
 * Simulateur RH & Paie pour la formation OFPPT au Maroc
 */

export type ModePedagogique = 'demonstration' | 'entrainement' | 'evaluation';
export type NiveauPedagogique = 'essentiel' | 'avance';

export interface Entreprise {
  id: string;
  raisonSociale: string;
  formeJuridique: string;
  siegeSocial: string;
  ville: string;
  registreCommerce: string;
  patente: string;
  numeroCNSS: string;
  ice: string; // Identifiant Commun de l'Entreprise
  secteur: string; // Secteur privé non agricole (ex: Services & Formation)
  horaireHebdo: number; // 44h standard
  horaireMensuelMoyen: number; // 191h standard Code du Travail
  dateCreation: string;
  representantLegal: string;
  qualiteRepresentant: string;
}

export type StatutSalarie = 'actif' | 'sorti' | 'suspendu';
export type SituationFamiliale = 'celibataire' | 'marie' | 'divorce' | 'veuf';

export interface PieceDossier {
  id: string;
  nom: string;
  categorie: 'legale' | 'entreprise' | 'exercice';
  estObligatoire: boolean;
  estFournie: boolean;
  dateReception?: string;
  remarques?: string;
}

export interface Salarie {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  cinFictif: string; // Exemple: "FICTIF-AB123456"
  cnssFictif: string; // Exemple: "CNSS-FIC-987654321"
  telephoneFictif: string;
  emailFictif: string;
  adresseFictive: string;
  ville: string;
  situationFamiliale: SituationFamiliale;
  nombreEnfants: number;
  nombrePersonnesACharge: number; // Pour le calcul de l'abattement IR (max 6)
  poste: string;
  departement: string;
  qualification: string;
  dateEmbauche: string;
  dateSortie?: string;
  statut: StatutSalarie;
  contratActuelId?: string;
  salaireBaseMensuel: number; // en MAD
  horaireMensuel: number; // 191h standard
  modePaiement: 'virement' | 'cheque' | 'especes';
  banqueFictive?: string;
  ribFictif?: string;
  checklistDossier: PieceDossier[];
  historiqueEvenements: {
    date: string;
    description: string;
    auteur: string;
  }[];
}

export type TypeContrat = 'CDI' | 'CDD' | 'Avenant';
export type StatutContrat = 'en_cours' | 'echu' | 'rompu' | 'suspendu';
export type MotifCDD = 
  | 'remplacement_provisoire' 
  | 'accroissement_temporaire' 
  | 'travail_saisonnier' 
  | 'ouverture_etablissement' 
  | 'lancement_nouveau_produit'
  | 'autre_motifs_derogatoires';

export interface Contrat {
  id: string;
  salarieId: string;
  type: TypeContrat;
  numeroContrat: string;
  dateEffet: string;
  dateFinPrevue?: string; // Requis pour CDD
  motifCDD?: MotifCDD;
  justificationCDD?: string;
  dureeEssaiMois: number;
  renouvellementEssaiEffectue?: boolean;
  salaireBaseMensuel: number;
  poste: string;
  statut: StatutContrat;
  clausesParticulieres?: string[];
  anomaliesDetectees?: string[]; // Pour les exercices et contrôles
}

export type TypeEvenementPresence = 
  | 'presence'
  | 'retard'
  | 'absence_justifiee'
  | 'absence_injustifiee'
  | 'conge_annuel'
  | 'conge_exceptionnel'
  | 'arret_maladie'
  | 'maternite'
  | 'jour_ferie'
  | 'repos'
  | 'heures_sup_jour_25'
  | 'heures_sup_nuit_50'
  | 'heures_sup_repos_jour_50'
  | 'heures_sup_repos_nuit_100';

export type StatutWorkflow = 'Brouillon' | 'Soumise' | 'Approuvee' | 'Refusee';

export interface EvenementPresence {
  id: string;
  salarieId: string;
  periodeMois?: string; // Période de paie liée (ex: "2025-01")
  type: TypeEvenementPresence;
  dateDebut: string; // AAAA-MM-JJ
  dateFin: string; // AAAA-MM-JJ
  duree: number;
  unite: 'heures' | 'jours';
  motif: string;
  justificatifFictif?: string;
  statut: StatutWorkflow;
  impactPaie: boolean;
  regleAppliquee: string;
  commentaires?: string;
}

export interface DemandeConge {
  id: string;
  salarieId: string;
  type: 'annuel' | 'mariage' | 'naissance' | 'deces' | 'maternite' | 'circoncision' | 'maladie';
  dateDepart: string;
  dateRetour: string;
  nombreJoursOuvrables: number;
  soldeAvant: number;
  soldeApres: number;
  statut: StatutWorkflow;
  motif: string;
  avisResponsable?: string;
  dateDemande: string;
  dateDecision?: string;
}

export interface RubriquePaieLigne {
  code: string;
  libelle: string;
  nature: 'gain' | 'retenue';
  sens: 'salarial' | 'patronal';
  base: number;
  taux?: number;
  montant: number;
  estMonetaire: boolean; // false si avantage en nature
  assujettieCNSS: boolean;
  assujettieAMO: boolean;
  imposableIR: boolean;
  explicationFormule: string;
  referenceLegale: string;
}

export type StatutBulletin = 'Brouillon' | 'Controle' | 'Valide' | 'Cloture';

export interface DetailCalculExplicite {
  titre: string;
  formule: string;
  valeurs: string;
  explication: string;
  referenceCode: string;
}

export interface BulletinPaie {
  id: string;
  periodeMois: string; // format "AAAA-MM"
  salarieId: string;
  salarieMatricule: string;
  salarieNomPrenom: string;
  poste: string;
  statut: StatutBulletin;
  dateCalcul: string;
  dateCloture?: string;
  versionReglesUtilisee: string;
  estSnapshotScelle: boolean;
  
  // Variables d'entrée du mois
  salaireBaseContractuel: number;
  joursTravailles: number;
  heuresNormales: number;
  heuresSupplementaires: {
    taux25: number;
    taux50: number;
    taux100: number;
    montantTotal: number;
  };
  ancienneteAnnees: number;
  tauxAnciennete: number;
  primeAnciennete: number;
  primesDiverses: {
    libelle: string;
    montant: number;
    imposable: boolean;
    cotisable: boolean;
  }[];
  indemnitesNonImposables: {
    libelle: string;
    montant: number;
  }[];
  avantagesEnNature: {
    libelle: string;
    montant: number;
  }[];
  retenuesAbsences: {
    heures: number;
    tauxHoraire: number;
    montant: number;
  };
  acomptesAvances: number;

  // Masses et assiettes
  salaireBrutGlobal: number;
  salaireBrutImposable: number;
  assietteCNSS: number;
  assietteCNSSPlafonnee: number; // Max 6 000 MAD
  assietteAMO: number;

  // Cotisations salariales
  cnssSalariale: number; // 4.48% (plafonné à 6000 DH = max 268.80 DH)
  amoSalariale: number; // 2.26% (déplafonné)
  totalCotisationsSalariales: number;

  // Déductions fiscales
  fraisProfessionnels: number; // 35% ou 25%, plafonné
  salaireNetImposable: number;
  
  // Impôt sur le revenu
  trancheIR: string;
  tauxIR: number;
  sommeADeduireIR: number;
  irBrut: number;
  deductionChargesFamille: number; // 30 MAD par personne à charge (max 180 MAD)
  irNet: number;

  // Cotisations patronales
  cnssPatronalePrestations: number; // 8.98% (plafonné à 6000 DH)
  cnssPatronaleAllocationsFamiliales: number; // 6.40% (déplafonné)
  taxeFormationProfessionnelle: number; // 1.60% (déplafonné)
  amoPatronale: number; // 4.11% (2.26% base + 1.85% solidarité, déplafonné)
  totalCotisationsPatronales: number;

  // Résultats finaux
  salaireNetAPayer: number; // Brut Global - Cotisations Salariales - IR Net - Retenues - Acomptes - Avantages en nature (pour déduction monétaire)
  coutTotalEmployeur: number; // Brut Global + Cotisations Patronales

  // Lignes détaillées pour impression conforme
  lignes: RubriquePaieLigne[];

  // Pédagogie pas-à-pas
  explicationsPedagogiques: DetailCalculExplicite[];
  remarquesControle?: string[];
}

export interface LivrePaieLigne {
  matricule: string;
  nomPrenom: string;
  poste: string;
  dateEmbauche: string;
  salaireBase: number;
  heuresSup: number;
  primeAnciennete: number;
  autresPrimes: number;
  brutGlobal: number;
  cnssSalariale: number;
  amoSalariale: number;
  netImposable: number;
  irNet: number;
  acomptes: number;
  netAPayer: number;
  chargesPatronales: number;
  coutTotal: number;
  joursDeclaresCNSS: number;
}

export interface DeclarationCNSSRecap {
  periodeMois: string;
  nombreSalariesDeclares: number;
  joursTotalDeclares: number;
  masseSalarialeBrute: number;
  masseSalarialePlafonnee6000: number;
  
  partPrestationsSociales: {
    assiette: number;
    partSalariale: number; // 4.48%
    partPatronale: number; // 8.98%
    total: number;
  };
  partAllocationsFamiliales: {
    assiette: number;
    partPatronale: number; // 6.40%
  };
  partTaxeFormation: {
    assiette: number;
    partPatronale: number; // 1.60%
  };
  partAMO: {
    assiette: number;
    partSalariale: number; // 2.26%
    partPatronale: number; // 4.11%
    total: number;
  };
  totalCotisationsADeclarer: number;
  concordanceAvecLivrePaie: boolean;
  ecartMontant: number;
}

export interface RegleParametreJuridique {
  id: string;
  intitule: string;
  domaine: 'social' | 'fiscal' | 'droit_travail' | 'salaire_minimum';
  valeurOuFormule: string;
  populationConcernee: string;
  dateDebutEffet: string;
  dateFinEffet?: string;
  sourceExacte: string; // Ex: Code du Travail marocain Loi 65-99 Art. 350
  dateConsultation: string;
  statutVerification: 'verifiee_officielle' | 'hypothese_pedagogique';
  validationFormateur: boolean;
  descriptionDetaillee: string;
}

export interface MissionExercice {
  id: string;
  numero: number;
  titre: string;
  contexte: string;
  competences: string[];
  dureeIndicativeMinutes: number;
  niveau: NiveauPedagogique;
  donneesFournies: string[];
  taches: string[];
  livrablesAttendus: string[];
  bareme: {
    dossierEtPieces: number; // Sur 4 pts
    justificationRegles: number; // Sur 4 pts
    calculs: number; // Sur 8 pts
    controlesEtCoherence: number; // Sur 4 pts
  };
  indicesProgressifs: string[];
  reponseAttendue: {
    elementsDossier?: Record<string, any>;
    formulesEtJustifications?: string[];
    resultatsNumeriquesAttendus?: Record<string, number>;
    controlesAttendus?: string[];
  };
  explicationComplete: string;
  erreursFrequentes: string[];
}

export interface TentativeExercice {
  id: string;
  missionId: string;
  stagiaireNom: string;
  dateDebut: string;
  dateRemise?: string;
  statut: 'en_cours' | 'remis' | 'corrige';
  reponsesStagiaire: {
    justificationsTextuelles: Record<string, string>;
    valeursCalculees: Record<string, number>;
    piecesValidees: string[];
    controlesEffectues: string[];
  };
  indicesConsultes: number;
  correction?: {
    noteDossier: number; // /4
    noteRegles: number; // /4
    noteCalculs: number; // /8
    noteControles: number; // /4
    noteTotaleSur20: number;
    commentairesFormateur: string;
    detailsEcarts: {
      champ: string;
      valeurStagiaire: any;
      valeurAttendue: any;
      estCorrect: boolean;
      commentaire: string;
    }[];
  };
}

export interface ClassePedagogique {
  id: string;
  nom: string;
  anneeScolaire: string;
  formateurNom: string;
  etablissement: string; // Ex: "ISTA Marrakech Guéliz - OFPPT"
  /** Code à communiquer aux stagiaires pour rejoindre cette classe depuis leur propre compte */
  codeInvitation?: string;
  stagiaires: {
    matricule: string;
    nom: string;
    prenom: string;
  }[];
}

/** Stagiaire ayant rejoint une classe depuis son propre compte (table classe_stagiaires) */
export interface MembreClasseLive {
  stagiaireUserId: string;
  classeId: string;
  matricule: string | null;
  nom: string;
  prenom: string;
  joinedAt: string;
}

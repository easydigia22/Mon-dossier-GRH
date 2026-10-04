import { Contrat, DemandeConge, Entreprise, EvenementPresence, Salarie } from '../types';

export const ENTREPRISE_DEMO: Entreprise = {
  id: 'ent-atlas-001',
  raisonSociale: 'Atlas Services Formation SARL',
  formeJuridique: 'Société à Responsabilité Limitée (SARL d\'associé unique)',
  siegeSocial: '142 Boulevard Mohammed V, Guéliz',
  ville: 'Marrakech',
  registreCommerce: 'RC-MRK-48920 (Fictif)',
  patente: 'PAT-45891203 (Fictif)',
  numeroCNSS: 'CNSS-ENT-7845129 (Fictif)',
  ice: '001894235000084 (Fictif)',
  secteur: 'Services administratifs, conseil et formation professionnelle',
  horaireHebdo: 44,
  horaireMensuelMoyen: 191,
  dateCreation: '2018-04-01',
  representantLegal: 'Karim EL AMRANI',
  qualiteRepresentant: 'Gérant'
};

export const SALARIES_DEMO: Salarie[] = [
  {
    id: 'sal-001',
    matricule: 'M001',
    nom: 'BENNANI',
    prenom: 'Fatima-Zahra',
    dateNaissance: '1988-06-14',
    lieuNaissance: 'Marrakech',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-EE452109',
    cnssFictif: 'CNSS-FIC-102938475',
    telephoneFictif: '+212 6 61 00 11 22',
    emailFictif: 'fz.bennani@atlas-fictif.ma',
    adresseFictive: '25 Rue Ibn Sina, Guéliz, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'marie',
    nombreEnfants: 2,
    nombrePersonnesACharge: 3, // Conjoint + 2 enfants
    poste: 'Responsable Administrative et Financière',
    departement: 'Direction / Finance',
    qualification: 'Cadre',
    dateEmbauche: '2018-05-01', // Ancienneté > 6 ans => 10%
    statut: 'actif',
    contratActuelId: 'ctr-001',
    salaireBaseMensuel: 14000,
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'Attijariwafa Bank - Agence Marrakech Guéliz',
    ribFictif: '007 450 0001234567890123 45',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat de travail signé (CDI)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2018-05-01' },
      { id: 'c2', nom: 'Copie CIN légalisée (fictive)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2018-04-28' },
      { id: 'c3', nom: 'Fiche d\'immatriculation CNSS', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2018-05-02' },
      { id: 'c4', nom: 'Fiche de renseignements individuels', categorie: 'entreprise', estObligatoire: true, estFournie: true, dateReception: '2018-05-01' },
      { id: 'c5', nom: 'Extrait d\'acte de naissance des enfants', categorie: 'entreprise', estObligatoire: false, estFournie: true, dateReception: '2018-05-10' }
    ],
    historiqueEvenements: [
      { date: '2018-05-01', description: 'Embauche initiale en CDI', auteur: 'Direction' },
      { date: '2022-01-01', description: 'Revalorisation salariale à 14 000 MAD', auteur: 'Gérant' }
    ]
  },
  {
    id: 'sal-002',
    matricule: 'M002',
    nom: 'ALAMI',
    prenom: 'Mehdi',
    dateNaissance: '1992-11-20',
    lieuNaissance: 'Casablanca',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-BK389012',
    cnssFictif: 'CNSS-FIC-293847561',
    telephoneFictif: '+212 6 62 11 22 33',
    emailFictif: 'mehdi.alami@atlas-fictif.ma',
    adresseFictive: 'Lotissement Al Manar, Hay Riad, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'marie',
    nombreEnfants: 1,
    nombrePersonnesACharge: 2,
    poste: 'Comptable Général',
    departement: 'Comptabilité',
    qualification: 'Agent de maîtrise',
    dateEmbauche: '2020-03-01', // Ancienneté ~4 ans => 5%
    statut: 'actif',
    contratActuelId: 'ctr-002',
    salaireBaseMensuel: 7500,
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'Banque Populaire Marrakech',
    ribFictif: '101 450 2121345678901234 12',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat de travail signé (CDI)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2020-03-01' },
      { id: 'c2', nom: 'Copie CIN légalisée (fictive)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2020-02-25' },
      { id: 'c3', nom: 'Fiche d\'immatriculation CNSS', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2020-03-05' },
      { id: 'c4', nom: 'Fiche de renseignements individuels', categorie: 'entreprise', estObligatoire: true, estFournie: true, dateReception: '2020-03-01' }
    ],
    historiqueEvenements: [
      { date: '2020-03-01', description: 'Embauche initiale en CDI', auteur: 'RAF' }
    ]
  },
  {
    id: 'sal-003',
    matricule: 'M003',
    nom: 'CHRAIBI',
    prenom: 'Yassine',
    dateNaissance: '1995-04-12',
    lieuNaissance: 'Fès',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-C891234',
    cnssFictif: 'CNSS-FIC-384756192',
    telephoneFictif: '+212 6 63 22 33 44',
    emailFictif: 'yassine.chraibi@atlas-fictif.ma',
    adresseFictive: 'Résidence Majorelle Appt 4, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'celibataire',
    nombreEnfants: 0,
    nombrePersonnesACharge: 0,
    poste: 'Formateur Informatique & Réseaux',
    departement: 'Pôle Pédagogique',
    qualification: 'Employé qualifié',
    dateEmbauche: '2021-09-01', // Ancienneté ~3 ans => 5%
    statut: 'actif',
    contratActuelId: 'ctr-003',
    salaireBaseMensuel: 6000,
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'Bank of Africa BMCE',
    ribFictif: '011 450 3344556677889900 88',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat de travail signé (CDI)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2021-09-01' },
      { id: 'c2', nom: 'Copie CIN (fictive)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2021-08-25' },
      { id: 'c3', nom: 'Attestation CNSS', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2021-09-05' }
    ],
    historiqueEvenements: [
      { date: '2021-09-01', description: 'Embauche initiale en CDI', auteur: 'Gérant' }
    ]
  },
  {
    id: 'sal-004',
    matricule: 'M004',
    nom: 'EL IDRISSI',
    prenom: 'Sanaa',
    dateNaissance: '1998-02-18',
    lieuNaissance: 'Marrakech',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-EE789012',
    cnssFictif: 'CNSS-FIC-475619283',
    telephoneFictif: '+212 6 64 33 44 55',
    emailFictif: 'sanaa.idrissi@atlas-fictif.ma',
    adresseFictive: 'Quartier Daoudiate, Bloc 12, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'celibataire',
    nombreEnfants: 0,
    nombrePersonnesACharge: 0,
    poste: 'Assistante Administrative & Accueil',
    departement: 'Administration',
    qualification: 'Employé',
    dateEmbauche: '2023-02-01', // Ancienneté ~2 ans => 5%
    statut: 'actif',
    contratActuelId: 'ctr-004',
    salaireBaseMensuel: 4000,
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'CIH Bank Guéliz',
    ribFictif: '230 450 9988776655443322 77',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat de travail signé (CDI)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2023-02-01' },
      { id: 'c2', nom: 'Copie CIN (fictive)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2023-01-28' },
      { id: 'c3', nom: 'Fiche d\'immatriculation CNSS', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2023-02-05' }
    ],
    historiqueEvenements: [
      { date: '2023-02-01', description: 'Embauche initiale en CDI', auteur: 'RAF' }
    ]
  },
  {
    id: 'sal-005',
    matricule: 'M005',
    nom: 'TAZI',
    prenom: 'Omar',
    dateNaissance: '1990-09-05',
    lieuNaissance: 'Rabat',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-A901234',
    cnssFictif: 'CNSS-FIC-561928374',
    telephoneFictif: '+212 6 65 44 55 66',
    emailFictif: 'omar.tazi@atlas-fictif.ma',
    adresseFictive: 'Avenue Abdelkrim Khattabi, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'marie',
    nombreEnfants: 3,
    nombrePersonnesACharge: 4,
    poste: 'Formateur Gestion & Management',
    departement: 'Pôle Pédagogique',
    qualification: 'Cadre',
    dateEmbauche: '2019-01-15', // Ancienneté ~6 ans => 10%
    statut: 'actif',
    contratActuelId: 'ctr-005',
    salaireBaseMensuel: 8500,
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'Attijariwafa Bank',
    ribFictif: '007 450 1122334455667788 99',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat de travail signé (CDI)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2019-01-15' },
      { id: 'c2', nom: 'Copie CIN (fictive)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2019-01-10' },
      { id: 'c3', nom: 'Justificatif enfants à charge', categorie: 'entreprise', estObligatoire: false, estFournie: true, dateReception: '2019-02-01' }
    ],
    historiqueEvenements: [
      { date: '2019-01-15', description: 'Embauche initiale en CDI', auteur: 'Direction' }
    ]
  },
  {
    id: 'sal-006',
    matricule: 'M006',
    nom: 'BERRADA',
    prenom: 'Salma',
    dateNaissance: '1997-07-25',
    lieuNaissance: 'Marrakech',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-EE612345',
    cnssFictif: 'CNSS-FIC-619283745',
    telephoneFictif: '+212 6 66 55 66 77',
    emailFictif: 'salma.berrada@atlas-fictif.ma',
    adresseFictive: 'Mhamid 9, Rue 14, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'celibataire',
    nombreEnfants: 0,
    nombrePersonnesACharge: 0,
    poste: 'Chargée de Recrutement & RH',
    departement: 'Ressources Humaines',
    qualification: 'Agent de maîtrise',
    dateEmbauche: '2022-06-01', // Ancienneté ~2 ans => 5%
    statut: 'actif',
    contratActuelId: 'ctr-006',
    salaireBaseMensuel: 6500,
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'Société Générale Maroc',
    ribFictif: '022 450 5566778899001122 33',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat CDI signé', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2022-06-01' },
      { id: 'c2', nom: 'CIN fictive', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2022-05-25' }
    ],
    historiqueEvenements: [
      { date: '2022-06-01', description: 'Embauche initiale en CDI', auteur: 'Gérant' }
    ]
  },
  {
    id: 'sal-007',
    matricule: 'M007',
    nom: 'OUAHBI',
    prenom: 'Rachid',
    dateNaissance: '1985-03-30',
    lieuNaissance: 'Essaouira',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-H456789',
    cnssFictif: 'CNSS-FIC-728394015',
    telephoneFictif: '+212 6 67 66 77 88',
    emailFictif: 'rachid.ouahbi@atlas-fictif.ma',
    adresseFictive: 'Massira 1, Imm 42, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'marie',
    nombreEnfants: 2,
    nombrePersonnesACharge: 3,
    poste: 'Technicien Support & Maintenance Informatique',
    departement: 'Pôle Technique',
    qualification: 'Employé qualifié',
    dateEmbauche: '2020-10-01', // Ancienneté ~4 ans => 5%
    statut: 'actif',
    contratActuelId: 'ctr-007',
    salaireBaseMensuel: 5200,
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'Crédit du Maroc',
    ribFictif: '021 450 1234123412341234 56',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat CDI', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2020-10-01' },
      { id: 'c2', nom: 'CIN fictive', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2020-09-20' }
    ],
    historiqueEvenements: [
      { date: '2020-10-01', description: 'Embauche CDI', auteur: 'RAF' }
    ]
  },
  {
    id: 'sal-008',
    matricule: 'M008',
    nom: 'AMRANI',
    prenom: 'Khadija',
    dateNaissance: '1999-12-10',
    lieuNaissance: 'Marrakech',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-EE991122',
    cnssFictif: 'CNSS-FIC-839405126',
    telephoneFictif: '+212 6 68 77 88 99',
    emailFictif: 'khadija.amrani@atlas-fictif.ma',
    adresseFictive: 'Sidi Youssef Ben Ali, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'celibataire',
    nombreEnfants: 0,
    nombrePersonnesACharge: 0,
    poste: 'Assistante Commerciale & Inscriptions',
    departement: 'Commercial',
    qualification: 'Employé',
    dateEmbauche: '2024-04-01', // Ancienneté < 2 ans => 0%
    statut: 'actif',
    contratActuelId: 'ctr-008',
    salaireBaseMensuel: 3800,
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'Banque Populaire',
    ribFictif: '101 450 7788990011223344 55',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat CDD 12 mois', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2024-04-01' },
      { id: 'c2', nom: 'CIN fictive', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2024-03-25' }
    ],
    historiqueEvenements: [
      { date: '2024-04-01', description: 'Recrutement CDD pour surcroît d\'activité (campagne inscriptions)', auteur: 'Gérant' }
    ]
  },
  {
    id: 'sal-009',
    matricule: 'M009',
    nom: 'TOUHAMI',
    prenom: 'Nabil',
    dateNaissance: '1993-05-14',
    lieuNaissance: 'Safi',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-HH123456',
    cnssFictif: 'CNSS-FIC-940516237',
    telephoneFictif: '+212 6 69 88 99 00',
    emailFictif: 'nabil.touhami@atlas-fictif.ma',
    adresseFictive: 'Targa, Villa 18, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'divorce',
    nombreEnfants: 1,
    nombrePersonnesACharge: 1, // Enfant à charge légale
    poste: 'Formateur Multimédia & Infographie',
    departement: 'Pôle Pédagogique',
    qualification: 'Employé qualifié',
    dateEmbauche: '2022-11-01', // Ancienneté ~2 ans => 5%
    statut: 'actif',
    contratActuelId: 'ctr-009',
    salaireBaseMensuel: 5800,
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'Attijariwafa Bank',
    ribFictif: '007 450 9900112233445566 77',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat CDI', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2022-11-01' }
    ],
    historiqueEvenements: [
      { date: '2022-11-01', description: 'Embauche CDI', auteur: 'Gérant' }
    ]
  },
  {
    id: 'sal-010',
    matricule: 'M010',
    nom: 'KABBAJ',
    prenom: 'Hamza',
    dateNaissance: '1996-08-22',
    lieuNaissance: 'Agadir',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-J789012',
    cnssFictif: 'CNSS-FIC-051627348',
    telephoneFictif: '+212 6 70 99 00 11',
    emailFictif: 'hamza.kabbaj@atlas-fictif.ma',
    adresseFictive: 'Semlalia, Résidence Les Oliviers, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'celibataire',
    nombreEnfants: 0,
    nombrePersonnesACharge: 0,
    poste: 'Agent Logistique & Accueil Sécurité',
    departement: 'Logistique',
    qualification: 'Employé',
    dateEmbauche: '2024-07-01', // Ancienneté < 2 ans => 0%
    statut: 'actif',
    contratActuelId: 'ctr-010',
    salaireBaseMensuel: 3400, // Proche SMIG
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'Al Barid Bank',
    ribFictif: '350 450 1111222233334444 55',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat CDI', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2024-07-01' },
      { id: 'c2', nom: 'CIN fictive', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2024-06-25' }
    ],
    historiqueEvenements: [
      { date: '2024-07-01', description: 'Embauche CDI', auteur: 'Direction' }
    ]
  },
  {
    id: 'sal-011',
    matricule: 'M011',
    nom: 'LAHLOU',
    prenom: 'Hajar',
    dateNaissance: '2000-03-15',
    lieuNaissance: 'Marrakech',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-EE334455',
    cnssFictif: 'CNSS-FIC-162738459',
    telephoneFictif: '+212 6 71 00 11 22',
    emailFictif: 'hajar.lahlou@atlas-fictif.ma',
    adresseFictive: 'Hay Charaf, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'celibataire',
    nombreEnfants: 0,
    nombrePersonnesACharge: 0,
    poste: 'Chargée de Communication Digitale (CDD Remplacement)',
    departement: 'Commercial & Communication',
    qualification: 'Agent de maîtrise',
    dateEmbauche: '2024-10-01', // Fin prévue au 2025-03-31
    statut: 'actif',
    contratActuelId: 'ctr-011',
    salaireBaseMensuel: 5000,
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'CIH Bank',
    ribFictif: '230 450 8877665544332211 00',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat CDD 6 mois (remplacement congé maternité)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2024-10-01' },
      { id: 'c2', nom: 'CIN fictive', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2024-09-28' }
    ],
    historiqueEvenements: [
      { date: '2024-10-01', description: 'Recrutement CDD remplacement (Article 16 Code du Travail)', auteur: 'Gérant' }
    ]
  },
  {
    id: 'sal-012',
    matricule: 'M012',
    nom: 'ZOUHIR',
    prenom: 'Anas',
    dateNaissance: '2001-09-18',
    lieuNaissance: 'Essaouira',
    nationalite: 'Marocaine',
    cinFictif: 'FICTIF-H998877',
    cnssFictif: 'CNSS-FIC-273849560',
    telephoneFictif: '+212 6 72 11 22 33',
    emailFictif: 'anas.zouhir@atlas-fictif.ma',
    adresseFictive: 'Mabrouka, Imm 5, Marrakech',
    ville: 'Marrakech',
    situationFamiliale: 'celibataire',
    nombreEnfants: 0,
    nombrePersonnesACharge: 0,
    poste: 'Aide Comptable (Nouvelle Embauche Février 2025)',
    departement: 'Comptabilité',
    qualification: 'Employé',
    dateEmbauche: '2025-02-15', // Embauche en cours de mois (cas pédagogique)
    statut: 'actif',
    contratActuelId: 'ctr-012',
    salaireBaseMensuel: 3600,
    horaireMensuel: 191,
    modePaiement: 'virement',
    banqueFictive: 'Attijariwafa Bank',
    ribFictif: '007 450 4455667788990011 22',
    checklistDossier: [
      { id: 'c1', nom: 'Contrat CDI avec période d\'essai de 1,5 mois', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2025-02-15' },
      { id: 'c2', nom: 'Copie CIN (fictive)', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2025-02-12' },
      { id: 'c3', nom: 'Fiche d\'embauche et demande CNSS', categorie: 'legale', estObligatoire: true, estFournie: true, dateReception: '2025-02-16' }
    ],
    historiqueEvenements: [
      { date: '2025-02-15', description: 'Embauche en cours de mois - CDI période d\'essai', auteur: 'RAF' }
    ]
  }
];

export const CONTRATS_DEMO: Contrat[] = [
  {
    id: 'ctr-001',
    salarieId: 'sal-001',
    type: 'CDI',
    numeroContrat: 'CTR-CDI-2018-001',
    dateEffet: '2018-05-01',
    dureeEssaiMois: 3,
    salaireBaseMensuel: 14000,
    poste: 'Responsable Administrative et Financière',
    statut: 'en_cours',
    clausesParticulieres: ['Clause de confidentialité renforcée', 'Prime de responsabilité incluse']
  },
  {
    id: 'ctr-002',
    salarieId: 'sal-002',
    type: 'CDI',
    numeroContrat: 'CTR-CDI-2020-002',
    dateEffet: '2020-03-01',
    dureeEssaiMois: 1.5,
    salaireBaseMensuel: 7500,
    poste: 'Comptable Général',
    statut: 'en_cours'
  },
  {
    id: 'ctr-003',
    salarieId: 'sal-003',
    type: 'CDI',
    numeroContrat: 'CTR-CDI-2021-003',
    dateEffet: '2021-09-01',
    dureeEssaiMois: 1.5,
    salaireBaseMensuel: 6000,
    poste: 'Formateur Informatique & Réseaux',
    statut: 'en_cours'
  },
  {
    id: 'ctr-004',
    salarieId: 'sal-004',
    type: 'CDI',
    numeroContrat: 'CTR-CDI-2023-004',
    dateEffet: '2023-02-01',
    dureeEssaiMois: 1.5,
    salaireBaseMensuel: 4000,
    poste: 'Assistante Administrative & Accueil',
    statut: 'en_cours'
  },
  {
    id: 'ctr-005',
    salarieId: 'sal-005',
    type: 'CDI',
    numeroContrat: 'CTR-CDI-2019-005',
    dateEffet: '2019-01-15',
    dureeEssaiMois: 3,
    salaireBaseMensuel: 8500,
    poste: 'Formateur Gestion & Management',
    statut: 'en_cours'
  },
  {
    id: 'ctr-006',
    salarieId: 'sal-006',
    type: 'CDI',
    numeroContrat: 'CTR-CDI-2022-006',
    dateEffet: '2022-06-01',
    dureeEssaiMois: 1.5,
    salaireBaseMensuel: 6500,
    poste: 'Chargée de Recrutement & RH',
    statut: 'en_cours'
  },
  {
    id: 'ctr-007',
    salarieId: 'sal-007',
    type: 'CDI',
    numeroContrat: 'CTR-CDI-2020-007',
    dateEffet: '2020-10-01',
    dureeEssaiMois: 1.5,
    salaireBaseMensuel: 5200,
    poste: 'Technicien Support & Maintenance Informatique',
    statut: 'en_cours'
  },
  {
    id: 'ctr-008',
    salarieId: 'sal-008',
    type: 'CDD',
    numeroContrat: 'CTR-CDD-2024-008',
    dateEffet: '2024-04-01',
    dateFinPrevue: '2025-03-31',
    motifCDD: 'accroissement_temporaire',
    justificationCDD: 'Surcroît temporaire d\'activité lié à la campagne annuelle d\'inscription et de certification.',
    dureeEssaiMois: 1,
    salaireBaseMensuel: 3800,
    poste: 'Assistante Commerciale & Inscriptions',
    statut: 'en_cours'
  },
  {
    id: 'ctr-009',
    salarieId: 'sal-009',
    type: 'CDI',
    numeroContrat: 'CTR-CDI-2022-009',
    dateEffet: '2022-11-01',
    dureeEssaiMois: 1.5,
    salaireBaseMensuel: 5800,
    poste: 'Formateur Multimédia & Infographie',
    statut: 'en_cours'
  },
  {
    id: 'ctr-010',
    salarieId: 'sal-010',
    type: 'CDI',
    numeroContrat: 'CTR-CDI-2024-010',
    dateEffet: '2024-07-01',
    dureeEssaiMois: 1.5,
    salaireBaseMensuel: 3400,
    poste: 'Agent Logistique & Accueil Sécurité',
    statut: 'en_cours'
  },
  {
    id: 'ctr-011',
    salarieId: 'sal-011',
    type: 'CDD',
    numeroContrat: 'CTR-CDD-2024-011',
    dateEffet: '2024-10-01',
    dateFinPrevue: '2025-03-31',
    motifCDD: 'remplacement_provisoire',
    justificationCDD: 'Remplacement de la salariée titulaire en congé de maternité (Art. 16 Code du Travail).',
    dureeEssaiMois: 1,
    salaireBaseMensuel: 5000,
    poste: 'Chargée de Communication Digitale',
    statut: 'en_cours'
  },
  {
    id: 'ctr-012',
    salarieId: 'sal-012',
    type: 'CDI',
    numeroContrat: 'CTR-CDI-2025-012',
    dateEffet: '2025-02-15',
    dureeEssaiMois: 1.5,
    salaireBaseMensuel: 3600,
    poste: 'Aide Comptable',
    statut: 'en_cours'
  }
];

export const EVENEMENTS_PRESENCE_DEMO: EvenementPresence[] = [
  // Janvier 2025
  {
    id: 'evt-001',
    salarieId: 'sal-003', // Yassine Chraibi
    type: 'heures_sup_jour_25',
    dateDebut: '2025-01-14',
    dateFin: '2025-01-14',
    duree: 8,
    unite: 'heures',
    motif: 'Préparation et déploiement de la salle d\'examen réseau',
    statut: 'Approuvee',
    impactPaie: true,
    regleAppliquee: 'Code du Travail Art. 197 : +25% jour ouvrable'
  },
  {
    id: 'evt-002',
    salarieId: 'sal-004', // Sanaa El Idrissi
    type: 'retard',
    dateDebut: '2025-01-20',
    dateFin: '2025-01-20',
    duree: 2,
    unite: 'heures',
    motif: 'Panne de transport justifiée',
    statut: 'Approuvee',
    impactPaie: false,
    regleAppliquee: 'Tolérance ponctuelle RH'
  },
  {
    id: 'evt-003',
    salarieId: 'sal-007', // Rachid Ouahbi
    type: 'absence_injustifiee',
    dateDebut: '2025-01-22',
    dateFin: '2025-01-22',
    duree: 8, // 1 journée = 8h
    unite: 'heures',
    motif: 'Absence sans justificatif transmis sous 48h',
    statut: 'Approuvee',
    impactPaie: true,
    regleAppliquee: 'Retenue proportionnelle sur salaire (Art. 184 Code du Travail)'
  },
  {
    id: 'evt-004',
    salarieId: 'sal-002', // Mehdi Alami
    type: 'heures_sup_jour_25',
    dateDebut: '2025-01-27',
    dateFin: '2025-01-27',
    duree: 6,
    unite: 'heures',
    motif: 'Arrêté comptable et clôture bilan provisoire',
    statut: 'Approuvee',
    impactPaie: true,
    regleAppliquee: 'Code du Travail Art. 197 : +25%'
  },
  // Février 2025
  {
    id: 'evt-005',
    salarieId: 'sal-005', // Omar Tazi
    type: 'arret_maladie',
    dateDebut: '2025-02-05',
    dateFin: '2025-02-07',
    duree: 3,
    unite: 'jours',
    motif: 'Syndrome grippal aigu avec certificat médical fourni sous 48h',
    justificatifFictif: 'Certificat médical Dr. Fictif Marrakech du 05/02/2025',
    statut: 'Approuvee',
    impactPaie: true, // Retenue employeur jours non travaillés, dossier CNSS pour indemnités journalières
    regleAppliquee: 'Code du Travail Art. 271 & Régime IJ CNSS (carence 3 jours)'
  },
  {
    id: 'evt-006',
    salarieId: 'sal-008', // Khadija Amrani
    type: 'heures_sup_repos_jour_50',
    dateDebut: '2025-02-16', // Dimanche (repos hebdomadaire)
    dateFin: '2025-02-16',
    duree: 6,
    unite: 'heures',
    motif: 'Permanence journée portes ouvertes orientation',
    statut: 'Approuvee',
    impactPaie: true,
    regleAppliquee: 'Code du Travail Art. 200 : +50% jour de repos hebdomadaire'
  },
  {
    id: 'evt-007',
    salarieId: 'sal-009', // Nabil Touhami
    type: 'conge_annuel',
    dateDebut: '2025-02-17',
    dateFin: '2025-02-22',
    duree: 6,
    unite: 'jours',
    motif: 'Congé annuel payé d\'hiver approuvé',
    statut: 'Approuvee',
    impactPaie: false, // Congé payé
    regleAppliquee: 'Articles 231 et suivants du Code du Travail'
  }
];

export const DEMANDES_CONGES_DEMO: DemandeConge[] = [
  {
    id: 'dc-001',
    salarieId: 'sal-009',
    type: 'annuel',
    dateDepart: '2025-02-17',
    dateRetour: '2025-02-24',
    nombreJoursOuvrables: 6,
    soldeAvant: 18,
    soldeApres: 12,
    statut: 'Approuvee',
    motif: 'Congé d\'hiver régulier',
    avisResponsable: 'Favorable, suppléance assurée par M003',
    dateDemande: '2025-02-01',
    dateDecision: '2025-02-05'
  },
  {
    id: 'dc-002',
    salarieId: 'sal-004',
    type: 'mariage',
    dateDepart: '2025-03-10',
    dateRetour: '2025-03-15',
    nombreJoursOuvrables: 4,
    soldeAvant: 15,
    soldeApres: 15, // Congé exceptionnel non déduit du congé annuel
    statut: 'Approuvee',
    motif: 'Mariage du salarié (Article 274 du Code du Travail : 4 jours rémunérés)',
    avisResponsable: 'Félicitations de la direction',
    dateDemande: '2025-02-20',
    dateDecision: '2025-02-22'
  }
];

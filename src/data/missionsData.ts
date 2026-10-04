import { MissionExercice } from '../types';

export const MISSIONS_PEDAGOGIQUES: MissionExercice[] = [
  {
    id: 'mission-01',
    numero: 1,
    titre: 'Constituer un dossier administratif salarié conforme',
    contexte: 'L\'entreprise "Atlas Services Formation SARL" vient d\'engager M. Anas ZOUHIR (Matricule M012) en qualité d\'Aide Comptable. Vous devez constituer son dossier administratif individuel et vérifier les pièces requises.',
    competences: [
      'Identifier les pièces obligatoires d\'un dossier salarié au Maroc',
      'Vérifier la validité des pièces d\'identité et d\'immatriculation CNSS',
      'Structurer une fiche individuelle de renseignements'
    ],
    dureeIndicativeMinutes: 30,
    niveau: 'essentiel',
    donneesFournies: [
      'Fiche d\'état civil fictive d\'Anas ZOUHIR, né le 18/09/2001 à Essaouira',
      'Copie de CIN fictive (FICTIF-H998877)',
      'Déclaration de situation familiale : célibataire, sans enfant à charge',
      'Date d\'embauche : 15 février 2025'
    ],
    taches: [
      'Compléter les données d\'identification du salarié dans le simulateur',
      'Cocher et classifier les pièces reçues (légales, internes, justificatifs)',
      'Vérifier l\'absence d\'éléments interdits ou discriminatoires',
      'Justifier l\'utilité de chaque document pour la gestion de la paie'
    ],
    livrablesAttendus: [
      'Fiche administrative du salarié M012 validée',
      'Checklist des pièces du dossier complétée',
      'Brève note explicative sur l\'immatriculation CNSS'
    ],
    bareme: {
      dossierEtPieces: 4,
      justificationRegles: 4,
      calculs: 8,
      controlesEtCoherence: 4
    },
    indicesProgressifs: [
      'Indice 1 : La CIN et l\'immatriculation CNSS sont indispensables pour la déclaration des salaires.',
      'Indice 2 : La situation familiale et les enfants à charge influencent directement l\'abattement IR (Article 73 du CGI).',
      'Indice 3 : Ne conservez aucun dossier médical confidentiel dans un dossier administratif général.'
    ],
    reponseAttendue: {
      formulesEtJustifications: [
        'Le dossier doit comporter obligatoirement la copie de la CIN, le contrat de travail signé et la demande d\'immatriculation CNSS.',
        'La situation familiale détermine les déductions fiscales pour charges de famille (30 MAD par personne, max 180 MAD/mois).'
      ],
      controlesAttendus: [
        'Vérifier la concordance entre le nom sur la CIN et le contrat',
        'Vérifier l\'âge légal d\'admission au travail (> 15 ans au Maroc, art. 143 Code du Travail)'
      ]
    },
    explicationComplete: 'La constitution du dossier administratif est la première obligation de l\'employeur lors de l\'embauche. Elle conditionne la déclaration dans les délais légaux à la CNSS et permet d\'établir le bulletin de paie sans erreur sur les exonérations et déductions fiscales.',
    erreursFrequentes: [
      'Oublier de vérifier l\'adresse et le RIB avant le premier virement',
      'Confondre le numéro d\'affiliation de l\'employeur et le numéro d\'immatriculation du salarié'
    ]
  },
  {
    id: 'mission-02',
    numero: 2,
    titre: 'Rédiger et contrôler un contrat de travail (CDD vs CDI)',
    contexte: 'La direction souhaite recruter Mme Hajar LAHLOU pour remplacer une salariée en congé de maternité pour 6 mois. Le stagiaire doit qualifier le contrat et vérifier la conformité des clauses.',
    competences: [
      'Distinguer le champ d\'application du CDI et du CDD selon l\'Article 16 du Code du Travail',
      'Contrôler la durée de la période d\'essai légale',
      'Vérifier les mentions contractuelles obligatoires'
    ],
    dureeIndicativeMinutes: 45,
    niveau: 'essentiel',
    donneesFournies: [
      'Motif du recrutement : Remplacement de Mme Salma Berrada (congé de maternité)',
      'Durée de la mission : 6 mois du 01/10/2024 au 31/03/2025',
      'Rémunération convenue : 5 000 MAD brut pour 191h/mois',
      'Qualification : Agent de maîtrise'
    ],
    taches: [
      'Choisir la forme contractuelle adéquate et justifier le motif légal',
      'Fixer la période d\'essai maximale autorisée par la loi pour cette catégorie',
      'Vérifier l\'existence de la date de fin précise'
    ],
    livrablesAttendus: [
      'Fiche de contrat CDD validée dans le simulateur',
      'Justification légale fondée sur l\'Article 16 du Code du Travail'
    ],
    bareme: {
      dossierEtPieces: 4,
      justificationRegles: 4,
      calculs: 8,
      controlesEtCoherence: 4
    },
    indicesProgressifs: [
      'Indice 1 : Le CDD est dérogatoire au Maroc. L\'article 16 autorise expressément le remplacement d\'un salarié dont le contrat est suspendu.',
      'Indice 2 : Pour un CDD de moins de six mois ou égal à six mois, la période d\'essai est calculée selon l\'art. 14 du Code du Travail (1 jour par semaine dans la limite de 2 semaines ou 1 mois selon durée).'
    ],
    reponseAttendue: {
      formulesEtJustifications: [
        'Motif légal : Remplacement d\'un salarié dont le contrat est suspendu pour maternité (Art. 16 Code du Travail).',
        'Période d\'essai : Conforme aux dispositions de l\'Article 14 pour les contrats à durée déterminée.'
      ]
    },
    explicationComplete: 'Le CDD ne peut avoir pour effet de pourvoir durablement à un emploi lié à l\'activité normale et permanente. Tout CDD conclu en dehors des cas prévus par l\'Article 16 est réputé CDI.',
    erreursFrequentes: [
      'Omettre de mentionner le nom de la personne remplacée sur le contrat CDD',
      'Prévoir une période d\'essai excédant les plafonds d\'ordre public'
    ]
  },
  {
    id: 'mission-03',
    numero: 3,
    titre: 'Audit de conformité et repérage des pièces manquantes',
    contexte: 'L\'inspecteur du travail a annoncé une visite de contrôle. Vous devez auditer les 12 dossiers des salariés de la SARL Atlas Services Formation et lister les anomalies et pièces manquantes.',
    competences: [
      'Mener un audit documentaire RH',
      'Identifier les manquements administratifs prioritaires',
      'Rédiger un plan de régularisation'
    ],
    dureeIndicativeMinutes: 40,
    niveau: 'essentiel',
    donneesFournies: [
      'Les 12 dossiers du personnel de l\'entreprise',
      'Tableau des pièces obligatoires : CIN, contrat signé, affiliation CNSS, fiches de paie'
    ],
    taches: [
      'Parcourir les fiches salariés dans le simulateur',
      'Identifier le salarié dont le dossier ne comporte pas encore la copie légalisée ou le RIB',
      'Émettre une alerte de régularisation'
    ],
    livrablesAttendus: [
      'Rapport d\'audit documentaire avec statut par salarié',
      'Lettre type de relance de pièce manquante'
    ],
    bareme: {
      dossierEtPieces: 4,
      justificationRegles: 4,
      calculs: 8,
      controlesEtCoherence: 4
    },
    indicesProgressifs: [
      'Indice 1 : Examinez attentivement la checklist des pièces dans le dossier de M. Anas Zouhir (M012) et M. Hamza Kabbaj (M010).',
      'Indice 2 : Vérifiez si tous les contrats de travail portent bien la mention signée.'
    ],
    reponseAttendue: {
      controlesAttendus: [
        'Vérification de la validité de la pièce d\'identité',
        'Vérification de la présence de l\'immatriculation CNSS'
      ]
    },
    explicationComplete: 'Un dossier incomplet expose l\'entreprise à des sanctions lors des contrôles de l\'inspection du travail et complique les déclarations sociales et la preuve en cas de litige prud\'homal.',
    erreursFrequentes: [
      'Considérer une pièce non obligatoire comme un motif de blocage du salaire'
    ]
  },
  {
    id: 'mission-04',
    numero: 4,
    titre: 'Enregistrement des présences, retards et heures supplémentaires',
    contexte: 'En janvier 2025, plusieurs événements de présence ont été constatés : heures supplémentaires un jour ouvrable pour M. Chraibi (8h) et M. Alami (6h), retard de 2h pour Mlle Idrissi, et 1 jour d\'absence injustifiée pour M. Ouahbi.',
    competences: [
      'Saisir les événements de présence selon leur nature',
      'Appliquer les taux de majoration légaux des heures sup (25%, 50%, 100%)',
      'Calculer l\'impact exact sur le temps de travail du mois'
    ],
    dureeIndicativeMinutes: 45,
    niveau: 'essentiel',
    donneesFournies: [
      'Relevé de pointage du mois de janvier 2025',
      'Taux horaires de base : M003 (31.41 MAD/h), M002 (39.27 MAD/h), M007 (27.23 MAD/h)'
    ],
    taches: [
      'Saisir les événements dans le module Présences et Absences',
      'Qualifier la majoration applicable pour chaque heure supplémentaire',
      'Valider le workflow des demandes (Brouillon -> Approuvée)'
    ],
    livrablesAttendus: [
      'Calendrier de présence de janvier 2025 à jour',
      'Récapitulatif des heures supplémentaires et des heures d\'absence à déduire'
    ],
    bareme: {
      dossierEtPieces: 4,
      justificationRegles: 4,
      calculs: 8,
      controlesEtCoherence: 4
    },
    indicesProgressifs: [
      'Indice 1 : Les heures sup en journée ouvrable (6h-21h) sont majorées de 25% (Art. 197).',
      'Indice 2 : Une absence injustifiée de 8h entraîne une retenue de : 8 × (Salaire de base / 191).'
    ],
    reponseAttendue: {
      resultatsNumeriquesAttendus: {
        heuresSupM003: 8,
        tauxMajorationM003: 25,
        heuresAbsenceM007: 8
      }
    },
    explicationComplete: 'Le décompte précis des heures supplémentaires et des absences garantit la conformité du bulletin de paie et évite les contestations salariales.',
    erreursFrequentes: [
      'Appliquer la majoration de 50% en journée ordinaire sans justification de travail de nuit ou de jour de repos'
    ]
  },
  {
    id: 'mission-05',
    numero: 5,
    titre: 'Traitement d\'une demande de congé annuel et calcul du solde',
    contexte: 'M. Nabil TOUHAMI (M009) sollicite 6 jours ouvrables de congé annuel payé du 17 au 22 février 2025. Vous devez vérifier ses droits acquis, son solde restant et instruire la demande.',
    competences: [
      'Calculer les droits à congé annuel selon l\'Article 231 du Code du Travail (1,5 jour par mois)',
      'Décompter les jours ouvrables vs jours calendaires',
      'Mettre à jour le compteur de congés'
    ],
    dureeIndicativeMinutes: 35,
    niveau: 'essentiel',
    donneesFournies: [
      'Date d\'embauche de M. Touhami : 01/11/2022 (> 2 ans de service continu)',
      'Solde de congé avant la demande : 18 jours ouvrables',
      'Période demandée : du lundi 17 février au samedi 22 février 2025'
    ],
    taches: [
      'Contrôler si le salarié a accompli les 6 mois de service continu requis pour ouvrir droit à la prise de congé',
      'Décompter le nombre exact de jours ouvrables (les dimanches ne comptent pas)',
      'Calculer le solde après congé (18 - 6 = 12 jours)',
      'Approuver la demande dans le simulateur'
    ],
    livrablesAttendus: [
      'Décision d\'octroi de congé signée',
      'Fiche de suivi du solde de congés actualisée'
    ],
    bareme: {
      dossierEtPieces: 4,
      justificationRegles: 4,
      calculs: 8,
      controlesEtCoherence: 4
    },
    indicesProgressifs: [
      'Indice 1 : La semaine compte 6 jours ouvrables au Maroc (du lundi au samedi inclus).',
      'Indice 2 : Le congé annuel payé ne diminue pas la rémunération mensuelle.'
    ],
    reponseAttendue: {
      resultatsNumeriquesAttendus: {
        joursPris: 6,
        soldeFinal: 12
      }
    },
    explicationComplete: 'Tout salarié acquiert 1,5 jour ouvrable de congé par mois de travail effectif. La rémunération est maintenue à l\'identique par le versement de l\'indemnité de congé payé.',
    erreursFrequentes: [
      'Déduire une absence sur le bulletin alors qu\'il s\'agit d\'un congé annuel rémunéré',
      'Compter le dimanche comme un jour ouvrable de congé'
    ]
  },
  {
    id: 'mission-06',
    numero: 6,
    titre: 'Gestion d\'un arrêt maladie et articulation Paie / CNSS',
    contexte: 'M. Omar TAZI (M005) a été placé en arrêt maladie pour 3 jours (du 5 au 7 février 2025) avec certificat médical remis dans les 48h. Déterminez l\'impact côté employeur et côté CNSS.',
    competences: [
      'Appliquer les règles du Code du Travail relatives à la maladie (Art. 271 et 272)',
      'Distinguer les obligations de l\'employeur et les prestations en espèces de la CNSS (délai de carence)',
      'Établir l\'attestation pour la caisse de sécurité sociale'
    ],
    dureeIndicativeMinutes: 45,
    niveau: 'avance',
    donneesFournies: [
      'Salaire de base : 8 500 MAD (taux horaire : 44.50 MAD/h)',
      'Durée de l\'arrêt : 3 jours calendaires (24 heures ouvrées)',
      'Certificat médical conforme remis le 06/02/2025'
    ],
    taches: [
      'Calculer la retenue sur salaire pour les 3 jours d\'absence maladie',
      'Expliquer au salarié le fonctionnement des indemnités journalières de maladie de la CNSS (délai de carence légal de 3 jours)',
      'Générer l\'attestation de salaire pour la CNSS'
    ],
    livrablesAttendus: [
      'Fiche d\'événement maladie validée',
      'Calcul explicatif de la retenue employeur',
      'Note d\'information CNSS pour le salarié'
    ],
    bareme: {
      dossierEtPieces: 4,
      justificationRegles: 4,
      calculs: 8,
      controlesEtCoherence: 4
    },
    indicesProgressifs: [
      'Indice 1 : Sauf convention collective prévoyant un maintien de salaire, l\'employeur retient les jours non travaillés.',
      'Indice 2 : La CNSS verse les indemnités journalières à compter du 4ème jour d\'incapacité (carence de 3 jours).'
    ],
    reponseAttendue: {
      formulesEtJustifications: [
        'Retenue absence maladie = 24h × (8 500 / 191) = 1 068,06 MAD.',
        'La CNSS n\'indemnise qu\'à partir du 4ème jour, les 3 premiers jours constituant le délai de carence.'
      ]
    },
    explicationComplete: 'L\'arrêt maladie suspend le contrat de travail. Au Maroc, en l\'absence de maintien de salaire contractuel, l\'employeur opère une retenue exacte sur le salaire mensuel, et la CNSS indemnise le salarié après un délai de carence de 3 jours.',
    erreursFrequentes: [
      'Assimiler l\'arrêt maladie à un congé payé pris en charge intégralement par l\'employeur',
      'Oublier le délai de prévenance de 48 heures prévu par l\'Article 271'
    ]
  },
  {
    id: 'mission-07',
    numero: 7,
    titre: 'Préparation et contrôle des variables mensuelles de paie',
    contexte: 'Pour la paie de janvier 2025, rassemblez et consolidez toutes les variables : primes, acomptes versés, heures supplémentaires, et retenues.',
    competences: [
      'Consolider les éléments variables de rémunération',
      'Qualifier le traitement fiscal et social de chaque élément (imposable, exonéré, cotisable)',
      'Déterminer la prime d\'ancienneté conformément à l\'Article 350'
    ],
    dureeIndicativeMinutes: 50,
    niveau: 'essentiel',
    donneesFournies: [
      'Liste des salariés et dates d\'embauche',
      'Tableau des heures sup approuvées du mois de janvier',
      'Relevé des acomptes versés le 15 du mois'
    ],
    taches: [
      'Déterminer le taux de prime d\'ancienneté pour chaque salarié en fonction de ses années de service',
      'Calculer l\'assiette de la prime d\'ancienneté (Base + Heures sup)',
      'Intégrer les acomptes consentis'
    ],
    livrablesAttendus: [
      'Tableau de bord des variables de paie de janvier 2025',
      'Fiche de contrôle avant calcul du brut'
    ],
    bareme: {
      dossierEtPieces: 4,
      justificationRegles: 4,
      calculs: 8,
      controlesEtCoherence: 4
    },
    indicesProgressifs: [
      'Indice 1 : Un salarié embauché en mai 2018 a plus de 6 ans d\'ancienneté en janvier 2025 -> Taux de 10%.',
      'Indice 2 : L\'acompte sur salaire n\'est pas une charge mais une avance déductible du Net à payer.'
    ],
    reponseAttendue: {
      formulesEtJustifications: [
        'Prime d\'ancienneté Art. 350 : 2 à 5 ans = 5%, 5 à 12 ans = 10%, 12 à 20 ans = 15%.'
      ]
    },
    explicationComplete: 'Les variables de paie doivent faire l\'objet d\'un pointage systématique avant le lancement du calcul automatique pour éviter les régularisations a posteriori.',
    erreursFrequentes: [
      'Calculer la prime d\'ancienneté sur le salaire brut total au lieu de la base légale (Base + Heures sup)'
    ]
  },
  {
    id: 'mission-08',
    numero: 8,
    titre: 'Calcul complet et contrôle pas-à-pas d\'un bulletin de paie',
    contexte: 'Vous devez calculer le bulletin de paie de M. Mehdi ALAMI (M002) pour janvier 2025 (Salaire de base : 7 500 MAD, 6h supplémentaires à 25%, marié avec 1 enfant, ancienneté 4 ans = 5%).',
    competences: [
      'Calculer le Salaire Brut Global et l\'Assiette CNSS/AMO',
      'Appliquer le plafonnement de la CNSS à 6 000 MAD',
      'Calculer les déductions pour frais professionnels et le Net Imposable',
      'Calculer l\'IR par tranches et appliquer l\'abattement pour charges de famille',
      'Déterminer le Net à Payer'
    ],
    dureeIndicativeMinutes: 60,
    niveau: 'essentiel',
    donneesFournies: [
      'Salaire de base : 7 500 MAD',
      'Taux horaire : 7 500 / 191 = 39,27 MAD/h',
      'Heures sup : 6h × 39,27 × 1,25 = 294,53 MAD',
      'Ancienneté : 4 ans -> Taux 5% appliqué sur (7 500 + 294,53) = 389,73 MAD',
      'Charges de famille : 2 personnes (épouse + 1 enfant) = 60 MAD'
    ],
    taches: [
      'Exécuter le calcul dans le simulateur de paie',
      'Inspecter les formules étape par étape',
      'Vérifier le plafonnement de la CNSS (assiette 6 000 MAD, soit 268,80 MAD)',
      'Vérifier l\'application correcte du barème de l\'IR et le Net à Payer'
    ],
    livrablesAttendus: [
      'Bulletin de paie de Mehdi Alami généré et validé',
      'Fiche explicative du calcul de l\'IR et du Net à payer'
    ],
    bareme: {
      dossierEtPieces: 4,
      justificationRegles: 4,
      calculs: 8,
      controlesEtCoherence: 4
    },
    indicesProgressifs: [
      'Indice 1 : Brut Global = 7 500 + 294,53 + 389,73 = 8 184,26 MAD.',
      'Indice 2 : Cotisation CNSS salariale = 6 000 × 4,48% = 268,80 MAD. AMO = 8 184,26 × 2,26% = 184,96 MAD.',
      'Indice 3 : Frais professionnels = 25% car le salaire dépasse 6 500 MAD (ou 35% selon tranche).'
    ],
    reponseAttendue: {
      resultatsNumeriquesAttendus: {
        salaireBrutGlobal: 8184.26,
        cnssSalariale: 268.80,
        amoSalariale: 184.96
      }
    },
    explicationComplete: 'Le calcul du bulletin marocain suit une chaîne déterministe stricte : Brut Global -> Cotisations sociales salariales (avec plafond CNSS 6000 DH et AMO déplafonnée) -> Frais professionnels -> Net Imposable -> Barème IR progressif -> Réductions charges de famille -> Net à payer.',
    erreursFrequentes: [
      'Appliquer le taux CNSS sur le salaire brut réel supérieur à 6 000 MAD sans le plafonner',
      'Oublier de déduire les charges de famille de l\'IR brut'
    ]
  },
  {
    id: 'mission-09',
    numero: 9,
    titre: 'Production du livre de paie et réconciliation avec l\'état CNSS',
    contexte: 'Tous les bulletins de janvier 2025 sont calculés. Vous devez éditer le livre de paie récapitulatif mensuel, vérifier les totaux et contrôler la concordance stricte avec l\'état déclaratif CNSS.',
    competences: [
      'Éditer et contrôler le Livre de Paie mensuel',
      'Vérifier les totaux de masse salariale brute, cotisable et nette',
      'Établir l\'état déclaratif pédagogique CNSS / AMO',
      'Effectuer le rapprochement paie / déclaration sociale'
    ],
    dureeIndicativeMinutes: 50,
    niveau: 'avance',
    donneesFournies: [
      'Ensemble des bulletins des salariés pour janvier 2025',
      'Bordereau déclaratif CNSS de la période'
    ],
    taches: [
      'Afficher le livre de paie de janvier 2025',
      'Vérifier que la somme des colonnes correspond aux totaux affichés',
      'Accéder au module CNSS et AMO et vérifier la concordance des montants',
      'Identifier tout écart de centimes d\'arrondi'
    ],
    livrablesAttendus: [
      'Livre de paie exporté au format CSV ou imprimé',
      'Bordereau pédagogique de déclaration CNSS / AMO',
      'Procès-verbal de réconciliation paie / CNSS'
    ],
    bareme: {
      dossierEtPieces: 4,
      justificationRegles: 4,
      calculs: 8,
      controlesEtCoherence: 4
    },
    indicesProgressifs: [
      'Indice 1 : La masse salariale brute du livre de paie doit égaler la somme exacte des bruts individuels.',
      'Indice 2 : La part patronale ne fait pas partie des retenues salariales mais s\'ajoute pour former le coût global.'
    ],
    reponseAttendue: {
      controlesAttendus: [
        'Égalité stricte : Somme des Nets des bulletins = Net global du livre de paie',
        'Concordance des cotisations salariales et patronales avec le bordereau CNSS'
      ]
    },
    explicationComplete: 'Le livre de paie est un registre légal obligatoire (Article 371 du Code du Travail). Les données doivent être en réconciliation parfaite avec la déclaration CNSS mensuelle.',
    erreursFrequentes: [
      'Constater un écart entre le livre de paie et l\'état CNSS suite à une modification non synchronisée d\'un bulletin'
    ]
  },
  {
    id: 'mission-10',
    numero: 10,
    titre: 'Mission de synthèse : Traiter un mois complet avec anomalies volontaires',
    contexte: 'Pour la paie de février 2025, plusieurs anomalies ont été glissées dans les données : embauche en cours de mois sans proratisation, absence déduite deux fois, et dépassement de période d\'essai sur CDD. Vous devez auditer, corriger et clôturer la paie.',
    competences: [
      'Diagnostiquer des anomalies complexes de paie et de gestion administrative',
      'Proratiser un salaire d\'entrée en cours de mois (15 février)',
      'Détecter et corriger une double retenue d\'absence',
      'Clôturer la période et sceller l\'historique'
    ],
    dureeIndicativeMinutes: 75,
    niveau: 'avance',
    donneesFournies: [
      'Scénario de février 2025 avec les 12 salariés',
      'Nouvel arrivant M012 embauché le 15 février',
      'Salarié M008 avec contrat CDD arrivant à échéance fin mars',
      'Salarié M005 avec arrêt maladie de 3 jours'
    ],
    taches: [
      'Repérer les erreurs dans les données de paie de février',
      'Proratiser le salaire de base de M012 pour la période travaillée du 15 au 28 février',
      'Corriger les variables de paie',
      'Valider et clôturer la période de février'
    ],
    livrablesAttendus: [
      'Rapport d\'anomalies corrigées',
      'Bulletins de paie de février clôturés et scellés',
      'Livre de paie consolidé de février'
    ],
    bareme: {
      dossierEtPieces: 4,
      justificationRegles: 4,
      calculs: 8,
      controlesEtCoherence: 4
    },
    indicesProgressifs: [
      'Indice 1 : Pour une embauche au 15 février, le salarié n\'a travaillé que 14 jours calendaires (ou les heures ouvrées réelles). Le salaire doit être proratisé.',
      'Indice 2 : Vérifiez que l\'absence pour maladie n\'a pas été saisie à la fois comme congé sans solde et comme retenue exceptionnelle.'
    ],
    reponseAttendue: {
      controlesAttendus: [
        'Proratisation exacte de l\'embauche en cours de mois',
        'Élimination des doubles retenues',
        'Clôture irréversible avec conservation de l\'instantané des règles'
      ]
    },
    explicationComplete: 'Cette mission de synthèse reproduit les situations d\'audit réelles auxquelles un gestionnaire de paie est confronté en entreprise. Elle valide l\'ensemble des compétences du module.',
    erreursFrequentes: [
      'Clôturer la paie avant d\'avoir contrôlé la réconciliation avec les états sociaux'
    ]
  }
];

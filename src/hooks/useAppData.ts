import { useEffect, useState } from 'react';
import { CONTRATS_DEMO, DEMANDES_CONGES_DEMO, ENTREPRISE_DEMO, EVENEMENTS_PRESENCE_DEMO, SALARIES_DEMO } from '../data/initialDemoData';
import { MISSIONS_PEDAGOGIQUES } from '../data/missionsData';
import { clearAllLocalData, loadAppState, saveAppState } from '../services/db';
import { calculerBulletinPaie } from '../services/payrollEngine';
import { REGLES_JURIDIQUES_MAROC } from '../services/rulesData';
import {
  BulletinPaie,
  ClassePedagogique,
  Contrat,
  DemandeConge,
  Entreprise,
  EvenementPresence,
  MissionExercice,
  ModePedagogique,
  NiveauPedagogique,
  RegleParametreJuridique,
  Salarie,
  TentativeExercice
} from '../types';

export function useAppData() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [entreprise, setEntreprise] = useState<Entreprise>(ENTREPRISE_DEMO);
  const [salaries, setSalaries] = useState<Salarie[]>(SALARIES_DEMO);
  const [contrats, setContrats] = useState<Contrat[]>(CONTRATS_DEMO);
  const [evenementsPresence, setEvenementsPresence] = useState<EvenementPresence[]>(EVENEMENTS_PRESENCE_DEMO);
  const [demandesConges, setDemandesConges] = useState<DemandeConge[]>(DEMANDES_CONGES_DEMO);
  const [bulletins, setBulletins] = useState<BulletinPaie[]>([]);
  const [regles, setRegles] = useState<RegleParametreJuridique[]>(REGLES_JURIDIQUES_MAROC);
  const [missions] = useState<MissionExercice[]>(MISSIONS_PEDAGOGIQUES);
  const [tentatives, setTentatives] = useState<TentativeExercice[]>([]);
  const [classes, setClasses] = useState<ClassePedagogique[]>([
    {
      id: 'cls-01',
      nom: 'TSGE 2 - Gestion des Entreprises',
      anneeScolaire: '2024 / 2025',
      formateurNom: 'M. M. TAHIRI',
      etablissement: 'ISTA Marrakech Guéliz — OFPPT',
      stagiaires: [
        { matricule: 'STG-01', nom: 'BENALI', prenom: 'Amine' },
        { matricule: 'STG-02', nom: 'EL HADDAD', prenom: 'Sara' },
        { matricule: 'STG-03', nom: 'NACIRI', prenom: 'Youssef' }
      ]
    }
  ]);

  // Paramètres d'exécution
  const [periodeActive, setPeriodeActive] = useState<string>('2025-01');
  const [modePedagogique, setModePedagogique] = useState<ModePedagogique>('demonstration');
  const [niveau, setNiveau] = useState<NiveauPedagogique>('essentiel');
  const [nomStagiaireActif, setNomStagiaireActif] = useState<string>('Stagiaire OFPPT');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  // Charger l'état au démarrage
  useEffect(() => {
    async function init() {
      try {
        const stored = await loadAppState();
        if (stored) {
          if (stored.entreprise) setEntreprise(stored.entreprise);
          if (stored.salaries && stored.salaries.length > 0) setSalaries(stored.salaries);
          if (stored.contrats) setContrats(stored.contrats);
          if (stored.evenementsPresence) setEvenementsPresence(stored.evenementsPresence);
          if (stored.demandesConges) setDemandesConges(stored.demandesConges);
          if (stored.bulletins) setBulletins(stored.bulletins);
          if (stored.regles) setRegles(stored.regles);
          if (stored.tentatives) setTentatives(stored.tentatives);
          if (stored.classes) setClasses(stored.classes);
          if (stored.parametresApp) {
            setPeriodeActive(stored.parametresApp.periodeActive || '2025-01');
            setModePedagogique(stored.parametresApp.modePedagogique || 'demonstration');
            setNiveau(stored.parametresApp.niveau || 'essentiel');
            setNomStagiaireActif(stored.parametresApp.nomStagiaireActif || 'Stagiaire OFPPT');
          }
        } else {
          // Calculer les bulletins initiaux pour janvier 2025
          calculerTousLesBulletinsPeriode('2025-01', SALARIES_DEMO, EVENEMENTS_PRESENCE_DEMO);
        }
      } catch (e) {
        console.error('Erreur chargement initial:', e);
      } finally {
        setIsLoaded(true);
      }
    }
    init();
  }, []);

  // Sauvegarde automatique lorsque les données changent
  useEffect(() => {
    if (!isLoaded) return;
    const saveTimeout = setTimeout(() => {
      saveAppState({
        version: 1,
        derniereSauvegarde: new Date().toISOString(),
        entreprise,
        salaries,
        contrats,
        evenementsPresence,
        demandesConges,
        bulletins,
        regles,
        missions,
        tentatives,
        classes,
        parametresApp: {
          periodeActive,
          modePedagogique,
          niveau,
          nomStagiaireActif
        }
      });
    }, 400);

    return () => clearTimeout(saveTimeout);
  }, [
    isLoaded,
    entreprise,
    salaries,
    contrats,
    evenementsPresence,
    demandesConges,
    bulletins,
    regles,
    tentatives,
    classes,
    periodeActive,
    modePedagogique,
    niveau,
    nomStagiaireActif
  ]);

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  /**
   * Calcul déterministe de tous les bulletins pour une période donnée
   */
  const calculerTousLesBulletinsPeriode = (
    periode: string,
    listeSalaries: Salarie[] = salaries,
    listeEvts: EvenementPresence[] = evenementsPresence
  ) => {
    const nouveauxBulletins: BulletinPaie[] = [];

    listeSalaries.forEach((sal) => {
      // Filtrer les événements de présence du salarié pour ce mois
      const evtsMois = listeEvts.filter(
        (e) => e.salarieId === sal.id && e.dateDebut.startsWith(periode) && e.statut === 'Approuvee'
      );

      let h25 = 0;
      let h50 = 0;
      let h100 = 0;
      let hAbsence = 0;

      evtsMois.forEach((e) => {
        if (e.type === 'heures_sup_jour_25') h25 += e.duree;
        if (e.type === 'heures_sup_nuit_50' || e.type === 'heures_sup_repos_jour_50') h50 += e.duree;
        if (e.type === 'heures_sup_repos_nuit_100') h100 += e.duree;
        if (e.type === 'absence_injustifiee' || e.type === 'arret_maladie') {
          hAbsence += e.unite === 'jours' ? e.duree * 8 : e.duree;
        }
      });

      // Vérifier si le salarié a été embauché au cours de ce mois (proratisation)
      let primes: { libelle: string; montant: number; imposable: boolean; cotisable: boolean }[] = [];
      let indemnitesExonerees: { libelle: string; montant: number }[] = [];
      let avantages: { libelle: string; montant: number }[] = [];
      let acomptes = 0;

      // Exemple variables démo
      if (sal.matricule === 'M001') {
        primes.push({ libelle: 'Prime de fonction & responsabilité', montant: 1500, imposable: true, cotisable: true });
        indemnitesExonerees.push({ libelle: 'Indemnité de transport légale', montant: 500 });
      }
      if (sal.matricule === 'M002' && periode === '2025-01') {
        acomptes = 1000;
      }

      const bulletin = calculerBulletinPaie({
        salarie: sal,
        periodeMois: periode,
        heuresSup25: h25,
        heuresSup50: h50,
        heuresSup100: h100,
        heuresAbsence: hAbsence,
        primesDiverses: primes,
        indemnitesNonImposables: indemnitesExonerees,
        avantagesEnNature: avantages,
        acomptesAvances: acomptes
      });

      nouveauxBulletins.push(bulletin);
    });

    setBulletins((prev) => {
      // Conserver les bulletins d'autres périodes, remplacer ceux de la période en cours non scellés
      const autres = prev.filter((b) => b.periodeMois !== periode || b.estSnapshotScelle);
      return [...autres, ...nouveauxBulletins];
    });

    showNotification(`Bulletins de la période ${periode} calculés avec succès (${nouveauxBulletins.length} salariés)`, 'success');
  };

  /**
   * Clôturer la paie d'une période pour sceller l'historique
   */
  const cloturerPeriode = (periode: string) => {
    setBulletins((prev) =>
      prev.map((b) => {
        if (b.periodeMois === periode) {
          return {
            ...b,
            statut: 'Cloture',
            estSnapshotScelle: true,
            dateCloture: new Date().toISOString()
          };
        }
        return b;
      })
    );
    showNotification(`La période ${periode} a été clôturée. Les bulletins sont scellés.`, 'success');
  };

  /**
   * Réinitialisation de la copie de démonstration
   */
  const reinitialiserDonneesDemo = async () => {
    await clearAllLocalData();
    setEntreprise(ENTREPRISE_DEMO);
    setSalaries(SALARIES_DEMO);
    setContrats(CONTRATS_DEMO);
    setEvenementsPresence(EVENEMENTS_PRESENCE_DEMO);
    setDemandesConges(DEMANDES_CONGES_DEMO);
    setRegles(REGLES_JURIDIQUES_MAROC);
    setTentatives([]);
    calculerTousLesBulletinsPeriode('2025-01', SALARIES_DEMO, EVENEMENTS_PRESENCE_DEMO);
    showNotification('Jeu de données de démonstration réinitialisé avec succès.', 'info');
  };

  /**
   * Ajouter ou modifier un salarié
   */
  const upsertSalarie = (salarie: Salarie) => {
    setSalaries((prev) => {
      const exists = prev.some((s) => s.id === salarie.id);
      if (exists) {
        return prev.map((s) => (s.id === salarie.id ? salarie : s));
      }
      return [...prev, salarie];
    });
    showNotification(`Salarié ${salarie.nom} ${salarie.prenom} (${salarie.matricule}) enregistré.`, 'success');
  };

  /**
   * Ajouter ou modifier un contrat et synchroniser le profil salarié
   */
  const upsertContrat = (contrat: Contrat) => {
    setContrats((prev) => {
      const exists = prev.some((c) => c.id === contrat.id);
      if (exists) {
        return prev.map((c) => (c.id === contrat.id ? contrat : c));
      }
      return [...prev, contrat];
    });

    // Synchronisation automatique avec le profil du salarié
    setSalaries((prev) =>
      prev.map((sal) => {
        if (sal.id === contrat.salarieId) {
          const updatedHistory = [
            ...(sal.historiqueEvenements || []),
            {
              date: new Date().toISOString().split('T')[0],
              description: `Mise à jour contrat ${contrat.type} N° ${contrat.numeroContrat} - Poste: ${contrat.poste} (${contrat.salaireBaseMensuel} MAD)`,
              auteur: 'Gestionnaire RH'
            }
          ];

          return {
            ...sal,
            poste: contrat.statut === 'en_cours' ? contrat.poste : sal.poste,
            salaireBaseMensuel: contrat.statut === 'en_cours' ? contrat.salaireBaseMensuel : sal.salaireBaseMensuel,
            contratActuelId: contrat.statut === 'en_cours' ? contrat.id : sal.contratActuelId,
            historiqueEvenements: updatedHistory
          };
        }
        return sal;
      })
    );

    showNotification(`Contrat ${contrat.numeroContrat} enregistré et profil salarié synchronisé.`, 'success');
  };

  /**
   * Supprimer un contrat
   */
  const deleteContrat = (contratId: string) => {
    setContrats((prev) => prev.filter((c) => c.id !== contratId));
    showNotification('Contrat supprimé avec succès.', 'info');
  };

  /**
   * Ajouter ou modifier un événement de présence (avec période de paie liée)
   */
  const upsertEvenementPresence = (evt: EvenementPresence) => {
    const periode = evt.periodeMois || evt.dateDebut.substring(0, 7);
    const evtAvecPeriode: EvenementPresence = {
      ...evt,
      periodeMois: periode
    };

    setEvenementsPresence((prev) => {
      const exists = prev.some((e) => e.id === evt.id);
      if (exists) {
        return prev.map((e) => (e.id === evt.id ? evtAvecPeriode : e));
      }
      return [...prev, evtAvecPeriode];
    });
    showNotification(`Événement de pointage enregistré pour la période ${periode}.`, 'success');
  };

  /**
   * Supprimer un événement de présence
   */
  const deleteEvenementPresence = (evtId: string) => {
    setEvenementsPresence((prev) => prev.filter((e) => e.id !== evtId));
    showNotification('Événement de présence supprimé.', 'info');
  };

  /**
   * Ajouter ou approuver une demande de congé
   */
  const upsertDemandeConge = (demande: DemandeConge) => {
    setDemandesConges((prev) => {
      const exists = prev.some((d) => d.id === demande.id);
      if (exists) {
        return prev.map((d) => (d.id === demande.id ? demande : d));
      }
      return [...prev, demande];
    });
    showNotification(`Demande de congé mise à jour (${demande.statut}).`, 'info');
  };

  /**
   * Enregistrer une tentative de mission par le stagiaire
   */
  const soumettreTentative = (tentative: TentativeExercice) => {
    setTentatives((prev) => {
      const filtered = prev.filter((t) => t.id !== tentative.id);
      return [...filtered, tentative];
    });
    showNotification('Votre mission a été enregistrée et soumise avec succès.', 'success');
  };

  return {
    isLoaded,
    entreprise,
    setEntreprise,
    salaries,
    contrats,
    evenementsPresence,
    demandesConges,
    bulletins,
    regles,
    missions,
    tentatives,
    classes,
    setClasses,
    periodeActive,
    setPeriodeActive,
    modePedagogique,
    setModePedagogique,
    niveau,
    setNiveau,
    nomStagiaireActif,
    setNomStagiaireActif,
    notification,
    showNotification,
    calculerTousLesBulletinsPeriode,
    cloturerPeriode,
    reinitialiserDonneesDemo,
    upsertSalarie,
    upsertContrat,
    deleteContrat,
    upsertEvenementPresence,
    deleteEvenementPresence,
    upsertDemandeConge,
    soumettreTentative
  };
}

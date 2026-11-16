import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  ArrowRight,
  AlertCircle,
  Award,
  Radio,
  FileSpreadsheet,
  FileText,
  ListChecks,
  UserX,
  ClipboardCheck,
  Circle
} from 'lucide-react';
import { ClassePedagogique, MissionExercice, MembreClasseLive } from '../../types';
import { cloudEnabled } from '../../services/cloudSync';
import { supabase } from '../../services/supabase';
import { fetchAllActivitesRHLive, fetchAllTentativesLive, ActiviteRHLive, TentativeLive } from '../../services/trainerLive';
import { fetchEffectifLive } from '../../services/classeJoin';
import {
  exporterSuiviStagiairesCSV,
  genererSuiviStagiairesPDF,
  genererCertificatPDF,
  LigneSuiviExport,
  MetaSuiviExport
} from '../../services/exportService';
import { estParcoursReussi, referenceCertificat } from '../../services/certificat';
import { chargerParametresRelance, enregistrerParametresRelance, ParametresRelance } from '../../services/reminders';
import { OngletNavigation } from '../common/NavigationTabs';
import { Card, Kpi, Badge, SectionTitle, ZelligeHeader, Button } from '../ui/kit';

interface FormateurDashboardProps {
  classes: ClassePedagogique[];
  missions: MissionExercice[];
  onNavigate: (onglet: OngletNavigation) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  /** Aperçu hors-ligne (design) : si fourni, on n'interroge pas Supabase. */
  previewData?: { tentatives: TentativeLive[]; effectif: MembreClasseLive[] };
}

/** Ligne consolidée par stagiaire, calculée à partir des remises Supabase. */
interface SuiviStagiaire {
  userId: string;
  nom: string;
  classeId: string | null;
  classe: string;
  missionsSoumises: number; // missions distinctes remises ou corrigées
  missionsCorrigees: number;
  moyenne: number | null; // moyenne /20 des missions corrigées
  derniereActivite: string | null; // ISO
  taux: number; // % d'avancement sur le catalogue de missions
  inactifJours: number | null; // jours depuis la dernière activité (null = jamais actif)
}

const MS_JOUR = 1000 * 60 * 60 * 24;

export const FormateurDashboard: React.FC<FormateurDashboardProps> = ({
  classes,
  missions,
  onNavigate,
  showNotification,
  previewData
}) => {
  const [tentatives, setTentatives] = useState<TentativeLive[]>(previewData?.tentatives ?? []);
  const [activitesRH, setActivitesRH] = useState<ActiviteRHLive[]>([]);
  const [effectif, setEffectif] = useState<MembreClasseLive[]>(previewData?.effectif ?? []);
  const [chargement, setChargement] = useState(false);
  const [classeFiltre, setClasseFiltre] = useState<string>('toutes');
  const [seuilInactivite, setSeuilInactivite] = useState<number>(7);
  const [parametresRelance, setParametresRelance] = useState<ParametresRelance>({
    active: false,
    delaiInactiviteJours: 7,
    delaiEntreRelancesJours: 7
  });
  const [relancesDisponibles, setRelancesDisponibles] = useState(cloudEnabled);
  const [sauvegardeRelance, setSauvegardeRelance] = useState(false);
  const [envoiCollectif, setEnvoiCollectif] = useState(false);
  const [messageCollectif, setMessageCollectif] = useState(
    'Bonjour,\nConnectez-vous à SIMULRH pour poursuivre vos missions et vérifier votre progression.\n— Votre formateur'
  );
  const [classeMessageCible, setClasseMessageCible] = useState('toutes');
  const [stagiairesSelectionnes, setStagiairesSelectionnes] = useState<string[]>([]);

  const classesActives = useMemo(() => classes.filter((c) => !c.archiveeLe), [classes]);
  const destinatairesMessage = useMemo(
    () => effectif.filter((membre) => classeMessageCible === 'toutes' || membre.classeId === classeMessageCible),
    [effectif, classeMessageCible]
  );
  const missionsTotal = Math.max(missions.length, 1);

  const charger = async () => {
    if (previewData) return; // aperçu design : données injectées, pas de requête réseau
    if (!cloudEnabled) return;
    setChargement(true);
    try {
      const [lives, effectifs, activites] = await Promise.all([
        fetchAllTentativesLive(),
        Promise.all(classesActives.map((c) => fetchEffectifLive(c.id))).then((r) => r.flat()),
        fetchAllActivitesRHLive()
      ]);
      setTentatives(lives);
      setEffectif(effectifs);
      setActivitesRH(activites);
    } catch (e: any) {
      showNotification(`Chargement du suivi impossible : ${e.message}`, 'error');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classesActives.map((c) => c.id).join(',')]);

  useEffect(() => {
    if (!cloudEnabled || previewData) return;
    chargerParametresRelance()
      .then(setParametresRelance)
      .catch(() => setRelancesDisponibles(false));
  }, [previewData]);

  useEffect(() => {
    setStagiairesSelectionnes(destinatairesMessage.map((membre) => membre.stagiaireUserId));
  }, [destinatairesMessage]);

  const sauverRelances = async (prochains: ParametresRelance) => {
    setParametresRelance(prochains);
    setSauvegardeRelance(true);
    try {
      await enregistrerParametresRelance(prochains);
      showNotification(prochains.active ? 'Relances e-mail automatiques activées.' : 'Relances e-mail automatiques désactivées.', 'success');
    } catch (e: any) {
      setParametresRelance(parametresRelance);
      showNotification(`Paramètres de relance non enregistrés : ${e.message}`, 'error');
    } finally {
      setSauvegardeRelance(false);
    }
  };

  const envoyerMessageCollectif = async () => {
    if (messageCollectif.trim().length < 10) return showNotification('Le message doit contenir au moins 10 caractères.', 'warning');
    if (stagiairesSelectionnes.length === 0) return showNotification('Sélectionnez au moins un stagiaire.', 'warning');
    const cible = `${stagiairesSelectionnes.length} stagiaire(s) sélectionné(s)`;
    if (!confirm(`Envoyer ce message à ${cible} ?`)) return;
    if (!supabase) return showNotification('Une connexion cloud est nécessaire.', 'error');
    setEnvoiCollectif(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error('Session expirée.');
      const response = await fetch('/api/send-class-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ message: messageCollectif, classeId: classeMessageCible === 'toutes' ? undefined : classeMessageCible, stagiaireIds: stagiairesSelectionnes })
      });
      const resultat = await response.json() as { ok: boolean; envoyes?: number; erreur?: string };
      if (!response.ok || !resultat.ok) throw new Error(resultat.erreur ?? 'Envoi impossible.');
      showNotification(`Message envoyé à ${resultat.envoyes ?? 0} stagiaire(s).`, 'success');
    } catch (e: any) {
      showNotification(`Envoi collectif impossible : ${e.message}`, 'error');
    } finally {
      setEnvoiCollectif(false);
    }
  };

  // Consolidation par stagiaire (jointure remises <-> effectif réel via userId).
  const suiviComplet: SuiviStagiaire[] = useMemo(() => {
    const maintenant = Date.now();
    const classeIdParUser = new Map<string, string>();
    const classeNomParUser = new Map<string, string>();
    const nomParUser = new Map<string, string>();
    for (const m of effectif) {
      const classe = classesActives.find((c) => c.id === m.classeId);
      classeIdParUser.set(m.stagiaireUserId, m.classeId);
      classeNomParUser.set(m.stagiaireUserId, classe?.nom ?? '—');
      nomParUser.set(m.stagiaireUserId, `${m.nom} ${m.prenom}`.trim());
    }

    const parUser = new Map<string, TentativeLive[]>();
    for (const t of tentatives) {
      const liste = parUser.get(t.userId) ?? [];
      liste.push(t);
      parUser.set(t.userId, liste);
    }

    const userIds = new Set<string>([...effectif.map((m) => m.stagiaireUserId), ...parUser.keys()]);

    const lignes: SuiviStagiaire[] = [];
    for (const userId of userIds) {
      const liste = parUser.get(userId) ?? [];
      const soumises = new Set<string>();
      const corrigees = new Set<string>();
      const notes: number[] = [];
      let derniere: string | null = null;

      for (const { tentative: t } of liste) {
        if (t.statut === 'remis' || t.statut === 'corrige') soumises.add(t.missionId);
        if (t.statut === 'corrige') {
          corrigees.add(t.missionId);
          if (t.correction) notes.push(t.correction.noteTotaleSur20);
        }
        const d = t.dateRemise || t.dateDebut;
        if (d && (!derniere || d > derniere)) derniere = d;
      }
      for (const activite of activitesRH.filter((activite) => activite.userId === userId)) {
        if (!derniere || activite.updatedAt > derniere) derniere = activite.updatedAt;
      }

      lignes.push({
        userId,
        nom: nomParUser.get(userId) || liste[0]?.tentative.stagiaireNom || 'Stagiaire',
        classeId: classeIdParUser.get(userId) ?? null,
        classe: classeNomParUser.get(userId) || '—',
        missionsSoumises: soumises.size,
        missionsCorrigees: corrigees.size,
        moyenne: notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null,
        derniereActivite: derniere,
        taux: Math.round((soumises.size / missionsTotal) * 100),
        inactifJours: derniere ? Math.floor((maintenant - new Date(derniere).getTime()) / MS_JOUR) : null
      });
    }

    return lignes.sort((a, b) => b.taux - a.taux || a.nom.localeCompare(b.nom));
  }, [tentatives, effectif, activitesRH, classesActives, missionsTotal]);

  // Filtre par classe
  const suivi = useMemo(
    () => (classeFiltre === 'toutes' ? suiviComplet : suiviComplet.filter((s) => s.classeId === classeFiltre)),
    [suiviComplet, classeFiltre]
  );
  const userIdsScope = useMemo(() => new Set(suivi.map((s) => s.userId)), [suivi]);

  // Indicateurs globaux (sur le périmètre filtré)
  const nbStagiaires = suivi.length;
  const tauxMoyen = nbStagiaires ? Math.round(suivi.reduce((s, x) => s + x.taux, 0) / nbStagiaires) : 0;
  const tentativesScope = useMemo(() => tentatives.filter((t) => userIdsScope.has(t.userId)), [tentatives, userIdsScope]);
  const aCorriger = tentativesScope.filter((t) => t.tentative.statut === 'remis').length;
  const notesCorrigees = tentativesScope
    .filter((t) => t.tentative.statut === 'corrige' && t.tentative.correction)
    .map((t) => t.tentative.correction!.noteTotaleSur20);
  const moyenneGenerale = notesCorrigees.length ? notesCorrigees.reduce((a, b) => a + b, 0) / notesCorrigees.length : null;

  const estInactif = (s: SuiviStagiaire) => s.inactifJours === null || s.inactifJours >= seuilInactivite;
  const nbInactifs = suivi.filter(estInactif).length;
  const suiviParStagiaire = useMemo(() => new Map(suiviComplet.map((stagiaire) => [stagiaire.userId, stagiaire])), [suiviComplet]);
  const stagiairesARelancer = suivi.filter(estInactif).slice(0, 4);
  const actionsPrioritaires: { titre: string; detail: string; terminee: boolean; onglet: OngletNavigation }[] = [
    {
      titre: 'Créer ou vérifier vos classes',
      detail: classesActives.length ? `${classesActives.length} classe(s) active(s).` : 'Aucune classe active pour le moment.',
      terminee: classesActives.length > 0,
      onglet: 'formateur'
    },
    {
      titre: 'Inviter vos stagiaires',
      detail: nbStagiaires ? `${nbStagiaires} stagiaire(s) rattaché(s).` : 'Communiquez le code d’invitation de votre classe.',
      terminee: nbStagiaires > 0,
      onglet: 'formateur'
    },
    {
      titre: 'Corriger les travaux remis',
      detail: aCorriger ? `${aCorriger} remise(s) attend(ent) votre correction.` : 'Aucune remise en attente de correction.',
      terminee: nbStagiaires > 0 && aCorriger === 0,
      onglet: 'formateur'
    }
  ];
  const prochaineAction = actionsPrioritaires.find((action) => !action.terminee) ?? actionsPrioritaires[2];

  // Avancement par mission (sur le périmètre filtré)
  const avancementMissions = useMemo(() => {
    const soumisParMission = new Map<string, Set<string>>();
    const corrigeParMission = new Map<string, Set<string>>();
    for (const { userId, tentative: t } of tentativesScope) {
      if (t.statut === 'remis' || t.statut === 'corrige') {
        if (!soumisParMission.has(t.missionId)) soumisParMission.set(t.missionId, new Set());
        soumisParMission.get(t.missionId)!.add(userId);
      }
      if (t.statut === 'corrige') {
        if (!corrigeParMission.has(t.missionId)) corrigeParMission.set(t.missionId, new Set());
        corrigeParMission.get(t.missionId)!.add(userId);
      }
    }
    const base = Math.max(nbStagiaires, 1);
    return missions
      .map((m) => {
        const soumis = soumisParMission.get(m.id)?.size ?? 0;
        return {
          id: m.id,
          numero: m.numero,
          titre: m.titre,
          soumis,
          corriges: corrigeParMission.get(m.id)?.size ?? 0,
          taux: Math.round((soumis / base) * 100)
        };
      })
      .sort((a, b) => a.numero - b.numero); // ordre croissant des missions (1 → 10)
  }, [tentativesScope, missions, nbStagiaires]);

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';

  const couleurTaux = (t: number) =>
    t >= 75 ? 'bg-emerald-500' : t >= 40 ? 'bg-[#149D92]' : t > 0 ? 'bg-amber-500' : 'bg-slate-300';

  const lignesExport = (): LigneSuiviExport[] =>
    suivi.map((s) => ({
      nom: s.nom,
      classe: s.classe,
      missionsSoumises: s.missionsSoumises,
      missionsCorrigees: s.missionsCorrigees,
      taux: s.taux,
      moyenne: s.moyenne,
      derniereActivite: s.derniereActivite
    }));

  const metaExport = (): MetaSuiviExport => ({
    nbMissions: missions.length,
    nbStagiaires,
    tauxMoyen,
    aCorriger,
    moyenneGenerale
  });

  const handleExportCSV = () => {
    if (suivi.length === 0) return showNotification('Aucun stagiaire à exporter.', 'warning');
    exporterSuiviStagiairesCSV(lignesExport(), metaExport());
    showNotification('Export Excel (CSV) généré.', 'success');
  };
  const handleExportPDF = () => {
    if (suivi.length === 0) return showNotification('Aucun stagiaire à exporter.', 'warning');
    genererSuiviStagiairesPDF(lignesExport(), metaExport());
    showNotification('Export PDF généré.', 'success');
  };

  // Le parcours est réussi — et le certificat délivrable — quand toutes les
  // missions sont corrigées avec une moyenne ≥ 10/20.
  const parcoursReussi = (s: SuiviStagiaire) =>
    estParcoursReussi(s.missionsCorrigees, missions.length, s.moyenne);

  const handleCertificat = (s: SuiviStagiaire) => {
    if (!parcoursReussi(s) || s.moyenne === null) return;
    const classe = classesActives.find((c) => c.id === s.classeId);
    genererCertificatPDF({
      nomStagiaire: s.nom,
      classe: classe?.nom ?? (s.classe !== '—' ? s.classe : undefined),
      etablissement: classe?.etablissement,
      formateurNom: classe?.formateurNom,
      moyenneSur20: s.moyenne,
      nbMissions: missions.length,
      reference: referenceCertificat(s.nom)
    });
    showNotification(`Certificat de ${s.nom} généré.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Bandeau formateur — zellige */}
      <ZelligeHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-sm">
              <Award className="w-6 h-6 text-[#5FD0C5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#C96A4B] text-white rounded-full tracking-wide">SUIVI DES STAGIAIRES</span>
                <span className="text-[11px] text-white/70 font-medium inline-flex items-center gap-1">
                  <Radio className="w-3 h-3" /> Données en direct
                </span>
              </div>
              <h1 className="font-display text-[1.7rem] leading-tight font-semibold text-white mt-1.5">Tableau de bord Formateur</h1>
              <p className="text-sm text-white/75 mt-0.5">
                Avancement réel de vos stagiaires — {classesActives.length} classe(s) active(s), {nbStagiaires} stagiaire(s) affiché(s).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="onDark" onClick={charger} disabled={chargement} icon={chargement ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}>
              Actualiser
            </Button>
            <Button variant="onDark" onClick={handleExportCSV} icon={<FileSpreadsheet className="w-4 h-4" />}>Excel</Button>
            <Button variant="onDark" onClick={handleExportPDF} icon={<FileText className="w-4 h-4" />}>PDF</Button>
            <Button variant="secondary" onClick={() => onNavigate('formateur')} icon={<Users className="w-4 h-4" />}>Mes classes</Button>
          </div>
        </div>

        {/* Barre de filtres claire, posée sur le bandeau */}
        <div className="mt-5 bg-white/95 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs shadow-sm">
          <label className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold uppercase tracking-wide text-[10px]">Classe</span>
            <select
              value={classeFiltre}
              onChange={(e) => setClasseFiltre(e.target.value)}
              className="px-3 py-1.5 border border-[#ECE3D6] rounded-lg font-bold text-[#1C2459] bg-[#FBF7F0]"
            >
              <option value="toutes">Toutes les classes</option>
              {classesActives.map((c) => (
                <option key={c.id} value={c.id}>{c.nom} ({c.anneeScolaire})</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold uppercase tracking-wide text-[10px]">Seuil d'inactivité</span>
            <input
              type="number"
              min={1}
              max={90}
              value={seuilInactivite}
              onChange={(e) => setSeuilInactivite(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 px-2 py-1.5 border border-[#ECE3D6] rounded-lg font-bold text-[#1C2459] bg-[#FBF7F0]"
            />
            <span className="text-slate-500">jour(s)</span>
          </label>
          {!cloudEnabled && (
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <AlertCircle className="w-3.5 h-3.5" /> Suivi en direct indisponible en mode local.
            </span>
          )}
        </div>
      </ZelligeHeader>

      {/* Bloc d'orientation : rend les prochaines actions formateur immédiatement visibles. */}
      <Card className="p-5" aria-labelledby="pilotage-rapide-title">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E4F3F1] text-[#149D92] flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="pilotage-rapide-title" className="font-display text-lg font-semibold text-[#1C2459]">Pilotage rapide de votre classe</h2>
              <p className="text-xs text-slate-500 mt-0.5">Les actions prioritaires pour faire avancer vos stagiaires.</p>
            </div>
          </div>
          <Button variant="primary" onClick={() => onNavigate(prochaineAction.onglet)} icon={<ArrowRight className="w-4 h-4" />}>
            {prochaineAction.titre}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {actionsPrioritaires.map((action, index) => (
            <button
              key={action.titre}
              type="button"
              onClick={() => onNavigate(action.onglet)}
              className={`text-left rounded-xl border p-3 transition-colors ${action.terminee ? 'border-[#BFE1D9] bg-[#F2FAF8]' : 'border-[#ECE3D6] hover:border-[#149D92] hover:bg-[#FBF7F0]'}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {action.terminee ? <CheckCircle2 className="w-4 h-4 text-[#149D92]" /> : <Circle className="w-4 h-4 text-slate-400" />}
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Étape {index + 1}</span>
              </div>
              <p className="text-xs font-semibold text-[#1C2459]">{action.titre}</p>
              <p className="text-[11px] leading-snug text-slate-500 mt-1">{action.detail}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi
          label="Stagiaires suivis"
          tone="navy"
          icon={<Users className="w-4 h-4" />}
          value={nbStagiaires}
          unit="comptes"
        />
        <Kpi
          label="Avancement moyen"
          tone="teal"
          icon={<TrendingUp className="w-4 h-4" />}
          value={`${tauxMoyen}%`}
          footer={
            <div className="h-1.5 w-full bg-[#F3ECE1] rounded-full overflow-hidden">
              <div className={`h-full ${couleurTaux(tauxMoyen)}`} style={{ width: `${tauxMoyen}%` }} />
            </div>
          }
        />
        <Kpi
          label="À corriger"
          tone="safran"
          icon={<Clock className="w-4 h-4" />}
          value={aCorriger}
          unit="en attente"
          footer={
            <button onClick={() => onNavigate('formateur')} className="font-semibold text-[#149D92] hover:underline inline-flex items-center gap-1">
              Corriger <ArrowRight className="w-3 h-3" />
            </button>
          }
        />
        <Kpi
          label={`Inactifs (≥ ${seuilInactivite} j)`}
          tone="terracotta"
          icon={<UserX className="w-4 h-4" />}
          value={nbInactifs}
          unit="à relancer"
          valueClassName={nbInactifs > 0 ? 'text-[#B4563B]' : 'text-[#1C2459]'}
        />
        <Kpi
          label="Moyenne générale"
          tone="success"
          icon={<CheckCircle2 className="w-4 h-4" />}
          value={moyenneGenerale !== null ? moyenneGenerale.toFixed(1) : '—'}
          unit="/ 20"
          valueClassName="text-[#2E9E6B]"
          footer={`${notesCorrigees.length} copie(s) corrigée(s)`}
        />
      </div>

      {/* Priorités concrètes : évite au formateur de parcourir tout le tableau pour agir. */}
      <Card className="p-5" aria-labelledby="priorites-pedagogiques-title">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="priorites-pedagogiques-title" className="font-display text-lg font-semibold text-[#1C2459]">Priorités pédagogiques</h2>
            <p className="text-xs text-slate-500 mt-0.5">Les actions qui demandent votre attention aujourd’hui.</p>
          </div>
          <Button variant="secondary" onClick={() => onNavigate('formateur')} icon={<ArrowRight className="w-4 h-4" />}>
            Ouvrir l’espace formateur
          </Button>
        </div>

        {aCorriger === 0 && nbInactifs === 0 ? (
          <div className="rounded-xl bg-[#F2FAF8] px-4 py-3 text-xs text-[#277657] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Aucune priorité bloquante : les corrections et l’activité sont à jour.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aCorriger > 0 && (
              <button type="button" onClick={() => onNavigate('formateur')} className="text-left rounded-xl border border-[#F4D8A7] bg-[#FFF9ED] hover:border-[#C98A2B] p-4 transition-colors">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-[#C98A2B] shrink-0 mt-0.5" />
                  <span>
                    <span className="block text-sm font-semibold text-[#1C2459]">{aCorriger} copie(s) à corriger</span>
                    <span className="block text-xs text-slate-600 mt-1">Ouvrez l’espace formateur pour consulter les remises et donner un retour aux stagiaires.</span>
                  </span>
                </div>
              </button>
            )}
            {nbInactifs > 0 && (
              <button type="button" onClick={() => onNavigate('formateur')} className="text-left rounded-xl border border-[#F3C9C1] bg-[#FFF7F5] hover:border-[#D64545] p-4 transition-colors">
                <div className="flex items-start gap-2.5">
                  <UserX className="w-5 h-5 text-[#B4563B] shrink-0 mt-0.5" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#1C2459]">{nbInactifs} stagiaire(s) à relancer</span>
                    <span className="block text-xs text-slate-600 mt-1 truncate">{stagiairesARelancer.map((s) => s.nom).join(' · ')}</span>
                  </span>
                </div>
              </button>
            )}
          </div>
        )}
      </Card>

      <Card className="p-5" aria-labelledby="message-collectif-title">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 id="message-collectif-title" className="font-display text-lg font-semibold text-[#1C2459]">Message collectif aux stagiaires</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chaque stagiaire reçoit un e-mail individuel ; les adresses ne sont jamais visibles dans l’interface.</p>
          </div>
          <Button variant="primary" onClick={envoyerMessageCollectif} disabled={envoiCollectif || nbStagiaires === 0} icon={envoiCollectif ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}>
            {envoiCollectif ? 'Envoi en cours…' : 'Envoyer maintenant'}
          </Button>
        </div>
        <label className="block mt-4 text-xs font-semibold text-slate-600">
          Destinataires
          <select value={classeMessageCible} onChange={(e) => setClasseMessageCible(e.target.value)} disabled={envoiCollectif} className="mt-1.5 block w-full sm:w-80 rounded-xl border border-[#ECE3D6] bg-white px-3 py-2 text-sm font-normal text-[#1C2459]">
            <option value="toutes">Toutes mes classes ({nbStagiaires} stagiaires)</option>
            {classesActives.map((classe) => (
              <option key={classe.id} value={classe.id}>{classe.nom} — {classe.stagiaires.length} stagiaire(s)</option>
            ))}
          </select>
        </label>
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs font-semibold text-slate-600">Sélectionner les stagiaires ({stagiairesSelectionnes.length}/{destinatairesMessage.length})</span>
            <button type="button" onClick={() => setStagiairesSelectionnes(stagiairesSelectionnes.length === destinatairesMessage.length ? [] : destinatairesMessage.map((membre) => membre.stagiaireUserId))} className="text-[11px] font-semibold text-[#149D92] hover:underline">
              {stagiairesSelectionnes.length === destinatairesMessage.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>
          {destinatairesMessage.length === 0 ? (
            <p className="rounded-xl bg-[#FBF7F0] px-3 py-2 text-xs text-slate-500">Aucun effectif rattaché à cette cible.</p>
          ) : (
            <div className="max-h-40 overflow-y-auto rounded-xl border border-[#ECE3D6] divide-y divide-[#F3ECE1]">
              {destinatairesMessage.map((membre) => {
                const selectionne = stagiairesSelectionnes.includes(membre.stagiaireUserId);
                const suiviStagiaire = suiviParStagiaire.get(membre.stagiaireUserId);
                const statut = !suiviStagiaire || suiviStagiaire.inactifJours === null
                  ? { libelle: 'Jamais actif', style: 'bg-[#FFF1EE] text-[#B4563B]' }
                  : estInactif(suiviStagiaire)
                    ? { libelle: `Inactif ${suiviStagiaire.inactifJours} j`, style: 'bg-[#FFF4E5] text-[#A86418]' }
                    : { libelle: suiviStagiaire.inactifJours === 0 ? 'Actif aujourd’hui' : `Actif · ${suiviStagiaire.inactifJours} j`, style: 'bg-[#F2FAF8] text-[#277657]' };
                return <label key={membre.stagiaireUserId} className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#1C2459] hover:bg-[#FBF7F0] cursor-pointer"><input type="checkbox" checked={selectionne} onChange={() => setStagiairesSelectionnes((selection) => selectionne ? selection.filter((id) => id !== membre.stagiaireUserId) : [...selection, membre.stagiaireUserId])} className="accent-[#149D92]" /><span className={`w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-bold ${statut.style}`}>{statut.libelle}</span><span className="font-medium">{membre.prenom} {membre.nom}</span><span className="ml-auto text-[10px] text-slate-400">{classesActives.find((classe) => classe.id === membre.classeId)?.nom ?? ''}</span></label>;
              })}
            </div>
          )}
        </div>
        <label className="block mt-4 text-xs font-semibold text-slate-600">
          Votre message
          <textarea
            value={messageCollectif}
            onChange={(e) => setMessageCollectif(e.target.value.slice(0, 2000))}
            disabled={envoiCollectif}
            maxLength={2000}
            rows={4}
            className="mt-1.5 w-full resize-y rounded-xl border border-[#ECE3D6] bg-[#FBF7F0] px-3 py-2 text-sm font-normal text-[#1C2459] focus:outline-none focus:ring-2 focus:ring-[#149D92]/30 focus:border-[#149D92]"
          />
          <span className="mt-1 block text-[11px] font-normal text-slate-400 text-right">{messageCollectif.length}/2000</span>
        </label>
      </Card>

      {relancesDisponibles && (
        <Card className="p-5" aria-labelledby="relances-auto-title">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 id="relances-auto-title" className="font-display text-lg font-semibold text-[#1C2459]">Relances e-mail automatiques</h2>
              <p className="text-xs text-slate-500 mt-0.5">Un e-mail pédagogique est envoyé aux stagiaires inactifs, sans exposer leurs adresses dans l’interface.</p>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
              <span className="text-xs font-semibold text-[#1C2459]">{parametresRelance.active ? 'Activées' : 'Désactivées'}</span>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={parametresRelance.active}
                disabled={sauvegardeRelance}
                onChange={(e) => sauverRelances({ ...parametresRelance, active: e.target.checked })}
              />
              <span className="w-10 h-6 bg-slate-200 rounded-full relative transition-colors peer-checked:bg-[#149D92] after:content-[''] after:absolute after:w-4 after:h-4 after:bg-white after:rounded-full after:top-1 after:left-1 after:transition-transform peer-checked:after:translate-x-4" />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <label className="text-xs text-slate-600">
              Relancer après
              <span className="flex items-center gap-2 mt-1">
                <input type="number" min={1} max={90} value={parametresRelance.delaiInactiviteJours} disabled={sauvegardeRelance} onChange={(e) => setParametresRelance({ ...parametresRelance, delaiInactiviteJours: Math.max(1, Math.min(90, Number(e.target.value) || 1)) })} className="w-20 px-2 py-1.5 border border-[#ECE3D6] rounded-lg font-bold text-[#1C2459]" /> jours d’inactivité
              </span>
            </label>
            <label className="text-xs text-slate-600">
              Attendre au moins
              <span className="flex items-center gap-2 mt-1">
                <input type="number" min={1} max={90} value={parametresRelance.delaiEntreRelancesJours} disabled={sauvegardeRelance} onChange={(e) => setParametresRelance({ ...parametresRelance, delaiEntreRelancesJours: Math.max(1, Math.min(90, Number(e.target.value) || 1)) })} className="w-20 px-2 py-1.5 border border-[#ECE3D6] rounded-lg font-bold text-[#1C2459]" /> jours entre deux e-mails
              </span>
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={() => sauverRelances(parametresRelance)} disabled={sauvegardeRelance} icon={sauvegardeRelance ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}>Enregistrer les réglages</Button>
          </div>
        </Card>
      )}

      {/* Avancement par mission */}
      <Card className="p-6">
        <SectionTitle
          icon={<ListChecks className="w-4 h-4" />}
          title="Avancement par mission"
          subtitle="Part des stagiaires ayant soumis chaque mission — dans l'ordre des missions"
        />

        {nbStagiaires === 0 ? (
          <p className="text-xs text-slate-400 italic">Aucune donnée pour le périmètre sélectionné.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
            {avancementMissions.map((m) => (
              <div key={m.id} className="flex items-center gap-3 text-xs">
                <span className="w-6 h-6 rounded-lg bg-[#1C2459] text-white font-bold flex items-center justify-center shrink-0">{m.numero}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-700 truncate">{m.titre}</span>
                    <span className="tabular-nums text-slate-500 shrink-0">{m.soumis}/{nbStagiaires} · {m.taux}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-[#F3ECE1] rounded-full overflow-hidden">
                    <div className={`h-full ${couleurTaux(m.taux)}`} style={{ width: `${m.taux}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tableau de suivi par stagiaire */}
      <Card className="p-6">
        <SectionTitle
          title="Avancement par stagiaire"
          subtitle="Missions soumises, corrigées, moyenne et dernière activité"
          right={
            <button onClick={() => onNavigate('formateur')} className="text-xs font-semibold text-[#149D92] hover:underline flex items-center gap-1">
              <span>Espace formateur</span><ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        />

        {chargement && suivi.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : suivi.length === 0 ? (
          <div className="text-center py-10">
            <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Aucun stagiaire suivi pour ce périmètre.</p>
            <p className="text-xs text-slate-400 mt-1">
              Communiquez à vos apprenants le code d'invitation de votre classe depuis l'espace formateur.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-slate-400 border-b border-[#ECE3D6]">
                  <th className="py-2 pr-2">Stagiaire</th>
                  <th className="py-2 pr-2">Classe</th>
                  <th className="py-2 pr-2 w-48">Avancement</th>
                  <th className="py-2 pr-2 text-center">Corrigées</th>
                  <th className="py-2 pr-2 text-center">Moyenne</th>
                  <th className="py-2 pr-2">Dernière activité</th>
                  <th className="py-2 pr-2 text-center">Certificat</th>
                </tr>
              </thead>
              <tbody>
                {suivi.map((s) => {
                  const inactif = estInactif(s);
                  return (
                    <tr key={s.userId} className="border-b border-[#F3ECE1] hover:bg-[#FBF7F0]">
                      <td className="py-2.5 pr-2 font-semibold text-[#1F2440]">{s.nom}</td>
                      <td className="py-2.5 pr-2 text-slate-500">{s.classe}</td>
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#F3ECE1] rounded-full overflow-hidden min-w-[60px]">
                            <div className={`h-full ${couleurTaux(s.taux)}`} style={{ width: `${s.taux}%` }} />
                          </div>
                          <span className="tabular-nums text-slate-600 w-16 shrink-0">
                            {s.missionsSoumises}/{missions.length} · {s.taux}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-2 text-center tabular-nums text-slate-600">{s.missionsCorrigees}</td>
                      <td className="py-2.5 pr-2 text-center font-bold text-[#149D92] tabular-nums">
                        {s.moyenne !== null ? `${s.moyenne.toFixed(1)}` : '—'}
                      </td>
                      <td className="py-2.5 pr-2">
                        <span className="text-slate-500">{fmtDate(s.derniereActivite)}</span>
                        {inactif && (
                          <Badge tone="terracotta" icon={<UserX className="w-3 h-3" />} className="ml-2">
                            {s.inactifJours === null ? 'Jamais actif' : `Inactif ${s.inactifJours}j`}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 pr-2 text-center">
                        {parcoursReussi(s) ? (
                          <button
                            onClick={() => handleCertificat(s)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#149D92] hover:bg-[#11857c] text-white text-[11px] font-semibold transition-colors"
                            title={`Générer le certificat de complétion de ${s.nom}`}
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Certificat</span>
                          </button>
                        ) : (
                          <span
                            className="text-[11px] text-slate-400"
                            title={
                              s.missionsCorrigees < missions.length
                                ? `${s.missionsCorrigees}/${missions.length} missions corrigées`
                                : 'Moyenne inférieure à 10/20'
                            }
                          >
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

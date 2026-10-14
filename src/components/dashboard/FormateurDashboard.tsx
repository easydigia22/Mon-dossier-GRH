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
  UserX
} from 'lucide-react';
import { ClassePedagogique, MissionExercice, MembreClasseLive } from '../../types';
import { cloudEnabled } from '../../services/cloudSync';
import { fetchAllTentativesLive, TentativeLive } from '../../services/trainerLive';
import { fetchEffectifLive } from '../../services/classeJoin';
import {
  exporterSuiviStagiairesCSV,
  genererSuiviStagiairesPDF,
  LigneSuiviExport,
  MetaSuiviExport
} from '../../services/exportService';
import { OngletNavigation } from '../common/NavigationTabs';

interface FormateurDashboardProps {
  classes: ClassePedagogique[];
  missions: MissionExercice[];
  onNavigate: (onglet: OngletNavigation) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
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
  showNotification
}) => {
  const [tentatives, setTentatives] = useState<TentativeLive[]>([]);
  const [effectif, setEffectif] = useState<MembreClasseLive[]>([]);
  const [chargement, setChargement] = useState(false);
  const [classeFiltre, setClasseFiltre] = useState<string>('toutes');
  const [seuilInactivite, setSeuilInactivite] = useState<number>(7);

  const classesActives = useMemo(() => classes.filter((c) => !c.archiveeLe), [classes]);
  const missionsTotal = Math.max(missions.length, 1);

  const charger = async () => {
    if (!cloudEnabled) return;
    setChargement(true);
    try {
      const [lives, effectifs] = await Promise.all([
        fetchAllTentativesLive(),
        Promise.all(classesActives.map((c) => fetchEffectifLive(c.id))).then((r) => r.flat())
      ]);
      setTentatives(lives);
      setEffectif(effectifs);
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
  }, [tentatives, effectif, classesActives, missionsTotal]);

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
      .sort((a, b) => a.taux - b.taux || a.numero - b.numero); // les plus bloquantes d'abord
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

  return (
    <div className="space-y-6">
      {/* Bandeau formateur */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
              <Award className="w-6 h-6 text-[#149D92]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-[#149D92] text-white rounded">SUIVI DES STAGIAIRES</span>
                <span className="text-xs text-slate-500 font-medium inline-flex items-center gap-1">
                  <Radio className="w-3 h-3" /> Données en direct
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#1C2459] mt-1">Tableau de bord Formateur</h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Avancement et résultats réels de vos stagiaires — {classesActives.length} classe(s) active(s), {nbStagiaires} stagiaire(s) affiché(s).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={charger}
              disabled={chargement}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-[#1C2459] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {chargement ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Actualiser</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-[#1C2459] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-[#1C2459] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4 text-[#D64545]" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => onNavigate('formateur')}
              className="px-4 py-2 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>Mes classes</span>
            </button>
          </div>
        </div>

        {/* Filtres : classe + seuil d'inactivité */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Classe :</span>
            <select
              value={classeFiltre}
              onChange={(e) => setClasseFiltre(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-[#1C2459] bg-slate-50"
            >
              <option value="toutes">Toutes les classes</option>
              {classesActives.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.anneeScolaire})
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Seuil d'inactivité :</span>
            <input
              type="number"
              min={1}
              max={90}
              value={seuilInactivite}
              onChange={(e) => setSeuilInactivite(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg font-bold text-[#1C2459] bg-slate-50"
            />
            <span className="text-slate-500">jour(s)</span>
          </label>
        </div>

        {!cloudEnabled && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Le suivi en direct nécessite un compte connecté (Supabase). En mode local, aucune donnée stagiaire n'est disponible.
            </p>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Stagiaires suivis</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1C2459]"><Users className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1C2459] tabular-nums">{nbStagiaires}</span>
            <span className="text-xs text-slate-500">comptes</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Avancement moyen</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-[#149D92]"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1C2459] tabular-nums">{tauxMoyen}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${couleurTaux(tauxMoyen)}`} style={{ width: `${tauxMoyen}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">À corriger</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#E9A23B]"><Clock className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1C2459] tabular-nums">{aCorriger}</span>
            <span className="text-xs text-slate-500">en attente</span>
          </div>
          <button onClick={() => onNavigate('formateur')} className="mt-2 text-[11px] font-semibold text-[#149D92] hover:underline inline-flex items-center gap-1">
            Corriger <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Inactifs (≥ {seuilInactivite} j)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600"><UserX className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold tabular-nums ${nbInactifs > 0 ? 'text-rose-600' : 'text-[#1C2459]'}`}>{nbInactifs}</span>
            <span className="text-xs text-slate-500">à relancer</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Moyenne générale</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700"><CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 tabular-nums">
              {moyenneGenerale !== null ? `${moyenneGenerale.toFixed(1)}` : '—'}
            </span>
            <span className="text-xs text-slate-500">/ 20</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">{notesCorrigees.length} copie(s) corrigée(s)</div>
        </div>
      </div>

      {/* Avancement par mission */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1C2459] flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-[#149D92]" /> Avancement par mission
            </h2>
            <p className="text-xs text-slate-500">Part des stagiaires ayant soumis chaque mission — les plus bloquantes en premier</p>
          </div>
        </div>

        {nbStagiaires === 0 ? (
          <p className="text-xs text-slate-400 italic">Aucune donnée pour le périmètre sélectionné.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
            {avancementMissions.map((m) => (
              <div key={m.id} className="flex items-center gap-3 text-xs">
                <span className="w-6 h-6 rounded bg-[#1C2459] text-white font-bold flex items-center justify-center shrink-0">{m.numero}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-700 truncate">{m.titre}</span>
                    <span className="tabular-nums text-slate-500 shrink-0">{m.soumis}/{nbStagiaires} · {m.taux}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${couleurTaux(m.taux)}`} style={{ width: `${m.taux}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tableau de suivi par stagiaire */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1C2459]">Avancement par stagiaire</h2>
            <p className="text-xs text-slate-500">Missions soumises, corrigées, moyenne et dernière activité</p>
          </div>
          <button onClick={() => onNavigate('formateur')} className="text-xs font-semibold text-[#149D92] hover:underline flex items-center gap-1">
            <span>Espace formateur</span><ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

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
                <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-2">Stagiaire</th>
                  <th className="py-2 pr-2">Classe</th>
                  <th className="py-2 pr-2 w-48">Avancement</th>
                  <th className="py-2 pr-2 text-center">Corrigées</th>
                  <th className="py-2 pr-2 text-center">Moyenne</th>
                  <th className="py-2 pr-2">Dernière activité</th>
                </tr>
              </thead>
              <tbody>
                {suivi.map((s) => {
                  const inactif = estInactif(s);
                  return (
                    <tr key={s.userId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 pr-2 font-semibold text-slate-800">{s.nom}</td>
                      <td className="py-2.5 pr-2 text-slate-500">{s.classe}</td>
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
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
                          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-semibold text-[10px]">
                            <UserX className="w-3 h-3" />
                            {s.inactifJours === null ? 'Jamais actif' : `Inactif ${s.inactifJours}j`}
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
      </div>
    </div>
  );
};

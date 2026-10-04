import React from 'react';
import {
  Users,
  Building,
  Receipt,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
  CalendarCheck
} from 'lucide-react';
import { BulletinPaie, Entreprise, MissionExercice, ModePedagogique, Salarie } from '../../types';
import { formatMAD } from '../../services/exportService';
import { OngletNavigation } from '../common/NavigationTabs';

interface DashboardViewProps {
  entreprise: Entreprise;
  salaries: Salarie[];
  bulletins: BulletinPaie[];
  missions: MissionExercice[];
  periodeActive: string;
  modePedagogique: ModePedagogique;
  onNavigate: (onglet: OngletNavigation) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  entreprise,
  salaries,
  bulletins,
  missions,
  periodeActive,
  modePedagogique,
  onNavigate
}) => {
  const bulletinsPeriode = bulletins.filter((b) => b.periodeMois === periodeActive);
  const totalMasseBrute = bulletinsPeriode.reduce((sum, b) => sum + b.salaireBrutGlobal, 0);
  const totalCotisationsCNSS = bulletinsPeriode.reduce((sum, b) => sum + b.cnssSalariale + b.cnssPatronalePrestations + b.cnssPatronaleAllocationsFamiliales + b.taxeFormationProfessionnelle, 0);
  const totalCotisationsAMO = bulletinsPeriode.reduce((sum, b) => sum + b.amoSalariale + b.amoPatronale, 0);
  const totalNetAPayer = bulletinsPeriode.reduce((sum, b) => sum + b.salaireNetAPayer, 0);

  const formatMois = (p: string) => {
    const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const [annee, m] = p.split('-').map(Number);
    return `${moisNoms[m - 1]} ${annee}`;
  };

  return (
    <div className="space-y-6">
      {/* Bandeau d'accueil contextuel et pédagogique */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-[#1C2459] text-white rounded">
                ENTREPRISE FICTIVE PME
              </span>
              <span className="text-xs text-slate-500 font-medium">Secteur privé non agricole (Maroc)</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1C2459] mt-1">{entreprise.raisonSociale}</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Siège social : {entreprise.siegeSocial}, {entreprise.ville} · {entreprise.secteur}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#F4F7FA] border border-slate-200 rounded-lg p-3 text-right">
              <span className="text-xs text-slate-500 block">Période de travail active</span>
              <span className="text-base font-bold text-[#1C2459] block">{formatMois(periodeActive)}</span>
            </div>
            <button
              onClick={() => onNavigate('missions')}
              className="px-4 py-2.5 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Voir les 10 missions</span>
            </button>
          </div>
        </div>

        {/* Note pédagogique selon le mode */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#149D92] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            {modePedagogique === 'demonstration' && (
              <span>
                <strong>Mode Démonstration :</strong> Le formateur pilote le scénario de la SARL Atlas. Tous les calculs de paie et leurs justifications pas-à-pas (CNSS, AMO, IR, Frais pros, Prime d'ancienneté Art. 350) sont consultables en clair.
              </span>
            )}
            {modePedagogique === 'entrainement' && (
              <span>
                <strong>Mode Entraînement :</strong> Vous disposez de dossiers fictifs et d'indices progressifs. Testez la saisie des absences, la proratisation des salaires et le calcul des cotisations sans crainte d'erreur.
              </span>
            )}
            {modePedagogique === 'evaluation' && (
              <span>
                <strong>Mode Évaluation :</strong> Réalisez la mission demandée dans le temps imparti. Votre tentative sera enregistrée et soumise à la correction selon la grille officielle sur 20 points.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cartes métriques / KPIs du mois */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Effectif */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Effectif total</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1C2459]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1C2459] tabular-nums">{salaries.length}</span>
            <span className="text-xs text-slate-500">salariés adultes mensualisés</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            10 CDI · 2 CDD réglementés (Art. 16)
          </div>
        </div>

        {/* KPI 2 : Masse salariale brute */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Masse salariale brute</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-[#149D92]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#1C2459] tabular-nums">{formatMAD(totalMasseBrute)}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Pour {bulletinsPeriode.length} bulletin(s) généré(s)
          </div>
        </div>

        {/* KPI 3 : Cotisations sociales CNSS + AMO */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cotisations CNSS &amp; AMO</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#E9A23B]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#1C2459] tabular-nums">{formatMAD(totalCotisationsCNSS + totalCotisationsAMO)}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Parts salariales et patronales confondues
          </div>
        </div>

        {/* KPI 4 : Net global à payer */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Net total à payer</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700 tabular-nums">{formatMAD(totalNetAPayer)}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Virements bancaires fictifs
          </div>
        </div>
      </div>

      {/* Raccourcis pédagogiques & Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('salaries')}
          className="bg-white border border-slate-200 hover:border-[#149D92] rounded-xl p-5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#F4F7FA] group-hover:bg-teal-50 flex items-center justify-center text-[#1C2459] group-hover:text-[#149D92]">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#149D92] group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-semibold text-[#1C2459]">Dossiers du Personnel</h3>
          <p className="text-xs text-slate-500 mt-1">
            Consultez les 12 salariés, leurs pièces administratives, CIN et immatriculations CNSS fictives.
          </p>
        </div>

        <div
          onClick={() => onNavigate('bulletins')}
          className="bg-white border border-slate-200 hover:border-[#149D92] rounded-xl p-5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#F4F7FA] group-hover:bg-teal-50 flex items-center justify-center text-[#1C2459] group-hover:text-[#149D92]">
              <Receipt className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#149D92] group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-semibold text-[#1C2459]">Moteur de Paie Déterministe</h3>
          <p className="text-xs text-slate-500 mt-1">
            Visualisez les bulletins mensuels avec le détail pas-à-pas des formules : assiette, taux et résultat.
          </p>
        </div>

        <div
          onClick={() => onNavigate('missions')}
          className="bg-white border border-slate-200 hover:border-[#149D92] rounded-xl p-5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#F4F7FA] group-hover:bg-teal-50 flex items-center justify-center text-[#1C2459] group-hover:text-[#149D92]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#149D92] group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-semibold text-[#1C2459]">Parcours de 10 Missions</h3>
          <p className="text-xs text-slate-500 mt-1">
            Du dossier salarié au livre de paie et à la régularisation des anomalies, progressez avec correction guidée.
          </p>
        </div>
      </div>

      {/* Tableau récapitulatif des 10 missions de formation */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1C2459]">Missions Pédagogiques du Module</h2>
            <p className="text-xs text-slate-500">Compétences professionnelles évaluées sur barème standard de 20 points</p>
          </div>
          <button
            onClick={() => onNavigate('missions')}
            className="text-xs font-semibold text-[#149D92] hover:underline flex items-center gap-1"
          >
            <span>Accéder à l'espace de travail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {missions.map((m) => (
            <div
              key={m.id}
              onClick={() => onNavigate('missions')}
              className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-[#F4F7FA] transition-colors cursor-pointer flex items-start gap-3"
            >
              <span className="w-6 h-6 rounded bg-[#1C2459] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {m.numero}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-[#1C2459] truncate">{m.titre}</h4>
                  <span className="text-[10px] text-slate-500 shrink-0">{m.dureeIndicativeMinutes} min</span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{m.contexte}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

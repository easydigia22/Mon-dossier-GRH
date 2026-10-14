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
import { Card, Kpi, SectionTitle, ZelligeHeader, Button } from '../ui/kit';

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
      {/* Bandeau d'accueil contextuel et pédagogique — zellige */}
      <ZelligeHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#C96A4B] text-white rounded-full tracking-wide">
                ENTREPRISE FICTIVE PME
              </span>
              <span className="text-[11px] text-white/70 font-medium">Secteur privé non agricole (Maroc)</span>
            </div>
            <h1 className="font-display text-[1.7rem] leading-tight font-semibold text-white mt-1.5">
              {entreprise.raisonSociale || 'Votre entreprise'}
            </h1>
            <p className="text-sm text-white/75 mt-0.5">
              {entreprise.siegeSocial ? `Siège social : ${entreprise.siegeSocial}, ${entreprise.ville} · ` : ''}{entreprise.secteur || 'À compléter dans « Mon entreprise »'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 border border-white/15 rounded-xl p-3 text-right backdrop-blur-sm">
              <span className="text-[11px] text-white/70 block">Période de travail active</span>
              <span className="text-base font-bold text-white block">{formatMois(periodeActive)}</span>
            </div>
            <Button variant="secondary" onClick={() => onNavigate('missions')} icon={<GraduationCap className="w-4 h-4" />}>
              Voir les 10 missions
            </Button>
          </div>
        </div>

        {/* Note pédagogique selon le mode */}
        <div className="mt-4 bg-white/95 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#149D92] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            {modePedagogique === 'demonstration' && (
              <span>
                <strong>Mode Démonstration :</strong> Tous les calculs de paie et leurs justifications pas-à-pas (CNSS, AMO, IR, Frais pros, Prime d'ancienneté Art. 350) sont consultables en clair.
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
      </ZelligeHeader>

      {/* Cartes métriques / KPIs du mois */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Effectif total"
          tone="navy"
          icon={<Users className="w-4 h-4" />}
          value={salaries.length}
          unit="salariés"
          footer="Mensualisés — secteur privé non agricole"
        />
        <Kpi
          label="Masse salariale brute"
          tone="teal"
          icon={<TrendingUp className="w-4 h-4" />}
          value={formatMAD(totalMasseBrute)}
          valueClassName="text-[#1C2459] text-xl"
          footer={`Pour ${bulletinsPeriode.length} bulletin(s) généré(s)`}
        />
        <Kpi
          label="Cotisations CNSS & AMO"
          tone="safran"
          icon={<Receipt className="w-4 h-4" />}
          value={formatMAD(totalCotisationsCNSS + totalCotisationsAMO)}
          valueClassName="text-[#1C2459] text-xl"
          footer="Parts salariales et patronales confondues"
        />
        <Kpi
          label="Net total à payer"
          tone="success"
          icon={<CalendarCheck className="w-4 h-4" />}
          value={formatMAD(totalNetAPayer)}
          valueClassName="text-[#2E9E6B] text-xl"
          footer="Virements bancaires fictifs"
        />
      </div>

      {/* Raccourcis pédagogiques & Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('salaries')}
          className="bg-white border border-[#ECE3D6] hover:border-[#149D92] rounded-xl p-5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#F4F7FA] group-hover:bg-[#E4F3F1] flex items-center justify-center text-[#1C2459] group-hover:text-[#149D92]">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#149D92] group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-semibold text-[#1C2459]">Dossiers du Personnel</h3>
          <p className="text-xs text-slate-500 mt-1">
            Consultez les {salaries.length} salariés, leurs pièces administratives, CIN et immatriculations CNSS fictives.
          </p>
        </div>

        <div
          onClick={() => onNavigate('bulletins')}
          className="bg-white border border-[#ECE3D6] hover:border-[#149D92] rounded-xl p-5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#F4F7FA] group-hover:bg-[#E4F3F1] flex items-center justify-center text-[#1C2459] group-hover:text-[#149D92]">
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
          className="bg-white border border-[#ECE3D6] hover:border-[#149D92] rounded-xl p-5 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#F4F7FA] group-hover:bg-[#E4F3F1] flex items-center justify-center text-[#1C2459] group-hover:text-[#149D92]">
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
      <div className="bg-white border border-[#ECE3D6] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#1C2459]">Missions Pédagogiques du Module</h2>
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
              className="p-3 rounded-lg border border-[#ECE3D6] hover:border-slate-300 hover:bg-[#FBF7F0] transition-colors cursor-pointer flex items-start gap-3"
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

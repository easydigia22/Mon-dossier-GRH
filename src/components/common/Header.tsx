import React from 'react';
import { CheckCircle2, Cloud, CloudOff, Download, HelpCircle, Menu, RotateCcw } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { MonthPicker } from './MonthPicker';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { ModePedagogique, NiveauPedagogique } from '../../types';

interface HeaderProps {
  periodeActive: string;
  onSelectPeriode: (periode: string) => void;
  modePedagogique: ModePedagogique;
  onSelectMode: (mode: ModePedagogique) => void;
  niveau: NiveauPedagogique;
  onToggleNiveau: () => void;
  onResetDemo: () => void;
  cloudStatus?: 'off' | 'ok' | 'error';
  /** Ouvre le tiroir de navigation sur mobile (< lg) */
  onOuvrirMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  periodeActive,
  onSelectPeriode,
  modePedagogique,
  onSelectMode,
  niveau,
  onToggleNiveau,
  onResetDemo,
  cloudStatus = 'off',
  onOuvrirMenu
}) => {
  const { canInstall, promptInstall } = useInstallPrompt();

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-[#ECE3D6] sticky top-0 z-20 no-print">
      {/* Barre supérieure principale */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
        {/* Zone 1: Identité & Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOuvrirMenu}
            className="lg:hidden flex items-center justify-center w-9 h-9 -ml-1 rounded-md text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Ouvrir le menu de navigation"
            title="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <AppLogo size={36} />
          <div>
            <div className="text-base font-bold text-[#1C2459] leading-tight flex items-center gap-2">
              <span className="font-display tracking-tight">Mon GRH</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#F3ECE1] text-[#0F7D74] rounded-full">
                Simulateur RH &amp; Paie
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Formation professionnelle OFPPT — Gestion administrative du personnel
            </div>
          </div>
        </div>

        {/* Zone 2: Mois de simulation & Mode Pédagogique */}
        <div className="flex items-center gap-4">
          {/* Sélecteur de mois de simulation (calendrier) */}
          <MonthPicker value={periodeActive} onChange={onSelectPeriode} />

          {/* Mode Pédagogique (Segmented Control) */}
          <div className="flex items-center bg-[#F3ECE1] p-1 rounded-lg border border-[#ECE3D6]">
            <button
              onClick={() => onSelectMode('demonstration')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                modePedagogique === 'demonstration'
                  ? 'bg-white text-[#1C2459] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Démonstration
            </button>
            <button
              onClick={() => onSelectMode('entrainement')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                modePedagogique === 'entrainement'
                  ? 'bg-white text-[#149D92] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entraînement
            </button>
            <button
              onClick={() => onSelectMode('evaluation')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                modePedagogique === 'evaluation'
                  ? 'bg-white text-[#D64545] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Évaluation
            </button>
          </div>

          {/* Niveau (Essentiel / Avancé) */}
          <button
            onClick={onToggleNiveau}
            className="text-xs px-2.5 py-1.5 border border-[#ECE3D6] rounded-lg text-slate-700 hover:bg-[#FBF7F0] transition-colors whitespace-nowrap"
            title="Basculer entre niveau essentiel et avancé"
          >
            Niveau : <strong className="text-[#1C2459] capitalize">{niveau}</strong>
          </button>
        </div>

        {/* Zone 3: Actions & Réinitialisation */}
        <div className="flex items-center gap-2">
          {canInstall && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#149D92] hover:bg-[#108a80] rounded transition-colors"
              title="Installer l'application sur cet appareil"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Installer l'app</span>
            </button>
          )}

          {modePedagogique === 'demonstration' && (
            <button
              onClick={onResetDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-[#F3ECE1] hover:bg-[#ECE3D6] rounded-lg transition-colors"
              title="Réinitialise le scénario démo à son état initial"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Réinitialiser démo</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 border-l border-slate-200 pl-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#149D92]" />
            <span>Moteur déterministe</span>
          </div>

          {cloudStatus !== 'off' && (
            <div
              className={`hidden md:flex items-center gap-1 text-[11px] border-l border-slate-200 pl-3 ${
                cloudStatus === 'ok' ? 'text-[#149D92]' : 'text-[#D64545]'
              }`}
              title={cloudStatus === 'ok' ? 'Données synchronisées avec Supabase' : 'Synchronisation impossible — copie locale conservée'}
            >
              {cloudStatus === 'ok' ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
              <span>{cloudStatus === 'ok' ? 'Synchronisé' : 'Hors ligne'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mention légale discrète requise par le cahier des charges */}
      <div className="bg-zellige bg-[#1C2459] text-slate-300 text-[11px] py-1.5 px-4 text-center">
        <span>Simulation pédagogique — données fictives — ne vaut pas validation juridique.</span>
        <span className="mx-2 text-[#5FD0C5]">·</span>
        <span>Formation professionnelle OFPPT — Maroc</span>
      </div>
    </header>
  );
};

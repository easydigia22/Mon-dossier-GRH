import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileSignature,
  Clock,
  CalendarDays,
  Calculator,
  Receipt,
  BookOpenText,
  ShieldCheck,
  FileText,
  GraduationCap,
  Award,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export type OngletNavigation =
  | 'dashboard'
  | 'entreprise'
  | 'salaries'
  | 'contrats'
  | 'presences'
  | 'conges'
  | 'preparation_paie'
  | 'bulletins'
  | 'livre_paie'
  | 'cnss'
  | 'documents'
  | 'missions'
  | 'formateur'
  | 'parametres';

interface NavigationTabsProps {
  ongletActif: OngletNavigation;
  onSelectOnglet: (onglet: OngletNavigation) => void;
  nombreSalaries: number;
  nombreMissions: number;
  /** Masque l'onglet « Espace Formateur » pour les comptes stagiaire */
  afficherEspaceFormateur?: boolean;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  ongletActif,
  onSelectOnglet,
  nombreSalaries,
  nombreMissions,
  afficherEspaceFormateur = true
}) => {
  const [reduit, setReduit] = useState(false);

  const items: { id: OngletNavigation; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'entreprise', label: 'Mon entreprise', icon: Building2 },
    { id: 'salaries', label: 'Dossiers du personnel', icon: Users, badge: nombreSalaries },
    { id: 'contrats', label: 'Contrats', icon: FileSignature },
    { id: 'presences', label: 'Présences & Absences', icon: Clock },
    { id: 'conges', label: 'Congés & Maladies', icon: CalendarDays },
    { id: 'preparation_paie', label: 'Préparation paie', icon: Calculator },
    { id: 'bulletins', label: 'Bulletins de paie', icon: Receipt },
    { id: 'livre_paie', label: 'Livre de paie', icon: BookOpenText },
    { id: 'cnss', label: 'CNSS & AMO', icon: ShieldCheck },
    { id: 'documents', label: 'Documents RH', icon: FileText },
    { id: 'missions', label: 'Exercices & Missions', icon: GraduationCap, badge: nombreMissions },
    ...(afficherEspaceFormateur ? [{ id: 'formateur' as const, label: 'Espace Formateur', icon: Award }] : []),
    { id: 'parametres', label: 'Paramètres & Lois', icon: Sliders }
  ];

  return (
    <aside
      className={`no-print bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col shrink-0 transition-all duration-200 ${
        reduit ? 'w-16' : 'w-64'
      }`}
    >
      <div className={`flex items-center h-16 shrink-0 border-b border-slate-200 px-3 ${reduit ? 'justify-center' : 'justify-between'}`}>
        {!reduit && (
          <img
            src="/logo-ofppt.jpg"
            alt="Office de la Formation Professionnelle et de la Promotion du Travail"
            className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
          />
        )}
        <button
          onClick={() => setReduit((v) => !v)}
          className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-[#16324F] hover:bg-slate-100 transition-colors"
          title={reduit ? 'Agrandir le menu' : 'Réduire le menu'}
          aria-label={reduit ? 'Agrandir le menu' : 'Réduire le menu'}
        >
          {reduit ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const estActif = ongletActif === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectOnglet(item.id)}
              title={reduit ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                reduit ? 'justify-center' : ''
              } ${
                estActif
                  ? 'bg-[#16324F] text-white'
                  : 'text-slate-600 hover:text-[#16324F] hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${estActif ? 'text-[#149D92]' : 'text-slate-400'}`} />
              {!reduit && <span className="flex-1 text-left truncate">{item.label}</span>}
              {item.badge !== undefined && !reduit && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    estActif
                      ? 'bg-[#149D92] text-white font-bold'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

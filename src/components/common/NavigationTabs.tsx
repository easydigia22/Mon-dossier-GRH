import React from 'react';
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
  Sliders
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
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  ongletActif,
  onSelectOnglet,
  nombreSalaries,
  nombreMissions
}) => {
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
    { id: 'formateur', label: 'Espace Formateur', icon: Award },
    { id: 'parametres', label: 'Paramètres & Lois', icon: Sliders }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 overflow-x-auto no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 py-2 min-w-max">
          {items.map((item) => {
            const Icon = item.icon;
            const estActif = ongletActif === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectOnglet(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  estActif
                    ? 'bg-[#16324F] text-white'
                    : 'text-slate-600 hover:text-[#16324F] hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${estActif ? 'text-[#149D92]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
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
        </div>
      </div>
    </nav>
  );
};

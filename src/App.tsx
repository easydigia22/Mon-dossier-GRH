/**
 * MON DOSSIER ADMINISTRATIF
 * Simulateur RH & Paie — Formation OFPPT
 */

import React, { Suspense, lazy, useState } from 'react';
import { useAppData } from './hooks/useAppData';
import { Header } from './components/common/Header';
import { NavigationTabs, OngletNavigation } from './components/common/NavigationTabs';
import { CheckCircle2, AlertTriangle, Info, X, Loader2 } from 'lucide-react';
import type { UserRole } from './services/profile';

// Chargement différé des vues : seule la vue affichée est téléchargée, ce qui
// réduit fortement le poids du premier chargement (critique pour un partage WhatsApp).
const DashboardView = lazy(() => import('./components/dashboard/DashboardView').then((m) => ({ default: m.DashboardView })));
const CompanyView = lazy(() => import('./components/company/CompanyView').then((m) => ({ default: m.CompanyView })));
const EmployeesView = lazy(() => import('./components/employees/EmployeesView').then((m) => ({ default: m.EmployeesView })));
const ContractsView = lazy(() => import('./components/contracts/ContractsView').then((m) => ({ default: m.ContractsView })));
const PresenceView = lazy(() => import('./components/presence/PresenceView').then((m) => ({ default: m.PresenceView })));
const LeavesView = lazy(() => import('./components/leaves/LeavesView').then((m) => ({ default: m.LeavesView })));
const PayrollPreparationView = lazy(() => import('./components/payroll/PayrollPreparationView').then((m) => ({ default: m.PayrollPreparationView })));
const PayrollSlipsView = lazy(() => import('./components/payroll/PayrollSlipsView').then((m) => ({ default: m.PayrollSlipsView })));
const PayrollBookView = lazy(() => import('./components/payroll/PayrollBookView').then((m) => ({ default: m.PayrollBookView })));
const CnssView = lazy(() => import('./components/cnss/CnssView').then((m) => ({ default: m.CnssView })));
const DocumentsView = lazy(() => import('./components/documents/DocumentsView').then((m) => ({ default: m.DocumentsView })));
const MissionsView = lazy(() => import('./components/missions/MissionsView').then((m) => ({ default: m.MissionsView })));
const TrainerView = lazy(() => import('./components/trainer/TrainerView').then((m) => ({ default: m.TrainerView })));
const SettingsView = lazy(() => import('./components/settings/SettingsView').then((m) => ({ default: m.SettingsView })));

const ChargementVue: React.FC = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="w-6 h-6 animate-spin text-[#1C2459]" />
  </div>
);

interface AppProps {
  userEmail?: string;
  role?: UserRole;
  onSignOut?: () => void;
}

export default function App({ userEmail, role, onSignOut }: AppProps) {
  const estFormateur = role === 'formateur' || role === undefined; // mode local sans compte : accès complet

  const {
    isLoaded,
    cloudEnabled,
    cloudOk,
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
  } = useAppData();

  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);
  const [ongletActif, setOngletActifBrut] = useState<OngletNavigation>('dashboard');
  const setOngletActif = (onglet: OngletNavigation) => {
    // Un stagiaire ne doit jamais atterrir sur l'espace réservé au formateur
    setOngletActifBrut(onglet === 'formateur' && !estFormateur ? 'dashboard' : onglet);
  };
  const [selectedSalarieIdPourBulletin, setSelectedSalarieIdPourBulletin] = useState<string | undefined>(undefined);

  const handleVoirBulletin = (salarieId: string) => {
    setSelectedSalarieIdPourBulletin(salarieId);
    setOngletActif('bulletins');
  };

  const handleToggleNiveau = () => {
    const nouveau = niveau === 'essentiel' ? 'avance' : 'essentiel';
    setNiveau(nouveau);
    showNotification(`Niveau pédagogique basculé en mode ${nouveau}.`, 'info');
  };

  const handleResetDemoConfirm = () => {
    if (confirm('Voulez-vous réinitialiser toutes les données de démonstration de la SARL Atlas ? Les modifications apportées seront effacées.')) {
      reinitialiserDonneesDemo();
    }
  };

  const fullAppState = {
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
  };

  const handleRestoreState = (state: any) => {
    if (state.entreprise) setEntreprise(state.entreprise);
    if (state.salaries) salaries.splice(0, salaries.length, ...state.salaries);
    if (state.contrats) contrats.splice(0, contrats.length, ...state.contrats);
    if (state.evenementsPresence) evenementsPresence.splice(0, evenementsPresence.length, ...state.evenementsPresence);
    if (state.demandesConges) demandesConges.splice(0, demandesConges.length, ...state.demandesConges);
    if (state.classes) setClasses(state.classes);
    if (state.parametresApp) {
      if (state.parametresApp.periodeActive) setPeriodeActive(state.parametresApp.periodeActive);
      if (state.parametresApp.modePedagogique) setModePedagogique(state.parametresApp.modePedagogique);
      if (state.parametresApp.niveau) setNiveau(state.parametresApp.niveau);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#1C2459] border-t-[#149D92] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-[#1C2459]">Chargement de Mon Dossier Administratif...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F4F7FA] text-[#172B4D]">
      {/* Barre de navigation verticale des onglets */}
      <NavigationTabs
        ongletActif={ongletActif}
        onSelectOnglet={setOngletActif}
        nombreSalaries={salaries.length}
        nombreMissions={missions.length}
        afficherEspaceFormateur={estFormateur}
        userEmail={userEmail}
        role={role}
        onSignOut={onSignOut}
        mobileOuvert={menuMobileOuvert}
        onFermerMobile={() => setMenuMobileOuvert(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : notification.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-300'
              : notification.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-blue-50 text-[#1C2459] border-blue-300'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
          {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-[#149D92]" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* En-tête global */}
      <Header
        periodeActive={periodeActive}
        onSelectPeriode={setPeriodeActive}
        modePedagogique={modePedagogique}
        onSelectMode={setModePedagogique}
        niveau={niveau}
        onToggleNiveau={handleToggleNiveau}
        onResetDemo={handleResetDemoConfirm}
        cloudStatus={!cloudEnabled ? 'off' : cloudOk ? 'ok' : 'error'}
        onOuvrirMenu={() => setMenuMobileOuvert(true)}
      />

      {/* Contenu principal de la vue active */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
       <Suspense fallback={<ChargementVue />}>
        {ongletActif === 'dashboard' && (
          <DashboardView
            entreprise={entreprise}
            salaries={salaries}
            bulletins={bulletins}
            missions={missions}
            periodeActive={periodeActive}
            modePedagogique={modePedagogique}
            onNavigate={setOngletActif}
          />
        )}

        {ongletActif === 'entreprise' && (
          <CompanyView
            entreprise={entreprise}
            onSaveEntreprise={setEntreprise}
            showNotification={showNotification}
          />
        )}

        {ongletActif === 'salaries' && (
          <EmployeesView
            salaries={salaries}
            periodeActive={periodeActive}
            onSaveSalarie={upsertSalarie}
            showNotification={showNotification}
          />
        )}

        {ongletActif === 'contrats' && (
          <ContractsView
            contrats={contrats}
            salaries={salaries}
            entreprise={entreprise}
            onSaveContrat={upsertContrat}
            onDeleteContrat={deleteContrat}
            showNotification={showNotification}
          />
        )}

        {ongletActif === 'presences' && (
          <PresenceView
            evenements={evenementsPresence}
            salaries={salaries}
            periodeActive={periodeActive}
            onSaveEvenement={upsertEvenementPresence}
            onDeleteEvenement={deleteEvenementPresence}
            showNotification={showNotification}
          />
        )}

        {ongletActif === 'conges' && (
          <LeavesView
            demandes={demandesConges}
            salaries={salaries}
            onSaveDemande={upsertDemandeConge}
            showNotification={showNotification}
          />
        )}

        {ongletActif === 'preparation_paie' && (
          <PayrollPreparationView
            salaries={salaries}
            evenements={evenementsPresence}
            bulletins={bulletins}
            periodeActive={periodeActive}
            onCalculerTous={calculerTousLesBulletinsPeriode}
            onCloturerPeriode={cloturerPeriode}
            onVoirBulletin={handleVoirBulletin}
            showNotification={showNotification}
          />
        )}

        {ongletActif === 'bulletins' && (
          <PayrollSlipsView
            entreprise={entreprise}
            salaries={salaries}
            bulletins={bulletins}
            periodeActive={periodeActive}
            selectedSalarieId={selectedSalarieIdPourBulletin}
            onSelectSalarie={setSelectedSalarieIdPourBulletin}
            showNotification={showNotification}
          />
        )}

        {ongletActif === 'livre_paie' && (
          <PayrollBookView
            entreprise={entreprise}
            salaries={salaries}
            bulletins={bulletins}
            periodeActive={periodeActive}
            onSelectPeriode={setPeriodeActive}
            showNotification={showNotification}
          />
        )}

        {ongletActif === 'cnss' && (
          <CnssView
            entreprise={entreprise}
            salaries={salaries}
            bulletins={bulletins}
            periodeActive={periodeActive}
            showNotification={showNotification}
          />
        )}

        {ongletActif === 'documents' && (
          <DocumentsView
            entreprise={entreprise}
            salaries={salaries}
            periodeActive={periodeActive}
          />
        )}

        {ongletActif === 'missions' && (
          <MissionsView
            missions={missions}
            tentatives={tentatives}
            modePedagogique={modePedagogique}
            nomStagiaireActif={nomStagiaireActif}
            onSoumettreTentative={soumettreTentative}
            showNotification={showNotification}
          />
        )}

        {ongletActif === 'formateur' && estFormateur && (
          <TrainerView
            classes={classes}
            setClasses={setClasses}
            missions={missions}
            tentatives={tentatives}
            periodeActive={periodeActive}
            showNotification={showNotification}
          />
        )}

        {ongletActif === 'parametres' && (
          <SettingsView
            regles={regles}
            onResetDemo={handleResetDemoConfirm}
            fullAppState={fullAppState}
            onRestoreState={handleRestoreState}
            showNotification={showNotification}
          />
        )}
       </Suspense>
      </main>

      {/* Pied de page sobre */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-[11px] text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <img
              src="/logo-ofppt.jpg"
              alt="Office de la Formation Professionnelle et de la Promotion du Travail"
              className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200"
            />
            MON DOSSIER ADMINISTRATIF — Simulateur RH &amp; Paie (Formation professionnelle OFPPT)
          </span>
          <span className="text-slate-400">
            Conforme Code du Travail (Loi 65-99), Dahir CNSS et CGI Article 73 · Sauvegarde locale sécurisée IndexedDB
          </span>
        </div>
      </footer>
      </div>
    </div>
  );
}

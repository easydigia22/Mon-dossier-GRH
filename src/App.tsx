/**
 * MON DOSSIER ADMINISTRATIF
 * Simulateur RH & Paie — Formation OFPPT
 */

import React, { useState } from 'react';
import { useAppData } from './hooks/useAppData';
import { Header } from './components/common/Header';
import { NavigationTabs, OngletNavigation } from './components/common/NavigationTabs';
import { DashboardView } from './components/dashboard/DashboardView';
import { CompanyView } from './components/company/CompanyView';
import { EmployeesView } from './components/employees/EmployeesView';
import { ContractsView } from './components/contracts/ContractsView';
import { PresenceView } from './components/presence/PresenceView';
import { LeavesView } from './components/leaves/LeavesView';
import { PayrollPreparationView } from './components/payroll/PayrollPreparationView';
import { PayrollSlipsView } from './components/payroll/PayrollSlipsView';
import { PayrollBookView } from './components/payroll/PayrollBookView';
import { CnssView } from './components/cnss/CnssView';
import { DocumentsView } from './components/documents/DocumentsView';
import { MissionsView } from './components/missions/MissionsView';
import { TrainerView } from './components/trainer/TrainerView';
import { SettingsView } from './components/settings/SettingsView';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import type { UserRole } from './services/profile';

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
          <div className="w-12 h-12 border-4 border-[#16324F] border-t-[#149D92] rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-[#16324F]">Chargement de Mon Dossier Administratif...</p>
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
              : 'bg-blue-50 text-[#16324F] border-blue-300'
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
        userEmail={userEmail}
        role={role}
        onSignOut={onSignOut}
        cloudStatus={!cloudEnabled ? 'off' : cloudOk ? 'ok' : 'error'}
      />

      {/* Contenu principal de la vue active */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

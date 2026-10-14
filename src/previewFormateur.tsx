/**
 * Page d'APERÇU DESIGN (hors production) du tableau de bord Formateur.
 * Rendue avec des données fictives pour juger l'identité visuelle sans connexion.
 * Accessible en dev à /preview.html — ne fait partie d'aucun build applicatif.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { FormateurDashboard } from './components/dashboard/FormateurDashboard';
import { MISSIONS_PEDAGOGIQUES } from './data/missionsData';
import type { ClassePedagogique, TentativeExercice } from './types';
import type { TentativeLive } from './services/trainerLive';
import type { MembreClasseLive } from './types';

const classes: ClassePedagogique[] = [
  { id: 'c-a', nom: 'TSGE 2 - Groupe A', anneeScolaire: '2024 / 2025', formateurNom: 'M. TAHIRI', etablissement: 'ISTA Guéliz', stagiaires: [] },
  { id: 'c-b', nom: 'TSGE 2 - Groupe B', anneeScolaire: '2024 / 2025', formateurNom: 'M. TAHIRI', etablissement: 'ISTA Guéliz', stagiaires: [] }
];

const jours = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

const effectif: MembreClasseLive[] = [
  { stagiaireUserId: 'u1', classeId: 'c-a', matricule: 'STG-01', nom: 'BENALI', prenom: 'Amine', joinedAt: jours(30) },
  { stagiaireUserId: 'u2', classeId: 'c-a', matricule: 'STG-02', nom: 'EL HADDAD', prenom: 'Sara', joinedAt: jours(30) },
  { stagiaireUserId: 'u3', classeId: 'c-a', matricule: 'STG-03', nom: 'NACIRI', prenom: 'Youssef', joinedAt: jours(28) },
  { stagiaireUserId: 'u4', classeId: 'c-b', matricule: 'STG-04', nom: 'KEBDANI', prenom: 'Imane', joinedAt: jours(20) },
  { stagiaireUserId: 'u5', classeId: 'c-b', matricule: 'STG-05', nom: 'OUARDI', prenom: 'Mehdi', joinedAt: jours(20) },
  { stagiaireUserId: 'u6', classeId: 'c-b', matricule: 'STG-06', nom: 'TAZI', prenom: 'Nada', joinedAt: jours(12) }
];

const mkT = (
  userId: string,
  nom: string,
  missionIdx: number,
  statut: TentativeExercice['statut'],
  joursAvant: number,
  note?: number
): TentativeLive => ({
  userId,
  tentative: {
    id: `${userId}-m${missionIdx}`,
    missionId: MISSIONS_PEDAGOGIQUES[missionIdx]?.id ?? `m-${missionIdx}`,
    stagiaireNom: nom,
    dateDebut: jours(joursAvant + 1),
    dateRemise: statut !== 'en_cours' ? jours(joursAvant) : undefined,
    statut,
    reponsesStagiaire: { justificationsTextuelles: {}, valeursCalculees: {}, piecesValidees: [], controlesEffectues: [] },
    indicesConsultes: 0,
    correction:
      statut === 'corrige' && note !== undefined
        ? { noteDossier: 3.5, noteRegles: 3, noteCalculs: note - 9, noteControles: 2.5, noteTotaleSur20: note, commentairesFormateur: '', detailsEcarts: [] }
        : undefined
  }
});

const tentatives: TentativeLive[] = [
  mkT('u1', 'Amine BENALI', 0, 'corrige', 10, 16.5),
  mkT('u1', 'Amine BENALI', 1, 'corrige', 6, 14),
  mkT('u1', 'Amine BENALI', 2, 'remis', 2),
  mkT('u2', 'Sara EL HADDAD', 0, 'corrige', 9, 18),
  mkT('u2', 'Sara EL HADDAD', 1, 'corrige', 5, 15.5),
  mkT('u2', 'Sara EL HADDAD', 2, 'corrige', 3, 13),
  mkT('u2', 'Sara EL HADDAD', 3, 'remis', 1),
  mkT('u3', 'Youssef NACIRI', 0, 'corrige', 11, 11.5),
  mkT('u3', 'Youssef NACIRI', 1, 'remis', 4),
  mkT('u4', 'Imane KEBDANI', 0, 'corrige', 8, 17),
  mkT('u4', 'Imane KEBDANI', 1, 'en_cours', 2),
  mkT('u5', 'Mehdi OUARDI', 0, 'remis', 9)
  // u6 : aucune remise → stagiaire inactif / jamais actif
];

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-[#FBF7F0] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <FormateurDashboard
          classes={classes}
          missions={MISSIONS_PEDAGOGIQUES}
          onNavigate={() => {}}
          showNotification={() => {}}
          previewData={{ tentatives, effectif }}
        />
      </div>
    </div>
  </React.StrictMode>
);

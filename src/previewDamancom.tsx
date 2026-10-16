/** Aperçu design (dev) du module DAMANCOM avec données fictives. */
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { DamancomView } from './components/damancom/DamancomView';
import type { Entreprise, Salarie, BulletinPaie } from './types';

const entreprise = {
  raisonSociale: 'Atlas Services Formation SARL',
  numeroCNSS: '7845129',
  ville: 'Marrakech'
} as unknown as Entreprise;

const mkSal = (matricule: string, nom: string, prenom: string, cnss: string, emb: string, sortie?: string) =>
  ({ matricule, nom, prenom, cnssFictif: cnss, dateEmbauche: emb, dateSortie: sortie } as unknown as Salarie);

const salaries = [
  mkSal('M001', 'BENNANI', 'Fatima-Zahra', '987654321', '2018-05-01'),
  mkSal('M002', 'ALAMI', 'Mehdi', '987654322', '2020-03-01'),
  mkSal('M003', 'CHRAIBI', 'Yassine', '987654323', '2025-01-10'), // entrant
  mkSal('M004', 'EL IDRISSI', 'Sanaa', '987654324', '2023-02-01', '2025-01-28') // sortant
];

const mkB = (mat: string, nom: string, jours: number, brut: number): BulletinPaie => {
  const plaf = Math.min(brut, 6000);
  return {
    periodeMois: '2025-01',
    salarieMatricule: mat,
    salarieNomPrenom: nom,
    joursTravailles: jours,
    salaireBrutGlobal: brut,
    assietteCNSSPlafonnee: plaf,
    cnssSalariale: plaf * 0.0448,
    cnssPatronalePrestations: plaf * 0.0898,
    cnssPatronaleAllocationsFamiliales: brut * 0.064,
    taxeFormationProfessionnelle: brut * 0.016,
    amoSalariale: brut * 0.0226,
    amoPatronale: brut * 0.0411
  } as unknown as BulletinPaie;
};

const bulletins = [
  mkB('M001', 'BENNANI Fatima-Zahra', 26, 12000),
  mkB('M002', 'ALAMI Mehdi', 26, 8500),
  mkB('M003', 'CHRAIBI Yassine', 18, 5200),
  mkB('M004', 'EL IDRISSI Sanaa', 24, 6800)
];

createRoot(document.getElementById('root')!).render(
  <div className="min-h-screen bg-[#FBF7F0] p-4 sm:p-8">
    <div className="max-w-7xl mx-auto">
      <DamancomView
        entreprise={entreprise}
        salaries={salaries}
        bulletins={bulletins}
        periodeActive="2025-01"
        showNotification={() => {}}
      />
    </div>
  </div>
);

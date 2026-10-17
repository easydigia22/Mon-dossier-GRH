import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluerParcours, estParcoursReussi, referenceCertificat, SEUIL_REUSSITE } from './certificat';
import type { MissionExercice, TentativeExercice } from '../types';

function mission(id: string): MissionExercice {
  // Seul `id` est lu par evaluerParcours ; le reste est rempli a minima.
  return {
    id,
    numero: 1,
    titre: id,
    contexte: '',
    competences: [],
    dureeIndicativeMinutes: 0,
    niveau: 'essentiel',
    donneesFournies: [],
    taches: [],
    livrablesAttendus: [],
    bareme: { dossierEtPieces: 4, justificationRegles: 4, calculs: 8, controlesEtCoherence: 4 },
    indicesProgressifs: [],
    reponseAttendue: {},
    explicationComplete: '',
    erreursFrequentes: []
  } as MissionExercice;
}

function tentativeCorrigee(missionId: string, note: number): TentativeExercice {
  return {
    id: `t-${missionId}`,
    missionId,
    stagiaireNom: 'Test',
    dateDebut: '2026-01-01T00:00:00.000Z',
    statut: 'corrige',
    reponsesStagiaire: { justificationsTextuelles: {}, valeursCalculees: {}, piecesValidees: [], controlesEffectues: [] },
    indicesConsultes: 0,
    correction: {
      noteDossier: 0,
      noteRegles: 0,
      noteCalculs: 0,
      noteControles: 0,
      noteTotaleSur20: note,
      commentairesFormateur: '',
      detailsEcarts: []
    }
  };
}

function tentativeRemise(missionId: string): TentativeExercice {
  return {
    id: `t-${missionId}`,
    missionId,
    stagiaireNom: 'Test',
    dateDebut: '2026-01-01T00:00:00.000Z',
    statut: 'remis',
    reponsesStagiaire: { justificationsTextuelles: {}, valeursCalculees: {}, piecesValidees: [], controlesEffectues: [] },
    indicesConsultes: 0
  };
}

test('parcours vide : jamais réussi', () => {
  const s = evaluerParcours([], []);
  assert.equal(s.reussi, false);
  assert.equal(s.complet, false);
  assert.equal(s.moyenne, null);
});

test('toutes corrigées et moyenne ≥ 10 → réussi', () => {
  const missions = [mission('a'), mission('b')];
  const tentatives = [tentativeCorrigee('a', 12), tentativeCorrigee('b', 14)];
  const s = evaluerParcours(missions, tentatives);
  assert.equal(s.missionsCorrigees, 2);
  assert.equal(s.moyenne, 13);
  assert.equal(s.complet, true);
  assert.equal(s.reussi, true);
});

test('une mission non corrigée → non complet, non réussi', () => {
  const missions = [mission('a'), mission('b')];
  const tentatives = [tentativeCorrigee('a', 18), tentativeRemise('b')];
  const s = evaluerParcours(missions, tentatives);
  assert.equal(s.missionsCorrigees, 1);
  assert.equal(s.complet, false);
  assert.equal(s.reussi, false);
});

test('complet mais moyenne < 10 → non réussi', () => {
  const missions = [mission('a'), mission('b')];
  const tentatives = [tentativeCorrigee('a', 8), tentativeCorrigee('b', 9)];
  const s = evaluerParcours(missions, tentatives);
  assert.equal(s.complet, true);
  assert.equal(s.reussi, false);
});

test('moyenne exactement au seuil → réussi', () => {
  const missions = [mission('a')];
  const s = evaluerParcours(missions, [tentativeCorrigee('a', SEUIL_REUSSITE)]);
  assert.equal(s.reussi, true);
});

test('tentatives hors catalogue ignorées', () => {
  const missions = [mission('a')];
  const tentatives = [tentativeCorrigee('a', 11), tentativeCorrigee('zzz', 20)];
  const s = evaluerParcours(missions, tentatives);
  assert.equal(s.missionsCorrigees, 1);
  assert.equal(s.moyenne, 11);
  assert.equal(s.reussi, true);
});

test('estParcoursReussi : garde-fous', () => {
  assert.equal(estParcoursReussi(0, 0, null), false);
  assert.equal(estParcoursReussi(3, 3, null), false);
  assert.equal(estParcoursReussi(2, 3, 20), false);
  assert.equal(estParcoursReussi(3, 3, 9.9), false);
  assert.equal(estParcoursReussi(3, 3, 10), true);
});

test('référence déterministe et stable', () => {
  const d = new Date('2026-06-15T10:00:00.000Z');
  const r1 = referenceCertificat('Amine Alami', d);
  const r2 = referenceCertificat('amine alami', d);
  assert.equal(r1, r2); // insensible à la casse / espaces
  assert.match(r1, /^SRH-[0-9A-Z]{6}-2026$/);
});

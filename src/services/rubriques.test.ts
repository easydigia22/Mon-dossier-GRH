import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { repartirRubriques } from './rubriques';
import { RubriquePersonnalisee } from '../types';

describe('repartirRubriques', () => {
  it('range une prime vers primesDiverses, imposable et cotisable', () => {
    const rubriques: RubriquePersonnalisee[] = [
      { libelle: 'Prime de rendement', montant: 1200, type: 'prime' }
    ];

    const r = repartirRubriques(rubriques);

    assert.deepEqual(r.primesDiverses, [
      { libelle: 'Prime de rendement', montant: 1200, imposable: true, cotisable: true }
    ]);
    assert.deepEqual(r.indemnitesNonImposables, []);
    assert.deepEqual(r.avantagesEnNature, []);
  });

  it('range une indemnité exonérée vers indemnitesNonImposables', () => {
    const rubriques: RubriquePersonnalisee[] = [
      { libelle: 'Indemnité de transport', montant: 500, type: 'indemnite_exoneree' }
    ];

    const r = repartirRubriques(rubriques);

    assert.deepEqual(r.indemnitesNonImposables, [
      { libelle: 'Indemnité de transport', montant: 500 }
    ]);
    assert.deepEqual(r.primesDiverses, []);
    assert.deepEqual(r.avantagesEnNature, []);
  });

  it('range un avantage en nature vers avantagesEnNature', () => {
    const rubriques: RubriquePersonnalisee[] = [
      { libelle: 'Voiture de fonction', montant: 800, type: 'avantage_nature' }
    ];

    const r = repartirRubriques(rubriques);

    assert.deepEqual(r.avantagesEnNature, [
      { libelle: 'Voiture de fonction', montant: 800 }
    ]);
    assert.deepEqual(r.primesDiverses, []);
    assert.deepEqual(r.indemnitesNonImposables, []);
  });

  it('répartit une liste mixte dans les trois familles', () => {
    const rubriques: RubriquePersonnalisee[] = [
      { libelle: 'Prime de responsabilité', montant: 1500, type: 'prime' },
      { libelle: 'Indemnité de panier', montant: 300, type: 'indemnite_exoneree' },
      { libelle: 'Logement de fonction', montant: 2000, type: 'avantage_nature' }
    ];

    const r = repartirRubriques(rubriques);

    assert.equal(r.primesDiverses.length, 1);
    assert.equal(r.indemnitesNonImposables.length, 1);
    assert.equal(r.avantagesEnNature.length, 1);
  });

  it('retourne trois listes vides pour une entrée vide', () => {
    const r = repartirRubriques([]);
    assert.deepEqual(r, { primesDiverses: [], indemnitesNonImposables: [], avantagesEnNature: [] });
  });
});

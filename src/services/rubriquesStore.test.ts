import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getRubriques,
  ajouterRubrique,
  supprimerRubrique,
  appliquerRubriqueCategorie
} from './rubriques';
import { RubriquePersonnalisee, RubriquesSalariePeriode } from '../types';

const PRIME: RubriquePersonnalisee = { libelle: 'Prime', montant: 1000, type: 'prime' };

describe('getRubriques', () => {
  it('retourne la liste du couple salarié/période', () => {
    const store: RubriquesSalariePeriode[] = [
      { salarieId: 's1', periodeMois: '2025-01', rubriques: [PRIME] }
    ];
    assert.deepEqual(getRubriques(store, 's1', '2025-01'), [PRIME]);
  });

  it('retourne un tableau vide quand rien n\'est saisi', () => {
    assert.deepEqual(getRubriques([], 's1', '2025-01'), []);
  });

  it('ne confond pas deux périodes du même salarié', () => {
    const store: RubriquesSalariePeriode[] = [
      { salarieId: 's1', periodeMois: '2025-01', rubriques: [PRIME] }
    ];
    assert.deepEqual(getRubriques(store, 's1', '2025-02'), []);
  });
});

describe('ajouterRubrique', () => {
  it('crée l\'entrée si le couple salarié/période n\'existe pas', () => {
    const next = ajouterRubrique([], 's1', '2025-01', PRIME);
    assert.deepEqual(getRubriques(next, 's1', '2025-01'), [PRIME]);
  });

  it('ajoute à une entrée existante sans muter le store d\'origine', () => {
    const store: RubriquesSalariePeriode[] = [
      { salarieId: 's1', periodeMois: '2025-01', rubriques: [PRIME] }
    ];
    const autre: RubriquePersonnalisee = { libelle: 'Transport', montant: 500, type: 'indemnite_exoneree' };
    const next = ajouterRubrique(store, 's1', '2025-01', autre);

    assert.equal(getRubriques(next, 's1', '2025-01').length, 2);
    assert.equal(store[0].rubriques.length, 1, 'le store d\'origine ne doit pas être muté');
  });
});

describe('supprimerRubrique', () => {
  it('retire la rubrique à l\'index donné', () => {
    const transport: RubriquePersonnalisee = { libelle: 'Transport', montant: 500, type: 'indemnite_exoneree' };
    const store: RubriquesSalariePeriode[] = [
      { salarieId: 's1', periodeMois: '2025-01', rubriques: [PRIME, transport] }
    ];
    const next = supprimerRubrique(store, 's1', '2025-01', 0);
    assert.deepEqual(getRubriques(next, 's1', '2025-01'), [transport]);
  });
});

describe('appliquerRubriqueCategorie', () => {
  it('ajoute la rubrique à tous les salariés listés pour la période', () => {
    const next = appliquerRubriqueCategorie([], ['s1', 's2', 's3'], '2025-01', PRIME);
    assert.deepEqual(getRubriques(next, 's1', '2025-01'), [PRIME]);
    assert.deepEqual(getRubriques(next, 's2', '2025-01'), [PRIME]);
    assert.deepEqual(getRubriques(next, 's3', '2025-01'), [PRIME]);
  });
});

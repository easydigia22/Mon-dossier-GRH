# Consultation du dossier stagiaire par le formateur — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner au formateur un accès en lecture seule au dossier de travail (entreprise, salariés, contrats, présences, congés, bulletins) de ses propres stagiaires, et supprimer la note automatique à 18/20.

**Architecture:** Une migration RLS ajoute une fonction `est_mon_stagiaire()` et des policies SELECT sur 6 tables métier. Un service `dossierStagiaire.ts` charge un dossier en parallèle. Un écran `DossierStagiaireView.tsx` l'affiche en sections dépliantes, monté dans l'Espace Formateur. La note auto disparaît de `MissionsView` : la remise devient `remis` sans correction.

**Tech Stack:** React 19 + TypeScript, Vite, Supabase (PostgreSQL + RLS), Tailwind CSS v4, lucide-react. Pas de framework de test.

**Spec:** `docs/superpowers/specs/2026-10-14-dossier-stagiaire-formateur-design.md`

## Global Constraints

- **Aucun framework de test dans le projet.** La « vérification » d'une tâche = `npx tsc --noEmit` passe, `npx vite build` passe, et (pour la migration) les requêtes SQL manuelles du §10 de la spec. Pas de `pytest`/`vitest`.
- **Migrations idempotentes** : `create or replace`, `drop policy if exists` avant `create policy`, `add column if not exists`. Réexécutables sans dommage.
- **Nommage des fichiers de migration** : `AAAAMMJJhhmmss_nom.sql` dans `supabase/migrations/`. Celle-ci : `20261014000000_formateur_dossiers_stagiaires.sql`.
- **Lecture seule garantie par la base** : aucune policy INSERT/UPDATE/DELETE, aucun `grant` d'écriture pour le formateur sur les 6 tables.
- **Commentaires de code en français**, comme tout le projet.
- **Attribution des commits** : terminer chaque message par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **6 tables métier concernées** : `entreprises`, `salaries`, `contrats`, `evenements_presence`, `demandes_conges`, `bulletins`. Exclues : `regles`, `procedures`, `parametres_app`, `classes`, `tentatives`.

## Review Focus

- **UPDATE refusé par RLS = 0 ligne, pas une erreur.** Un formateur qui tenterait une écriture ne doit jamais croire qu'elle a réussi. Couvert par la migration (aucun grant d'écriture) et vérifié par le scénario SQL 3. → Task 1.
- **Formateur révoqué (`statut = 'en_attente'`/`'refuse'`) garde ses lignes `classes`.** Sans `is_formateur()` en facteur dans `est_mon_stagiaire()`, il continuerait de lire ses anciens stagiaires. → Task 1, vérifié scénario SQL 4.
- **Stagiaire sans entreprise.** `fetchDossierStagiaire` doit renvoyer `entreprise: undefined` + tableaux vides sans lever, et l'écran afficher un état vide, pas une erreur. → Task 2 (test manuel), Task 4 (rendu).
- **`supabase === null` (mode local sans cloud).** Le service et l'écran ne doivent pas planter : dossier vide, message explicite. → Task 2, Task 4.
- **Tentatives de démo déjà notées à 18/20.** Après Task 5, l'affichage stagiaire doit gérer les deux cas (`correction` présente ou absente) sans casser l'historique. → Task 5.

---

## Task 1 : Migration RLS — accès lecture seule du formateur

**Files:**
- Create: `supabase/migrations/20261014000000_formateur_dossiers_stagiaires.sql`

**Interfaces:**
- Consomme : `public.is_formateur()` et `public.classe_stagiaires` (migrations existantes).
- Produit : fonction SQL `public.est_mon_stagiaire(p_user_id uuid) returns boolean` ; policy `formateur_read_roster` (SELECT) sur les 6 tables métier.

- [ ] **Step 1 : Écrire la migration**

Créer `supabase/migrations/20261014000000_formateur_dossiers_stagiaires.sql` :

```sql
-- Consultation en lecture seule, par le formateur, du dossier de travail de ses
-- propres stagiaires (entreprise, salariés, contrats, présences, congés, bulletins).
-- Spec : docs/superpowers/specs/2026-10-14-dossier-stagiaire-formateur-design.md
--
-- Idempotente : réexécutable sans dommage.
-- SELECT uniquement : aucun grant d'écriture. Les policies owner_all existantes
-- (accès plein du stagiaire à son dossier) sont conservées ; celle-ci s'ajoute.

-- Appartenance : vrai si l'appelant est un formateur approuvé ET que le stagiaire
-- visé est rattaché à l'une de ses classes. is_formateur() reste en facteur : un
-- formateur révoqué (statut <> 'approuve') perd l'accès, bien que ses lignes de
-- classes subsistent.
create or replace function public.est_mon_stagiaire(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_formateur()
     and exists (
       select 1 from public.classe_stagiaires cs
       where cs.stagiaire_user_id = p_user_id
         and cs.classe_user_id = auth.uid()
     );
$$;

-- Policy de lecture sur chacune des 6 tables métier. SELECT uniquement.
do $$
declare
  t text;
begin
  foreach t in array array[
    'entreprises', 'salaries', 'contrats',
    'evenements_presence', 'demandes_conges', 'bulletins'
  ]
  loop
    execute format('drop policy if exists "formateur_read_roster" on public.%I', t);
    execute format(
      'create policy "formateur_read_roster" on public.%I
         for select to authenticated
         using (public.est_mon_stagiaire(%I.user_id))', t, t);
  end loop;
end $$;
```

- [ ] **Step 2 : Vérifier la syntaxe SQL localement**

Si la CLI Supabase est installée : `supabase db lint` (ou appliquer sur une base locale via `supabase db reset`). Sinon, relecture manuelle : chaque `create policy` est précédé d'un `drop policy if exists`, la fonction est `create or replace`, aucun `grant` d'écriture n'est présent.
Attendu : aucune erreur de syntaxe ; le mot `insert`, `update`, `delete`, `grant` n'apparaît pas dans le fichier.

- [ ] **Step 3 : Appliquer la migration sur le projet Supabase**

Exécuter le contenu du fichier dans l'éditeur SQL de Supabase (ou `supabase db push`).
Attendu : exécution sans erreur. Réexécuter une seconde fois pour confirmer l'idempotence (aucune erreur « policy already exists »).

- [ ] **Step 4 : Vérifier le cloisonnement par les requêtes SQL du §10**

Avec un formateur A, un formateur B, deux stagiaires dans deux classes distinctes, exécuter les 8 scénarios du §10 de la spec. Points critiques :
- Scénario 2 (formateur A lit un stagiaire de B) → 0 ligne.
- Scénario 3 (`update` d'une table métier) → 0 ligne affectée, pas d'erreur.
- Scénario 4 (formateur A passé `en_attente`, puis relit) → 0 ligne.
- Scénario 6 (stagiaire X lit stagiaire Y) → 0 ligne.

Attendu : les 8 scénarios conformes au tableau. Noter tout écart avant de poursuivre.

- [ ] **Step 5 : Commit**

```bash
git add supabase/migrations/20261014000000_formateur_dossiers_stagiaires.sql
git commit -m "feat(db): acces lecture seule du formateur au dossier de ses stagiaires

Fonction est_mon_stagiaire() + policies SELECT sur les 6 tables metier.
Aucun grant d'ecriture : la lecture seule est garantie par la base.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : Service de chargement du dossier

**Files:**
- Create: `src/services/dossierStagiaire.ts`

**Interfaces:**
- Consomme : `supabase` (de `./supabase`, type `SupabaseClient | null`) ; types `Entreprise`, `Salarie`, `Contrat`, `EvenementPresence`, `DemandeConge`, `BulletinPaie` (de `../types`).
- Produit :
  - `interface DossierStagiaire { entreprise?: Entreprise; salaries: Salarie[]; contrats: Contrat[]; evenementsPresence: EvenementPresence[]; demandesConges: DemandeConge[]; bulletins: BulletinPaie[]; chargeLe: string; }`
  - `async function fetchDossierStagiaire(userId: string): Promise<DossierStagiaire>`

- [ ] **Step 1 : Écrire le service**

Créer `src/services/dossierStagiaire.ts` :

```ts
/**
 * Chargement, côté formateur, du dossier de travail complet d'un stagiaire.
 * S'appuie sur les policies RLS "formateur_read_roster" (migration 20261014000000) :
 * sans droit, chaque requête renvoie simplement 0 ligne, sans erreur. Le filtre
 * .eq('user_id', ...) ne porte aucune sécurité (c'est la RLS qui décide) ; il évite
 * seulement de rapatrier d'autres dossiers.
 */

import { supabase } from './supabase';
import type {
  Entreprise, Salarie, Contrat, EvenementPresence, DemandeConge, BulletinPaie
} from '../types';

export interface DossierStagiaire {
  entreprise?: Entreprise;
  salaries: Salarie[];
  contrats: Contrat[];
  evenementsPresence: EvenementPresence[];
  demandesConges: DemandeConge[];
  bulletins: BulletinPaie[];
  /** ISO : fraîcheur affichée dans le bandeau de l'écran. */
  chargeLe: string;
}

const dossierVide = (): DossierStagiaire => ({
  entreprise: undefined,
  salaries: [],
  contrats: [],
  evenementsPresence: [],
  demandesConges: [],
  bulletins: [],
  chargeLe: new Date().toISOString()
});

export async function fetchDossierStagiaire(userId: string): Promise<DossierStagiaire> {
  if (!supabase) return dossierVide();

  const q = (table: string) => supabase!.from(table).select('data').eq('user_id', userId);

  const [ent, sal, con, pre, cng, bul] = await Promise.all([
    q('entreprises'),
    q('salaries'),
    q('contrats'),
    q('evenements_presence'),
    q('demandes_conges'),
    q('bulletins')
  ]);

  const premiereErreur = [ent, sal, con, pre, cng, bul].find((r) => r.error);
  if (premiereErreur?.error) throw premiereErreur.error;

  const lignes = <T>(r: { data: { data: unknown }[] | null }): T[] =>
    (r.data ?? []).map((row) => row.data as T);

  const entreprises = lignes<Entreprise>(ent);

  return {
    entreprise: entreprises[0],
    salaries: lignes<Salarie>(sal),
    contrats: lignes<Contrat>(con),
    evenementsPresence: lignes<EvenementPresence>(pre),
    demandesConges: lignes<DemandeConge>(cng),
    bulletins: lignes<BulletinPaie>(bul),
    chargeLe: new Date().toISOString()
  };
}
```

- [ ] **Step 2 : Vérifier le typage**

Run: `npx tsc --noEmit`
Attendu : aucune erreur. (En particulier, les noms de types importés existent bien dans `src/types/index.ts` : `Entreprise`, `Salarie`, `Contrat`, `EvenementPresence`, `DemandeConge`, `BulletinPaie`.)

- [ ] **Step 3 : Commit**

```bash
git add src/services/dossierStagiaire.ts
git commit -m "feat(trainer): service de chargement du dossier d'un stagiaire

fetchDossierStagiaire() charge les 6 tables metier en parallele. Mode local
(supabase null) et dossier vide renvoient un dossier vide sans lever.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : Composant de rendu d'une valeur de dossier (section dépliante)

**Files:**
- Create: `src/components/trainer/SectionDossier.tsx`

**Interfaces:**
- Produit : `SectionDossier`, un composant React réutilisable.
  - Props : `{ titre: string; compteur?: number; ouvertParDefaut?: boolean; vide?: boolean; messageVide?: string; children: React.ReactNode }`

- [ ] **Step 1 : Écrire le composant**

Créer `src/components/trainer/SectionDossier.tsx` :

```tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SectionDossierProps {
  titre: string;
  /** Affiché entre parenthèses à côté du titre (ex. nombre de salariés). */
  compteur?: number;
  ouvertParDefaut?: boolean;
  /** Si vrai, le corps n'est pas rendu et messageVide s'affiche à la place. */
  vide?: boolean;
  messageVide?: string;
  children: React.ReactNode;
}

/** Section pliable d'un dossier stagiaire, en lecture seule. */
export const SectionDossier: React.FC<SectionDossierProps> = ({
  titre,
  compteur,
  ouvertParDefaut = false,
  vide = false,
  messageVide = 'Rien à afficher pour l\'instant.',
  children
}) => {
  const [ouvert, setOuvert] = useState(ouvertParDefaut);

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-[#1C2459] flex items-center gap-2">
          {ouvert ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {titre}
          {typeof compteur === 'number' && (
            <span className="text-xs font-normal text-slate-500">({compteur})</span>
          )}
        </span>
      </button>
      {ouvert && (
        <div className="px-4 pb-4 text-xs">
          {vide ? <p className="text-slate-500 italic">{messageVide}</p> : children}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2 : Vérifier le typage**

Run: `npx tsc --noEmit`
Attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/components/trainer/SectionDossier.tsx
git commit -m "feat(trainer): composant section depliante pour le dossier stagiaire

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : Écran de consultation du dossier

**Files:**
- Create: `src/components/trainer/DossierStagiaireView.tsx`
- Modify: `src/components/trainer/TrainerView.tsx` (import + montage d'une section)

**Interfaces:**
- Consomme : `fetchDossierStagiaire`, `DossierStagiaire` (Task 2) ; `SectionDossier` (Task 3) ; `MembreClasseLive` (`../../types`) ; `formatMAD` (`../../services/exportService`).
- Produit : `DossierStagiaireView`, props `{ effectif: MembreClasseLive[]; showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void }`.

- [ ] **Step 1 : Écrire l'écran**

Créer `src/components/trainer/DossierStagiaireView.tsx` :

```tsx
import React, { useState } from 'react';
import { FolderOpen, RefreshCw, Lock, Loader2, Building2 } from 'lucide-react';
import type { MembreClasseLive } from '../../types';
import { fetchDossierStagiaire, DossierStagiaire } from '../../services/dossierStagiaire';
import { formatMAD } from '../../services/exportService';
import { SectionDossier } from './SectionDossier';

interface DossierStagiaireViewProps {
  effectif: MembreClasseLive[];
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

/** Consultation en lecture seule du dossier de travail d'un stagiaire de la classe. */
export const DossierStagiaireView: React.FC<DossierStagiaireViewProps> = ({ effectif, showNotification }) => {
  const [userIdActif, setUserIdActif] = useState<string>('');
  const [dossier, setDossier] = useState<DossierStagiaire | null>(null);
  const [chargement, setChargement] = useState(false);

  const membre = effectif.find((m) => m.stagiaireUserId === userIdActif);

  const charger = async (userId: string) => {
    setChargement(true);
    try {
      setDossier(await fetchDossierStagiaire(userId));
    } catch {
      showNotification('Impossible de charger le dossier de ce stagiaire.', 'error');
      setDossier(null);
    } finally {
      setChargement(false);
    }
  };

  const handleSelection = (userId: string) => {
    setUserIdActif(userId);
    if (userId) charger(userId);
    else setDossier(null);
  };

  const dateFr = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-[#149D92]" />
          <h3 className="text-sm font-bold text-[#1C2459]">Dossier de travail d'un stagiaire</h3>
        </div>

        {effectif.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aucun stagiaire n'a encore rejoint cette classe avec son propre compte. Communiquez-leur le code d'invitation.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={userIdActif}
              onChange={(e) => handleSelection(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">— Choisir un stagiaire —</option>
              {effectif.map((m) => (
                <option key={m.stagiaireUserId} value={m.stagiaireUserId}>
                  {m.prenom} {m.nom}{m.matricule ? ` (${m.matricule})` : ''}
                </option>
              ))}
            </select>
            {membre && (
              <button
                type="button"
                onClick={() => charger(membre.stagiaireUserId)}
                className="text-xs flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Rafraîchir
              </button>
            )}
          </div>
        )}
      </div>

      {chargement && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#1C2459]" />
        </div>
      )}

      {!chargement && dossier && membre && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-900">
            <Lock className="w-3.5 h-3.5" />
            <span>
              Lecture seule — dossier de <strong>{membre.prenom} {membre.nom}</strong> · chargé à {dateFr(dossier.chargeLe)}
            </span>
          </div>

          <SectionDossier
            titre="Entreprise"
            ouvertParDefaut
            vide={!dossier.entreprise}
            messageVide="Ce stagiaire n'a pas encore créé son entreprise."
          >
            {dossier.entreprise && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Building2 className="w-4 h-4 text-[#149D92]" />
                  <strong className="text-sm">{dossier.entreprise.raisonSociale}</strong>
                </div>
                <div>Forme : {dossier.entreprise.formeJuridique}</div>
                <div>Ville : {dossier.entreprise.ville}</div>
                <div>ICE : {dossier.entreprise.ice}</div>
                <div>N° CNSS : {dossier.entreprise.numeroCNSS}</div>
                <div>Secteur : {dossier.entreprise.secteur}</div>
                <div>Représentant : {dossier.entreprise.representantLegal}</div>
              </div>
            )}
          </SectionDossier>

          <SectionDossier titre="Salariés" compteur={dossier.salaries.length} vide={dossier.salaries.length === 0}
            messageVide="Aucun salarié saisi.">
            <ul className="space-y-1 text-slate-700">
              {dossier.salaries.map((s) => (
                <li key={s.id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{s.prenom} {s.nom}{s.matricule ? ` · ${s.matricule}` : ''}</span>
                  <span className="text-slate-500">{s.poste ?? ''}</span>
                </li>
              ))}
            </ul>
          </SectionDossier>

          <SectionDossier titre="Contrats" compteur={dossier.contrats.length} vide={dossier.contrats.length === 0}
            messageVide="Aucun contrat saisi.">
            <ul className="space-y-1 text-slate-700">
              {dossier.contrats.map((c) => (
                <li key={c.id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{c.type ?? 'Contrat'} · {c.poste ?? ''}</span>
                  <span className="text-slate-500">{c.dateEffet ?? ''}</span>
                </li>
              ))}
            </ul>
          </SectionDossier>

          <SectionDossier titre="Présences" compteur={dossier.evenementsPresence.length}
            vide={dossier.evenementsPresence.length === 0} messageVide="Aucun événement de présence.">
            <ul className="space-y-1 text-slate-700">
              {dossier.evenementsPresence.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{e.type ?? 'Événement'}</span>
                  <span className="text-slate-500">{e.periodeMois ?? ''}</span>
                </li>
              ))}
            </ul>
          </SectionDossier>

          <SectionDossier titre="Congés" compteur={dossier.demandesConges.length}
            vide={dossier.demandesConges.length === 0} messageVide="Aucune demande de congé.">
            <ul className="space-y-1 text-slate-700">
              {dossier.demandesConges.map((d) => (
                <li key={d.id} className="border-b border-slate-100 py-1">{d.type ?? 'Congé'} — {d.statut ?? ''}</li>
              ))}
            </ul>
          </SectionDossier>

          <SectionDossier titre="Bulletins" compteur={dossier.bulletins.length}
            vide={dossier.bulletins.length === 0} messageVide="Aucun bulletin calculé.">
            <ul className="space-y-1 text-slate-700">
              {dossier.bulletins.map((b) => (
                <li key={b.id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{b.salarieNomPrenom} · {b.periodeMois}</span>
                  <span className="font-mono text-[#149D92]">{formatMAD(b.salaireNetAPayer)}</span>
                </li>
              ))}
            </ul>
          </SectionDossier>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2 : Vérifier les noms de propriétés contre les types réels**

Champs vérifiés contre `src/types/index.ts` au moment de l'écriture du plan : `Salarie.poste` ✓, `Contrat.type`/`Contrat.poste`/`Contrat.dateEffet` ✓ (le champ est `dateEffet`, **pas** `dateDebut`), `EvenementPresence.type`/`periodeMois` ✓, `DemandeConge.type`/`statut` ✓ (`statut` est un `StatutWorkflow` : `'Brouillon' | 'Soumise' | 'Approuvee' | 'Refusee'`), `BulletinPaie.salarieNomPrenom`/`periodeMois`/`salaireNetAPayer` ✓. Si un champ a changé depuis, corriger l'accès. Les accès optionnels (`?? ''`) tolèrent l'absence de valeur mais pas un nom de champ inexistant.
Attendu : chaque propriété lue existe dans son interface.

- [ ] **Step 3 : Monter l'écran dans TrainerView**

Dans `src/components/trainer/TrainerView.tsx`, ajouter l'import en tête :

```tsx
import { DossierStagiaireView } from './DossierStagiaireView';
```

Puis, dans le rendu, juste après le bloc de suivi des tentatives en direct (la section qui utilise `effectifLive`), insérer :

```tsx
      <DossierStagiaireView effectif={effectifLive} showNotification={showNotification} />
```

`effectifLive` est déjà chargé par `TrainerView` (state ligne ~118, alimenté par `fetchEffectifLive`). L'écran réutilise ce roster sans nouvel appel réseau.

- [ ] **Step 4 : Vérifier le typage et le build**

Run: `npx tsc --noEmit && npx vite build`
Attendu : aucune erreur de type ; build réussi.

- [ ] **Step 5 : Commit**

```bash
git add src/components/trainer/DossierStagiaireView.tsx src/components/trainer/TrainerView.tsx
git commit -m "feat(trainer): ecran de consultation du dossier stagiaire (lecture seule)

Sections depliantes (entreprise, salaries, contrats, presences, conges,
bulletins) avec etats vides explicites et bandeau lecture seule. Monte dans
l'Espace Formateur en reutilisant le roster deja charge.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5 : Suppression de la note automatique

**Files:**
- Modify: `src/components/missions/MissionsView.tsx`

**Interfaces:**
- Consomme : `TentativeExercice` (statut `'en_cours' | 'remis' | 'corrige'`, `correction?` optionnel).
- Produit : à la remise, une tentative de statut `'remis'` sans `correction`.

- [ ] **Step 1 : Retirer le calcul de note dans `handleSoumettre`**

Dans `src/components/missions/MissionsView.tsx`, remplacer le corps de `handleSoumettre` qui construit la note (le bloc `let noteDossier = 4; ... noteTotaleSur20: noteTotale, ...`) par une tentative sans correction :

```tsx
  const handleSoumettre = (e: React.FormEvent) => {
    e.preventDefault();

    const nouvelleTentative: TentativeExercice = {
      id: `tentative-${mission.id}-${Date.now()}`,
      missionId: mission.id,
      stagiaireNom: nomStagiaireActif,
      dateDebut: new Date(debutMission).toISOString(),
      dateRemise: new Date().toISOString(),
      statut: 'remis',
      reponsesStagiaire: {
        justificationsTextuelles: reponsesTextuelles,
        valeursCalculees,
        piecesValidees: [],
        controlesEffectues: controlesCoches
      },
      indicesConsultes: indicesAffiches
      // Pas de correction : la note est posée par le formateur (TrainerView).
    };

    onSoumettreTentative(nouvelleTentative);

    if (enEvaluation) {
      showNotification('Copie remise. En attente de correction par le formateur.', 'success');
    } else {
      showNotification('Mission remise. Votre formateur la corrigera.', 'success');
    }
  };
```

Supprimer aussi, si elle devient inutilisée, la ligne `setVoirCorrige(true)` qui suivait la remise, et vérifier qu'aucune variable `noteTotale`/`noteDossier`/… ne reste référencée.

- [ ] **Step 2 : Adapter le badge d'état côté stagiaire**

Repérer le badge « Mission complétée (…/20) » (il lit `tentativeExistante.correction?.noteTotaleSur20`). Le remplacer par un affichage à deux cas :

```tsx
                {tentativeExistante && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      tentativeExistante.correction
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tentativeExistante.correction
                      ? `Corrigée (${tentativeExistante.correction.noteTotaleSur20.toFixed(1)}/20)`
                      : 'Remise — en attente de correction'}
                  </span>
                )}
```

Conserver les classes de couleur existantes (vert si corrigée, neutre/ambre si en attente) selon le style du fichier ; l'essentiel est que l'absence de `correction` n'affiche plus « 18/20 ».

- [ ] **Step 3 : Vérifier le typage et le build**

Run: `npx tsc --noEmit && npx vite build`
Attendu : aucune erreur ; en particulier, plus aucune référence aux variables de note supprimées.

- [ ] **Step 4 : Vérifier le comportement des anciennes tentatives**

Relecture : une tentative de démo portant déjà `correction.noteTotaleSur20 = 18` doit afficher « Corrigée (18.0/20) » (cas `correction` présent), et une nouvelle remise « Remise — en attente de correction » (cas `correction` absent). Les deux branches sont couvertes par le ternaire.
Attendu : aucun chemin ne lève sur `correction` undefined.

- [ ] **Step 5 : Commit**

```bash
git add src/components/missions/MissionsView.tsx
git commit -m "feat(missions): supprimer la note auto, la remise passe en 'remis'

La note 18/20 codee en dur disparait : a la remise la tentative est 'remis'
sans correction, et le formateur la note. Le badge stagiaire distingue
'en attente de correction' et 'corrigee (n/20)'.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6 : Mention de transparence côté stagiaire

**Files:**
- Modify: `src/components/missions/MissionsView.tsx` (bandeau d'information)
- Modify: `src/components/auth/AuthGate.tsx` (écran « Rejoindre ma classe »)

**Interfaces:** aucune nouvelle ; ajout de texte statique.

- [ ] **Step 1 : Ajouter la mention dans l'écran Missions**

Dans `src/components/missions/MissionsView.tsx`, sous l'en-tête des missions, ajouter un bandeau discret :

```tsx
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-[11px] text-[#1C2459] flex items-start gap-2">
        <span>
          Votre formateur peut consulter votre dossier de travail (entreprise, salariés, bulletins)
          pour corriger vos missions. Il ne peut rien y modifier.
        </span>
      </div>
```

- [ ] **Step 2 : Ajouter la mention dans l'écran « Rejoindre ma classe »**

Dans `src/components/auth/AuthGate.tsx`, dans le `JoinClasseScreen`, sous le sous-titre « Demandez le code à votre formateur », ajouter :

```tsx
        <p className="text-[11px] text-slate-500 leading-relaxed">
          En rejoignant une classe, vous permettez à votre formateur de consulter votre dossier de
          travail pour le corriger. Il ne peut rien y modifier.
        </p>
```

- [ ] **Step 3 : Vérifier le typage et le build**

Run: `npx tsc --noEmit && npx vite build`
Attendu : aucune erreur ; build réussi.

- [ ] **Step 4 : Commit**

```bash
git add src/components/missions/MissionsView.tsx src/components/auth/AuthGate.tsx
git commit -m "feat(ui): mention de transparence (consultation du dossier par le formateur)

Conformite CNDP : le stagiaire est informe, a l'inscription en classe et dans
l'espace Missions, que son formateur peut consulter son dossier en lecture seule.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7 : Déploiement

**Files:** aucun (opération de livraison).

- [ ] **Step 1 : Confirmer que la migration est bien appliquée en production**

La migration (Task 1) doit déjà être exécutée sur le projet Supabase de production. Sinon, l'appliquer maintenant, sinon l'écran formateur affichera des dossiers vides (RLS refuse → 0 ligne).

- [ ] **Step 2 : Pousser et laisser Vercel déployer**

```bash
git push origin main
```

- [ ] **Step 3 : Vérifier le déploiement**

`npx vercel list mon-dossier-grh --scope easydigia` → dernier déploiement production « Ready ». Vérifier que le chunk `TrainerView` servi contient `Dossier de travail d'un stagiaire`.

- [ ] **Step 4 : Test fonctionnel manuel**

Avec un compte formateur et un stagiaire de sa classe ayant créé une entreprise : ouvrir l'Espace Formateur → sélectionner le stagiaire → vérifier l'affichage du dossier, les compteurs, l'état vide pour un stagiaire sans entreprise, et l'absence de tout bouton d'écriture.

---

## Notes d'exécution

- **Tasks 1 → 4 sont séquentielles** : chacune consomme l'interface de la précédente (migration → service → section → écran). Task 5 et Task 6 sont indépendantes des précédentes et l'une de l'autre.
- **Dépendance externe forte** : Task 1 Step 3-4 et Task 7 nécessitent un accès au projet Supabase que l'assistant n'a pas (connecteur en 403 sur ce scope). Ces étapes sont à exécuter par le propriétaire du projet ; l'assistant fournit le SQL et les scénarios de vérification.

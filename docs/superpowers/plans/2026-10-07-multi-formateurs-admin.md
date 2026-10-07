# Multi-formateurs, approbation et cloisonnement — Plan d'implémentation (lot A, partie applicative)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à l'application les règles que la base applique déjà : écran d'attente
pour un formateur non approuvé, espace d'administration pour approuver / refuser /
révoquer, et visibilité du rôle `admin`.

**Architecture:** `profile.ts` cesse de ne renvoyer qu'un rôle et renvoie le profil complet
(rôle, statut, e-mail, motif de refus). `AuthGate` — déjà le point d'entrée unique après
connexion, qui sait détourner l'affichage pour un stagiaire sans classe — gagne un
troisième chemin : l'écran d'attente. Un nouveau service `adminService.ts` encapsule la
lecture des profils et l'appel RPC `decider_formateur`, consommé par une vue
`AdminView.tsx` routée comme 16ᵉ onglet, réservé au rôle `admin`.

**Tech Stack:** React 19 + TypeScript, Supabase JS (RLS + RPC `security definer`), Tailwind,
`tsx` pour les scripts de vérification jetables (ce dépôt n'a pas de suite de tests — voir
Global Constraints).

**Spec:** `docs/superpowers/specs/2026-10-07-multi-formateurs-admin-design.md`

**Prérequis déjà satisfait :** la migration
`supabase/migrations/20261007000000_multi_formateurs_admin.sql` **a été appliquée en
production** le 2026-10-07. La base applique donc déjà le cloisonnement et l'approbation ;
ce plan ne couvre que la partie applicative. Aucune tâche ici ne touche au SQL.

## Global Constraints

- Ce dépôt n'a **aucune suite de tests automatisés** (aucun fichier `*.test.*` dans `src/`).
  Ne pas introduire vitest/jest. Chaque tâche logique se vérifie par un script `tsx` jetable
  (non commité, à placer sous `.superpowers/`, qui est git-ignoré) ; chaque tâche d'UI se
  vérifie visuellement dans le navigateur.
- `npx tsc --noEmit` doit rester sans erreur après chaque tâche. `npm run build` doit passer
  après la dernière.
- Couleurs de marque : `#1C2459` (primaire) et `#149D92` (accent). Jamais d'autre teinte.
- Toutes les chaînes visibles sont en français.
- Les écritures sur `profiles` passent **exclusivement** par la RPC `decider_formateur`.
  Aucun `update` direct sur `profiles` depuis le client : la table lui est interdite en
  écriture, un `update` échouerait silencieusement.
- Le mode local sans Supabase (`supabase === null`) doit rester pleinement fonctionnel et
  ne jamais afficher l'écran d'attente.
- Ne jamais committer sans que `tsc --noEmit` soit passé pour ce commit.

## Review Focus

- **L'admin perd les onglets formateur.** `estFormateur` devient `role === 'formateur'`, donc
  un admin n'est plus « formateur » — or la spec lui garde l'accès à l'Espace Formateur pour
  sa vue globale. Si `afficherEspaceFormateur` ne reçoit pas `estFormateur || estAdmin`,
  l'admin perd l'onglet qui porte sa vue d'ensemble, et l'onglet Discipline avec.
- **Lecture du profil en échec** (réseau coupé, RLS refusant). Le code actuel se replie sur
  `'stagiaire'` ; avec un statut en jeu, un repli muet peut soit enfermer un formateur
  approuvé sur l'écran d'attente, soit laisser entrer un compte non approuvé. L'échec doit
  être visible et fermé : message d'erreur explicite avec bouton de déconnexion, jamais un
  accès par défaut.
- **Profil absent juste après l'inscription** (le trigger n'a pas encore écrit la ligne).
  `maybeSingle()` renvoie `null` : le code ne doit ni planter, ni accorder un accès
  formateur par défaut.
- **Formateur révoqué pendant sa session.** Son interface croit encore à son approbation.
  La revérification au retour de focus doit le renvoyer sur l'écran d'attente, sans
  déclencher de rafale de requêtes ni toucher au mode local.
- **Refus sans motif saisi.** L'admin refuse en laissant le champ vide : l'écran du
  formateur refusé ne doit pas afficher « null » ou un bloc vide, mais un libellé par défaut.

---

## Task 1: Profil complet au lieu du seul rôle

**Files:**
- Modify: `src/services/profile.ts` (réécriture complète du fichier)

**Interfaces:**
- Produces: `UserRole` (élargi à `'admin'`), `StatutCompte`, `MonProfil`,
  `fetchMonProfil(): Promise<MonProfil>` — consommés par les tâches 2, 5, 6 et 7.
- `fetchMyRole` est **supprimée** ; son seul appelant est `AuthGate.tsx` (tâche 2).

- [ ] **Step 1: Réécrire `src/services/profile.ts`**

```ts
import { supabase } from './supabase';

export type UserRole = 'stagiaire' | 'formateur' | 'admin';
export type StatutCompte = 'en_attente' | 'approuve' | 'refuse';

export interface MonProfil {
  role: UserRole;
  statut: StatutCompte;
  email?: string;
  motifRefus?: string;
}

/** Profil du compte connecté, tel que fixé côté serveur (voir migrations profiles_*). */
export async function fetchMonProfil(): Promise<MonProfil> {
  if (!supabase) return { role: 'stagiaire', statut: 'approuve' };

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return { role: 'stagiaire', statut: 'approuve' };

  // Filtrer explicitement : depuis la policy `admin_read_all`, un select non filtré
  // renvoie toutes les lignes à un admin, et `maybeSingle()` échoue au-delà d'une.
  const { data, error } = await supabase
    .from('profiles')
    .select('role, statut, email, motif_refus')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  // Ligne absente : le trigger d'inscription n'a pas encore écrit. On retombe sur le
  // profil le moins privilégié — jamais sur un accès formateur par défaut.
  if (!data) return { role: 'stagiaire', statut: 'approuve' };

  return {
    role: (data.role as UserRole) ?? 'stagiaire',
    statut: (data.statut as StatutCompte) ?? 'en_attente',
    email: data.email ?? undefined,
    motifRefus: data.motif_refus ?? undefined
  };
}
```

- [ ] **Step 2: Vérifier que plus rien n'importe `fetchMyRole`**

Run: `grep -rn "fetchMyRole" src`
Expected: une seule occurrence, dans `src/components/auth/AuthGate.tsx` (corrigée en tâche 2).
Si une autre apparaît, la traiter dans cette tâche.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: une erreur attendue, dans `AuthGate.tsx`, sur l'import de `fetchMyRole` devenu
inexistant. Aucune autre erreur. Cette tâche se commite avec la tâche 2, car elle laisse
volontairement le projet non compilable seule.

---

## Task 2: Écran d'attente et chemin d'authentification

**Files:**
- Modify: `src/components/auth/AuthGate.tsx`

**Interfaces:**
- Consumes: `fetchMonProfil`, `MonProfil`, `UserRole` (tâche 1).
- Produces: `AuthGateProps.children` reçoit désormais un `role` pouvant valoir `'admin'`.
  La signature du callback est inchangée : `{ userEmail?, role?, onSignOut? }`.

- [ ] **Step 1: Remplacer l'import et l'état du rôle**

Dans `src/components/auth/AuthGate.tsx`, remplacer la ligne d'import :

```ts
import { fetchMyRole, UserRole } from '../../services/profile';
```

par :

```ts
import { fetchMonProfil, MonProfil, UserRole } from '../../services/profile';
```

Puis remplacer les deux lignes d'état :

```ts
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [roleLoading, setRoleLoading] = useState(false);
```

par :

```ts
  const [profil, setProfil] = useState<MonProfil | undefined>(undefined);
  const [profilLoading, setProfilLoading] = useState(false);
  const [profilErreur, setProfilErreur] = useState<string | null>(null);
  const role = profil?.role;
```

- [ ] **Step 2: Remplacer l'effet de chargement du rôle**

Remplacer tout l'effet `// Charger le rôle (stagiaire / formateur) une fois la session établie`
(de `useEffect(() => {` jusqu'à `}, [session?.user.id]);`) par :

```ts
  // Charger le profil (rôle + statut d'approbation) une fois la session établie.
  // Revérifié au retour de focus : un compte révoqué pendant la session doit
  // retomber sur l'écran d'attente plutôt que de se heurter à des erreurs RLS.
  useEffect(() => {
    if (!session) {
      setProfil(undefined);
      setProfilErreur(null);
      return;
    }
    let cancelled = false;

    const charger = (avecIndicateur: boolean) => {
      if (avecIndicateur) setProfilLoading(true);
      fetchMonProfil()
        .then((p) => {
          if (cancelled) return;
          setProfil(p);
          setProfilErreur(null);
        })
        .catch((e) => {
          console.error('Lecture du profil impossible:', e);
          // Échec fermé : aucun accès par défaut, un message explicite à la place.
          if (!cancelled) setProfilErreur('Impossible de vérifier votre compte. Vérifiez votre connexion, puis réessayez.');
        })
        .finally(() => {
          if (!cancelled && avecIndicateur) setProfilLoading(false);
        });
    };

    charger(true);

    const onFocus = () => charger(false);
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [session?.user.id]);
```

- [ ] **Step 3: Adapter la condition de chargement**

Remplacer :

```ts
  if (checking || (session && roleLoading) || (session && role === 'stagiaire' && classeLoading)) {
```

par :

```ts
  if (checking || (session && profilLoading) || (session && role === 'stagiaire' && classeLoading)) {
```

- [ ] **Step 4: Brancher les trois chemins après connexion**

Dans le bloc `if (session) {`, juste après la définition de `signOut` et **avant** la ligne
`if (role === 'stagiaire' && !maClasse) {`, insérer :

```ts
    if (profilErreur) {
      return <EcranBloquant titre="Compte non vérifiable" message={profilErreur} onSignOut={signOut} />;
    }

    if (profil && profil.role === 'formateur' && profil.statut !== 'approuve') {
      const enAttente = profil.statut === 'en_attente';
      return (
        <EcranBloquant
          titre={enAttente ? 'Compte en attente de validation' : 'Demande refusée'}
          message={
            enAttente
              ? "Votre compte formateur a bien été créé. Un administrateur doit le valider avant que vous puissiez accéder à l'application."
              : profil.motifRefus || "Votre demande de compte formateur n'a pas été retenue."
          }
          email={session.user.email}
          onSignOut={signOut}
        />
      );
    }
```

- [ ] **Step 5: Ajouter le composant `EcranBloquant` en fin de fichier**

À ajouter à la fin de `src/components/auth/AuthGate.tsx`, à côté de `JoinClasseScreen` :

```tsx
const EcranBloquant: React.FC<{
  titre: string;
  message: string;
  email?: string;
  onSignOut: () => void;
}> = ({ titre, message, email, onSignOut }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#F4F7FA] px-4">
    <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4 text-center">
      <div className="flex justify-center">
        <AppLogo size={40} />
      </div>
      <h1 className="text-base font-bold text-[#1C2459]">{titre}</h1>
      <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
      {email && <p className="text-[11px] text-slate-400">Compte : {email}</p>}
      <button
        onClick={onSignOut}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1C2459] hover:bg-[#161c47] text-white text-xs font-semibold rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Se déconnecter
      </button>
    </div>
  </div>
);
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7: Vérifier le mode local**

Run: `npx tsx` sur un script jetable qui importe `fetchMonProfil` et l'appelle sans
configuration Supabase :

```ts
import { fetchMonProfil } from '../../../src/services/profile';
const p = await fetchMonProfil();
console.log(p);
console.log(p.role === 'stagiaire' && p.statut === 'approuve' ? 'PASS' : 'FAIL');
```

Expected: `PASS` — sans Supabase, aucun écran bloquant ne doit pouvoir se déclencher.

- [ ] **Step 8: Commit**

```bash
git add src/services/profile.ts src/components/auth/AuthGate.tsx
git commit -m "feat(auth): gate unapproved trainer accounts behind a waiting screen"
```

---

## Task 3: Mention de validation sur l'écran d'inscription

**Files:**
- Modify: `src/components/auth/AuthGate.tsx` (formulaire d'inscription)

**Interfaces:**
- Consumes: l'état `compteRole` et `mode` déjà présents dans le composant.
- Produces: rien de consommé ailleurs.

- [ ] **Step 1: Ajouter la mention dans le `fieldset` de choix du rôle**

Dans `src/components/auth/AuthGate.tsx`, le choix du rôle est un `<fieldset>` rendu sous
`{mode === 'signup' && (` (lignes 206-225). Insérer la mention **à l'intérieur** du
fieldset, entre la fermeture du `</div>` des boutons radio et le `</fieldset>` :

```tsx
            </div>
            {compteRole === 'formateur' && (
              <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Un compte formateur doit être validé par l'administrateur avant de pouvoir
                servir. Vous serez prévenu à votre prochaine connexion.
              </p>
            )}
          </fieldset>
```

La condition sur `mode === 'signup'` est déjà portée par le bloc englobant : la répéter
serait redondant.

Sans cette mention, l'écran d'attente qui suit l'inscription est vécu comme une panne.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/AuthGate.tsx
git commit -m "feat(auth): warn at signup that a trainer account needs approval"
```

---

## Task 4: Onglet Administration dans la navigation

**Files:**
- Modify: `src/components/common/NavigationTabs.tsx:24-39` (union `OngletNavigation`)
- Modify: `src/components/common/NavigationTabs.tsx` (props et liste `items`)

**Interfaces:**
- Produces: `'administration'` dans `OngletNavigation`, et la prop
  `afficherAdministration?: boolean` sur `NavigationTabsProps` — consommées par la tâche 5.

- [ ] **Step 1: Élargir l'union**

Dans `src/components/common/NavigationTabs.tsx`, ajouter `| 'administration'` à
`OngletNavigation`, juste après `| 'formateur'` :

```ts
  | 'formateur'
  | 'administration'
  | 'parametres';
```

- [ ] **Step 2: Ajouter la prop**

Dans `interface NavigationTabsProps`, après `afficherEspaceFormateur`, ajouter :

```ts
  afficherAdministration?: boolean;
```

Et dans la déstructuration du composant, après `afficherEspaceFormateur = true,` :

```ts
  afficherAdministration = false,
```

- [ ] **Step 3: Ajouter l'entrée de menu**

Dans le tableau `items`, juste après la ligne de l'Espace Formateur :

```ts
    ...(afficherAdministration ? [{ id: 'administration' as const, label: 'Administration', icon: ShieldAlert }] : []),
```

Ajouter `ShieldAlert` à l'import `lucide-react` en tête de fichier.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur (la prop est optionnelle, `App.tsx` compile encore sans la passer).

- [ ] **Step 5: Commit**

```bash
git add src/components/common/NavigationTabs.tsx
git commit -m "feat(nav): add an admin-only Administration tab"
```

---

## Task 5: Rôles dans App.tsx et routage de l'onglet

**Files:**
- Modify: `src/App.tsx:44` (`estFormateur`)
- Modify: `src/App.tsx:88-92` (garde `setOngletActif`)
- Modify: `src/App.tsx:169` (props de `NavigationTabs`)
- Modify: `src/App.tsx` (import paresseux et rendu de `AdminView`)

**Interfaces:**
- Consumes: `'administration'` et `afficherAdministration` (tâche 4) ; `AdminView` (tâche 7).
- Produces: `estAdmin`, utilisé nulle part ailleurs que dans ce fichier.

- [ ] **Step 1: Dédoubler la variable de rôle**

Remplacer la ligne 44 :

```ts
  const estFormateur = role === 'formateur' || role === undefined; // mode local sans compte : accès complet
```

par :

```ts
  // mode local sans compte (role === undefined) : accès complet, comme avant.
  const estAdmin = role === 'admin';
  const estFormateur = role === 'formateur' || estAdmin || role === undefined;
```

`estAdmin` est inclus dans `estFormateur` à dessein : la spec garde à l'admin l'accès à
l'Espace Formateur, qui porte sa vue globale. Sans cela, il perdrait l'onglet même.

- [ ] **Step 2: Étendre la garde d'onglet**

Remplacer :

```ts
    const ongletsFormateur: OngletNavigation[] = ['formateur', 'discipline'];
    setOngletActifBrut(ongletsFormateur.includes(onglet) && !estFormateur ? 'dashboard' : onglet);
```

par :

```ts
    const ongletsFormateur: OngletNavigation[] = ['formateur', 'discipline'];
    if (onglet === 'administration' && !estAdmin) return setOngletActifBrut('dashboard');
    setOngletActifBrut(ongletsFormateur.includes(onglet) && !estFormateur ? 'dashboard' : onglet);
```

- [ ] **Step 3: Passer la prop à la navigation**

Dans le JSX `<NavigationTabs ... />`, après `afficherEspaceFormateur={estFormateur}` :

```tsx
        afficherAdministration={estAdmin}
```

- [ ] **Step 4: Importer la vue en lazy**

À côté des autres imports paresseux en tête de fichier (voir la ligne de `DisciplineView`) :

```ts
const AdminView = lazy(() => import('./components/admin/AdminView').then((m) => ({ default: m.AdminView })));
```

- [ ] **Step 5: Rendre la vue**

Dans le `<Suspense>`, à côté des autres branches d'onglet :

```tsx
        {ongletActif === 'administration' && estAdmin && (
          <AdminView showNotification={showNotification} />
        )}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: une erreur attendue sur l'import de `./components/admin/AdminView`, qui n'existe
pas encore (tâche 7). Aucune autre erreur. Ne pas committer avant la tâche 7 ; les tâches 6
et 7 créent le service et la vue.

---

## Task 6: Service d'administration

**Files:**
- Create: `src/services/adminService.ts`

**Interfaces:**
- Consumes: `UserRole`, `StatutCompte` (tâche 1).
- Produces: `ProfilAdmin`, `fetchProfils(): Promise<ProfilAdmin[]>`,
  `deciderFormateur(userId: string, decision: StatutCompte, motif?: string): Promise<void>`
  — consommés par la tâche 7.

- [ ] **Step 1: Créer `src/services/adminService.ts`**

```ts
import { supabase } from './supabase';
import type { StatutCompte, UserRole } from './profile';

export interface ProfilAdmin {
  userId: string;
  email: string;
  role: UserRole;
  statut: StatutCompte;
  decideLe?: string;
  motifRefus?: string;
  creeLe: string;
}

/**
 * Tous les profils visibles par l'admin (politique `admin_read_all`).
 * Un non-admin n'obtient que sa propre ligne : la restriction vit dans la base,
 * pas ici.
 */
export async function fetchProfils(): Promise<ProfilAdmin[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, role, statut, decide_le, motif_refus, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((l) => ({
    userId: l.user_id,
    email: l.email ?? '(e-mail inconnu)',
    role: l.role as UserRole,
    statut: l.statut as StatutCompte,
    decideLe: l.decide_le ?? undefined,
    motifRefus: l.motif_refus ?? undefined,
    creeLe: l.created_at
  }));
}

/**
 * Approuver, refuser ou révoquer un compte formateur.
 * Passe par la fonction `security definer` : `profiles` est en écriture interdite
 * au client, un update direct échouerait.
 */
export async function deciderFormateur(
  userId: string,
  decision: StatutCompte,
  motif?: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.rpc('decider_formateur', {
    p_user_id: userId,
    p_decision: decision,
    p_motif: motif ?? null
  });
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: toujours la seule erreur sur `AdminView` manquant (tâche 7).

---

## Task 7: Vue d'administration

**Files:**
- Create: `src/components/admin/AdminView.tsx`

**Interfaces:**
- Consumes: `ProfilAdmin`, `fetchProfils`, `deciderFormateur` (tâche 6).
- Produces: `AdminView` (export nommé), consommé par `App.tsx` (tâche 5).

- [ ] **Step 1: Créer `src/components/admin/AdminView.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldAlert, XCircle } from 'lucide-react';
import { deciderFormateur, fetchProfils, ProfilAdmin } from '../../services/adminService';
import type { StatutCompte } from '../../services/profile';

interface AdminViewProps {
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

const LIBELLE_STATUT: Record<StatutCompte, string> = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  refuse: 'Refusé'
};

const CLASSE_STATUT: Record<StatutCompte, string> = {
  en_attente: 'bg-amber-50 text-amber-800 border-amber-200',
  approuve: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  refuse: 'bg-red-50 text-red-800 border-red-200'
};

export const AdminView: React.FC<AdminViewProps> = ({ showNotification }) => {
  const [profils, setProfils] = useState<ProfilAdmin[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  // Refus en ligne plutôt qu'un window.prompt : une boîte de dialogue native bloque
  // la page, ne se teste pas et jure avec le reste de l'application.
  const [refusPour, setRefusPour] = useState<string | null>(null);
  const [motifSaisi, setMotifSaisi] = useState('');

  const recharger = () => {
    setChargement(true);
    fetchProfils()
      .then((p) => {
        setProfils(p);
        setErreur(null);
      })
      .catch((e) => setErreur(e instanceof Error ? e.message : String(e)))
      .finally(() => setChargement(false));
  };

  useEffect(recharger, []);

  const decider = async (profil: ProfilAdmin, decision: StatutCompte, motif?: string) => {
    setEnCours(profil.userId);
    try {
      await deciderFormateur(profil.userId, decision, motif);
      showNotification(`Compte ${profil.email} : ${LIBELLE_STATUT[decision].toLowerCase()}.`, 'success');
      setRefusPour(null);
      setMotifSaisi('');
      recharger();
    } catch (e) {
      showNotification(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setEnCours(null);
    }
  };

  const formateurs = profils.filter((p) => p.role === 'formateur');
  const enAttente = formateurs.filter((p) => p.statut === 'en_attente');
  const traites = formateurs.filter((p) => p.statut !== 'en_attente');

  const ligne = (p: ProfilAdmin) => (
    <li key={p.userId} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-[#1C2459] truncate">{p.email}</div>
        <div className="text-[10px] text-slate-400">
          Inscrit le {new Date(p.creeLe).toLocaleDateString('fr-FR')}
          {p.decideLe && ` · décidé le ${new Date(p.decideLe).toLocaleDateString('fr-FR')}`}
          {p.motifRefus && ` · motif : ${p.motifRefus}`}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${CLASSE_STATUT[p.statut]}`}>
          {LIBELLE_STATUT[p.statut]}
        </span>
        {enCours === p.userId ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <>
            {p.statut !== 'approuve' && (
              <button
                onClick={() => decider(p, 'approuve')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#149D92] hover:bg-[#11857c] text-white text-[11px] font-semibold rounded transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approuver
              </button>
            )}
            {p.statut !== 'refuse' && (
              <button
                onClick={() => {
                  setRefusPour(p.userId);
                  setMotifSaisi('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-red-300 text-red-700 hover:bg-red-50 text-[11px] font-semibold rounded transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Refuser
              </button>
            )}
            {p.statut === 'approuve' && (
              <button
                onClick={() => decider(p, 'en_attente')}
                className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
              >
                Révoquer
              </button>
            )}
          </>
        )}
      </div>

      {refusPour === p.userId && (
        <div className="w-full mt-2 flex flex-wrap items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <input
            type="text"
            value={motifSaisi}
            onChange={(e) => setMotifSaisi(e.target.value)}
            placeholder="Motif du refus (affiché au formateur)"
            className="flex-1 min-w-[12rem] px-2 py-1 text-[11px] border border-red-200 rounded"
          />
          <button
            onClick={() => decider(p, 'refuse', motifSaisi.trim() || undefined)}
            className="px-2.5 py-1 bg-[#D64545] hover:bg-[#b93a3a] text-white text-[11px] font-semibold rounded transition-colors"
          >
            Confirmer le refus
          </button>
          <button
            onClick={() => setRefusPour(null)}
            className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
          >
            Annuler
          </button>
        </div>
      )}
    </li>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-[#149D92]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1C2459]">Administration</h1>
            <p className="text-xs text-slate-500">
              Approuver, refuser ou révoquer les comptes formateurs de l'établissement
            </p>
          </div>
        </div>
        <p className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
          Une révocation ne supprime rien : le formateur perd l'accès et retombe sur l'écran
          d'attente. Ses groupes, ses stagiaires et leur travail restent en base.
        </p>
      </div>

      {chargement && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[#1C2459]" />
        </div>
      )}

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-xs">{erreur}</div>
      )}

      {!chargement && !erreur && (
        <>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1C2459] mb-2">
              Demandes en attente ({enAttente.length})
            </h2>
            {enAttente.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucune demande en attente.</p>
            ) : (
              <ul className="divide-y divide-slate-100">{enAttente.map(ligne)}</ul>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1C2459] mb-2">
              Comptes formateurs ({traites.length})
            </h2>
            {traites.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun compte formateur traité pour le moment.</p>
            ) : (
              <ul className="divide-y divide-slate-100">{traites.map(ligne)}</ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur. L'erreur de la tâche 5 sur l'import manquant disparaît ici.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build réussi.

- [ ] **Step 4: Commit (tâches 5, 6 et 7 ensemble)**

```bash
git add src/App.tsx src/services/adminService.ts src/components/admin/AdminView.tsx
git commit -m "feat(admin): add an administration view to approve and revoke trainers"
```

---

## Task 8: État vide de la liste des remises

**Files:**
- Modify: `src/components/trainer/TrainerView.tsx:442-449`

**Interfaces:**
- Consumes: rien des tâches précédentes.
- Produces: rien.

Avec le cloisonnement désormais actif en base, un formateur fraîchement approuvé dont aucun
stagiaire n'a rejoint ses groupes voit une liste vide. « Aucune remise pour le moment » lui
laisserait croire à une panne.

- [ ] **Step 1: Corriger la phrase d'introduction**

Remplacer :

```tsx
          <p className="text-slate-600">
            Les missions soumises par tous les stagiaires connectés à ce projet apparaissent ici automatiquement, sans import manuel.
          </p>
```

par :

```tsx
          <p className="text-slate-600">
            Les missions soumises par les stagiaires de vos groupes apparaissent ici automatiquement, sans import manuel.
          </p>
```

La phrase actuelle est devenue fausse : un formateur ne voit plus « tous les stagiaires
connectés à ce projet », mais les siens.

- [ ] **Step 2: Expliciter l'état vide**

Remplacer :

```tsx
          {!chargementLive && tentativesLive.length === 0 && !erreurLive && (
            <p className="text-slate-400 italic">Aucune remise pour le moment.</p>
          )}
```

par :

```tsx
          {!chargementLive && tentativesLive.length === 0 && !erreurLive && (
            <p className="text-slate-400 italic">
              Aucune remise pour le moment. Si aucun stagiaire n'a encore rejoint vos groupes,
              communiquez-leur le code d'invitation de votre classe.
            </p>
          )}
```

- [ ] **Step 3: Typecheck et commit**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

```bash
git add src/components/trainer/TrainerView.tsx
git commit -m "feat(trainer): explain the empty submissions list after isolation"
```

---

## Task 9: Vérification finale

**Files:** aucun fichier modifié — tâche de vérification.

- [ ] **Step 1: Vérification de compilation**

Run: `npx tsc --noEmit && npm run build`
Expected: les deux réussissent sans erreur.

- [ ] **Step 2: Revue des 5 points du Review Focus**

Reparcourir chacun des cinq points de la section **Review Focus** et confirmer le
comportement, en priorité celui de l'admin : connecté en `admin`, les onglets
**Administration**, **Espace Formateur** et **Discipline & Licenciement** doivent tous être
visibles.

- [ ] **Step 3: Scénario à trois comptes dans le navigateur**

C'est l'étape qui prouve le lot ; elle ne se remplace pas par une lecture du code.

1. **Formateur en attente** — s'inscrire avec un e-mail neuf en choisissant « formateur ».
   Attendu : la mention de validation s'affiche au moment de l'inscription, puis l'écran
   « Compte en attente de validation » après connexion, sans aucun onglet.
2. **Admin** — se connecter avec `ezzouhir2122@gmail.com`. Attendu : l'onglet
   Administration liste la demande ; l'approuver ; vérifier que le formateur entre ensuite
   dans l'application ; le révoquer ; vérifier qu'il retombe sur l'écran d'attente au
   rechargement.
3. **Cloisonnement** — avec deux formateurs approuvés et un stagiaire rattaché à la classe
   du premier, vérifier dans l'Espace Formateur que le second ne voit pas la remise du
   stagiaire du premier, et que l'admin, lui, la voit.

- [ ] **Step 4: Déployer**

```bash
git push origin main
```

Le déploiement de production se déclenche automatiquement depuis GitHub (la CLI Vercel
n'est pas authentifiée sur cette machine). Vérifier ensuite sur
`https://mon-dossier-grh.vercel.app` que l'onglet Administration apparaît pour le compte
admin.

La migration SQL étant déjà appliquée, aucune action base de données n'est requise.

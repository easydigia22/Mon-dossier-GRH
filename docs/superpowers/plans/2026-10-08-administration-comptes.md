# Administration des comptes — Plan d'implémentation (lot B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'administrateur de désactiver, réactiver et supprimer n'importe quel
compte, et de confier les groupes d'un formateur à un autre.

**Architecture:** Quatre fonctions `security definer` prolongent le mécanisme de
`decider_formateur` déjà en place ; aucune Edge Function. `adminService.ts` les expose,
et `AdminView.tsx` éclate en quatre fichiers courts plutôt que de doubler de taille.

**Tech Stack:** React 19 + TypeScript, Supabase (RLS + RPC `security definer`), Tailwind.
Pas de suite de tests dans ce dépôt — voir Global Constraints.

**Spec:** `docs/superpowers/specs/2026-10-07-administration-comptes-design.md`

**Prérequis :** le lot A est livré et sa migration appliquée (vérifié : `profiles` a ses
8 colonnes, `is_admin` et `decider_formateur` existent, les 3 politiques sur `tentatives`
sont en place).

## Global Constraints

- Ce dépôt n'a **aucune suite de tests automatisés**. Ne pas introduire vitest/jest.
  Vérification par `npx tsc --noEmit`, `npm run build`, et contrôle visuel au navigateur.
- `npx tsc --noEmit` doit rester sans erreur après chaque tâche ; `npm run build` après la
  dernière.
- Couleurs de marque : `#1C2459` (primaire), `#149D92` (accent), `#D64545` (danger).
  Aucune autre teinte.
- Toutes les chaînes visibles sont en français.
- Les écritures sur `profiles`, `classes` et `classe_stagiaires` passent **exclusivement**
  par les fonctions `security definer`. Aucun `update` ni `delete` direct depuis le client :
  ces tables lui sont interdites en écriture, la requête échouerait sans erreur visible.
- Aucune boîte de dialogue native (`window.confirm`, `window.prompt`) : elles bloquent la
  page et ne se testent pas. Les confirmations sont des panneaux en ligne.
- La migration SQL de ce lot **n'est pas appliquée par l'implémenteur**. Elle est livrée en
  fichier ; l'utilisateur l'exécute lui-même, après le déploiement applicatif.
- Ne jamais committer sans que `tsc --noEmit` soit passé pour ce commit.

## Review Focus

- **L'admin agit sur lui-même.** Les quatre fonctions doivent refuser une cible `admin`, et
  `supprimer_compte` doit en plus refuser `auth.uid()`. Si une seule de ces gardes manque,
  l'établissement peut se retrouver sans administrateur, sans aucun moyen de revenir en
  arrière depuis l'application.
- **Réaffectation vers un identifiant de groupe déjà pris.** `classes` a pour clé primaire
  `(user_id, id)` : si le formateur destinataire possède déjà un groupe du même `id`, le
  `update` viole la clé. La fonction doit le détecter et le dire, pas laisser remonter une
  erreur Postgres brute.
- **Réaffectation partielle.** Déplacer la ligne de `classes` sans déplacer
  `classe_stagiaires` laisse les stagiaires rattachés à un formateur qui ne possède plus la
  classe — ils disparaissent de la vue des deux. Les deux `update` dans la même fonction,
  donc la même transaction.
- **Suppression d'un compte déjà supprimé** (deux onglets, liste périmée). `delete` sur zéro
  ligne ne lève pas d'erreur : sans contrôle explicite, l'interface annoncerait une
  suppression qui n'a pas eu lieu — exactement le piège qui a coûté un défaut critique au
  lot A.
- **Stagiaire désactivé.** `AuthGate` ne teste aujourd'hui le statut que pour un formateur.
  Si la garde n'est pas élargie à tous les rôles, désactiver un stagiaire n'a strictement
  aucun effet : il continue d'entrer dans l'application.

---

## Task 1: Migration SQL

**Files:**
- Create: `supabase/migrations/20261008000000_administration_comptes.sql`

**Interfaces:**
- Produces: les RPC `desactiver_compte`, `reaffecter_groupe`, `apercu_suppression`,
  `supprimer_compte`, et les politiques `admin_read_classes` / `admin_read_roster` —
  consommées par la tâche 2.

- [ ] **Step 1: Créer le fichier de migration**

```sql
-- Administration des comptes (lot B) : désactivation, réaffectation de groupe,
-- suppression définitive.
-- Spec : docs/superpowers/specs/2026-10-07-administration-comptes-design.md
--
-- Aucune Edge Function : vérifié sur ce projet,
-- has_table_privilege('postgres', 'auth.users', 'DELETE') = true.
--
-- Idempotente : peut être réexécutée sans dommage.

-- 1. Quatrième état possible d'un compte
alter table public.profiles drop constraint if exists profiles_statut_check;
alter table public.profiles add constraint profiles_statut_check
  check (statut in ('en_attente', 'approuve', 'refuse', 'desactive'));

-- 2. Lectures de l'admin sur les groupes et les rattachements.
-- Les écritures passent par les fonctions ci-dessous, jamais par une policy.
drop policy if exists "admin_read_classes" on public.classes;
create policy "admin_read_classes" on public.classes
  for select to authenticated
  using (public.is_admin());

drop policy if exists "admin_read_roster" on public.classe_stagiaires;
create policy "admin_read_roster" on public.classe_stagiaires
  for select to authenticated
  using (public.is_admin());

-- 3. Désactiver / réactiver
create or replace function public.desactiver_compte(p_user_id uuid, p_desactive boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administrateur.';
  end if;

  select role into v_role from public.profiles where user_id = p_user_id;
  if v_role is null then
    raise exception 'Compte introuvable.';
  end if;
  if v_role = 'admin' then
    raise exception 'Un compte administrateur ne peut pas être désactivé.';
  end if;

  -- La réactivation remet en 'approuve', jamais en 'en_attente' :
  -- désactiver vaut décision.
  update public.profiles
     set statut      = case when p_desactive then 'desactive' else 'approuve' end,
         motif_refus = null,
         decide_par  = auth.uid(),
         decide_le   = now()
   where user_id = p_user_id;
end;
$$;

-- 4. Confier un groupe à un autre formateur
create or replace function public.reaffecter_groupe(
  p_classe_id text,
  p_ancien    uuid,
  p_nouveau   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administrateur.';
  end if;

  if not exists (
    select 1 from public.profiles
    where user_id = p_nouveau and role = 'formateur' and statut = 'approuve'
  ) then
    raise exception 'Le formateur destinataire doit être un formateur approuvé.';
  end if;

  -- `classes` a pour clé primaire (user_id, id) : un identifiant déjà pris chez le
  -- destinataire ferait échouer l'update sur une violation de clé illisible.
  if exists (select 1 from public.classes where user_id = p_nouveau and id = p_classe_id) then
    raise exception 'Le formateur destinataire possède déjà un groupe portant cet identifiant.';
  end if;

  update public.classes
     set user_id = p_nouveau, updated_at = now()
   where user_id = p_ancien and id = p_classe_id;

  if not found then
    raise exception 'Groupe introuvable chez ce formateur.';
  end if;

  -- Indissociable du déplacement ci-dessus : sans cela les stagiaires resteraient
  -- rattachés à un formateur qui ne possède plus la classe.
  update public.classe_stagiaires
     set classe_user_id = p_nouveau
   where classe_user_id = p_ancien and classe_id = p_classe_id;
end;
$$;

-- 5. Ce qu'une suppression détruirait (lecture seule)
create or replace function public.apercu_suppression(p_user_id uuid)
returns table (groupes bigint, stagiaires_detaches bigint, bulletins bigint, remises bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administrateur.';
  end if;

  return query
    select (select count(*) from public.classes           where user_id       = p_user_id),
           (select count(*) from public.classe_stagiaires where classe_user_id = p_user_id),
           (select count(*) from public.bulletins         where user_id       = p_user_id),
           (select count(*) from public.tentatives        where user_id       = p_user_id);
end;
$$;

-- 6. Suppression définitive
create or replace function public.supprimer_compte(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administrateur.';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Vous ne pouvez pas supprimer votre propre compte.';
  end if;

  select role into v_role from public.profiles where user_id = p_user_id;
  if v_role = 'admin' then
    raise exception 'Un compte administrateur ne peut pas être supprimé depuis l''application.';
  end if;

  -- Les 10 tables applicatives, `profiles` et `classe_stagiaires` référencent toutes
  -- auth.users en `on delete cascade` : cette ligne suffit à tout effacer.
  delete from auth.users where id = p_user_id;

  -- Un delete sur zéro ligne ne lève pas d'erreur : sans ce contrôle, l'interface
  -- annoncerait une suppression qui n'a pas eu lieu.
  if not found then
    raise exception 'Compte introuvable.';
  end if;
end;
$$;

revoke all on function public.desactiver_compte(uuid, boolean) from public;
revoke all on function public.reaffecter_groupe(text, uuid, uuid) from public;
revoke all on function public.apercu_suppression(uuid) from public;
revoke all on function public.supprimer_compte(uuid) from public;

grant execute on function public.desactiver_compte(uuid, boolean) to authenticated;
grant execute on function public.reaffecter_groupe(text, uuid, uuid) to authenticated;
grant execute on function public.apercu_suppression(uuid) to authenticated;
grant execute on function public.supprimer_compte(uuid) to authenticated;
```

- [ ] **Step 2: Relire les cinq gardes du Review Focus dans le fichier**

Vérifier à l'œil, sans exécuter : `desactiver_compte` refuse `admin` ;
`supprimer_compte` refuse `admin` **et** `auth.uid()` ; `reaffecter_groupe` teste la
collision d'identifiant avant l'`update` ; les deux `update` de `reaffecter_groupe` sont
dans la même fonction ; `supprimer_compte` teste `not found`.

Expected: les cinq présentes. Si l'une manque, l'ajouter maintenant.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20261008000000_administration_comptes.sql
git commit -m "feat(db): add account administration functions and admin read policies"
```

Ne pas exécuter cette migration : elle est livrée en fichier, l'utilisateur l'applique
lui-même après le déploiement applicatif.

---

## Task 2: Service d'administration

**Files:**
- Modify: `src/services/adminService.ts`

**Interfaces:**
- Consumes: les RPC de la tâche 1 ; `StatutCompte`, `UserRole` de `profile.ts`.
- Produces: `CompteAdmin`, `ClasseAdmin`, `ApercuSuppression`, `fetchComptes`,
  `fetchClassesDe`, `desactiverCompte`, `reaffecterGroupe`, `apercuSuppression`,
  `supprimerCompte` — consommés par les tâches 4, 5 et 6.
  `ProfilAdmin`, `fetchProfils` et `deciderFormateur` restent inchangés.

- [ ] **Step 1: Ajouter les types et les appels en fin de `src/services/adminService.ts`**

```ts
/** Un groupe tel que l'admin le voit (policy `admin_read_classes`). */
export interface ClasseAdmin {
  userId: string;
  id: string;
  nom: string;
}

/** Un compte dans la liste d'administration, enrichi de son contexte. */
export interface CompteAdmin extends ProfilAdmin {
  /** Formateurs : nombre de groupes possédés. */
  nbGroupes?: number;
  /** Stagiaires : nom de la classe rejointe, si elle est lisible. */
  classeRejointe?: string;
}

export interface ApercuSuppression {
  groupes: number;
  stagiairesDetaches: number;
  bulletins: number;
  remises: number;
}

/**
 * Tous les comptes, enrichis : nombre de groupes pour un formateur, classe
 * rejointe pour un stagiaire. Trois lectures assemblées côté client — le volume
 * attendu est de quelques dizaines de comptes.
 */
export async function fetchComptes(): Promise<CompteAdmin[]> {
  if (!supabase) return [];

  const [profils, classes, rattachements] = await Promise.all([
    fetchProfils(),
    supabase.from('classes').select('user_id, id, data'),
    supabase.from('classe_stagiaires').select('stagiaire_user_id, classe_user_id, classe_id')
  ]);

  if (classes.error) throw classes.error;
  if (rattachements.error) throw rattachements.error;

  const lignesClasses = classes.data ?? [];
  const nomDeClasse = new Map<string, string>(
    lignesClasses.map((c) => [`${c.user_id}|${c.id}`, (c.data as { nom?: string })?.nom ?? 'Groupe sans nom'])
  );
  const nbGroupesPar = new Map<string, number>();
  lignesClasses.forEach((c) => nbGroupesPar.set(c.user_id, (nbGroupesPar.get(c.user_id) ?? 0) + 1));

  const classeDuStagiaire = new Map<string, string>(
    (rattachements.data ?? []).map((r) => [
      r.stagiaire_user_id,
      nomDeClasse.get(`${r.classe_user_id}|${r.classe_id}`) ?? 'Classe inconnue'
    ])
  );

  return profils.map((p) => ({
    ...p,
    nbGroupes: p.role === 'formateur' ? nbGroupesPar.get(p.userId) ?? 0 : undefined,
    classeRejointe: p.role === 'stagiaire' ? classeDuStagiaire.get(p.userId) : undefined
  }));
}

/** Les groupes d'un formateur, pour le panneau de réaffectation. */
export async function fetchClassesDe(userId: string): Promise<ClasseAdmin[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('classes').select('user_id, id, data').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((c) => ({
    userId: c.user_id,
    id: c.id,
    nom: (c.data as { nom?: string })?.nom ?? 'Groupe sans nom'
  }));
}

export async function desactiverCompte(userId: string, desactive: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.rpc('desactiver_compte', {
    p_user_id: userId,
    p_desactive: desactive
  });
  if (error) throw new Error(error.message);
}

export async function reaffecterGroupe(classeId: string, ancien: string, nouveau: string): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.rpc('reaffecter_groupe', {
    p_classe_id: classeId,
    p_ancien: ancien,
    p_nouveau: nouveau
  });
  if (error) throw new Error(error.message);
}

export async function apercuSuppression(userId: string): Promise<ApercuSuppression> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { data, error } = await supabase.rpc('apercu_suppression', { p_user_id: userId });
  if (error) throw new Error(error.message);
  const l = (data ?? [])[0] ?? {};
  return {
    groupes: Number(l.groupes ?? 0),
    stagiairesDetaches: Number(l.stagiaires_detaches ?? 0),
    bulletins: Number(l.bulletins ?? 0),
    remises: Number(l.remises ?? 0)
  };
}

export async function supprimerCompte(userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.rpc('supprimer_compte', { p_user_id: userId });
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/services/adminService.ts
git commit -m "feat(admin): expose the account administration calls"
```

---

## Task 3: Blocage des comptes désactivés

**Files:**
- Modify: `src/services/profile.ts` (type `StatutCompte`)
- Modify: `src/components/auth/AuthGate.tsx` (garde et écran)

**Interfaces:**
- Produces: `StatutCompte` élargi à `'desactive'` — consommé par les tâches 2, 4, 5, 6.

- [ ] **Step 1: Élargir le type**

Dans `src/services/profile.ts`, remplacer :

```ts
export type StatutCompte = 'en_attente' | 'approuve' | 'refuse';
```

par :

```ts
export type StatutCompte = 'en_attente' | 'approuve' | 'refuse' | 'desactive';
```

- [ ] **Step 2: Bloquer tout rôle désactivé**

Dans `src/components/auth/AuthGate.tsx`, le bloc existant ne teste le statut que pour un
formateur. Insérer la garde générale **avant** lui, juste après le bloc
`if (profil?.profilAbsent) { … }` :

```tsx
    if (profil?.statut === 'desactive') {
      return (
        <EcranBloquant
          titre="Compte désactivé"
          message="Votre compte a été désactivé par l'administrateur de l'établissement. Contactez-le si vous pensez qu'il s'agit d'une erreur."
          email={session.user.email}
          onSignOut={signOut}
        />
      );
    }
```

Elle précède la garde du formateur non approuvé, et vaut pour tous les rôles : sans elle,
désactiver un stagiaire n'aurait aucun effet, puisque rien ne teste son statut.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/services/profile.ts src/components/auth/AuthGate.tsx
git commit -m "feat(auth): block deactivated accounts whatever their role"
```

---

## Task 4: Éclatement de AdminView et liste des comptes

**Files:**
- Create: `src/components/admin/LigneCompte.tsx`
- Modify: `src/components/admin/AdminView.tsx` (réécriture complète)

**Interfaces:**
- Consumes: `CompteAdmin`, `fetchComptes`, `desactiverCompte` (tâche 2) ;
  `ConfirmationSuppression` (tâche 5) et `ReaffectationGroupes` (tâche 6).
- Produces: `LigneCompte` et ses props — consommé par `AdminView` seul.

Cette tâche crée `AdminView` dans sa forme finale, qui importe deux composants que les
tâches 5 et 6 créent. Le projet ne compile donc qu'à l'issue de la tâche 6 : les
tâches 4, 5 et 6 se committent ensemble.

- [ ] **Step 1: Créer `src/components/admin/LigneCompte.tsx`**

```tsx
import React from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { CompteAdmin } from '../../services/adminService';
import type { StatutCompte } from '../../services/profile';

export const LIBELLE_STATUT: Record<StatutCompte, string> = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  refuse: 'Refusé',
  desactive: 'Désactivé'
};

export const CLASSE_STATUT: Record<StatutCompte, string> = {
  en_attente: 'bg-amber-50 text-amber-800 border-amber-200',
  approuve: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  refuse: 'bg-red-50 text-red-800 border-red-200',
  desactive: 'bg-slate-100 text-slate-600 border-slate-300'
};

interface LigneCompteProps {
  compte: CompteAdmin;
  occupe: boolean;
  onApprouver?: () => void;
  onRefuser?: () => void;
  onRevoquer?: () => void;
  onDesactiver: (desactive: boolean) => void;
  onReaffecter?: () => void;
  onSupprimer: () => void;
  /** Panneau ouvert sous la ligne (suppression ou réaffectation). */
  panneau?: React.ReactNode;
}

export const LigneCompte: React.FC<LigneCompteProps> = ({
  compte,
  occupe,
  onApprouver,
  onRefuser,
  onRevoquer,
  onDesactiver,
  onReaffecter,
  onSupprimer,
  panneau
}) => {
  const desactive = compte.statut === 'desactive';

  return (
    <li className="py-2.5 flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-[#1C2459] truncate">{compte.email}</div>
        <div className="text-[10px] text-slate-400">
          Inscrit le {new Date(compte.creeLe).toLocaleDateString('fr-FR')}
          {compte.nbGroupes !== undefined && ` · ${compte.nbGroupes} groupe(s)`}
          {compte.classeRejointe && ` · ${compte.classeRejointe}`}
          {compte.motifRefus && ` · motif : ${compte.motifRefus}`}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${CLASSE_STATUT[compte.statut]}`}>
          {LIBELLE_STATUT[compte.statut]}
        </span>

        {occupe ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <>
            {onApprouver && (
              <button
                onClick={onApprouver}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#149D92] hover:bg-[#11857c] text-white text-[11px] font-semibold rounded transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approuver
              </button>
            )}
            {onRefuser && (
              <button
                onClick={onRefuser}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-red-300 text-red-700 hover:bg-red-50 text-[11px] font-semibold rounded transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Refuser
              </button>
            )}
            {onRevoquer && (
              <button
                onClick={onRevoquer}
                className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
              >
                Révoquer
              </button>
            )}
            {onReaffecter && (
              <button
                onClick={onReaffecter}
                className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
              >
                Réaffecter un groupe
              </button>
            )}
            <button
              onClick={() => onDesactiver(!desactive)}
              className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
            >
              {desactive ? 'Réactiver' : 'Désactiver'}
            </button>
            {/* En retrait : la suppression ne sert qu'aux effacements et aux erreurs. */}
            <button
              onClick={onSupprimer}
              className="px-2.5 py-1 text-[11px] font-semibold text-[#D64545] hover:underline"
            >
              Supprimer
            </button>
          </>
        )}
      </div>

      {panneau}
    </li>
  );
};
```

- [ ] **Step 2: Réécrire `src/components/admin/AdminView.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import {
  CompteAdmin,
  deciderFormateur,
  desactiverCompte,
  fetchComptes
} from '../../services/adminService';
import type { StatutCompte } from '../../services/profile';
import { LigneCompte } from './LigneCompte';
import { ConfirmationSuppression } from './ConfirmationSuppression';
import { ReaffectationGroupes } from './ReaffectationGroupes';

interface AdminViewProps {
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

type Panneau = { type: 'suppression' | 'reaffectation' | 'refus'; userId: string } | null;

export const AdminView: React.FC<AdminViewProps> = ({ showNotification }) => {
  const [comptes, setComptes] = useState<CompteAdmin[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [motifSaisi, setMotifSaisi] = useState('');

  const recharger = () => {
    setChargement(true);
    fetchComptes()
      .then((c) => {
        setComptes(c);
        setErreur(null);
      })
      .catch((e) => setErreur(e instanceof Error ? e.message : String(e)))
      .finally(() => setChargement(false));
  };

  useEffect(recharger, []);

  const agir = async (compte: CompteAdmin, action: () => Promise<void>, message: string) => {
    setOccupe(compte.userId);
    try {
      await action();
      showNotification(message, 'success');
      setPanneau(null);
      setMotifSaisi('');
      recharger();
    } catch (e) {
      showNotification(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setOccupe(null);
    }
  };

  const decider = (compte: CompteAdmin, decision: StatutCompte, motif?: string) =>
    agir(
      compte,
      () => deciderFormateur(compte.userId, decision, motif),
      `Compte ${compte.email} : décision enregistrée.`
    );

  const basculer = (compte: CompteAdmin, desactive: boolean) =>
    agir(
      compte,
      () => desactiverCompte(compte.userId, desactive),
      `Compte ${compte.email} : ${desactive ? 'désactivé' : 'réactivé'}.`
    );

  const formateurs = comptes.filter((c) => c.role === 'formateur');
  const enAttente = formateurs.filter((c) => c.statut === 'en_attente');
  const formateursTraites = formateurs.filter((c) => c.statut !== 'en_attente');
  const stagiaires = comptes.filter((c) => c.role === 'stagiaire');
  const formateursApprouves = formateurs.filter((c) => c.statut === 'approuve');

  const panneauDe = (compte: CompteAdmin): React.ReactNode => {
    if (panneau?.userId !== compte.userId) return null;

    if (panneau.type === 'refus') {
      return (
        <div className="w-full mt-2 flex flex-wrap items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <input
            type="text"
            value={motifSaisi}
            onChange={(e) => setMotifSaisi(e.target.value)}
            placeholder="Motif du refus (affiché au formateur)"
            className="flex-1 min-w-[12rem] px-2 py-1 text-[11px] border border-red-200 rounded"
          />
          <button
            onClick={() => decider(compte, 'refuse', motifSaisi.trim() || undefined)}
            className="px-2.5 py-1 bg-[#D64545] hover:bg-[#b93a3a] text-white text-[11px] font-semibold rounded transition-colors"
          >
            Confirmer le refus
          </button>
          <button
            onClick={() => setPanneau(null)}
            className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
          >
            Annuler
          </button>
        </div>
      );
    }

    if (panneau.type === 'suppression') {
      return (
        <ConfirmationSuppression
          compte={compte}
          onAnnuler={() => setPanneau(null)}
          onSupprime={() => {
            showNotification(`Compte ${compte.email} supprimé définitivement.`, 'success');
            setPanneau(null);
            recharger();
          }}
          onErreur={(m) => showNotification(m, 'error')}
        />
      );
    }

    return (
      <ReaffectationGroupes
        formateur={compte}
        destinataires={formateursApprouves.filter((f) => f.userId !== compte.userId)}
        onAnnuler={() => setPanneau(null)}
        onReaffecte={(nom) => {
          showNotification(`Groupe « ${nom} » réaffecté.`, 'success');
          setPanneau(null);
          recharger();
        }}
        onErreur={(m) => showNotification(m, 'error')}
      />
    );
  };

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
              Comptes de l'établissement : approbation, désactivation, groupes et suppression
            </p>
          </div>
        </div>
        <p className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
          La désactivation est réversible et ne supprime rien. La suppression, elle, est
          définitive : elle efface le compte et toutes ses données, sans récupération possible.
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
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1C2459] mb-2">
              Demandes en attente ({enAttente.length})
            </h2>
            {enAttente.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucune demande en attente.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {enAttente.map((c) => (
                  <LigneCompte
                    key={c.userId}
                    compte={c}
                    occupe={occupe === c.userId}
                    onApprouver={() => decider(c, 'approuve')}
                    onRefuser={() => {
                      setMotifSaisi('');
                      setPanneau({ type: 'refus', userId: c.userId });
                    }}
                    onDesactiver={(d) => basculer(c, d)}
                    onSupprimer={() => setPanneau({ type: 'suppression', userId: c.userId })}
                    panneau={panneauDe(c)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1C2459] mb-2">
              Formateurs ({formateursTraites.length})
            </h2>
            {formateursTraites.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun compte formateur traité pour le moment.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {formateursTraites.map((c) => (
                  <LigneCompte
                    key={c.userId}
                    compte={c}
                    occupe={occupe === c.userId}
                    onRevoquer={c.statut === 'approuve' ? () => decider(c, 'en_attente') : undefined}
                    onReaffecter={
                      (c.nbGroupes ?? 0) > 0
                        ? () => setPanneau({ type: 'reaffectation', userId: c.userId })
                        : undefined
                    }
                    onDesactiver={(d) => basculer(c, d)}
                    onSupprimer={() => setPanneau({ type: 'suppression', userId: c.userId })}
                    panneau={panneauDe(c)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1C2459] mb-2">Stagiaires ({stagiaires.length})</h2>
            {stagiaires.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun compte stagiaire.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stagiaires.map((c) => (
                  <LigneCompte
                    key={c.userId}
                    compte={c}
                    occupe={occupe === c.userId}
                    onDesactiver={(d) => basculer(c, d)}
                    onSupprimer={() => setPanneau({ type: 'suppression', userId: c.userId })}
                    panneau={panneauDe(c)}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: deux erreurs attendues, sur les imports de `./ConfirmationSuppression` et
`./ReaffectationGroupes`, créés aux tâches 5 et 6. Aucune autre. Ne pas committer ici.

---

## Task 5: Panneau de suppression

**Files:**
- Create: `src/components/admin/ConfirmationSuppression.tsx`

**Interfaces:**
- Consumes: `CompteAdmin`, `ApercuSuppression`, `apercuSuppression`, `supprimerCompte`
  (tâche 2).
- Produces: `ConfirmationSuppression` — consommé par `AdminView` (tâche 4).

- [ ] **Step 1: Créer le composant**

```tsx
import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { apercuSuppression, ApercuSuppression, CompteAdmin, supprimerCompte } from '../../services/adminService';

interface ConfirmationSuppressionProps {
  compte: CompteAdmin;
  onAnnuler: () => void;
  onSupprime: () => void;
  onErreur: (message: string) => void;
}

export const ConfirmationSuppression: React.FC<ConfirmationSuppressionProps> = ({
  compte,
  onAnnuler,
  onSupprime,
  onErreur
}) => {
  const [apercu, setApercu] = useState<ApercuSuppression | null>(null);
  const [saisie, setSaisie] = useState('');
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    apercuSuppression(compte.userId)
      .then(setApercu)
      .catch((e) => onErreur(e instanceof Error ? e.message : String(e)));
    // L'aperçu ne dépend que du compte visé.
  }, [compte.userId]);

  // Recopier l'adresse oblige à regarder quelle ligne on vise : c'est la protection
  // contre l'erreur réelle, supprimer le mauvais compte d'une liste.
  const confirme = saisie.trim().toLowerCase() === compte.email.toLowerCase();

  const supprimer = async () => {
    setOccupe(true);
    try {
      await supprimerCompte(compte.userId);
      onSupprime();
    } catch (e) {
      onErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div className="w-full mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-3 space-y-2">
      <div className="flex items-start gap-2 text-[11px] text-red-900">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Suppression définitive, sans retour possible.</p>
          {apercu === null ? (
            <p className="text-red-700">Calcul de ce qui sera effacé…</p>
          ) : (
            <p className="text-red-700">
              Seront effacés : {apercu.groupes} groupe(s), {apercu.bulletins} bulletin(s),{' '}
              {apercu.remises} remise(s).
              {apercu.stagiairesDetaches > 0 &&
                ` ${apercu.stagiairesDetaches} stagiaire(s) seront détachés et devront rejoindre une autre classe.`}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder={`Saisissez ${compte.email} pour confirmer`}
          className="flex-1 min-w-[16rem] px-2 py-1 text-[11px] border border-red-200 rounded"
        />
        {occupe ? (
          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
        ) : (
          <>
            <button
              onClick={supprimer}
              disabled={!confirme}
              className="px-2.5 py-1 bg-[#D64545] hover:bg-[#b93a3a] text-white text-[11px] font-semibold rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Supprimer définitivement
            </button>
            <button
              onClick={onAnnuler}
              className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
            >
              Annuler
            </button>
          </>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: une seule erreur restante, sur `./ReaffectationGroupes` (tâche 6).

---

## Task 6: Panneau de réaffectation

**Files:**
- Create: `src/components/admin/ReaffectationGroupes.tsx`

**Interfaces:**
- Consumes: `CompteAdmin`, `ClasseAdmin`, `fetchClassesDe`, `reaffecterGroupe` (tâche 2).
- Produces: `ReaffectationGroupes` — consommé par `AdminView` (tâche 4).

- [ ] **Step 1: Créer le composant**

```tsx
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ClasseAdmin, CompteAdmin, fetchClassesDe, reaffecterGroupe } from '../../services/adminService';

interface ReaffectationGroupesProps {
  formateur: CompteAdmin;
  /** Formateurs approuvés, hors celui-ci. */
  destinataires: CompteAdmin[];
  onAnnuler: () => void;
  onReaffecte: (nomDuGroupe: string) => void;
  onErreur: (message: string) => void;
}

export const ReaffectationGroupes: React.FC<ReaffectationGroupesProps> = ({
  formateur,
  destinataires,
  onAnnuler,
  onReaffecte,
  onErreur
}) => {
  const [groupes, setGroupes] = useState<ClasseAdmin[] | null>(null);
  const [choix, setChoix] = useState<Record<string, string>>({});
  const [occupe, setOccupe] = useState<string | null>(null);

  useEffect(() => {
    fetchClassesDe(formateur.userId)
      .then(setGroupes)
      .catch((e) => onErreur(e instanceof Error ? e.message : String(e)));
  }, [formateur.userId]);

  const reaffecter = async (groupe: ClasseAdmin) => {
    const destinataire = choix[groupe.id];
    if (!destinataire) return;
    setOccupe(groupe.id);
    try {
      await reaffecterGroupe(groupe.id, formateur.userId, destinataire);
      onReaffecte(groupe.nom);
    } catch (e) {
      onErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(null);
    }
  };

  return (
    <div className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 space-y-2">
      <p className="text-[11px] font-semibold text-[#1C2459]">
        Confier un groupe de {formateur.email} à un autre formateur
      </p>

      {groupes === null && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}

      {groupes?.length === 0 && (
        <p className="text-[11px] text-slate-500 italic">Ce formateur ne possède aucun groupe.</p>
      )}

      {destinataires.length === 0 && (groupes?.length ?? 0) > 0 && (
        <p className="text-[11px] text-slate-500 italic">
          Aucun autre formateur approuvé ne peut recevoir ces groupes.
        </p>
      )}

      {groupes?.map((g) => (
        <div key={g.id} className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-700 flex-1 min-w-[8rem] truncate">{g.nom}</span>
          <select
            value={choix[g.id] ?? ''}
            onChange={(e) => setChoix((c) => ({ ...c, [g.id]: e.target.value }))}
            disabled={destinataires.length === 0}
            className="px-2 py-1 text-[11px] border border-slate-300 rounded disabled:bg-slate-100"
          >
            <option value="">Confier à…</option>
            {destinataires.map((d) => (
              <option key={d.userId} value={d.userId}>
                {d.email}
              </option>
            ))}
          </select>
          {occupe === g.id ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <button
              onClick={() => reaffecter(g)}
              disabled={!choix[g.id]}
              className="px-2.5 py-1 bg-[#149D92] hover:bg-[#11857c] text-white text-[11px] font-semibold rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confier
            </button>
          )}
        </div>
      ))}

      <button
        onClick={onAnnuler}
        className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
      >
        Fermer
      </button>
    </div>
  );
};
```

- [ ] **Step 2: Typecheck et build**

Run: `npx tsc --noEmit && npm run build`
Expected: les deux réussissent. Les erreurs des tâches 4 et 5 ont disparu.

- [ ] **Step 3: Commit (tâches 4, 5 et 6 ensemble)**

```bash
git add src/components/admin/
git commit -m "feat(admin): manage every account, reassign groups, delete for good"
```

---

## Task 7: Vérification finale

**Files:** aucun fichier modifié — tâche de vérification.

- [ ] **Step 1: Compilation**

Run: `npx tsc --noEmit && npm run build`
Expected: les deux réussissent sans erreur.

- [ ] **Step 2: Les cinq points du Review Focus**

Relire le fichier de migration et confirmer les cinq gardes, puis vérifier dans
`AuthGate.tsx` que la garde `statut === 'desactive'` précède celle du formateur et ne
teste aucun rôle.

- [ ] **Step 3: Déployer l'application d'abord**

```bash
git push origin main
```

Le déploiement de production part automatiquement depuis GitHub (la CLI Vercel n'est pas
authentifiée sur cette machine).

**L'ordre compte.** Déployer avant d'appliquer la migration, pas l'inverse : la nouvelle
valeur `desactive` n'apparaîtra en base qu'une fois la migration passée, et l'application
qui la lit doit déjà être en ligne. L'ordre inverse a provoqué une panne au lot A.

- [ ] **Step 4: Appliquer la migration, puis vérifier**

Exécuter `supabase/migrations/20261008000000_administration_comptes.sql` dans le SQL
Editor, **lire la sortie**, puis contrôler :

```sql
select count(*) as fonctions from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('desactiver_compte', 'reaffecter_groupe', 'apercu_suppression', 'supprimer_compte');
```

Expected: `4`.

- [ ] **Step 5: Scénario navigateur sur un compte jetable**

Créer un compte jetable dans Authentication → Users. Le désactiver depuis l'espace admin,
vérifier qu'il bute sur « Compte désactivé » à la connexion, le réactiver, vérifier qu'il
entre. Puis le supprimer : l'aperçu doit afficher des nombres, le bouton doit rester
désactivé tant que l'adresse n'est pas recopiée exactement, et le compte doit disparaître
de `auth.users` et de `profiles`.

**Ne jamais exercer la suppression sur un compte réel.** Elle n'a pas d'annulation ; un
compte jetable est le seul support acceptable.

- [ ] **Step 6: Réaffectation**

Avec deux formateurs approuvés, créer un groupe chez le premier, le confier au second, et
vérifier que le groupe et son roster ont suivi :

```sql
select user_id from public.classes where id = '<id du groupe>';
select classe_user_id from public.classe_stagiaires where classe_id = '<id du groupe>';
```

Expected: les deux renvoient l'identifiant du second formateur.

# Multi-établissements — Conception

**Date :** 2026-10-18
**Statut :** En attente de validation (rien n'est appliqué en prod avant accord)
**Contexte prod :** simulrh.one · Supabase `rwhoezldcnxzkecwcxfq` · déploiement Vercel `mon-dossier-grh`

## 1. Intention & pourquoi

Aujourd'hui SimulRH est un espace unique : le cloisonnement existe **par formateur**
(un formateur ne voit que les stagiaires de ses classes), mais l'**admin est global**
(il voit tous les profils, classes, rosters et tentatives, tous centres confondus), et
`etablissement` n'est qu'un **texte libre** dans `classes.data`.

On veut accueillir **plusieurs centres OFPPT**, chacun isolé : les formateurs, stagiaires,
classes et données d'un centre ne doivent **jamais** être visibles par un autre centre.
L'isolation doit être garantie **en base (RLS)**, pas seulement à l'écran.

## 2. Objectifs / non-objectifs

**Objectifs**
- Un **tenant `etablissement`** réel, référencé par les profils et les classes.
- **Isolation stricte RLS** : un admin/formateur ne voit que SON établissement.
- **Super-admin** (toi) au-dessus de tout : crée/supervise les établissements, valide les
  nouveaux centres, peut agir en transverse.
- **Admin d'établissement** : gère uniquement les formateurs/stagiaires/classes de SON centre.
- **Inscription formateur** : choisir un établissement existant **ou** en créer un nouveau,
  puis validation/rejet.
- **Reprise de l'existant sans rien casser** (migration pilotée par les données, idempotente).

**Non-objectifs**
- Pas de refonte du simulateur de paie ni des modules métier (ils restent par-utilisateur).
- Pas de transfert de stagiaires entre établissements (hors périmètre pour l'instant).
- Pas de facturation / quotas par établissement.

**Anti-objectifs (ce qui serait un échec même si « ça marche »)**
- Qu'un admin d'un centre puisse lire/modifier les comptes ou données d'un autre centre.
- Qu'un formateur approuvé « flotte » sans établissement et devienne invisible/inaccessible.
- Qu'un compte existant se retrouve enfermé dehors après la migration.

## 3. Modèle de données

### 3.1 Nouvelle table `etablissements`
```
id            uuid primary key default gen_random_uuid()
nom           text not null
ville         text
code          text unique            -- code d'adhésion (comme le code de classe)
statut        text not null default 'en_attente'  -- 'en_attente' | 'approuve' | 'refuse'
cree_par      uuid references auth.users(id)       -- formateur créateur, ou super-admin
cree_le       timestamptz not null default now()
```
- `statut` : un établissement **créé par un formateur** naît `en_attente` ; le super-admin
  l'approuve. Un établissement créé par le super-admin naît `approuve`.
- `code` : court, sans caractères ambigus (même générateur que les codes de classe).

### 3.2 `profiles` — rattachement + super-admin
```
alter table profiles add column etablissement_id uuid references etablissements(id);
-- nouveau rôle : 'superadmin' (global). Enum : stagiaire | formateur | admin | superadmin
```
- `etablissement_id` : l'établissement du compte (null pour le super-admin global).
- Le **super-admin** = `easydigia22@gmail.com` (déjà le 1er admin). Promu `superadmin`.
- Un **admin** garde `role='admin'` **mais avec un `etablissement_id`** : il n'administre que
  ce centre.

### 3.3 `classes` — établissement réel
```
alter table classes add column etablissement_id uuid references etablissements(id);
```
- Source de vérité de l'établissement d'une classe (le texte `data->>'etablissement'` devient
  un simple libellé d'affichage, synchronisé mais non faisant foi).
- L'établissement d'une classe = celui de son formateur propriétaire.

## 4. Rôles & flux

### 4.1 Super-admin (toi)
- Crée des établissements (statut `approuve` d'emblée), génère/voit leurs codes.
- Valide/rejette les établissements créés par des formateurs (`en_attente`).
- Lors de l'approbation d'un établissement créé par un formateur, **ce formateur créateur en
  devient l'admin** (`role='admin'`, `statut='approuve'`, `etablissement_id`=ce centre).
  *(Décision par défaut — à confirmer.)*
- Peut tout lire/piloter en transverse (supervision).

### 4.2 Admin d'établissement
- Comme l'admin actuel, **mais borné à son `etablissement_id`** : il ne voit/valide/désactive
  que les comptes de SON centre, ne voit que SES classes/rosters/tentatives.

### 4.3 Inscription d'un formateur
À l'inscription (écran d'auth), après avoir choisi le rôle « formateur », il :
- **soit choisit un établissement existant** (liste des établissements `approuve`),
- **soit crée le sien** (nom + ville) → crée une ligne `etablissements` en `en_attente`.

Puis **validation** :
- S'il a **rejoint un établissement existant** → l'**admin de ce centre** valide/rejette
  (flux `decider_formateur` actuel, scopé au centre).
- S'il a **créé un nouvel établissement** → le **super-admin** valide l'établissement ; à
  l'approbation, le créateur devient admin de ce centre (cf. 4.1).

Tant que non validé : écran d'attente (déjà en place via `statut`).

### 4.4 Stagiaire
- Inchangé côté saisie : il rejoint une classe via le code (`join_classe`).
- Son `etablissement_id` est **déduit de la classe rejointe** (écrit par `join_classe`, en
  security definer). Garantit qu'un stagiaire appartient au centre de sa classe.

## 5. Cloisonnement RLS

### 5.1 Nouveaux helpers (security definer, stable)
```
mon_etablissement()   -> uuid    -- etablissement_id du compte courant
is_superadmin()       -> boolean -- role = 'superadmin'
```
`is_admin()` reste (role in ('admin','superadmin')) pour les capacités, mais les **policies
de lecture transverses** passent de « `is_admin()` » à :
```
is_superadmin()
OR (is_admin() AND <ligne>.etablissement_id = mon_etablissement())
```

### 5.2 Policies à re-scoper
- `profiles.admin_read_all` → super-admin : tout ; admin : profils de son établissement.
- `classes.admin_read_classes` → idem via `classes.etablissement_id`.
- `classe_stagiaires.admin_read_roster` → via l'établissement de la classe / du stagiaire.
- `tentatives.admin_read_tentatives` → via l'établissement du stagiaire auteur.
- Les policies **formateur** (`*_roster`) restent inchangées : déjà cloisonnées par roster,
  donc jamais inter-établissement.

### 5.3 Fonctions d'administration re-scopées
`decider_formateur`, `desactiver_compte`, `reaffecter_groupe`, `supprimer_compte`,
`apercu_suppression` : ajoutent la garde « cible dans le même établissement que l'admin »
(sauf super-admin, transverse). `reaffecter_groupe` : interdit de déplacer une classe vers un
formateur d'un autre établissement.

### 5.4 Nouvelles fonctions
```
creer_etablissement(nom, ville)          -- super-admin : crée 'approuve' + code
proposer_etablissement(nom, ville)       -- formateur à l'inscription : crée 'en_attente'
decider_etablissement(id, decision)      -- super-admin : approuve/refuse + promeut le créateur admin
lister_etablissements_publics()          -- liste (id, nom, ville) des 'approuve' pour le choix à l'inscription
```
`join_classe` : écrit aussi `profiles.etablissement_id` du stagiaire = établissement de la classe.

## 6. Reprise de l'existant (migration idempotente, pilotée par les données)

1. Créer la table `etablissements`, colonnes `profiles.etablissement_id`,
   `classes.etablissement_id`, étendre l'enum rôle (`superadmin`) et l'enum statut établissement.
2. **Promouvoir** `easydigia22@gmail.com` en `superadmin` (global, `etablissement_id` null).
3. **Créer un unique « Établissement par défaut »** (`approuve`), avec un code généré.
4. **Rattacher toutes les classes** existantes à cet établissement par défaut.
5. **Rattacher tous les profils** (formateurs, admins, stagiaires) à l'établissement par défaut,
   **sauf** `easydigia22` qui devient `superadmin` global (`etablissement_id` null). Les
   éventuels autres `admin` restent `admin` sur l'établissement par défaut.
6. Le super-admin réorganise ensuite depuis l'app : créer d'autres centres, y réaffecter des
   formateurs/classes. Aucun compte n'est bloqué (tout le monde dans un centre valide).

> Tout compte existant reste approuvé et visible : la migration ne fait qu'**ajouter** le
> rattachement. Le pire cas (libellés hétérogènes) se corrige ensuite depuis l'app par le
> super-admin, sans risque de blocage.

## 7. Impact frontend

- **AuthGate / inscription** : ajout du choix d'établissement (liste existante **ou** création)
  pour le rôle formateur ; appel `lister_etablissements_publics` / `proposer_etablissement`.
- **Espace super-admin** (nouveau ou extension d'AdminView) : gestion des établissements
  (créer, voir codes, approuver/refuser les centres en attente, désigner un admin local).
- **AdminView** : déjà en place ; devient automatiquement borné à l'établissement par la RLS.
- **Certificat & tableaux** : l'`etablissement` affiché vient désormais de la table (fiable).
- Aucune rupture pour les stagiaires.

## 8. Décisions arrêtées (validées le 2026-10-18)

- **D1** L'approbation d'un établissement et la désignation de son admin sont **deux actes
  séparés** : le super-admin approuve le centre, puis **désigne l'admin à la main** (le créateur
  ou un autre). → fonction `designer_admin_etablissement`.
- **D2** Rôle `superadmin` distinct, réservé à **`easydigia22@gmail.com`** (unique).
- **D3** Reprise : **un seul « Établissement par défaut »** absorbe tout l'existant ; le
  super-admin réorganise ensuite depuis l'app (créer d'autres centres, réaffecter).
- **D4** Pas de changement des codes de classe ; ajout d'un **code établissement** séparé.

## 9. Ordre de livraison

1. **Migration SQL** (`20261018000000_multi_etablissements.sql`) — **montrée pour revue,
   appliquée par toi** (idéalement d'abord sur une branche Supabase).
2. **Frontend** : inscription (choix/création établissement) + espace super-admin.
3. Vérifications (isolation testée entre 2 centres) puis commit/push/déploiement (règle d'or).

# Multi-formateurs, approbation par un admin et cloisonnement — Spécification (lot A)

**Date :** 2026-10-07
**Statut :** approuvée en conception, à implémenter
**Lot suivant :** lot B — administration avancée des comptes (hors périmètre, voir §4)

## 1. Objectif

Permettre à plusieurs formateurs d'utiliser la même instance de l'application,
chacun ne gérant et ne voyant que ses propres groupes, sous le contrôle d'un
administrateur qui approuve les comptes formateurs.

**Succès :** un nouveau formateur s'inscrit, attend l'approbation de l'admin, puis
ne voit que le travail des stagiaires rattachés à ses propres classes. L'admin voit
l'ensemble de l'établissement en lecture et décide qui est formateur.

## 2. État actuel et failles visées

L'application distingue déjà deux rôles (`stagiaire`, `formateur`) dans la table
`profiles`, et chaque formateur possède déjà ses propres classes avec un code
d'invitation. Le rattachement stagiaire ↔ classe existe (`classe_stagiaires`).
Deux failles font obstacle à l'usage multi-formateurs :

1. **Le rôle est auto-attribué.** `handle_new_user`
   (`20261004120000_profiles_roles.sql`) lit le rôle demandé dans les métadonnées
   d'inscription. Il suffit de cocher « formateur » au moment de s'inscrire. Aucun
   rôle administrateur n'existe, donc aucune approbation n'est possible.
2. **Les formateurs ne sont pas cloisonnés.** `20261004130000_formateur_tentatives_access.sql`
   ouvre `tentatives` à tout formateur, en lecture et en écriture, sans condition
   d'appartenance — la migration le documente elle-même comme « un seul espace de
   formation par projet ». Un formateur voit donc le travail des stagiaires de tous
   les autres.

Toutes les autres tables (salariés, contrats, paie, classes, procédures
disciplinaires) sont déjà cloisonnées par `user_id` et ne sont pas concernées.

## 3. Périmètre

- Rôle `admin` et statut d'approbation sur les comptes.
- Inscription formateur créant un compte en attente ; écran d'attente après connexion.
- Espace d'administration : approuver, refuser avec motif, révoquer.
- Cloisonnement de `tentatives` sur le roster du formateur.
- Vue globale de l'admin, en lecture seule.

## 4. Hors périmètre (lot B)

Suppression d'un compte, réaffectation d'un groupe à un autre formateur,
intervention directe sur les stagiaires. Ces opérations exigent la clé
`service_role` via une Edge Function Supabase : le navigateur ne peut pas agir sur
`auth.users`. Profil de risque distinct, donc cycle spec → plan → implémentation
séparé.

## 5. Modèle de données

`public.profiles` évolue :

| Colonne | Type | Rôle |
|---|---|---|
| `role` | text | `check` élargi à `('stagiaire', 'formateur', 'admin')` |
| `statut` | text | `('en_attente', 'approuve', 'refuse')`, défaut `en_attente` |
| `email` | text | recopié depuis `auth.users` par le trigger, pour l'affichage admin |
| `decide_par` | uuid | admin auteur de la décision, `references auth.users` |
| `decide_le` | timestamptz | horodatage de la décision |
| `motif_refus` | text | motif affiché au formateur refusé |

L'e-mail est recopié parce que `auth.users` n'est pas lisible par le client :
sans lui, l'espace admin n'afficherait que des UUID et l'admin déciderait à
l'aveugle.

`handle_new_user` est repris avec deux garde-fous :

- un `stagiaire` est créé directement en `approuve` — il n'a rien à faire valider ;
- **`admin` n'est jamais attribuable depuis les métadonnées d'inscription.** Toute
  valeur autre que `formateur` retombe sur `stagiaire`. Sans cette règle, la faille
  actuelle serait seulement déplacée d'un cran.

`profiles` reste en écriture interdite pour le client (`revoke insert, update,
delete`), comme aujourd'hui.

## 6. Contrôle d'accès

`public.is_formateur()` devient le verrou unique : vrai si et seulement si
`role = 'formateur'` **et** `statut = 'approuve'`. Toutes les politiques existantes
passant déjà par cette fonction, l'approbation s'applique partout d'un seul coup,
sans point d'oubli possible.

`public.is_admin()` lui fait pendant : vrai si `role = 'admin'`.

Les deux sont `security definer` — elles lisent `profiles`, elle-même sous RLS, et
`is_formateur()` procède déjà ainsi aujourd'hui. Cela évite toute récursion de
politique.

Les décisions d'approbation passent par une fonction et non par une écriture :

```
decider_formateur(p_user_id uuid, p_decision text, p_motif text default null)
```

`security definer`, elle vérifie `is_admin()` en entrée, n'accepte que des cibles
dont le `role` est `formateur`, et écrit `statut`, `decide_par`, `decide_le`,
`motif_refus`. `p_decision` appartient à `('approuve', 'refuse', 'en_attente')` — la
révocation est le retour à `en_attente`.

Restreindre les cibles au rôle `formateur` a une conséquence voulue : un admin ne
peut ni se révoquer lui-même, ni révoquer un autre admin. L'établissement ne peut
donc pas se retrouver sans administrateur par une fausse manœuvre. Promouvoir ou
destituer un admin reste un acte SQL délibéré.

L'admin lit tous les profils (`admin_read_all` sur `profiles`) ; chacun continue de
lire le sien.

## 7. Cloisonnement des tentatives

Les deux politiques globales `formateur_read_all` et `formateur_update_all` sur
`public.tentatives` sont supprimées et remplacées par une condition
d'appartenance : le formateur accède à une tentative si son auteur figure dans
`classe_stagiaires` pour une classe dont il est propriétaire.

```sql
using (
  public.is_formateur()
  and exists (
    select 1 from public.classe_stagiaires cs
    where cs.stagiaire_user_id = tentatives.user_id
      and cs.classe_user_id = (select auth.uid())
  )
)
```

`is_formateur()` reste en facteur : les lignes de `classes` appartiennent
toujours à un formateur révoqué, et sans cette condition il garderait l'accès à ses
anciens stagiaires.

L'admin reçoit des politiques distinctes, **en lecture seule** (`is_admin()`) : il
pilote, il ne corrige pas. La correction reste l'acte du formateur ; toute écriture
administrative relève du lot B.

Aucun index n'est à créer : `classe_stagiaires` a `stagiaire_user_id` en clé
primaire et un index `(classe_user_id, classe_id)`.

Côté client, `fetchAllTentativesLive` (`src/services/trainerLive.ts`) fait un
`select` sans filtre et reçoit ce que RLS autorise. La liste se restreint donc
d'elle-même : la règle vit à un seul endroit, la base, et non dupliquée dans le
client. Un seul composant consomme ce service, `src/components/trainer/TrainerView.tsx`.

## 8. Parcours utilisateur et interface

`src/components/auth/AuthGate.tsx` est le point d'entrée unique après connexion. Il
récupère déjà le rôle et sait détourner l'affichage — un stagiaire sans classe y
voit l'écran de saisie du code d'invitation. L'écran d'attente se range au même
endroit, selon la même logique.

`fetchMyRole` (`src/services/profile.ts`) renvoie désormais le rôle **et** le
statut. Trois chemins après connexion :

| Situation | Affichage |
|---|---|
| formateur approuvé, admin | l'application, comme aujourd'hui |
| formateur en attente | écran plein : compte en attente de validation, e-mail rappelé, déconnexion |
| formateur refusé | même écran, avec le motif saisi par l'admin |

Le mode local sans compte n'est pas modifié : l'application reste utilisable hors
ligne avec accès complet.

L'écran d'inscription continue de proposer le choix du rôle, mais annonce
désormais qu'un compte formateur doit être validé par l'administrateur avant de
pouvoir servir. Sans cette mention, l'écran d'attente qui suit serait vécu comme
une panne.

Dans `src/App.tsx`, `estFormateur` (ligne 44) se dédouble : `estFormateur` exige
désormais l'approbation, et `estAdmin` s'ajoute. L'écran d'attente interceptant en
amont dans `AuthGate`, ces variables ne pilotent plus que la visibilité des onglets
réservés.

Nouvel onglet **« Administration »**, visible du seul admin : les demandes en
attente d'abord, puis tous les comptes formateurs avec statut et date de décision.
Trois actions — approuver, refuser avec motif, révoquer — toutes via
`decider_formateur`. L'admin conserve l'accès à l'Espace Formateur, où ses
politiques en lecture lui donnent la vue globale.

Un cas d'affichage nouveau à traiter : un formateur approuvé dont aucun stagiaire
n'a encore rejoint les groupes voit une liste vide. Elle doit dire « aucun stagiaire
n'a encore rejoint vos groupes », et non laisser un tableau vide sans explication.

## 9. Cas limites

**Révocation en cours de session.** L'interface d'un formateur révoqué croit encore
à son approbation ; RLS le bloque côté données mais il verrait des erreurs plutôt
qu'une explication. Le statut est revérifié au retour de focus sur l'onglet, et
l'écran d'attente reprend la main.

**Changement de classe.** Un stagiaire qui rejoint une autre classe sort
automatiquement du champ de son ancien formateur, la règle lisant le rattachement
courant. Aucun accès résiduel, aucune synchronisation à écrire.

**Refus puis réexamen.** Un refus n'est pas définitif : l'admin peut approuver plus
tard un compte refusé. Le motif reste affiché à l'intéressé jusque-là.

**Stagiaire sans classe.** Ses tentatives ne sont visibles que de lui-même et de
l'admin. Comportement voulu.

## 10. Migration et reprise de données

- **Formateurs déjà inscrits :** passés en `approuve` par la migration. Personne
  n'est enfermé dehors du jour au lendemain ; l'attente ne vaut que pour les
  inscriptions futures.
- **Stagiaires déjà inscrits :** passés en `approuve` (sans objet pour eux).
- **Premier admin :** `easydigia22@gmail.com` est désigné en dur dans la migration,
  en `role = 'admin'`, `statut = 'approuve'`. Le premier admin ne peut pas être
  approuvé par un admin ; le désigner en SQL est explicite et auditable, et ne crée
  aucune porte dérobée dans l'application.
- **E-mails existants :** recopiés depuis `auth.users` dans `profiles` par la même
  migration.

**Effet de bord assumé :** après cette migration, un formateur ne voit plus que les
stagiaires de ses propres classes. Le travail de stagiaires rattachés à la classe
d'un autre compte disparaîtra de sa vue. C'est l'objectif du lot, mais il faut
l'annoncer avant qu'il ne soit constaté.

La migration doit être exécutée dans le SQL Editor Supabase du projet
`rwhoezldcnxzkecwcxfq` : l'application en production ne reflétera pas ce lot tant
que ce n'est pas fait.

## 11. Vérification

Ce dépôt n'a aucune suite de tests automatisés et n'en introduit pas ici.

- `npx tsc --noEmit` et `npm run build` sans erreur.
- Requête SQL listant les politiques actives sur `tentatives`, pour vérifier
  qu'aucune politique globale ne subsiste.
- **Scénario à deux comptes dans le navigateur**, l'étape à ne pas sauter : un
  formateur en attente (qui doit rester sur l'écran d'attente), un formateur
  approuvé avec un stagiaire rattaché (qui doit voir ce stagiaire et lui seul), et
  l'admin (qui doit voir les deux). Le cloisonnement se constate avec des comptes
  réels ; il ne se démontre pas en lisant le code.

## 12. Alternatives écartées

**Table d'approbation séparée et colonne `formateur_user_id` dénormalisée sur
`tentatives`.** Meilleure traçabilité native et politiques plus simples à lire, au
prix de deux sources de vérité sur le statut et d'une colonne à maintenir à chaque
changement de classe — un oubli et un formateur conserve l'accès à un ancien
stagiaire. Le volume ne justifie pas la dénormalisation, et trois colonnes sur
`profiles` suffisent à la traçabilité.

**Entité « espace de formation » explicite,** à laquelle formateurs et classes se
rattachent. C'est la bonne architecture pour plusieurs établissements sur une même
instance, avec un admin par établissement. Pour un établissement et un admin, elle
ajoute une table, une notion dans toute l'interface et des jointures partout, pour
un besoin qui n'existe pas encore. La solution retenue ne ferme pas cette porte :
l'entité pourra être introduite plus tard sans rien casser.

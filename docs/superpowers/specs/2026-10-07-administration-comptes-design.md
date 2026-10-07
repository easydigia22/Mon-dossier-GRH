# Administration des comptes — Spécification (lot B)

**Date :** 2026-10-07
**Statut :** approuvée en conception, à implémenter
**Lot précédent :** `2026-10-07-multi-formateurs-admin-design.md` (lot A), livré et en production

## 1. Objectif

Donner à l'administrateur les moyens de tenir à jour la population de comptes de
l'établissement : désactiver un compte qui ne sert plus, supprimer définitivement un
compte sur demande d'effacement ou créé par erreur, et confier les groupes d'un
formateur à un autre.

**Succès :** en fin d'année scolaire, l'admin désactive une promotion de stagiaires en
quelques clics ; quand un formateur part, il confie ses groupes à un collègue ; et une
demande d'effacement se traite sans passer par le tableau de bord Supabase.

## 2. Décisions de cadrage

Prises avec l'utilisateur pendant la conception, elles orientent tout le reste :

- **Désactiver et supprimer sont deux actions distinctes.** La désactivation est le geste
  courant, réversible ; la suppression est définitive et réservée aux demandes
  d'effacement et aux comptes créés par erreur.
- **La suppression d'un formateur n'exige pas de réaffecter ses groupes au préalable.**
  Ses groupes disparaissent en cascade et ses stagiaires retombent sur l'écran
  « Rejoindre ma classe » à leur prochaine connexion. Choix explicite de l'utilisateur
  contre la recommandation initiale (réaffectation obligatoire) ; la contrepartie est le
  dénombrement obligatoire décrit en §5.
- **L'admin voit tous les comptes**, formateurs et stagiaires, sans recherche ni
  pagination (volume attendu : quelques dizaines).
- **Aucune Edge Function.** Vérifié sur le projet :
  `has_table_privilege('postgres', 'auth.users', 'DELETE')` renvoie `true`, donc une
  fonction `security definer` suffit pour supprimer un compte. Cela corrige l'affirmation
  de la spec du lot A, §4, qui tenait la clé `service_role` pour indispensable.

## 3. Périmètre

- Quatrième valeur de statut, `desactive`, et blocage correspondant pour **tous** les rôles.
- Fonctions d'administration : désactiver / réactiver, réaffecter un groupe, supprimer,
  et un aperçu chiffré avant suppression.
- Liste élargie aux stagiaires, avec leur classe.
- Éclatement de `AdminView.tsx` en quatre fichiers.

## 4. Hors périmètre

- Création de comptes depuis l'application (elle reste au formulaire d'inscription et au
  tableau de bord Supabase).
- Promotion ou destitution d'un administrateur : reste un acte SQL délibéré, comme au
  lot A.
- Export ou archivage des données avant suppression.
- Recherche, filtres et pagination de la liste.

## 5. Modèle de données et contrôle d'accès

### 5.1 Statut

`profiles.statut` accepte une quatrième valeur, `desactive`, et son `check` s'élargit à
`('en_attente', 'approuve', 'refuse', 'desactive')`.

C'est volontairement le même champ que l'approbation, et non un booléen séparé : un compte
a un seul état, pas deux qui pourraient se contredire — approuvé et désactivé à la fois
n'aurait pas de sens lisible.

**Conséquence sur le blocage.** Aujourd'hui `AuthGate` ne teste le statut que pour
`role === 'formateur'` : désactiver un stagiaire resterait sans effet. La règle devient :
tout compte en `desactive` est bloqué, quel que soit son rôle.

### 5.2 Fonctions

Toutes en `security definer`, sur le modèle de `decider_formateur` : elles vérifient
`is_admin()` en entrée et **refusent toute cible dont le rôle est `admin`**. Un
administrateur ne peut donc ni se désactiver, ni se supprimer, ni agir sur un autre
administrateur — l'établissement ne peut pas se retrouver sans administrateur par une
fausse manœuvre.

| Fonction | Rôle |
|---|---|
| `desactiver_compte(p_user_id uuid, p_desactive boolean)` | bascule entre `desactive` et `approuve` |
| `reaffecter_groupe(p_classe_id text, p_ancien uuid, p_nouveau uuid)` | confie un groupe à un autre formateur |
| `apercu_suppression(p_user_id uuid)` | lecture seule : ce que la suppression détruirait |
| `supprimer_compte(p_user_id uuid)` | `delete from auth.users`, cascades comprises |

`supprimer_compte` refuse également l'appelant lui-même, en plus de la règle sur les
administrateurs.

`reaffecter_groupe` déplace la ligne de `classes` **et** les lignes de
`classe_stagiaires` correspondantes, dans la même transaction. L'une sans l'autre
laisserait les stagiaires rattachés à un formateur qui ne possède plus la classe.

### 5.3 Politiques de lecture

L'admin n'a aujourd'hui aucun droit sur `classes` ni sur `classe_stagiaires`. Afficher les
groupes d'un formateur et la classe d'un stagiaire en exige deux nouvelles :
`admin_read_classes` et `admin_read_roster`, toutes deux en lecture seule, conditionnées à
`is_admin()`.

C'est une extension réelle de ce que l'admin voit — après ce lot, il connaît tous les
groupes et tous les rattachements de l'établissement. Cohérent avec la vue globale du
lot A, mais à décider comme tel, pas à subir.

Les écritures passent par les fonctions `security definer` : aucune politique d'écriture
n'est ajoutée pour l'admin.

## 6. Suppression : ce qui est détruit et comment

`supprimer_compte` exécute un `delete from auth.users`. Les cascades déjà déclarées dans
les migrations existantes effacent le reste : profil, salariés, contrats, événements de
présence, demandes de congés, bulletins, règles, tentatives, classes, procédures
disciplinaires, rattachements de classe. Les sessions et jetons du compte tombent avec,
donc la personne est déconnectée immédiatement, où qu'elle soit.

**L'opération n'a pas d'annulation.** Pas de corbeille, pas de sauvegarde préalable, pas
de rétablissement. Le design rend donc la manœuvre délibérée plutôt que simplement
possible, par deux moyens :

1. **Un dénombrement avant validation.** `apercu_suppression` renvoie le nombre de
   groupes, de stagiaires rattachés, de bulletins et de remises concernés. L'écran de
   confirmation les affiche. C'est la contrepartie du choix fait en §2 : la suppression
   d'un formateur détache ses stagiaires, et l'admin lira « 2 groupes, 14 stagiaires
   seront détachés » avant de valider, pas après.
2. **La saisie de l'adresse e-mail du compte.** Ni case à cocher ni « Êtes-vous sûr ? » :
   recopier l'adresse oblige à regarder laquelle on vise. C'est la protection contre
   l'erreur réelle — supprimer la mauvaise ligne d'une liste.

## 7. Interface

### 7.1 Trois listes

L'espace admin passe de deux listes à trois : demandes en attente, formateurs, stagiaires.

| Liste | Colonnes | Actions |
|---|---|---|
| Demandes en attente | e-mail, date d'inscription | approuver, refuser avec motif |
| Formateurs | e-mail, statut, date de décision, nombre de groupes | révoquer, désactiver / réactiver, réaffecter un groupe, supprimer |
| Stagiaires | e-mail, statut, classe rejointe | désactiver / réactiver, supprimer |

La désactivation est l'action principale et visible ; la suppression se tient en retrait,
parce qu'elle ne sert qu'aux demandes d'effacement et aux erreurs.

### 7.2 Panneaux en ligne

Les deux manœuvres délicates s'ouvrent sous la ligne concernée, comme le motif de refus du
lot A — jamais en boîte de dialogue native, qui bloque la page et ne se teste pas :

- **Suppression** : le dénombrement renvoyé par `apercu_suppression`, puis le champ de
  saisie de l'e-mail, puis le bouton de confirmation, désactivé tant que la saisie ne
  correspond pas.
- **Réaffectation** : la liste des groupes du formateur et, pour chacun, un sélecteur des
  autres formateurs approuvés.

### 7.3 Découpage des fichiers

`AdminView.tsx` fait 198 lignes pour deux listes et trois actions ; avec trois listes, six
actions et deux panneaux, il doublerait largement. Les plus gros fichiers du projet
frôlent déjà les 900 lignes et sont pénibles à modifier sans rien casser. Le lot éclate
donc le composant pendant que c'est encore simple :

| Fichier | Responsabilité |
|---|---|
| `AdminView.tsx` | chargement des données, état global, agencement des trois listes |
| `LigneCompte.tsx` | une ligne et ses actions, selon le rôle et le statut |
| `ConfirmationSuppression.tsx` | le panneau de suppression et sa garde de saisie |
| `ReaffectationGroupes.tsx` | le panneau de réaffectation |

### 7.4 Écran de blocage

`AuthGate` gagne un écran « Compte désactivé », distinct de celui de l'attente : un
stagiaire désactivé ne doit pas croire que sa demande est à l'étude.

## 8. Cas limites

**Réaffecter vers un formateur non approuvé.** Le sélecteur ne propose que des formateurs
en `approuve` ; `reaffecter_groupe` revérifie côté base, sans quoi un groupe pourrait
atterrir chez un compte incapable d'y accéder.

**Supprimer un compte déjà supprimé** (deux onglets ouverts, liste périmée). La fonction
lève une erreur explicite plutôt que de réussir silencieusement sur zéro ligne.

**Désactiver un formateur en attente.** Le statut passe de `en_attente` à `desactive` ; la
réactivation le remet en `approuve`, pas en `en_attente`. La désactivation vaut décision.

**Admin qui se supprime ou se désactive.** Refusé en base, et l'action n'est pas offerte
dans l'interface.

**Collision de code d'invitation après réaffectation.** Le code appartient à la ligne de
`classes` et la suit ; les stagiaires déjà rattachés n'ont rien à ressaisir.

## 9. Vérification

Ce dépôt n'a aucune suite de tests automatisés et n'en introduit pas ici.

- `npx tsc --noEmit` et `npm run build` sans erreur.
- Scénario navigateur avec un compte jetable créé pour l'occasion : le désactiver,
  vérifier l'écran de blocage, le réactiver, vérifier le retour, puis le supprimer et
  vérifier sa disparition de `auth.users` et de `profiles`.
- Réaffectation : créer un groupe chez un formateur, le confier à un second, vérifier que
  le groupe et son roster suivent — `select user_id from classes` et
  `select classe_user_id from classe_stagiaires`.
- **Ne jamais exercer la suppression sur un compte réel pendant la vérification.** Cette
  opération n'a pas d'annulation ; un compte jetable est le seul support acceptable.

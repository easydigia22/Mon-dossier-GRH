# Consultation du dossier de travail d'un stagiaire par son formateur — Spécification

**Date :** 2026-10-14
**Statut :** approuvée en conception, à implémenter
**Lot précédent :** 2026-10-07 — multi-formateurs, approbation admin et cloisonnement des tentatives

## 1. Objectif

Permettre à un formateur d'ouvrir, en lecture seule, le dossier de travail d'un
stagiaire de l'une de ses classes : l'entreprise qu'il a créée, ses salariés, ses
contrats, ses présences, ses congés et ses bulletins de paie.

**Succès :** un formateur ouvre l'Espace Formateur, choisit un stagiaire de sa
classe, et voit le dossier que ce stagiaire a réellement construit. Il peut noter
la mission correspondante sur pièces, au lieu de noter à l'aveugle. Il ne peut
rien modifier, et ne voit aucun stagiaire qui n'est pas dans l'une de ses classes.

## 2. État actuel

Trois des quatre briques nécessaires existent déjà.

1. **Chaque stagiaire possède déjà son propre dossier.** Toutes les tables métier
   (`20261004000000_init_mon_dossier_grh.sql`) sont clés sur `user_id` avec une
   policy `owner_all`. Un stagiaire crée son entreprise et travaille dans un
   espace strictement personnel. Rien à changer.
2. **Le rattachement formateur ↔ stagiaire existe et est cloisonné.** Le stagiaire
   rejoint une classe par code d'invitation (`join_classe`,
   `20261004140000_classe_join_code.sql`), et depuis
   `20261007000000_multi_formateurs_admin.sql` un formateur n'accède qu'aux
   stagiaires de ses propres classes.
3. **La notation existe côté formateur.** `TrainerView` lit les tentatives via
   `fetchAllTentativesLive()` et enregistre une correction via
   `saveCorrectionLive()`.

**Le manque :** le partage s'arrête à la table `tentatives`. Aucune policy ne
donne au formateur la moindre lecture sur les 6 tables métier. Il voit donc la
copie de mission, jamais le dossier que cette mission était censée produire.

**Défaut annexe traité ici :** `MissionsView.handleSoumettre()` attribue une note
codée en dur (4 + 3,5 + 7 + 3,5 = 18/20) à toute remise, quel que soit le contenu.
Tout stagiaire obtient 18/20 automatiquement, et la tentative arrive déjà
`corrige` chez le formateur.

## 3. Périmètre

- Accès du formateur, en lecture seule, aux 6 tables métier de ses stagiaires.
- Service de chargement d'un dossier complet.
- Nouvel écran de consultation dans l'Espace Formateur.
- Suppression de la note automatique : la remise devient `remis` sans note.
- Mention de transparence côté stagiaire.

## 4. Hors périmètre

- **Annotation ou notation du dossier lui-même.** La note reste portée par la
  mission, pas par le dossier. Pas de nouvelle table de commentaires.
- **Vraie correction automatique des missions.** Seules 3 missions sur 10
  définissent `resultatsNumeriquesAttendus`, et leurs clés (`heuresSupM003`,
  `soldeFinal`…) ne correspondent pas aux 3 champs génériques du formulaire
  (`montantBrut`, `retenues`, `resultatFinal`). Une notation automatique
  honnête suppose de refondre les données de mission et le formulaire de
  réponse : chantier distinct.
- **Réutilisation des 16 vues du stagiaire en mode consultation.** Écartée, voir §11.
- **Toute écriture du formateur sur le dossier.** Jamais, à aucun moment.
- **Accès de l'admin aux dossiers.** L'admin pilote les comptes ; il n'a pas
  vocation à lire le travail. Cohérent avec le lot A, où il est en lecture seule
  sur les tentatives uniquement.

## 5. Contrôle d'accès

Nouvelle migration : `20261014000000_formateur_dossiers_stagiaires.sql`,
idempotente comme les précédentes.

### 5.1 Fonction d'appartenance

```sql
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
```

Elle factorise le test déjà écrit deux fois dans le lot A. `is_formateur()` reste
en facteur : cette fonction exige `statut = 'approuve'`, donc un formateur révoqué
perd l'accès immédiatement, bien que ses lignes de `classes` subsistent.

`security definer` est nécessaire : `classe_stagiaires` est protégée par RLS, et
la fonction doit pouvoir la lire pour arbitrer. `search_path` est figé, comme sur
les fonctions existantes.

### 5.2 Policies de lecture

Pour chacune des 6 tables `entreprises`, `salaries`, `contrats`,
`evenements_presence`, `demandes_conges`, `bulletins` :

```sql
create policy "formateur_read_roster" on public.<table>
  for select to authenticated
  using (public.est_mon_stagiaire(<table>.user_id));
```

**SELECT uniquement.** Aucun `grant insert/update/delete` n'est ajouté. La lecture
seule est garantie par la base, pas par l'interface : même si un bug d'affichage
exposait un bouton d'écriture, la base refuserait.

Les policies `owner_all` existantes sont conservées telles quelles. Les policies
sont additives sous PostgreSQL : le stagiaire garde son accès plein, le formateur
s'ajoute en lecture.

### 5.3 Tables volontairement exclues

| Table | Raison |
|---|---|
| `regles` | Données de référence, identiques pour tous. Aucune information sur le travail du stagiaire. |
| `procedures` | La discipline est un onglet formateur ; un stagiaire n'en produit pas. |
| `parametres_app` | Préférences d'affichage. Sans valeur pour corriger. |
| `classes` | Appartiennent au formateur, pas au stagiaire. |

## 6. Service de lecture

Nouveau fichier `src/services/dossierStagiaire.ts`.

```ts
export interface DossierStagiaire {
  entreprise?: Entreprise;
  salaries: Salarie[];
  contrats: Contrat[];
  evenementsPresence: EvenementPresence[];
  demandesConges: DemandeConge[];
  bulletins: BulletinPaie[];
  chargeLe: string; // ISO, pour afficher la fraîcheur
}

export async function fetchDossierStagiaire(userId: string): Promise<DossierStagiaire>
```

Les 6 requêtes partent en parallèle via `Promise.all`, chacune filtrée par
`.eq('user_id', userId)`. Le filtre applicatif ne porte aucune sécurité — c'est la
RLS qui décide — mais il évite de rapatrier plus que nécessaire.

**Pas de temps réel.** Chargement à la demande à l'ouverture d'un dossier, plus un
bouton Rafraîchir. Corriger n'exige pas la seconde près, et un abonnement sur 6
tables multiplierait les connexions sans bénéfice.

**Dossier vide.** Un stagiaire qui n'a pas encore créé son entreprise renvoie des
tableaux vides sans erreur : c'est un état normal, pas une panne.

## 7. Interface

Nouveau fichier `src/components/trainer/DossierStagiaireView.tsx`, monté comme
sous-onglet de l'Espace Formateur. `TrainerView.tsx` atteint 853 lignes ; on n'y
ajoute rien.

- **Sélection :** liste des stagiaires de la classe active, alimentée par le
  roster déjà chargé par `TrainerView`. Pas de nouvel appel réseau pour la liste.
- **Bandeau permanent :** « Lecture seule — dossier de <prénom nom> », avec
  l'heure de chargement et le bouton Rafraîchir.
- **Sections dépliantes**, la section Entreprise ouverte par défaut (et affichant
  son état vide si l'entreprise n'existe pas encore), les autres fermées :
  Entreprise, Salariés (n), Contrats (n), Présences, Congés (n), Bulletins (n).
  Chaque titre porte son compteur, pour que l'avancement se lise sans déplier.
- **États vides explicites :** « Ce stagiaire n'a pas encore créé son entreprise »
  est l'information la plus utile en début de module, et doit s'afficher comme un
  constat, pas comme une erreur.
- **Aucun bouton d'action** dans cet écran. Pas de modification, pas de
  suppression, pas d'export : l'export du travail d'autrui n'a pas été demandé et
  élargirait la surface de données diffusables.

La présentation est propre à cet écran et ne cherche pas à reproduire les vues du
stagiaire : compacte, orientée correction.

## 8. Notation des missions

Dans `MissionsView.handleSoumettre()` :

- Suppression du calcul `noteDossier` / `noteRegles` / `noteCalculs` /
  `noteControles` et du champ `correction` à la création de la tentative.
- `statut` passe de `'corrige'` à `'remis'`.
- `indicesConsultes` reste enregistré : c'est une information de correction utile
  au formateur, désormais la seule trace du recours aux indices.

Côté stagiaire, le badge « Mission complétée (18/20) » devient :

- « Remise — en attente de correction » quand `statut === 'remis'` ;
- « Corrigée — n/20 » quand une correction existe.

Côté formateur, aucune modification : `TrainerView` affiche déjà « Non noté »
quand `correction` est absente, et son panneau de saisie de note fonctionne.

**Conséquence sur les données existantes :** les tentatives déjà enregistrées
portent une note à 18/20 issue du calcul supprimé. Elles ne sont pas reprises — il
s'agit de données de démonstration, et les réécrire effacerait d'éventuelles
corrections réelles déjà saisies par un formateur.

## 9. Transparence côté stagiaire

Une mention visible dans l'écran de rattachement à la classe et dans l'Espace
Missions : *« Votre formateur peut consulter votre dossier de travail (entreprise,
salariés, bulletins) pour corriger vos missions. Il ne peut rien y modifier. »*

Ce n'est pas cosmétique : le projet porte un volet conformité CNDP, et un accès
silencieux aux données produites par un tiers s'y défend mal. La mention est aussi
la forme la plus simple de consentement éclairé dans un cadre pédagogique.

## 10. Vérification

Le projet n'a aucun framework de test. La vérification du cloisonnement se fait
par requêtes SQL exécutées dans l'éditeur SQL de Supabase, en se plaçant
successivement dans la peau de chaque compte. Chaque scénario doit être exécuté
avant mise en production :

| # | Scénario | Attendu |
|---|---|---|
| 1 | Formateur A lit le dossier d'un stagiaire de sa classe | Lignes retournées |
| 2 | Formateur A lit le dossier d'un stagiaire du formateur B | 0 ligne |
| 3 | Formateur A tente un `update` sur une table métier d'un de ses stagiaires | Refus ou 0 ligne |
| 4 | Formateur A est passé `en_attente` par l'admin, puis relit | 0 ligne |
| 5 | Le stagiaire quitte la classe, le formateur relit | 0 ligne |
| 6 | Stagiaire X lit le dossier du stagiaire Y | 0 ligne |
| 7 | Admin lit une table métier d'un stagiaire | 0 ligne (hors périmètre) |
| 8 | Le stagiaire lit et écrit son propre dossier | Inchangé |

Le scénario 3 mérite attention : sous RLS, un `update` non autorisé ne lève pas
d'erreur, il affecte zéro ligne. Le contrôle doit porter sur le nombre de lignes
retournées, comme le fait déjà `saveCorrectionLive`.

Vérification fonctionnelle manuelle : un compte formateur et deux comptes
stagiaires dans deux classes différentes.

## 11. Alternatives écartées

**Réutiliser les 16 vues du stagiaire en mode consultation.** Fidélité maximale,
mais `useAppData` est construit pour charger le dossier de l'utilisateur connecté
depuis IndexedDB ; le faire charger un dossier tiers impose de le refondre, puis
de neutraliser les écritures dans les 16 vues. Une seule omission ouvre une
écriture sur le dossier d'autrui. Écarté au profit d'un écran dédié dont la
surface de risque est nulle par construction.

**Tableau de bord d'indicateurs seulement.** Plus léger, mais le formateur
continuerait de corriger sans voir le travail — l'objectif ne serait pas atteint.

**Temps réel sur les 6 tables.** Coût de connexions sans bénéfice pédagogique :
la correction n'est pas une activité à la seconde.

**Garder la note automatique comme auto-évaluation.** Afficher 18/20 à un
stagiaire qui n'a rien calculé dévalue la notation du formateur quand elle
arrive ensuite.

## 12. Limite connue, hors de portée de cette spec

Le mode Évaluation masque le corrigé dans l'interface, mais les données des
missions — corrigés inclus — sont embarquées dans le bundle JavaScript et restent
lisibles via les outils de développement du navigateur. Acceptable pour une
formation en salle ; insuffisant pour un examen à distance qui compterait dans une
note officielle. Y remédier suppose de déplacer les corrigés côté serveur.

# Tableur Pro : Excel et VBA pour la finance et l’assurance

Application web d’apprentissage, sur le modèle des applis de langue : leçons courtes, exercices interactifs, points d’expérience, séries de jours, niveaux et badges.

## Contenu

5 modules, 25 leçons, plus de 100 exercices :

| Module | Niveau | Thèmes |
|---|---|---|
| Les bases d’Excel | Débutant | Cellules, formules, SOMME/MOYENNE…, références `$`, SI/ET/OU, pourcentages |
| Analyser un portefeuille d’assurance | Intermédiaire | NB.SI, SOMME.SI.ENS, RECHERCHEV/X, ratio S/P, tableaux croisés dynamiques |
| Mathématiques financières | Intermédiaire | VC, VA, VPM, tableau d’amortissement, VAN, TRI |
| Actuariat et assurance | Avancé | Prime pure, tables de mortalité, valeurs actuelles probables, Chain Ladder |
| VBA : automatiser Excel | Avancé | Macros, variables, Range/Cells, boucles, fonctions personnalisées, reporting |

**Types d’exercices**
- **Formule** : un mini-tableur dans le navigateur. L’élève tape une vraie formule (noms français ou anglais, `;` ou `,`), qui est calculée et vérifiée. On peut cliquer sur une cellule pendant la saisie pour insérer sa référence, comme dans Excel. Certaines formules sont recopiées vers le bas pour vérifier l’usage des `$`.
- **QCM**, **code VBA à trous**, **lignes de code à remettre dans l’ordre**.
- **Exercice sur fichier** : l’élève télécharge un `.xlsx` (portefeuille de 400 contrats, 140 sinistres, table de mortalité, triangle de règlements, emprunt), travaille dans son propre Excel et saisit le résultat.

Les données sont fictives mais générées de façon déterministe : les réponses attendues correspondent toujours aux fichiers téléchargés.

## Développement

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # moteur de formules, cohérence de chaque exercice, progression
npm run build
```

Sans configuration Supabase, l’application tourne en **mode démo** : la « connexion » ne demande pas de mot de passe et la progression est stockée dans le navigateur.

## Mise en production

### 1. Supabase (comptes et sauvegarde de la progression)

1. Créez un projet gratuit sur [supabase.com](https://supabase.com).
2. **SQL Editor** > New query : collez le contenu de [`supabase/schema.sql`](supabase/schema.sql) puis cliquez sur **Run**.
3. **Authentication > URL Configuration** :
   - *Site URL* : l’adresse Netlify, par exemple `https://votre-site.netlify.app`
   - *Redirect URLs* : ajoutez `https://votre-site.netlify.app/**`
4. **Project Settings > API** : notez l’URL du projet et la clé publique `anon`.

Les emails (confirmation d’inscription, mot de passe oublié) sont envoyés par Supabase. Leur texte se personnalise dans **Authentication > Email Templates**. Pour un volume réel, configurez votre propre SMTP (**Authentication > SMTP Settings**), car le service intégré est limité à quelques emails par heure.

### 2. Netlify

1. **Add new site > Import an existing project** : choisissez ce dépôt GitHub. Le fichier `netlify.toml` fournit déjà la commande de build et la redirection des routes.
2. **Site configuration > Environment variables** : ajoutez
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Relancez un déploiement.

La clé `anon` est publique par conception : la sécurité repose sur les règles RLS du schéma, qui ne laissent chaque utilisateur lire et modifier que son propre profil.

## Offre payante (à venir)

La table `profiles` contient une colonne `plan` (`free` ou `premium`) que l’utilisateur ne peut pas modifier lui-même. Pour lancer une offre payante, il suffira de :
1. marquer les modules premium dans `src/content/modules/*.ts` et vérifier `user.plan` avant d’ouvrir une leçon ;
2. brancher un paiement (Stripe Checkout, par exemple) dont le webhook, exécuté côté serveur (fonction Netlify) avec la clé `service_role`, passe `plan` à `premium`.

## Structure

```
src/
  content/          leçons et exercices (un fichier par module), mémo des fonctions
  lib/formula/      moteur de formules Excel (analyse, calcul, fonctions FR/EN)
  lib/check.ts      correction des exercices
  lib/datasets.ts   jeux de données et export .xlsx
  lib/progress.ts   XP, séries, niveaux, badges, déverrouillage
  lib/auth.tsx      comptes (Supabase ou mode démo)
  components/       mini-tableur, exercices, blocs de code
  pages/            accueil, connexion, parcours, leçon, ressources, bac à sable, profil
supabase/schema.sql
```

Pour ajouter une leçon, ajoutez un objet dans le module voulu : `npm test` vérifie automatiquement que chaque solution est juste et que chaque exercice est cohérent.

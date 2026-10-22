import { PORTEFEUILLE, SINISTRES, REGIONS } from '../../lib/datasets'
import type { Module, SheetSpec } from '../types'

const CONTRATS: SheetSpec = {
  rows: [
    ['Contrat', 'Branche', 'Région', 'Prime'],
    ['C001', 'Auto', 'Nord', 640],
    ['C002', 'Habitation', 'Sud', 310],
    ['C003', 'Auto', 'Sud', 890],
    ['C004', 'Santé', 'Nord', 1450],
    ['C005', 'Auto', 'Nord', 520],
    ['C006', 'Habitation', 'Nord', 275],
    ['C007', 'Santé', 'Sud', 1980],
    ['C008', 'Auto', 'Ouest', 1120],
    ['C009', 'Habitation', 'Ouest', 430],
    ['C010', 'Auto', 'Sud', 760],
  ],
  formats: { D: 'eur' },
}

function withExtra(base: SheetSpec, extra: Record<number, (string | number | null)[]>): SheetSpec {
  return { ...base, rows: base.rows.map((r, i) => [...r, ...(extra[i] ?? [])]) }
}

const sumBy = <T>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0)

const primesSanteIdf = sumBy(
  PORTEFEUILLE.filter((c) => c.branche === 'Santé' && c.region === 'Île-de-France'),
  (c) => c.prime,
)
const nbAutoNord = PORTEFEUILLE.filter((c) => c.branche === 'Auto' && c.region === 'Nord').length
const primesParRegion = REGIONS.map((r) => sumBy(PORTEFEUILLE.filter((c) => c.region === r), (c) => c.prime))
const spHabitation =
  sumBy(SINISTRES.filter((s) => s.branche === 'Habitation'), (s) => s.montant) /
  sumBy(PORTEFEUILLE.filter((c) => c.branche === 'Habitation'), (c) => c.prime)
const ageMoyenPrevoyance = (() => {
  const xs = PORTEFEUILLE.filter((c) => c.branche === 'Prévoyance')
  return sumBy(xs, (c) => c.age) / xs.length
})()
const nbOuverts = SINISTRES.filter((s) => s.statut === 'Ouvert').length

export const portefeuille: Module = {
  id: 'portefeuille',
  title: 'Analyser un portefeuille d’assurance',
  description: 'Compter, additionner selon des critères, rechercher des informations et calculer le ratio sinistres/primes.',
  icon: '🗂️',
  color: '#0f6cbd',
  level: 'Intermédiaire',
  lessons: [
    {
      id: 'portefeuille-1',
      title: 'Compter et additionner avec un critère',
      summary: 'NB.SI, SOMME.SI et MOYENNE.SI.',
      theory: [
        {
          title: 'Un portefeuille, c’est une base de données',
          body: `Un **portefeuille** regroupe tous les contrats d’un assureur. Dans Excel, on le présente comme un tableau : **une ligne par contrat**, **une colonne par information** (branche, région, prime…).

Les questions de pilotage sont alors toujours du type : « combien de contrats Auto ? », « quel montant de primes en Santé ? ». Les fonctions en **.SI** y répondent.`,
          sheet: CONTRATS,
        },
        {
          title: 'NB.SI, SOMME.SI, MOYENNE.SI',
          body: `- \`=NB.SI(plage; critère)\` compte les cellules de la plage qui respectent le critère
- \`=SOMME.SI(plage_critère; critère; plage_somme)\` additionne la plage_somme sur les lignes qui respectent le critère
- \`=MOYENNE.SI(plage_critère; critère; plage_moyenne)\` fait la moyenne

Exemples sur le tableau ci-dessus :
- \`=NB.SI(B2:B11;"Auto")\` → 5 contrats Auto
- \`=SOMME.SI(B2:B11;"Auto";D2:D11)\` → primes Auto

Le critère peut être un texte (\`"Auto"\`), une comparaison (\`">1000"\`, \`"<>Santé"\`) ou une cellule (\`F1\`).`,
          tip: 'Les plages critère et somme doivent avoir la même taille.',
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Comptez en G2 le nombre de contrats de la branche Habitation.',
          sheet: withExtra(CONTRATS, { 0: [null, 'Indicateur', 'Valeur'], 1: [null, 'Nb Habitation', null] }),
          target: 'G2',
          solution: '=NB.SI(B2:B11;"Habitation")',
          requires: ['NB.SI'],
          explanation: '=NB.SI(B2:B11;"Habitation") donne 3.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en G2 le total des primes de la branche Auto.',
          sheet: withExtra(CONTRATS, { 0: [null, 'Indicateur', 'Valeur'], 1: [null, 'Primes Auto', null] }),
          target: 'G2',
          solution: '=SOMME.SI(B2:B11;"Auto";D2:D11)',
          requires: ['SOMME.SI'],
          explanation: '=SOMME.SI(B2:B11;"Auto";D2:D11) donne 3 930 €.',
        },
        {
          type: 'formula',
          prompt: 'Combien de contrats ont une prime supérieure à 800 € ? Réponse en G2.',
          sheet: withExtra(CONTRATS, { 0: [null, 'Indicateur', 'Valeur'], 1: [null, 'Primes > 800 €', null] }),
          target: 'G2',
          solution: '=NB.SI(D2:D11;">800")',
          requires: ['NB.SI'],
          hint: 'Le critère de comparaison s’écrit entre guillemets : ">800".',
          explanation: '=NB.SI(D2:D11;">800") donne 4 (C003, C004, C007, C008).',
        },
        {
          type: 'formula',
          prompt: 'Calculez en G2 la prime moyenne de la région Nord.',
          sheet: withExtra(CONTRATS, { 0: [null, 'Indicateur', 'Valeur'], 1: [null, 'Prime moy. Nord', null] }),
          target: 'G2',
          solution: '=MOYENNE.SI(C2:C11;"Nord";D2:D11)',
          requires: ['MOYENNE.SI'],
          explanation: '=MOYENNE.SI(C2:C11;"Nord";D2:D11) donne 721,25 €.',
        },
        {
          type: 'numeric',
          prompt: 'Téléchargez le portefeuille complet. Quel est l’âge moyen des assurés en Prévoyance ? (arrondi à 2 décimales)',
          file: 'portefeuille',
          answer: ageMoyenPrevoyance,
          tolerance: 0.01,
          unit: 'ans',
          hint: 'Utilisez MOYENNE.SI sur la colonne Branche et la colonne Âge.',
          explanation: '=MOYENNE.SI(D:D;"Prévoyance";C:C) : on peut utiliser des colonnes entières dans Excel.',
        },
      ],
    },
    {
      id: 'portefeuille-2',
      title: 'Plusieurs critères : les fonctions .SI.ENS',
      summary: 'SOMME.SI.ENS, NB.SI.ENS et MOYENNE.SI.ENS.',
      theory: [
        {
          title: 'Combiner plusieurs critères',
          body: `Pour croiser plusieurs critères (branche **et** région, par exemple), on utilise les versions **.ENS** :

- \`=SOMME.SI.ENS(plage_somme; plage1; critère1; plage2; critère2; …)\`
- \`=NB.SI.ENS(plage1; critère1; plage2; critère2; …)\`
- \`=MOYENNE.SI.ENS(plage_moyenne; plage1; critère1; …)\`

Attention : dans SOMME.SI.ENS, la plage à additionner est le **premier** argument (contrairement à SOMME.SI).

Exemple : primes Auto de la région Sud
\`=SOMME.SI.ENS(D2:D11;B2:B11;"Auto";C2:C11;"Sud")\``,
          sheet: CONTRATS,
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Calculez en G2 le total des primes Auto dans la région Nord.',
          sheet: withExtra(CONTRATS, { 0: [null, 'Indicateur', 'Valeur'], 1: [null, 'Auto Nord', null] }),
          target: 'G2',
          solution: '=SOMME.SI.ENS(D2:D11;B2:B11;"Auto";C2:C11;"Nord")',
          requires: ['SOMME.SI.ENS'],
          explanation: 'C001 (640 €) + C005 (520 €) = 1 160 €.',
        },
        {
          type: 'formula',
          prompt: 'Comptez en G2 les contrats Auto dont la prime dépasse 700 €.',
          sheet: withExtra(CONTRATS, { 0: [null, 'Indicateur', 'Valeur'], 1: [null, 'Auto > 700 €', null] }),
          target: 'G2',
          solution: '=NB.SI.ENS(B2:B11;"Auto";D2:D11;">700")',
          requires: ['NB.SI.ENS'],
          explanation: 'C003, C008 et C010 : 3 contrats.',
        },
        {
          type: 'formula',
          prompt: 'Construisez un tableau de synthèse : en G2, total des primes de la branche indiquée en F2 et de la région indiquée en G1. La formule sera recopiée jusqu’en G4 (les branches sont en F2:F4). Pensez aux $ !',
          sheet: withExtra(CONTRATS, {
            0: [null, 'Branche', 'Nord'],
            1: [null, 'Auto', null],
            2: [null, 'Habitation', null],
            3: [null, 'Santé', null],
          }),
          target: 'G2',
          fillTo: 'G4',
          solution: '=SOMME.SI.ENS($D$2:$D$11;$B$2:$B$11;F2;$C$2:$C$11;G$1)',
          requires: ['SOMME.SI.ENS'],
          hint: 'Les plages du tableau doivent être bloquées ; le critère branche F2 doit descendre, la région G$1 doit rester sur la ligne 1.',
          explanation: 'Les critères peuvent être des cellules : F2 (relative, suit la ligne) et G$1 (ligne bloquée). Résultat : 1 160 €, 275 € et 1 450 €. C’est la base de tout tableau de bord.',
        },
        {
          type: 'numeric',
          prompt: 'Dans le portefeuille complet, quel est le total des primes Santé en Île-de-France ?',
          file: 'portefeuille',
          answer: primesSanteIdf,
          tolerance: 1,
          unit: '€',
          hint: 'SOMME.SI.ENS avec deux critères : Branche = "Santé" et Région = "Île-de-France".',
          explanation: '=SOMME.SI.ENS(G:G;D:D;"Santé";E:E;"Île-de-France")',
        },
        {
          type: 'numeric',
          prompt: 'Dans le portefeuille complet, combien y a-t-il de contrats Auto dans la région Nord ?',
          file: 'portefeuille',
          answer: nbAutoNord,
          tolerance: 0,
          unit: 'contrats',
          explanation: '=NB.SI.ENS(D:D;"Auto";E:E;"Nord")',
        },
      ],
    },
    {
      id: 'portefeuille-3',
      title: 'Rechercher une information',
      summary: 'RECHERCHEV, RECHERCHEX, INDEX/EQUIV et SIERREUR.',
      theory: [
        {
          title: 'RECHERCHEV',
          body: `On a souvent deux tableaux à relier : les **sinistres** d’un côté, les **contrats** de l’autre. Pour retrouver la branche d’un sinistre à partir de son numéro de contrat :

\`=RECHERCHEV(valeur_cherchée; table; n°_colonne; FAUX)\`

- La valeur est cherchée dans la **première colonne** de la table
- Le n° de colonne indique quelle colonne renvoyer (1 = première colonne de la table)
- **FAUX** = correspondance exacte. À utiliser dans 99 % des cas !
- Si la valeur n’existe pas : erreur \`#N/A\``,
          sheet: {
            rows: [
              ['Sinistre', 'Contrat', 'Branche', '', 'Contrat', 'Branche', 'Prime'],
              ['S01', 'C003', '=RECHERCHEV(B2;$E$2:$G$5;2;FAUX)', null, 'C001', 'Auto', 640],
              ['S02', 'C001', '=RECHERCHEV(B3;$E$2:$G$5;2;FAUX)', null, 'C002', 'Habitation', 310],
              [null, null, null, null, 'C003', 'Santé', 1450],
              [null, null, null, null, 'C004', 'Auto', 890],
            ],
            formats: { G: 'eur' },
          },
        },
        {
          title: 'RECHERCHEX : la version moderne',
          body: `Disponible dans Excel 365 et 2021 : \`=RECHERCHEX(valeur; colonne_cherchée; colonne_renvoyée; [si_absent])\`

- Plus besoin de compter les colonnes
- La colonne renvoyée peut être à gauche de la colonne cherchée
- Le 4ᵉ argument remplace SIERREUR : \`=RECHERCHEX(B2;E2:E5;G2:G5;"Inconnu")\`

Alternative compatible avec toutes les versions : \`=INDEX(G2:G5;EQUIV(B2;E2:E5;0))\`.`,
        },
        {
          title: 'Gérer les erreurs : SIERREUR',
          body: `\`=SIERREUR(formule; valeur_si_erreur)\` renvoie la formule, sauf si elle produit une erreur.

\`=SIERREUR(RECHERCHEV(B2;E2:G5;3;FAUX);0)\` renvoie 0 pour un contrat introuvable.`,
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'En C2, retrouvez la prime du contrat concerné par le sinistre (colonne 3 du tableau des contrats E2:G6). Formule recopiée jusqu’en C4.',
          sheet: {
            rows: [
              ['Sinistre', 'Contrat', 'Prime', '', 'Contrat', 'Branche', 'Prime'],
              ['S01', 'C004', null, null, 'C001', 'Auto', 640],
              ['S02', 'C002', null, null, 'C002', 'Habitation', 310],
              ['S03', 'C005', null, null, 'C003', 'Auto', 890],
              [null, null, null, null, 'C004', 'Santé', 1450],
              [null, null, null, null, 'C005', 'Auto', 520],
            ],
            formats: { C: 'eur', G: 'eur' },
          },
          target: 'C2',
          fillTo: 'C4',
          solution: '=RECHERCHEV(B2;$E$2:$G$6;3;FAUX)',
          requires: ['RECHERCHEV'],
          hint: 'Bloquez la table avec $ et terminez par FAUX pour une recherche exacte.',
          explanation: '=RECHERCHEV(B2;$E$2:$G$6;3;FAUX) donne 1 450 €, 310 € et 520 €.',
        },
        {
          type: 'qcm',
          question: 'Que se passe-t-il si on oublie le 4ᵉ argument FAUX dans RECHERCHEV ?',
          options: [
            'Excel affiche une erreur de syntaxe',
            'Excel fait une recherche approximative, qui suppose une première colonne triée et peut renvoyer une mauvaise ligne',
            'Excel cherche dans toutes les colonnes',
            'Rien, FAUX est la valeur par défaut',
          ],
          answer: 1,
          explanation: 'Par défaut, RECHERCHEV fait une recherche approximative (VRAI). C’est utile pour un barème par tranches, dangereux pour un identifiant.',
        },
        {
          type: 'formula',
          prompt: 'En C2, retrouvez la branche du contrat avec RECHERCHEX. Si le contrat est introuvable, affichez « Inconnu ». Formule recopiée jusqu’en C4.',
          sheet: {
            rows: [
              ['Sinistre', 'Contrat', 'Branche', '', 'Contrat', 'Branche'],
              ['S01', 'C003', null, null, 'C001', 'Auto'],
              ['S02', 'C009', null, null, 'C002', 'Habitation'],
              ['S03', 'C001', null, null, 'C003', 'Santé'],
            ],
          },
          target: 'C2',
          fillTo: 'C4',
          solution: '=RECHERCHEX(B2;$E$2:$E$4;$F$2:$F$4;"Inconnu")',
          requires: ['RECHERCHEX'],
          explanation: 'C009 n’existe pas dans la table : RECHERCHEX renvoie « Inconnu » au lieu de #N/A.',
        },
        {
          type: 'formula',
          prompt: 'Barème : le coefficient bonus-malus dépend de l’ancienneté sans sinistre (tranches en E2:F5). Retrouvez en C2 le coefficient de l’assuré avec une recherche approximative. Formule recopiée jusqu’en C4.',
          sheet: {
            rows: [
              ['Assuré', 'Années sans sinistre', 'Coefficient', '', 'À partir de', 'Coef.'],
              ['Inès', 0, null, null, 0, 1],
              ['Jules', 4, null, null, 2, 0.9],
              ['Sarah', 15, null, null, 5, 0.75],
              [null, null, null, null, 13, 0.5],
            ],
          },
          target: 'C2',
          fillTo: 'C4',
          solution: '=RECHERCHEV(B2;$E$2:$F$5;2;VRAI)',
          requires: ['RECHERCHEV'],
          hint: 'Ici on veut justement la tranche : 4 ans tombe dans la tranche « à partir de 2 ».',
          explanation: 'Avec VRAI, RECHERCHEV prend la dernière ligne inférieure ou égale à la valeur cherchée. La première colonne doit être triée par ordre croissant.',
        },
      ],
    },
    {
      id: 'portefeuille-4',
      title: 'Le ratio sinistres / primes',
      summary: 'Mesurer la rentabilité technique d’une branche.',
      theory: [
        {
          title: 'Le S/P, indicateur clé de l’assureur',
          body: `Le **ratio S/P** (sinistres sur primes, ou *loss ratio*) mesure la part des primes consommée par les sinistres :

**S/P = charge des sinistres / primes acquises**

- S/P = 70 % : sur 100 € de primes, 70 € servent à payer les sinistres
- Il reste 30 € pour couvrir les **frais** (gestion, commissions…) et dégager une marge

Le **ratio combiné** = S/P + taux de frais. S’il dépasse **100 %**, l’activité d’assurance perd de l’argent (avant produits financiers).`,
          sheet: {
            rows: [
              ['Branche', 'Primes', 'Sinistres', 'S/P'],
              ['Auto', 500000, 360000, '=C2/B2'],
              ['Habitation', 300000, 315000, '=C3/B3'],
            ],
            formats: { B: 'eur0', C: 'eur0', D: 'pct' },
          },
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Calculez en D2 le ratio S/P de chaque branche. Formule recopiée jusqu’en D5.',
          sheet: {
            rows: [
              ['Branche', 'Primes', 'Sinistres', 'S/P'],
              ['Auto', 820000, 590000, null],
              ['Habitation', 410000, 452000, null],
              ['Santé', 650000, 520000, null],
              ['Prévoyance', 230000, 98000, null],
            ],
            formats: { B: 'eur0', C: 'eur0', D: 'pct' },
          },
          target: 'D2',
          fillTo: 'D5',
          solution: '=C2/B2',
          explanation: 'Habitation dépasse 100 % : la branche paie plus de sinistres qu’elle n’encaisse de primes.',
        },
        {
          type: 'formula',
          prompt: 'Le taux de frais est en H1. Calculez en E2 le ratio combiné (S/P + frais) et affichez « Déficitaire » s’il dépasse 100 %, sinon « Rentable ». Formule recopiée jusqu’en E5.',
          sheet: {
            rows: [
              ['Branche', 'Primes', 'Sinistres', 'S/P', 'Diagnostic', '', 'Taux de frais', 0.25],
              ['Auto', 820000, 590000, '=C2/B2', null],
              ['Habitation', 410000, 452000, '=C3/B3', null],
              ['Santé', 650000, 520000, '=C4/B4', null],
              ['Prévoyance', 230000, 98000, '=C5/B5', null],
            ],
            formats: { B: 'eur0', C: 'eur0', D: 'pct', H1: 'pct' },
            widths: [100, 90, 90, 60, 110, 20, 100, 60],
          },
          target: 'E2',
          fillTo: 'E5',
          solution: '=SI(D2+$H$1>1;"Déficitaire";"Rentable")',
          requires: ['SI'],
          hint: '100 % s’écrit 1 (ou 100%) dans une formule.',
          explanation: 'Auto : 72 % + 25 % = 97 % → rentable. Santé : 80 % + 25 % = 105 % → déficitaire.',
        },
        {
          type: 'qcm',
          question: 'Une branche a un S/P de 65 % et un taux de frais de 30 %. Que vaut son ratio combiné ?',
          options: ['35 %', '95 %', '195 %', '19,5 %'],
          answer: 1,
          explanation: '65 % + 30 % = 95 % : il reste une marge technique de 5 % des primes.',
        },
        {
          type: 'numeric',
          prompt: 'Avec les deux fichiers (portefeuille et sinistres 2024), calculez le ratio S/P de la branche Habitation. Donnez le résultat en pourcentage (ex. : 87,5).',
          file: 'sinistres',
          answer: spHabitation * 100,
          tolerance: 0.1,
          unit: '%',
          hint: 'SOMME.SI sur les sinistres Habitation, divisé par SOMME.SI sur les primes Habitation du portefeuille.',
          explanation: 'Charge des sinistres Habitation / primes Habitation. Téléchargez aussi le fichier portefeuille depuis la page Ressources.',
        },
        {
          type: 'numeric',
          prompt: 'Combien de sinistres sont encore au statut « Ouvert » dans le fichier sinistres 2024 ?',
          file: 'sinistres',
          answer: nbOuverts,
          tolerance: 0,
          unit: 'sinistres',
          explanation: '=NB.SI(F:F;"Ouvert"). Les sinistres ouverts nécessitent une provision : l’assureur devra encore payer.',
        },
      ],
    },
    {
      id: 'portefeuille-5',
      title: 'Les tableaux croisés dynamiques',
      summary: 'Synthétiser des milliers de lignes en quelques clics.',
      theory: [
        {
          title: 'À quoi sert un TCD ?',
          body: `Un **tableau croisé dynamique** (TCD) résume un grand tableau sans écrire une seule formule : total des primes par région, nombre de sinistres par branche et par mois…

**Pour le créer :**
- Cliquez dans le tableau de données
- Menu **Insertion > Tableau croisé dynamique**
- Dans le volet de droite, glissez les champs dans les 4 zones`,
        },
        {
          title: 'Les 4 zones',
          body: `- **Lignes** : les catégories affichées en lignes (ex. : Région)
- **Colonnes** : les catégories affichées en colonnes (ex. : Branche)
- **Valeurs** : ce qu’on calcule (ex. : Somme de Prime, Nombre de Contrat)
- **Filtres** : pour restreindre l’analyse (ex. : Statut = Ouvert)

Après modification des données : clic droit > **Actualiser**. Un TCD ne se met pas à jour tout seul !`,
          tip: 'Bonne pratique : transformez d’abord vos données en « Tableau » (Ctrl+L). Le TCD inclura automatiquement les nouvelles lignes.',
        },
      ],
      exercises: [
        {
          type: 'qcm',
          question: 'Vous voulez le total des primes par région. Où placez-vous le champ « Région » ?',
          options: ['Valeurs', 'Lignes', 'Filtres', 'Nulle part, il faut une formule'],
          answer: 1,
          explanation: 'La catégorie à détailler va en Lignes (ou Colonnes) ; le montant à agréger (Prime) va en Valeurs.',
        },
        {
          type: 'qcm',
          question: 'Vous glissez « Contrat » (un texte) dans la zone Valeurs. Que calcule Excel ?',
          options: ['La somme', 'Le nombre', 'La moyenne', 'Une erreur'],
          answer: 1,
          explanation: 'Pour un champ texte, Excel propose « Nombre de ». Pour un champ numérique, « Somme de ». On peut changer via « Paramètres des champs de valeurs ».',
        },
        {
          type: 'qcm',
          question: 'Vous avez ajouté 50 contrats au tableau source. Le TCD n’a pas changé. Pourquoi ?',
          options: ['Il faut recréer le TCD', 'Il faut actualiser le TCD', 'Les TCD sont limités à 100 lignes', 'Il faut enregistrer le fichier'],
          answer: 1,
          explanation: 'Un TCD est un instantané : clic droit > Actualiser (ou Données > Actualiser tout).',
        },
        {
          type: 'numeric',
          prompt: 'Créez un TCD sur le portefeuille complet avec Région en lignes et Somme de Prime en valeurs. Quel est le total des primes de la région qui encaisse le plus ?',
          file: 'portefeuille',
          answer: Math.max(...primesParRegion),
          tolerance: 1,
          unit: '€',
          hint: 'Triez le TCD par ordre décroissant : clic droit sur une valeur > Trier.',
          explanation: 'Le TCD donne en quelques secondes ce qui demanderait 5 formules SOMME.SI.',
        },
      ],
    },
  ],
}

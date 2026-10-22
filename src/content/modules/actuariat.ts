import { chainLadder, lx, PORTEFEUILLE, SINISTRES, TRIANGLE } from '../../lib/datasets'
import type { Module, SheetSpec } from '../types'

const frequenceAuto =
  SINISTRES.filter((s) => s.branche === 'Auto').length / PORTEFEUILLE.filter((c) => c.branche === 'Auto').length

const TABLE_60: SheetSpec = {
  rows: [['Âge x', 'lx', 'dx', 'qx'], ...[60, 61, 62, 63, 64, 65].map((x) => [x, lx(x), null, null])],
  formats: { B: 'int', C: 'int', D: 'dec6' },
}

function petitTriangle(extra: Record<string, string | null> = {}): SheetSpec {
  const rows: SheetSpec['rows'] = [
    ['Survenance', 'Dév 1', 'Dév 2', 'Dév 3', 'Dév 4', 'Ultime'],
    [2021, 1000, 1500, 1650, 1700, null],
    [2022, 1100, 1680, 1850, null, null],
    [2023, 1200, 1790, null, null, null],
    [2024, 1300, null, null, null, null],
    ['Facteur', null, null, null, null, null],
  ]
  for (const [addr, v] of Object.entries(extra)) {
    const col = addr.charCodeAt(0) - 65
    const row = parseInt(addr.slice(1), 10) - 1
    rows[row][col] = v
  }
  return { rows, formats: { B: 'int', C: 'int', D: 'int', E: 'int', F: 'int', B6: 'dec4', C6: 'dec4', D6: 'dec4' } }
}

const FACTEURS = { B6: '=SOMME(C2:C4)/SOMME(B2:B4)', C6: '=SOMME(D2:D3)/SOMME(C2:C3)', D6: '=E2/D2' }

export const actuariat: Module = {
  id: 'actuariat',
  title: 'Actuariat et assurance',
  description: 'Prime pure, tables de mortalité, valeurs actuelles probables et provisionnement par la méthode Chain Ladder.',
  icon: '🛡️',
  color: '#c50f1f',
  level: 'Avancé',
  lessons: [
    {
      id: 'actuariat-1',
      title: 'Fréquence, coût moyen et prime pure',
      summary: 'Les briques de la tarification en assurance non-vie.',
      theory: [
        {
          title: 'La prime pure',
          body: `La **prime pure** est le coût moyen des sinistres par contrat. C’est ce que l’assureur doit encaisser, au minimum, pour payer les sinistres.

- **Fréquence** = nombre de sinistres / nombre de contrats (plus précisément, l’exposition en années-contrats)
- **Coût moyen** = charge totale des sinistres / nombre de sinistres
- **Prime pure** = fréquence × coût moyen = charge totale / nombre de contrats

Exemple : 1 000 contrats, 60 sinistres, coût moyen 2 500 € → fréquence 6 %, prime pure 150 €.`,
        },
        {
          title: 'De la prime pure à la prime commerciale',
          body: `L’assureur ajoute des **chargements** pour couvrir ses frais (gestion, commissions, acquisition) et sa marge.

Si les chargements représentent un taux **c** de la prime commerciale :
**Prime commerciale = prime pure / (1 − c)**

Avec une prime pure de 150 € et 25 % de chargements : 150 / 0,75 = **200 €**.`,
          tip: 'Attention : 150 × 1,25 = 187,50 € ne donne pas le même résultat. Tout dépend de la base des chargements.',
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Calculez en B5 la fréquence de sinistres du portefeuille.',
          sheet: {
            rows: [
              ['Indicateur', 'Valeur'],
              ['Nombre de contrats', 12000],
              ['Nombre de sinistres', 840],
              ['Charge des sinistres', 2940000],
              ['Fréquence', null],
            ],
            formats: { B4: 'eur0', B5: 'pct2' },
          },
          target: 'B5',
          solution: '=B3/B2',
          explanation: '840 / 12 000 = 7 % : en moyenne, 7 contrats sur 100 ont un sinistre dans l’année.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en B6 le coût moyen d’un sinistre.',
          sheet: {
            rows: [
              ['Indicateur', 'Valeur'],
              ['Nombre de contrats', 12000],
              ['Nombre de sinistres', 840],
              ['Charge des sinistres', 2940000],
              ['Fréquence', '=B3/B2'],
              ['Coût moyen', null],
            ],
            formats: { B4: 'eur0', B5: 'pct2', B6: 'eur' },
          },
          target: 'B6',
          solution: '=B4/B3',
          explanation: '2 940 000 / 840 = 3 500 €.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en B7 la prime pure à partir de la fréquence et du coût moyen.',
          sheet: {
            rows: [
              ['Indicateur', 'Valeur'],
              ['Nombre de contrats', 12000],
              ['Nombre de sinistres', 840],
              ['Charge des sinistres', 2940000],
              ['Fréquence', '=B3/B2'],
              ['Coût moyen', '=B4/B3'],
              ['Prime pure', null],
            ],
            formats: { B4: 'eur0', B5: 'pct2', B6: 'eur', B7: 'eur' },
          },
          target: 'B7',
          solution: '=B5*B6',
          explanation: '7 % × 3 500 € = 245 €, soit aussi 2 940 000 / 12 000.',
        },
        {
          type: 'formula',
          prompt: 'Les chargements représentent 28 % de la prime commerciale (B8). Calculez la prime commerciale en B9.',
          sheet: {
            rows: [
              ['Indicateur', 'Valeur'],
              ['Nombre de contrats', 12000],
              ['Nombre de sinistres', 840],
              ['Charge des sinistres', 2940000],
              ['Fréquence', '=B3/B2'],
              ['Coût moyen', '=B4/B3'],
              ['Prime pure', '=B5*B6'],
              ['Taux de chargement', 0.28],
              ['Prime commerciale', null],
            ],
            formats: { B4: 'eur0', B5: 'pct2', B6: 'eur', B7: 'eur', B8: 'pct', B9: 'eur' },
          },
          target: 'B9',
          solution: '=B7/(1-B8)',
          explanation: '245 / 0,72 = 340,28 €.',
        },
        {
          type: 'numeric',
          prompt: 'Avec les fichiers portefeuille et sinistres, calculez la fréquence de sinistres de la branche Auto, en % (ex. : 12,5).',
          file: 'sinistres',
          answer: frequenceAuto * 100,
          tolerance: 0.05,
          unit: '%',
          hint: 'NB.SI sur la branche dans le fichier sinistres, divisé par NB.SI sur la branche dans le portefeuille.',
          explanation: 'Nombre de sinistres Auto / nombre de contrats Auto. Ici, on suppose une exposition d’un an pour chaque contrat.',
        },
      ],
    },
    {
      id: 'actuariat-2',
      title: 'Les tables de mortalité',
      summary: 'lx, dx, qx : mesurer le risque de décès.',
      theory: [
        {
          title: 'Lire une table de mortalité',
          body: `Une table de mortalité suit une génération fictive de **100 000 naissances** :
- **lx** : nombre de survivants à l’âge x
- **dx = lx − lx+1** : nombre de décès entre x et x+1
- **qx = dx / lx** : probabilité de décéder dans l’année, pour une personne d’âge x
- **px = 1 − qx** : probabilité de survivre un an

Probabilité qu’une personne d’âge x soit encore en vie à l’âge x+n : **l(x+n) / l(x)**.

En France, les assureurs utilisent des tables réglementaires (TH/TF 00-02 pour les contrats décès, TGH/TGF 05 pour les rentes).`,
          sheet: TABLE_60,
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Calculez en C2 le nombre de décès dx entre 60 et 61 ans. Formule recopiée jusqu’en C6.',
          sheet: TABLE_60,
          target: 'C2',
          fillTo: 'C6',
          solution: '=B2-B3',
          explanation: 'dx = lx − lx+1. La ligne 65 reste vide car il faudrait l66.',
        },
        {
          type: 'formula',
          prompt: 'Les dx sont calculés. Calculez en D2 le taux de mortalité qx. Formule recopiée jusqu’en D6.',
          sheet: {
            ...TABLE_60,
            rows: TABLE_60.rows.map((r, i) => (i >= 1 && i <= 5 ? [r[0], r[1], `=B${i + 1}-B${i + 2}`, null] : r)),
          },
          target: 'D2',
          fillTo: 'D6',
          solution: '=C2/B2',
          explanation: 'qx augmente avec l’âge : c’est la loi de mortalité.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en G1 la probabilité qu’une personne de 60 ans soit encore en vie à 65 ans.',
          sheet: {
            ...TABLE_60,
            rows: TABLE_60.rows.map((r, i) => (i === 0 ? [...r, null, 'P(60 → 65)', null] : r)),
            formats: { ...TABLE_60.formats, G1: 'pct2' },
          },
          target: 'G1',
          solution: '=B7/B2',
          explanation: 'l65 / l60 : la part des survivants à 60 ans qui atteignent 65 ans.',
        },
        {
          type: 'qcm',
          question: 'Si qx = 0,012, que vaut px ?',
          options: ['0,012', '0,988', '1,012', '0,12'],
          answer: 1,
          explanation: 'On décède ou on survit dans l’année : px = 1 − qx = 0,988.',
        },
        {
          type: 'numeric',
          prompt: 'Avec la table de mortalité complète, quelle est la probabilité qu’une personne de 40 ans atteigne 70 ans ? Réponse en % (ex. : 78,25).',
          file: 'mortalite',
          answer: (lx(70) / lx(40)) * 100,
          tolerance: 0.01,
          unit: '%',
          hint: 'RECHERCHEV(70;A:B;2;FAUX) / RECHERCHEV(40;A:B;2;FAUX)',
          explanation: 'l70 / l40. Utiliser RECHERCHEV plutôt que de cliquer sur les cellules évite les erreurs de ligne.',
        },
      ],
    },
    {
      id: 'actuariat-3',
      title: 'Valeur actuelle probable',
      summary: 'Combiner actualisation et probabilités : capital différé et assurance décès.',
      theory: [
        {
          title: 'Actualiser ET probabiliser',
          body: `En assurance vie, un paiement futur n’est pas certain : il dépend de la survie (ou du décès) de l’assuré. Sa valeur aujourd’hui est la **valeur actuelle probable** :

**VAP = montant × probabilité du paiement × facteur d’actualisation**

**Capital différé** : l’assureur verse **C** dans **n** ans si l’assuré d’âge x est vivant :
\`Prime unique = C × l(x+n)/l(x) × 1/(1+r)^n\``,
        },
        {
          title: 'Assurance temporaire décès',
          body: `L’assureur verse **C** en fin d’année si l’assuré décède dans l’année.

Sur **1 an** : \`Prime = C × qx / (1 + r)\`

Sur **n ans** : on additionne les décès de chaque année, chacun actualisé :
\`Prime = C × Σ d(x+k) × v^(k+1) / l(x)\`, pour k = 0 à n−1

**SOMMEPROD** est idéale pour ce calcul : elle multiplie deux colonnes ligne à ligne puis additionne.`,
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Un assuré de 60 ans souscrit un capital différé : 100 000 € versés à 70 ans s’il est vivant. Calculez la prime unique en B7.',
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Capital', 100000],
              ['Taux technique', 0.02],
              ['Durée (ans)', 10],
              ['l60', lx(60)],
              ['l70', lx(70)],
              ['Prime unique', null],
            ],
            formats: { B2: 'eur0', B3: 'pct', B5: 'int', B6: 'int', B7: 'eur' },
          },
          target: 'B7',
          solution: '=B2*B6/B5/(1+B3)^B4',
          hint: 'Capital × probabilité de survie × facteur d’actualisation.',
          explanation: 'La prime est nettement inférieure à 100 000 € : on bénéficie à la fois de l’actualisation et de la mortalité.',
        },
        {
          type: 'formula',
          prompt: 'Assurance décès sur 1 an : capital de 200 000 € versé en fin d’année en cas de décès. Calculez la prime pure en B5.',
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Capital décès', 200000],
              ['Taux technique', 0.02],
              ['q45', 0.0021],
              ['Prime pure', null],
            ],
            formats: { B2: 'eur0', B3: 'pct', B4: 'dec4', B5: 'eur' },
          },
          target: 'B5',
          solution: '=B2*B4/(1+B3)',
          explanation: '200 000 × 0,0021 / 1,02 = 411,76 €.',
        },
        {
          type: 'formula',
          prompt: 'Temporaire décès 5 ans à 50 ans. Les décès dx et les facteurs v^(k+1) sont donnés. Calculez la prime unique en G4 avec SOMMEPROD.',
          sheet: {
            rows: [
              ['k', 'd(50+k)', 'v^(k+1)', '', '', 'Capital', 150000],
              [0, lx(50) - lx(51), '=1/(1+$G$2)^(A2+1)', null, null, 'Taux', 0.02],
              [1, lx(51) - lx(52), '=1/(1+$G$2)^(A3+1)', null, null, 'l50', lx(50)],
              [2, lx(52) - lx(53), '=1/(1+$G$2)^(A4+1)', null, null, 'Prime unique', null],
              [3, lx(53) - lx(54), '=1/(1+$G$2)^(A5+1)'],
              [4, lx(54) - lx(55), '=1/(1+$G$2)^(A6+1)'],
            ],
            formats: { B: 'int', C: 'dec4', G1: 'eur0', G2: 'pct', G3: 'int', G4: 'eur' },
            widths: [40, 80, 80, 20, 20, 100, 90],
          },
          target: 'G4',
          solution: '=G1*SOMMEPROD(B2:B6;C2:C6)/G3',
          requires: ['SOMMEPROD'],
          explanation: 'SOMMEPROD(B2:B6;C2:C6) additionne les d(50+k) × v^(k+1) ; on divise par l50 pour obtenir des probabilités.',
        },
        {
          type: 'qcm',
          question: 'Toutes choses égales par ailleurs, si le taux technique baisse, la prime d’un capital différé…',
          options: ['baisse', 'augmente', 'ne change pas', 'devient nulle'],
          answer: 1,
          explanation: 'On actualise moins : la valeur actuelle du capital futur est plus élevée, donc la prime aussi.',
        },
      ],
    },
    {
      id: 'actuariat-4',
      title: 'Provisionner : la méthode Chain Ladder',
      summary: 'Estimer ce qu’il reste à payer sur les sinistres déjà survenus.',
      theory: [
        {
          title: 'Le triangle de liquidation',
          body: `Un sinistre survenu en 2023 peut être payé sur plusieurs années (expertises, procédures, dommages corporels). L’assureur doit **provisionner** ce qu’il reste à payer.

On range les règlements **cumulés** dans un triangle :
- une **ligne** par année de survenance
- une **colonne** par année de développement (1ʳᵉ année, 2ᵉ année…)

Plus une année est récente, moins on a de recul : le triangle est incomplet en bas à droite.`,
          sheet: petitTriangle(),
        },
        {
          title: 'Les facteurs de développement',
          body: `La méthode **Chain Ladder** suppose que les années récentes se développeront comme les anciennes.

**Facteur de développement** de la colonne j vers j+1 : somme de la colonne j+1 divisée par la somme de la colonne j, **sur les mêmes années** (celles qui ont les deux valeurs).

f1 = (1500 + 1680 + 1790) / (1000 + 1100 + 1200)

**Charge ultime** d’une année = dernier montant connu × produit des facteurs restants.

**Provision** = charge ultime − montant déjà payé. Elle couvre notamment les **IBNR** (sinistres survenus mais pas encore déclarés) et les aggravations des sinistres connus.`,
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Calculez en B6 le facteur de développement f1 (de Dév 1 à Dév 2).',
          sheet: petitTriangle(),
          target: 'B6',
          solution: '=SOMME(C2:C4)/SOMME(B2:B4)',
          requires: ['SOMME'],
          hint: 'Seules les années 2021 à 2023 ont une valeur en Dév 2 : ne prenez pas 2024 au dénominateur.',
          explanation: '4 970 / 3 300 = 1,5061 : en moyenne, les règlements augmentent de 50,6 % entre la 1ʳᵉ et la 2ᵉ année.',
        },
        {
          type: 'formula',
          prompt: 'f1 est calculé. Calculez en C6 le facteur f2 (de Dév 2 à Dév 3).',
          sheet: petitTriangle({ B6: FACTEURS.B6 }),
          target: 'C6',
          solution: '=SOMME(D2:D3)/SOMME(C2:C3)',
          explanation: '3 500 / 3 180 = 1,1006.',
        },
        {
          type: 'formula',
          prompt: 'Tous les facteurs sont calculés. Calculez en F5 la charge ultime de l’année 2024.',
          sheet: petitTriangle(FACTEURS),
          target: 'F5',
          solution: '=B5*B6*C6*D6',
          hint: 'L’année 2024 n’a que Dév 1 : il faut appliquer f1, f2 et f3.',
          explanation: '1 300 × 1,5061 × 1,1006 × 1,0303 ≈ 2 220. Il reste donc environ 920 à payer.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en F4 la provision (et non la charge ultime) de l’année 2023.',
          sheet: petitTriangle(FACTEURS),
          target: 'F4',
          solution: '=C4*C6*D6-C4',
          explanation: 'Charge ultime (1 790 × f2 × f3) moins ce qui est déjà payé (1 790).',
        },
        {
          type: 'numeric',
          prompt: 'Appliquez Chain Ladder au fichier « Triangle de règlements » (6 années). Quelle est la provision totale, en k€ ?',
          file: 'triangle',
          answer: chainLadder(TRIANGLE).total,
          tolerance: 1,
          unit: 'k€',
          hint: 'Calculez les 5 facteurs, complétez le triangle, puis additionnez (ultime − dernier payé) sur chaque année.',
          explanation: 'L’année la plus récente concentre l’essentiel de la provision : c’est celle sur laquelle on a le moins de recul.',
        },
      ],
    },
  ],
}

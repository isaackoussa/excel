import { BUSINESS_PLAN, projeterBusinessPlan } from '../../lib/datasets'
import type { Module, SheetCell, SheetSpec } from '../types'

const bp = projeterBusinessPlan()
const netCumule = bp.reduce((a, y) => a + y.net, 0)
const spPointMort = 1 - BUSINESS_PLAN.frais + BUSINESS_PLAN.provisions * BUSINESS_PLAN.rendement

const COLS = ['B', 'C', 'D', 'E', 'F']
/** Les années de la ligne 1 s'affichent sans séparateur de milliers (2025, pas 2 025). */
const YEAR_HEADERS = Object.fromEntries(COLS.map((c) => [`${c}1`, 'general' as const]))

/** Ligne de projection : première année en dur (ou formule), années suivantes par formule. */
function line(label: string, first: SheetCell, next: ((col: string, prev: string) => string) | null, n = 5): SheetCell[] {
  return [label, first, ...COLS.slice(1, n).map((c, i) => (next ? next(c, COLS[i]) : null))]
}

/** Compte de résultat projeté sur 5 ans. `blank` vide une ligne pour l'exercice. */
function compteResultat(blank?: 'ca' | 'charges' | 'rai' | 'impot'): SheetSpec {
  const f = (row: string, make: (c: string, p: string) => string) => (c: string, p: string) => (blank === row ? '' : make(c, p))
  const first = (row: string, formula: string) => (blank === row ? null : formula)
  const rows: SheetSpec['rows'] = [
    ['(k€)', 2025, 2026, 2027, 2028, 2029],
    line('Chiffre d’affaires', 1000, f('ca', (_, p) => `=${p}2*(1+$B$10)`)),
    line('Charges', first('charges', '=B2*$B$11'), f('charges', (c) => `=${c}2*$B$11`)),
    line('Résultat avant impôt', first('rai', '=B2-B3'), f('rai', (c) => `=${c}2-${c}3`)),
    line('Impôt', first('impot', '=MAX(0;B4)*$B$12'), f('impot', (c) => `=MAX(0;${c}4)*$B$12`)),
    line('Résultat net', '=B4-B5', (c) => `=${c}4-${c}5`),
    [null],
    [null],
    ['Hypothèses', null],
    ['Croissance du CA', 0.05],
    ['Charges en % du CA', 0.82],
    ['Taux d’impôt', 0.25],
  ]
  // Les cellules vidées pour l'exercice deviennent null.
  return {
    rows: rows.map((r) => r.map((v) => (v === '' ? null : v))),
    formats: { B: 'int', C: 'int', D: 'int', E: 'int', F: 'int', ...YEAR_HEADERS, B10: 'pct', B11: 'pct', B12: 'pct' },
    widths: [150, 70, 70, 70, 70, 70],
  }
}

/** Valorisation DCF sur 5 ans. */
function dcf(extra: Record<string, string> = {}): SheetSpec {
  const rows: SheetSpec['rows'] = [
    ['Année', 1, 2, 3, 4, 5],
    ['Flux de trésorerie (FCF)', 120, 130, 140, 150, 160],
    ['Facteur d’actualisation', null, null, null, null, null],
    ['FCF actualisé', null, null, null, null, null],
    [null],
    ['WACC', 0.08],
    ['Croissance à l’infini', 0.02],
    [null],
    ['Somme des FCF actualisés', null],
    ['Valeur terminale', null],
    ['Valeur d’entreprise', null],
  ]
  for (const [addr, v] of Object.entries(extra)) {
    const col = addr.charCodeAt(0) - 65
    const row = parseInt(addr.slice(1), 10) - 1
    rows[row][col] = v
  }
  return {
    rows,
    formats: { B: 'int', C: 'int', D: 'int', E: 'int', F: 'int', B3: 'dec4', C3: 'dec4', D3: 'dec4', E3: 'dec4', F3: 'dec4', B6: 'pct', B7: 'pct', B9: 'int', B10: 'int', B11: 'int' },
    widths: [180, 70, 70, 70, 70, 70],
  }
}

const FACTEURS = Object.fromEntries(COLS.map((c) => [`${c}3`, `=1/(1+$B$6)^${c}1`]))
const ACTUALISES = Object.fromEntries(COLS.map((c) => [`${c}4`, `=${c}2*${c}3`]))

/** Business plan simplifié d'un assureur sur 3 ans. `blank` vide une ligne pour l'exercice. */
function assureur(blank?: 'sinistres' | 'technique' | 'financier' | 'combine'): SheetSpec {
  const yrs = ['B', 'C', 'D']
  const row = (key: string, label: string, make: (c: string, i: number) => string): SheetCell[] => [
    label,
    ...yrs.map((c, i) => (blank === key ? null : make(c, i))),
  ]
  return {
    rows: [
      ['(k€)', 2025, 2026, 2027],
      ['Primes', 50000, '=B2*(1+$B$14)', '=C2*(1+$B$14)'],
      row('sinistres', 'Sinistres', (c) => `=${c}2*$B$15`),
      ['Frais', ...yrs.map((c) => `=${c}2*$B$16`)],
      row('technique', 'Résultat technique', (c) => `=${c}2-${c}3-${c}4`),
      ['Provisions', ...yrs.map((c) => `=${c}2*$B$17`)],
      row('financier', 'Produits financiers', (c) => `=${c}6*$B$18`),
      ['Résultat avant impôt', ...yrs.map((c) => `=${c}5+${c}7`)],
      ['Impôt', ...yrs.map((c) => `=MAX(0;${c}8)*$B$19`)],
      ['Résultat net', ...yrs.map((c) => `=${c}8-${c}9`)],
      row('combine', 'Ratio combiné', (c) => `=(${c}3+${c}4)/${c}2`),
      [null],
      ['Hypothèses', null],
      ['Croissance des primes', 0.04],
      ['Ratio S/P', 0.76],
      ['Taux de frais', 0.27],
      ['Provisions / primes', 1.6],
      ['Rendement financier', 0.025],
      ['Taux d’impôt', 0.25],
    ],
    formats: { B: 'int', C: 'int', D: 'int', ...YEAR_HEADERS, B11: 'pct', C11: 'pct', D11: 'pct', B14: 'pct', B15: 'pct', B16: 'pct', B17: 'dec2', B18: 'pct2', B19: 'pct' },
    widths: [160, 80, 80, 80],
  }
}

export const modelisation: Module = {
  id: 'modelisation',
  title: 'Modélisation financière',
  description: 'Construire un modèle propre, projeter un compte de résultat, valoriser par les flux (DCF), tester des scénarios et bâtir le business plan d’un assureur.',
  icon: '📈',
  color: '#0e7490',
  level: 'Avancé',
  lessons: [
    {
      id: 'modelisation-1',
      title: 'Structurer un modèle',
      summary: 'Hypothèses, calculs, résultats et contrôles : les règles d’un modèle fiable.',
      theory: [
        {
          title: 'Qu’est-ce qu’un modèle financier ?',
          body: `Un **modèle financier** est un classeur qui traduit en chiffres le fonctionnement d’une entreprise ou d’un projet : chiffre d’affaires, charges, résultat, trésorerie, valeur. On s’en sert pour **prévoir** (budget, business plan), **décider** (investir ou non) et **évaluer** (combien vaut une société, une compagnie d’assurance, un portefeuille).

Un bon modèle se reconnaît à trois qualités : il est **juste**, **lisible** par quelqu’un d’autre et **facile à modifier**.`,
        },
        {
          title: 'Séparer hypothèses, calculs et résultats',
          body: `La règle d’or : chaque information n’est saisie **qu’une seule fois**, dans une zone d’**hypothèses** (taux de croissance, S/P, taux d’impôt…). Toutes les formules y font référence.

- **Hypothèses** : les seules valeurs tapées à la main
- **Calculs** : uniquement des formules, jamais de nombre « en dur »
- **Résultats** : la synthèse lue par le décideur

Si le taux de croissance change, on le modifie à un seul endroit et tout le modèle se met à jour.`,
          sheet: {
            rows: [
              ['Hypothèses', 'Valeur'],
              ['Nombre de contrats', 12000],
              ['Prime moyenne', 450],
              [null, null],
              ['Calculs', null],
              ['Primes encaissées', '=B2*B3'],
            ],
            formats: { B3: 'eur', B6: 'eur0' },
          },
        },
        {
          title: 'Conventions et contrôles',
          body: `Les modélisateurs utilisent un code couleur universel :
- **bleu** : valeur saisie (hypothèse)
- **noir** : formule
- **vert** : lien vers une autre feuille

On ajoute aussi des **contrôles** : des cellules qui vérifient la cohérence du modèle (actif = passif, total des parts = 100 %, capital restant dû = 0 à la fin du prêt…) et affichent « OK » ou « ERREUR ».`,
          tip: 'Une formule par ligne : la même formule, recopiée sur toutes les années. Une exception cachée dans une colonne est l’erreur la plus fréquente des modèles.',
        },
      ],
      exercises: [
        {
          type: 'qcm',
          question: 'Dans un modèle, on trouve la formule =B5*1,04 pour projeter le chiffre d’affaires. Quel est le problème ?',
          options: [
            'Aucun, la formule est juste',
            'Le taux de croissance est écrit en dur : il faudra le modifier dans chaque formule',
            'Il faut écrire 104 % au lieu de 1,04',
            'On ne peut pas multiplier une cellule par un nombre',
          ],
          answer: 1,
          explanation: 'Le taux de 4 % doit être une hypothèse dans une cellule dédiée, par exemple =B5*(1+$B$20).',
        },
        {
          type: 'qcm',
          question: 'Selon la convention des modélisateurs, de quelle couleur est une cellule d’hypothèse saisie à la main ?',
          options: ['Noir', 'Bleu', 'Rouge', 'Vert'],
          answer: 1,
          explanation: 'Bleu pour les saisies, noir pour les formules, vert pour les liens vers d’autres feuilles.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en B8 les frais de gestion à partir des primes encaissées (B7) et du taux de frais en hypothèse.',
          sheet: {
            rows: [
              ['Hypothèses', 'Valeur'],
              ['Nombre de contrats', 12000],
              ['Prime moyenne', 450],
              ['Taux de frais', 0.22],
              [null, null],
              ['Calculs', null],
              ['Primes encaissées', '=B2*B3'],
              ['Frais de gestion', null],
            ],
            formats: { B3: 'eur', B4: 'pct', B7: 'eur0', B8: 'eur0' },
          },
          target: 'B8',
          solution: '=B7*B4',
          explanation: '=B7*B4 donne 1 188 000 €. Aucune valeur n’est tapée dans la formule : tout vient des hypothèses.',
        },
        {
          type: 'formula',
          prompt: 'Créez en B4 un contrôle : affichez « OK » si l’actif et le passif sont égaux (à 1 centime près), sinon « ERREUR ».',
          sheet: {
            rows: [
              ['Bilan', 'Montant'],
              ['Total actif', 1254300.5],
              ['Total passif', 1254300.5],
              ['Contrôle', null],
            ],
            formats: { B2: 'eur', B3: 'eur' },
          },
          target: 'B4',
          solution: '=SI(ABS(B2-B3)<0,01;"OK";"ERREUR")',
          requires: ['SI'],
          hint: 'ABS donne la valeur absolue de l’écart : =SI(ABS(B2-B3)<0,01;…;…)',
          explanation: 'On tolère un écart minuscule car les calculs à virgule peuvent laisser des restes du type 0,0000001.',
        },
      ],
    },
    {
      id: 'modelisation-2',
      title: 'Projeter un compte de résultat',
      summary: 'Les années en colonnes, une formule recopiée vers la droite.',
      theory: [
        {
          title: 'La structure d’une projection',
          body: `Dans une projection, les **années sont en colonnes** et les **postes en lignes**. Chaque poste suit une logique simple, pilotée par une hypothèse :

- **Chiffre d’affaires** : CA de l’année précédente × (1 + croissance)
- **Charges** : CA × taux de charges
- **Résultat avant impôt** : CA − charges
- **Impôt** : résultat × taux d’impôt, mais **jamais négatif** : \`=MAX(0;résultat)*taux\`
- **Résultat net** : résultat avant impôt − impôt

On écrit la formule de la première année à projeter, puis on la **recopie vers la droite** (poignée de recopie ou Ctrl+R).`,
          sheet: compteResultat(),
          tip: 'Pour une recopie vers la droite, c’est la colonne qu’il faut bloquer dans les hypothèses : $B$10 ou $B10. Une référence B10 deviendrait C10, D10…',
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Projetez le chiffre d’affaires : en C2, CA de l’année précédente × (1 + croissance en B10). La formule sera recopiée vers la droite jusqu’en F2.',
          sheet: compteResultat('ca'),
          target: 'C2',
          fillTo: 'F2',
          solution: '=B2*(1+$B$10)',
          hint: 'B2 doit glisser vers C2, D2… mais la croissance doit rester en B10.',
          explanation: '=B2*(1+$B$10) : le CA passe de 1 000 à 1 216 k€ en 2029.',
        },
        {
          type: 'formula',
          prompt: 'Calculez les charges en B3 (CA × taux de charges en B11). Formule recopiée jusqu’en F3.',
          sheet: compteResultat('charges'),
          target: 'B3',
          fillTo: 'F3',
          solution: '=B2*$B$11',
          explanation: '=B2*$B$11 : 820 k€ de charges en 2025.',
        },
        {
          type: 'formula',
          prompt: 'Calculez le résultat avant impôt en B4. Formule recopiée jusqu’en F4.',
          sheet: compteResultat('rai'),
          target: 'B4',
          fillTo: 'F4',
          solution: '=B2-B3',
          explanation: 'CA − charges : 180 k€ en 2025.',
        },
        {
          type: 'formula',
          prompt: 'Calculez l’impôt en B5 avec le taux en B12. Un résultat négatif ne donne pas d’impôt négatif : utilisez MAX. Formule recopiée jusqu’en F5.',
          sheet: compteResultat('impot'),
          target: 'B5',
          fillTo: 'F5',
          solution: '=MAX(0;B4)*$B$12',
          requires: ['MAX'],
          explanation: '=MAX(0;B4)*$B$12 : 45 k€ d’impôt en 2025. Si le résultat devenait négatif, l’impôt resterait à 0.',
        },
        {
          type: 'qcm',
          question: 'Votre directeur veut voir l’effet d’une croissance de 8 % au lieu de 5 %. Que faites-vous dans un modèle bien construit ?',
          options: [
            'Je réécris les formules de chiffre d’affaires',
            'Je modifie uniquement la cellule d’hypothèse B10',
            'Je copie le modèle dans un nouveau classeur',
            'Je recalcule à la main',
          ],
          answer: 1,
          explanation: 'C’est tout l’intérêt de séparer les hypothèses : un seul changement, et tout le compte de résultat se met à jour.',
        },
      ],
    },
    {
      id: 'modelisation-3',
      title: 'Valoriser par les flux : la méthode DCF',
      summary: 'Flux de trésorerie disponibles, actualisation et valeur terminale.',
      theory: [
        {
          title: 'Le flux de trésorerie disponible (FCF)',
          body: `Une entreprise vaut ce qu’elle va **rapporter en trésorerie** à l’avenir. Le **flux de trésorerie disponible** (*free cash flow*) d’une année :

**FCF = résultat d’exploitation × (1 − impôt) + amortissements − investissements − variation du BFR**

- Les **amortissements** sont réintégrés car ce sont des charges sans sortie d’argent
- Les **investissements** (*capex*) et la hausse du **besoin en fonds de roulement** consomment de la trésorerie`,
        },
        {
          title: 'Actualiser et ajouter la valeur terminale',
          body: `On actualise chaque FCF au **coût moyen pondéré du capital** (WACC), le rendement exigé par les actionnaires et les prêteurs :
\`FCF actualisé = FCF / (1 + WACC)^année\`

Au-delà de la dernière année projetée, on suppose une croissance constante **g** : c’est la **valeur terminale** (formule de Gordon-Shapiro) :
**VT = FCF dernière année × (1 + g) / (WACC − g)**

**Valeur d’entreprise = somme des FCF actualisés + VT actualisée**`,
          sheet: dcf({ ...FACTEURS, ...ACTUALISES, B9: '=SOMME(B4:F4)', B10: '=F2*(1+B7)/(B6-B7)', B11: '=B9+B10*F3' }),
          tip: 'La valeur terminale représente souvent plus de la moitié de la valeur : le choix de g et du WACC est donc décisif.',
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Calculez en B7 le flux de trésorerie disponible de l’année.',
          sheet: {
            rows: [
              ['Poste (k€)', 'Montant'],
              ['Résultat d’exploitation', 500],
              ['Taux d’impôt', 0.25],
              ['Amortissements', 80],
              ['Investissements', 120],
              ['Variation du BFR', 30],
              ['Flux de trésorerie disponible', null],
            ],
            formats: { B3: 'pct' },
            widths: [220, 90],
          },
          target: 'B7',
          solution: '=B2*(1-B3)+B4-B5-B6',
          explanation: '500 × 75 % + 80 − 120 − 30 = 305 k€.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en B3 le facteur d’actualisation 1/(1+WACC)^année (WACC en B6, année en ligne 1). Formule recopiée jusqu’en F3.',
          sheet: dcf(ACTUALISES),
          target: 'B3',
          fillTo: 'F3',
          solution: '=1/(1+$B$6)^B1',
          explanation: 'Le WACC est bloqué ($B$6), l’année B1 glisse vers C1, D1… Les FCF actualisés de la ligne 4 se calculent aussitôt.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en B10 la valeur terminale (Gordon-Shapiro) à partir du dernier FCF (F2), du WACC (B6) et de la croissance à l’infini (B7).',
          sheet: dcf({ ...FACTEURS, ...ACTUALISES, B9: '=SOMME(B4:F4)' }),
          target: 'B10',
          solution: '=F2*(1+B7)/(B6-B7)',
          explanation: '160 × 1,02 / (8 % − 2 %) = 2 720 k€.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en B11 la valeur d’entreprise : somme des FCF actualisés (B9) + valeur terminale (B10) actualisée avec le facteur de l’année 5 (F3).',
          sheet: dcf({ ...FACTEURS, ...ACTUALISES, B9: '=SOMME(B4:F4)', B10: '=F2*(1+B7)/(B6-B7)' }),
          target: 'B11',
          solution: '=B9+B10*F3',
          explanation: 'La valeur terminale est estimée à la fin de l’année 5 : on l’actualise donc avec le facteur de l’année 5.',
        },
        {
          type: 'qcm',
          question: 'Pourquoi la formule de la valeur terminale exige-t-elle que g soit inférieur au WACC ?',
          options: [
            'C’est une convention comptable',
            'Sinon le dénominateur est nul ou négatif et la valeur devient infinie ou absurde',
            'Parce que g doit toujours être négatif',
            'Excel refuse les taux supérieurs',
          ],
          answer: 1,
          explanation: 'WACC − g doit être positif. En pratique, g reste proche de la croissance de long terme de l’économie (1 à 2 %).',
        },
      ],
    },
    {
      id: 'modelisation-4',
      title: 'Scénarios et sensibilités',
      summary: 'Tester le modèle : CHOISIR, tables de sensibilité et valeur cible.',
      theory: [
        {
          title: 'Un sélecteur de scénarios',
          body: `On présente souvent trois jeux d’hypothèses : **pessimiste**, **central** et **optimiste**. Une cellule « scénario » (1, 2 ou 3) choisit lequel alimente le modèle :

\`=CHOISIR(numéro; valeur1; valeur2; valeur3)\` renvoie la valeur correspondant au numéro.

Alternative : \`=INDEX(B2:D2; numéro)\`.`,
          sheet: {
            rows: [
              ['Hypothèse', 'Pessimiste', 'Central', 'Optimiste'],
              ['Croissance', -0.02, 0.03, 0.06],
              ['Ratio S/P', 0.8, 0.72, 0.65],
              [null],
              ['Scénario (1 à 3)', 2],
              ['Croissance retenue', '=CHOISIR($B$5;B2;C2;D2)'],
              ['S/P retenu', '=CHOISIR($B$5;B3;C3;D3)'],
            ],
            formats: { B2: 'pct', C2: 'pct', D2: 'pct', B3: 'pct', C3: 'pct', D3: 'pct', B6: 'pct', B7: 'pct' },
            widths: [150, 90, 90, 90],
          },
        },
        {
          title: 'Sensibilités et valeur cible',
          body: `- **Table de sensibilité** : on fait varier une hypothèse (taux, croissance, S/P) et on observe le résultat. Excel l’automatise avec **Données > Analyse de scénarios > Table de données**, à une ou deux variables.
- **Valeur cible** (Données > Analyse de scénarios > Valeur cible) : Excel cherche la valeur d’une hypothèse qui donne le résultat voulu. Par exemple : « quel S/P donne un résultat nul ? » (le **point mort**).
- **Gestionnaire de scénarios** : enregistre plusieurs jeux d’hypothèses et produit un rapport de synthèse.`,
          tip: 'Une sensibilité bien présentée répond à la question du décideur : « à partir de quand le projet ne vaut plus le coup ? »',
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Le numéro de scénario est en B5. En B6, récupérez la croissance du scénario choisi avec CHOISIR. La formule sera recopiée en B7 pour le S/P.',
          sheet: {
            rows: [
              ['Hypothèse', 'Pessimiste', 'Central', 'Optimiste'],
              ['Croissance', -0.02, 0.03, 0.06],
              ['Ratio S/P', 0.8, 0.72, 0.65],
              [null],
              ['Scénario (1 à 3)', 3],
              ['Croissance retenue', null],
              ['S/P retenu', null],
            ],
            formats: { B2: 'pct', C2: 'pct', D2: 'pct', B3: 'pct', C3: 'pct', D3: 'pct', B6: 'pct', B7: 'pct' },
            widths: [150, 90, 90, 90],
          },
          target: 'B6',
          fillTo: 'B7',
          solution: '=CHOISIR($B$5;B2;C2;D2)',
          hint: 'Le numéro de scénario doit être bloqué ($B$5), les valeurs doivent descendre d’une ligne.',
          explanation: 'Scénario 3 : 6 % de croissance et 65 % de S/P. =INDEX(B2:D2;$B$5) fonctionne aussi.',
        },
        {
          type: 'formula',
          prompt: 'Table de sensibilité : calculez en B2 la VAN du projet (flux en E2:E7, investissement en E2) pour le taux indiqué en A2. Formule recopiée jusqu’en B6.',
          sheet: {
            rows: [
              ['Taux', 'VAN', null, 'Année', 'Flux'],
              [0.04, null, null, 0, -1000],
              [0.06, null, null, 1, 250],
              [0.08, null, null, 2, 250],
              [0.1, null, null, 3, 250],
              [0.12, null, null, 4, 250],
              [null, null, null, 5, 250],
            ],
            formats: { A: 'pct', B: 'int', E: 'int' },
            widths: [60, 80, 20, 60, 80],
          },
          target: 'B2',
          fillTo: 'B6',
          solution: '=$E$2+VAN(A2;$E$3:$E$7)',
          requires: ['VAN'],
          hint: 'Le taux A2 descend, les flux restent bloqués. N’oubliez pas l’investissement de l’année 0 hors de VAN.',
          explanation: 'La VAN devient négative entre 6 % et 8 % : c’est là que se situe le TRI du projet.',
        },
        {
          type: 'formula',
          prompt: 'Point mort : combien de contrats faut-il vendre pour couvrir les frais fixes ? Calculez-le en B5 (frais fixes / marge par contrat).',
          sheet: {
            rows: [
              ['Hypothèse', 'Valeur'],
              ['Frais fixes annuels', 1800000],
              ['Prime moyenne', 600],
              ['Coût variable par contrat', 450],
              ['Point mort (contrats)', null],
            ],
            formats: { B2: 'eur0', B3: 'eur0', B4: 'eur0', B5: 'int' },
            widths: [200, 110],
          },
          target: 'B5',
          solution: '=B2/(B3-B4)',
          explanation: '1 800 000 / (600 − 450) = 12 000 contrats. Au-delà, chaque contrat vendu dégage 150 € de bénéfice.',
        },
        {
          type: 'qcm',
          question: 'Vous voulez savoir quel ratio S/P rend le résultat exactement nul. Quel outil Excel utilisez-vous ?',
          options: ['La table de données', 'La valeur cible', 'Le tableau croisé dynamique', 'La mise en forme conditionnelle'],
          answer: 1,
          explanation: 'Valeur cible : « cellule à définir » = résultat, « valeur à atteindre » = 0, « cellule à modifier » = S/P.',
        },
        {
          type: 'qcm',
          question: 'Une table de données à deux entrées croise le WACC (en lignes) et la croissance g (en colonnes). Que contient chaque case ?',
          options: [
            'La moyenne des deux taux',
            'La valeur d’entreprise calculée avec ce WACC et ce g',
            'Le TRI du projet',
            'Une erreur si les taux sont différents',
          ],
          answer: 1,
          explanation: 'Excel recalcule tout le modèle pour chaque couple d’hypothèses : on voit d’un coup d’œil la fourchette de valorisation.',
        },
      ],
    },
    {
      id: 'modelisation-5',
      title: 'Le business plan d’un assureur',
      summary: 'Projeter primes, sinistres, frais et produits financiers d’une compagnie d’assurance.',
      theory: [
        {
          title: 'Comment gagne un assureur ?',
          body: `Le compte de résultat d’un assureur non-vie repose sur deux moteurs :

- Le **résultat technique** = primes − sinistres − frais. Il est positif si le **ratio combiné** (S/P + taux de frais) est inférieur à 100 %.
- Le **résultat financier** : l’assureur encaisse les primes **avant** de payer les sinistres. En attendant, il place ces sommes (les **provisions**) et en tire des **produits financiers**.

Un assureur peut donc avoir un résultat technique légèrement négatif et rester bénéficiaire grâce à ses placements.`,
        },
        {
          title: 'Le modèle',
          body: `- **Primes** : année précédente × (1 + croissance)
- **Sinistres** = primes × S/P ; **frais** = primes × taux de frais
- **Provisions** ≈ primes × un coefficient (en assurance de responsabilité, les sinistres se règlent sur plusieurs années, donc les provisions dépassent les primes)
- **Produits financiers** = provisions × rendement des placements
- **Impôt** = MAX(0 ; résultat avant impôt) × taux`,
          sheet: assureur(),
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Calculez les sinistres en B3 (primes × S/P en B15). Formule recopiée jusqu’en D3.',
          sheet: assureur('sinistres'),
          target: 'B3',
          fillTo: 'D3',
          solution: '=B2*$B$15',
          explanation: '50 000 × 76 % = 38 000 k€ de sinistres en 2025.',
        },
        {
          type: 'formula',
          prompt: 'Calculez le résultat technique en B5 (primes − sinistres − frais). Formule recopiée jusqu’en D5.',
          sheet: assureur('technique'),
          target: 'B5',
          fillTo: 'D5',
          solution: '=B2-B3-B4',
          explanation: '50 000 − 38 000 − 13 500 = −1 500 k€ : le ratio combiné de 103 % rend l’activité technique déficitaire.',
        },
        {
          type: 'formula',
          prompt: 'Calculez les produits financiers en B7 (provisions × rendement en B18). Formule recopiée jusqu’en D7. Regardez ensuite le résultat net.',
          sheet: assureur('financier'),
          target: 'B7',
          fillTo: 'D7',
          solution: '=B6*$B$18',
          explanation: '80 000 × 2,5 % = 2 000 k€ : les placements compensent la perte technique et le résultat net redevient positif.',
        },
        {
          type: 'formula',
          prompt: 'Calculez le ratio combiné en B11 : (sinistres + frais) / primes. Formule recopiée jusqu’en D11.',
          sheet: assureur('combine'),
          target: 'B11',
          fillTo: 'D11',
          solution: '=(B3+B4)/B2',
          explanation: '(38 000 + 13 500) / 50 000 = 103 %.',
        },
        {
          type: 'qcm',
          question: 'Les taux d’intérêt baissent fortement et le rendement des placements passe de 2,5 % à 0,5 %. Que devient cet assureur ?',
          options: [
            'Rien ne change, seul le résultat technique compte',
            'Son résultat devient négatif : il devra augmenter ses tarifs ou réduire ses frais',
            'Ses sinistres baissent',
            'Ses provisions disparaissent',
          ],
          answer: 1,
          explanation: 'Avec 0,5 %, les produits financiers ne couvrent plus la perte technique. C’est ce qui a poussé les assureurs à viser des ratios combinés sous 100 % pendant les années de taux bas.',
        },
        {
          type: 'numeric',
          prompt: 'Téléchargez le fichier « Business plan d’un assureur » et construisez la projection sur 5 ans. Quel est le résultat net cumulé sur les 5 années (en k€) ?',
          file: 'businessplan',
          answer: netCumule,
          tolerance: 1,
          unit: 'k€',
          hint: 'Construisez une ligne par poste, puis additionnez la ligne Résultat net.',
          explanation: 'Vérifiez que toutes vos formules pointent vers l’onglet Hypothèses : changez le S/P et tout doit bouger.',
        },
        {
          type: 'numeric',
          prompt: 'Avec la Valeur cible, trouvez le ratio S/P qui rend le résultat avant impôt exactement nul. Donnez-le en % (ex. : 81,5).',
          file: 'businessplan',
          answer: spPointMort * 100,
          tolerance: 0.05,
          unit: '%',
          hint: 'Données > Analyse de scénarios > Valeur cible : cellule à définir = résultat avant impôt de l’année 1, valeur = 0, cellule à modifier = S/P.',
          explanation: 'Au point mort : 1 − S/P − frais + provisions × rendement = 0, soit S/P = 1 − 21 % + 1,8 × 2,8 %.',
        },
      ],
    },
  ],
}

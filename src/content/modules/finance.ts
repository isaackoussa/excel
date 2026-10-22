import { EMPRUNT, mensualite } from '../../lib/datasets'
import type { Module, SheetSpec } from '../types'

const mens = mensualite(EMPRUNT.capital, EMPRUNT.taux, EMPRUNT.mois)

/** Tableau d'amortissement annuel : 10 000 € à 4 % sur 5 ans. */
function amortissement(opts: { interets: boolean; amortissement: boolean }): SheetSpec {
  const rows: SheetSpec['rows'] = [
    ['Année', 'Capital début', 'Annuité', 'Intérêts', 'Amortissement', 'Capital fin', '', 'Capital', 10000],
  ]
  for (let i = 0; i < 5; i++) {
    const r = i + 2
    rows.push([
      i + 1,
      i === 0 ? '=$I$1' : `=F${r - 1}`,
      '=VPM($I$2;$I$3;-$I$1)',
      opts.interets ? `=B${r}*$I$2` : null,
      opts.amortissement ? `=C${r}-D${r}` : null,
      `=B${r}-E${r}`,
      ...(i === 0 ? ['', 'Taux', 0.04] : i === 1 ? ['', 'Durée (ans)', 5] : []),
    ])
  }
  return {
    rows,
    formats: { B: 'eur', C: 'eur', D: 'eur', E: 'eur', F: 'eur', I1: 'eur0', I2: 'pct', I3: 'general' },
    widths: [55, 105, 90, 90, 115, 100, 20, 90, 75],
  }
}

export const finance: Module = {
  id: 'finance',
  title: 'Mathématiques financières',
  description: 'Intérêts composés, actualisation, crédit, tableau d’amortissement, VAN et TRI avec les fonctions financières d’Excel.',
  icon: '💶',
  color: '#8a3ffc',
  level: 'Intermédiaire',
  lessons: [
    {
      id: 'finance-1',
      title: 'Intérêts composés et valeur future',
      summary: 'Faire fructifier un capital : formule et fonction VC.',
      theory: [
        {
          title: 'Intérêts simples ou composés',
          body: `Un capital **C** placé au taux **r** pendant **n** années :
- en **intérêts simples**, rapporte toujours les mêmes intérêts : valeur = \`C × (1 + r × n)\`
- en **intérêts composés**, les intérêts produisent eux-mêmes des intérêts : valeur = \`C × (1 + r)^n\`

En finance et en assurance, on raisonne presque toujours en intérêts composés.`,
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Capital', 10000],
              ['Taux annuel', 0.03],
              ['Durée (ans)', 10],
              ['Valeur acquise', '=B2*(1+B3)^B4'],
            ],
            formats: { B2: 'eur', B3: 'pct', B5: 'eur' },
          },
        },
        {
          title: 'La fonction VC (valeur capitalisée)',
          body: `\`=VC(taux; nb_périodes; versement; [valeur_actuelle]; [type])\`

**Convention de signe** : Excel raisonne en flux de trésorerie. L’argent qui **sort** de votre poche est **négatif**, l’argent que vous **recevez** est **positif**.

Placer 10 000 € : \`=VC(3%;10;0;-10000)\` → **+13 439,16 €** que vous récupérerez.

**Taux et périodes doivent être cohérents** : pour des versements mensuels, taux mensuel = taux annuel / 12 et nombre de périodes = années × 12.`,
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Calculez en B5 la valeur acquise du capital avec la formule des intérêts composés (sans fonction).',
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Capital', 15000],
              ['Taux annuel', 0.025],
              ['Durée (ans)', 8],
              ['Valeur acquise', null],
            ],
            formats: { B2: 'eur', B3: 'pct2', B5: 'eur' },
          },
          target: 'B5',
          solution: '=B2*(1+B3)^B4',
          explanation: '=B2*(1+B3)^B4 donne 18 276,04 €. L’opérateur ^ signifie « puissance ».',
        },
        {
          type: 'formula',
          prompt: 'Même calcul avec la fonction VC. Le résultat doit être positif (vous récupérez l’argent).',
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Capital', 15000],
              ['Taux annuel', 0.025],
              ['Durée (ans)', 8],
              ['Valeur acquise', null],
            ],
            formats: { B2: 'eur', B3: 'pct2', B5: 'eur' },
          },
          target: 'B5',
          solution: '=VC(B3;B4;0;-B2)',
          requires: ['VC'],
          hint: 'Pas de versement périodique (0) et une valeur actuelle négative : vous déposez le capital.',
          explanation: '=VC(B3;B4;0;-B2) donne le même résultat que la formule.',
        },
        {
          type: 'formula',
          prompt: 'Un épargnant verse 200 € par mois pendant 10 ans sur un contrat rémunéré à 2,4 % par an. Calculez en B5 l’épargne constituée.',
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Versement mensuel', 200],
              ['Taux annuel', 0.024],
              ['Durée (ans)', 10],
              ['Épargne finale', null],
            ],
            formats: { B2: 'eur', B3: 'pct2', B5: 'eur' },
          },
          target: 'B5',
          solution: '=VC(B3/12;B4*12;-B2)',
          requires: ['VC'],
          hint: 'Taux mensuel = B3/12 ; nombre de mois = B4*12 ; le versement sort de votre poche.',
          explanation: '=VC(B3/12;B4*12;-B2) donne environ 27 094 €, pour 24 000 € versés.',
        },
        {
          type: 'qcm',
          question: 'Pourquoi =VC(3%;10;0;10000) renvoie-t-il un nombre négatif ?',
          options: [
            'Parce que le taux est trop faible',
            'Parce qu’un capital positif est vu comme de l’argent reçu : il faudra donc le rembourser (flux négatif)',
            'C’est une erreur d’Excel',
            'Parce qu’il manque le type',
          ],
          answer: 1,
          explanation: 'Si vous recevez 10 000 € aujourd’hui (emprunt), vous devrez rendre 13 439 € plus tard : un flux sortant, donc négatif.',
        },
      ],
    },
    {
      id: 'finance-2',
      title: 'Actualiser : la valeur actuelle',
      summary: 'Ramener des flux futurs à aujourd’hui : VA et facteurs d’actualisation.',
      theory: [
        {
          title: 'Pourquoi actualiser ?',
          body: `1 000 € reçus dans 5 ans valent **moins** que 1 000 € aujourd’hui : on pourrait placer la somme entre-temps.

**Valeur actuelle** d’un montant **M** reçu dans **n** années au taux **r** : \`M / (1 + r)^n\`

Le **facteur d’actualisation** \`v = 1 / (1 + r)\` est central en assurance vie : les engagements de l’assureur (rentes, capitaux décès) sont payés dans le futur et doivent être actualisés pour être provisionnés.`,
        },
        {
          title: 'La fonction VA',
          body: `\`=VA(taux; nb_périodes; versement; [valeur_future]; [type])\`

Valeur aujourd’hui d’une **rente** de 1 200 € par an pendant 15 ans à 3 % :
\`=VA(3%;15;-1200)\` → 14 325,52 €

Le paramètre **type** vaut 0 si les versements ont lieu en fin de période (par défaut), 1 s’ils ont lieu en début de période.`,
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Un assuré recevra un capital de 50 000 € dans 6 ans. Calculez en B5 sa valeur actuelle au taux de 3,5 % (sans fonction).',
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Capital futur', 50000],
              ['Taux', 0.035],
              ['Durée (ans)', 6],
              ['Valeur actuelle', null],
            ],
            formats: { B2: 'eur', B3: 'pct2', B5: 'eur' },
          },
          target: 'B5',
          solution: '=B2/(1+B3)^B4',
          explanation: '=B2/(1+B3)^B4 donne 40 675,03 €.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en B2 le facteur d’actualisation v^t = 1/(1+taux)^t pour chaque année t (en A). Le taux est en E1. Formule recopiée jusqu’en B6.',
          sheet: {
            rows: [
              ['t', 'Facteur v^t', '', 'Taux', 0.03],
              [1, null],
              [2, null],
              [3, null],
              [4, null],
              [5, null],
            ],
            formats: { B: 'dec4', E1: 'pct' },
          },
          target: 'B2',
          fillTo: 'B6',
          solution: '=1/(1+$E$1)^A2',
          explanation: 'On obtient 0,9709 ; 0,9426 ; 0,9151… Ces facteurs sont la base de tous les calculs actuariels.',
        },
        {
          type: 'formula',
          prompt: 'Une rente de 1 500 € par an est versée pendant 20 ans, en fin d’année. Calculez en B5 sa valeur actuelle au taux de 2 % avec VA (résultat positif).',
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Rente annuelle', 1500],
              ['Taux', 0.02],
              ['Durée (ans)', 20],
              ['Valeur actuelle', null],
            ],
            formats: { B2: 'eur', B3: 'pct', B5: 'eur' },
          },
          target: 'B5',
          solution: '=VA(B3;B4;-B2)',
          requires: ['VA'],
          explanation: '=VA(B3;B4;-B2) donne 24 527,15 € : c’est le capital qu’il faut détenir aujourd’hui pour servir la rente.',
        },
        {
          type: 'qcm',
          question: 'Si le taux d’actualisation augmente, la valeur actuelle d’un engagement futur…',
          options: ['augmente', 'diminue', 'ne change pas', 'devient négative'],
          answer: 1,
          explanation: 'On divise par (1 + r)^n, plus grand. C’est pourquoi une hausse des taux réduit les provisions des assureurs vie.',
        },
      ],
    },
    {
      id: 'finance-3',
      title: 'Le crédit : calculer une mensualité',
      summary: 'VPM, coût du crédit et capacité d’emprunt.',
      theory: [
        {
          title: 'La fonction VPM',
          body: `\`=VPM(taux; nb_périodes; valeur_actuelle)\` calcule le **versement constant** qui rembourse un emprunt.

Prêt de 200 000 € à 3,5 % sur 20 ans, remboursé **mensuellement** :
\`=VPM(3,5%/12; 20*12; -200000)\` → **1 159,92 €** par mois

Le montant emprunté est mis en négatif pour obtenir une mensualité positive.`,
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Capital', 200000],
              ['Taux annuel', 0.035],
              ['Durée (ans)', 20],
              ['Mensualité', '=VPM(B3/12;B4*12;-B2)'],
              ['Coût total', '=B5*B4*12-B2'],
            ],
            formats: { B2: 'eur0', B3: 'pct2', B5: 'eur', B6: 'eur' },
          },
        },
        {
          title: 'Coût du crédit et capacité d’emprunt',
          body: `- **Coût total du crédit** = total des mensualités − capital emprunté
- **Capacité d’emprunt** : à l’inverse, si on connaît la mensualité maximale, \`=VA(taux/12; mois; -mensualité)\` donne le capital qu’on peut emprunter

Les banques limitent généralement la mensualité à 35 % des revenus.`,
          tip: 'L’assurance emprunteur (décès, invalidité) s’ajoute souvent à la mensualité : c’est un gros marché pour les assureurs.',
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Calculez en B5 la mensualité d’un prêt auto de 25 000 € à 4,8 % sur 5 ans.',
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Capital', 25000],
              ['Taux annuel', 0.048],
              ['Durée (ans)', 5],
              ['Mensualité', null],
            ],
            formats: { B2: 'eur0', B3: 'pct2', B5: 'eur' },
          },
          target: 'B5',
          solution: '=VPM(B3/12;B4*12;-B2)',
          requires: ['VPM'],
          hint: 'Taux mensuel et nombre de mois ; capital en négatif.',
          explanation: '=VPM(B3/12;B4*12;-B2) donne 469,49 €.',
        },
        {
          type: 'formula',
          prompt: 'La mensualité est calculée en B5. Calculez en B6 le coût total du crédit (intérêts payés).',
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Capital', 25000],
              ['Taux annuel', 0.048],
              ['Durée (ans)', 5],
              ['Mensualité', '=VPM(B3/12;B4*12;-B2)'],
              ['Coût du crédit', null],
            ],
            formats: { B2: 'eur0', B3: 'pct2', B5: 'eur', B6: 'eur' },
          },
          target: 'B6',
          solution: '=B5*B4*12-B2',
          explanation: '60 mensualités de 469,49 € moins les 25 000 € empruntés : environ 3 169,61 € d’intérêts.',
        },
        {
          type: 'formula',
          prompt: 'Un ménage peut rembourser au maximum 1 100 € par mois sur 25 ans, au taux de 3,8 %. Calculez en B5 le capital qu’il peut emprunter.',
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Mensualité max', 1100],
              ['Taux annuel', 0.038],
              ['Durée (ans)', 25],
              ['Capacité d’emprunt', null],
            ],
            formats: { B2: 'eur', B3: 'pct2', B5: 'eur' },
          },
          target: 'B5',
          solution: '=VA(B3/12;B4*12;-B2)',
          requires: ['VA'],
          explanation: '=VA(B3/12;B4*12;-B2) : environ 212 825 €.',
        },
        {
          type: 'qcm',
          question: 'Pour un prêt à 6 % par an remboursé mensuellement, quel taux utiliser dans VPM ?',
          options: ['6%', '6%/12', '6%*12', '(1+6%)^12'],
          answer: 1,
          explanation: 'La périodicité du taux doit correspondre à celle des versements : 0,5 % par mois.',
        },
        {
          type: 'numeric',
          prompt: 'Ouvrez le fichier « Emprunt immobilier ». Quelle est la mensualité du prêt ? (au centime près)',
          file: 'emprunt',
          answer: mens,
          tolerance: 0.01,
          unit: '€',
          explanation: '=VPM(B3/12;B4;-B2) : attention, la durée est déjà exprimée en mois dans le fichier.',
        },
      ],
    },
    {
      id: 'finance-4',
      title: 'Le tableau d’amortissement',
      summary: 'Décomposer chaque échéance en intérêts et capital remboursé.',
      theory: [
        {
          title: 'Construction ligne par ligne',
          body: `Chaque échéance (constante) se décompose en :
- **Intérêts** = capital restant dû en début de période × taux
- **Amortissement** (capital remboursé) = échéance − intérêts
- **Capital fin** = capital début − amortissement

Le capital début d’une période est le capital fin de la précédente. À la dernière ligne, le capital fin doit valoir **0**.

Au début, l’échéance sert surtout à payer des intérêts ; à la fin, surtout à rembourser le capital.`,
          sheet: amortissement({ interets: true, amortissement: true }),
          tip: 'Cliquez sur les cellules pour voir comment chaque colonne est calculée.',
        },
        {
          title: 'INTPER et PRINCPER',
          body: `Pour obtenir directement les intérêts ou le capital remboursé d’une période donnée :
- \`=INTPER(taux; période; nb_périodes; va)\` : part d’intérêts
- \`=PRINCPER(taux; période; nb_périodes; va)\` : part de capital

Avec \`va\` négatif, les résultats sont positifs.`,
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Complétez la colonne Intérêts : en D2, capital début × taux (I2). Votre formule sera recopiée jusqu’en D6 et tout le tableau se mettra à jour.',
          sheet: amortissement({ interets: false, amortissement: true }),
          target: 'D2',
          fillTo: 'D6',
          solution: '=B2*$I$2',
          explanation: '=B2*$I$2 : le capital début suit la ligne, le taux est bloqué. Le capital fin de l’année 5 tombe bien à 0.',
        },
        {
          type: 'formula',
          prompt: 'Complétez la colonne Amortissement : en E2, l’annuité moins les intérêts. Formule recopiée jusqu’en E6.',
          sheet: amortissement({ interets: true, amortissement: false }),
          target: 'E2',
          fillTo: 'E6',
          solution: '=C2-D2',
          explanation: 'L’amortissement augmente chaque année, puisque les intérêts diminuent avec le capital restant dû.',
        },
        {
          type: 'formula',
          prompt: 'Sans le tableau, calculez directement en B5 les intérêts payés la 3ᵉ année avec INTPER (résultat positif).',
          sheet: {
            rows: [
              ['Paramètre', 'Valeur'],
              ['Capital', 10000],
              ['Taux', 0.04],
              ['Durée (ans)', 5],
              ['Intérêts année 3', null],
            ],
            formats: { B2: 'eur0', B3: 'pct', B5: 'eur' },
          },
          target: 'B5',
          solution: '=INTPER(B3;3;B4;-B2)',
          requires: ['INTPER'],
          explanation: '=INTPER(B3;3;B4;-B2) donne 249,34 €, comme la ligne 3 du tableau.',
        },
        {
          type: 'qcm',
          question: 'Dans un tableau d’amortissement à échéances constantes, comment évoluent les intérêts au fil du temps ?',
          options: ['Ils augmentent', 'Ils diminuent', 'Ils restent constants', 'Ils sont nuls la première année'],
          answer: 1,
          explanation: 'Les intérêts sont calculés sur le capital restant dû, qui diminue à chaque échéance.',
        },
        {
          type: 'numeric',
          prompt: 'Avec le fichier « Emprunt immobilier », construisez le tableau d’amortissement mensuel complet (240 lignes). Quel est le coût total des intérêts ?',
          file: 'emprunt',
          answer: mens * EMPRUNT.mois - EMPRUNT.capital,
          tolerance: 1,
          unit: '€',
          hint: 'Somme de la colonne Intérêts, ou directement : mensualité × 240 − capital.',
          explanation: 'Les deux méthodes doivent donner le même résultat : c’est un bon moyen de vérifier votre tableau.',
        },
      ],
    },
    {
      id: 'finance-5',
      title: 'Évaluer un investissement : VAN et TRI',
      summary: 'Décider si un projet crée de la valeur.',
      theory: [
        {
          title: 'La valeur actuelle nette (VAN)',
          body: `La **VAN** est la somme des flux d’un projet actualisés, investissement initial compris :

**VAN = −Investissement + Σ Flux_t / (1 + r)^t**

- VAN > 0 : le projet rapporte plus que le taux exigé **r** → on investit
- VAN < 0 : on renonce

**Piège classique** : la fonction \`VAN(taux; flux)\` d’Excel actualise **dès le premier flux**. L’investissement initial (en t = 0) doit donc être ajouté **en dehors** :
\`=B2+VAN(8%;B3:B7)\``,
          sheet: {
            rows: [
              ['Année', 'Flux'],
              [0, -100000],
              [1, 25000],
              [2, 30000],
              [3, 30000],
              [4, 25000],
              [5, 20000],
              ['VAN à 8 %', '=B2+VAN(8%;B3:B7)'],
              ['TRI', '=TRI(B2:B7)'],
            ],
            formats: { B: 'eur0', B8: 'eur', B9: 'pct2' },
          },
        },
        {
          title: 'Le taux de rentabilité interne (TRI)',
          body: `Le **TRI** est le taux pour lequel la VAN est nulle. C’est la rentabilité « intrinsèque » du projet.

\`=TRI(B2:B7)\` (flux de t = 0 à la fin, investissement compris)

Règle : on investit si **TRI > taux exigé**.`,
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Calculez en B9 la VAN du projet au taux indiqué en E1. Attention au flux de l’année 0 !',
          sheet: {
            rows: [
              ['Année', 'Flux', '', 'Taux exigé', 0.07],
              [0, -250000],
              [1, 60000],
              [2, 70000],
              [3, 70000],
              [4, 65000],
              [5, 50000],
              [null, null],
              ['VAN', null],
            ],
            formats: { B: 'eur0', B9: 'eur', E1: 'pct' },
          },
          target: 'B9',
          solution: '=B2+VAN(E1;B3:B7)',
          requires: ['VAN'],
          explanation: '=B2+VAN(E1;B3:B7) donne une VAN positive : le projet rapporte plus de 7 %.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en B9 le TRI du projet.',
          sheet: {
            rows: [
              ['Année', 'Flux'],
              [0, -250000],
              [1, 60000],
              [2, 70000],
              [3, 70000],
              [4, 65000],
              [5, 50000],
              [null, null],
              ['TRI', null],
            ],
            formats: { B: 'eur0', B9: 'pct2' },
          },
          target: 'B9',
          solution: '=TRI(B2:B7)',
          requires: ['TRI'],
          explanation: 'Le TRI est supérieur à 7 %, ce qui confirme le signe positif de la VAN.',
        },
        {
          type: 'qcm',
          question: 'Un analyste écrit =VAN(8%;B2:B7) en incluant l’investissement initial dans la plage. Quelle est l’erreur ?',
          options: [
            'Aucune erreur',
            'L’investissement initial est actualisé d’une année alors qu’il a lieu aujourd’hui',
            'Le taux doit être écrit 0,08',
            'VAN ne fonctionne qu’avec des flux positifs',
          ],
          answer: 1,
          explanation: 'VAN actualise le premier flux d’une période. Le flux de t = 0 doit être ajouté hors de la fonction.',
        },
        {
          type: 'qcm',
          question: 'Un projet a un TRI de 5,2 %. Le taux exigé par l’assureur est de 6 %. Que faire ?',
          options: ['Investir', 'Ne pas investir', 'Impossible à dire sans la VAN', 'Investir uniquement si la durée dépasse 5 ans'],
          answer: 1,
          explanation: 'TRI < taux exigé ⇔ VAN < 0 au taux exigé : le projet détruit de la valeur.',
        },
      ],
    },
  ],
}

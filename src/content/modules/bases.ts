import type { Module } from '../types'

export const bases: Module = {
  id: 'bases',
  title: 'Les bases d’Excel',
  description: 'Cellules, formules, fonctions essentielles, références absolues et conditions : tout ce qu’il faut pour démarrer.',
  icon: '📊',
  color: '#107c41',
  level: 'Débutant',
  lessons: [
    {
      id: 'bases-1',
      title: 'Découvrir le tableur',
      summary: 'Cellules, lignes, colonnes et première formule.',
      theory: [
        {
          title: 'Une feuille = une grille de cellules',
          body: `Une feuille Excel est une grille. Les **colonnes** sont repérées par des lettres (A, B, C…) et les **lignes** par des numéros (1, 2, 3…).

Chaque case s’appelle une **cellule** et possède une **adresse** : la lettre de la colonne puis le numéro de la ligne. La cellule à l’intersection de la colonne B et de la ligne 3 s’appelle donc **B3**.

Dans l’exemple ci-dessous, la prime du contrat C002 se trouve en **C3**.`,
          sheet: {
            rows: [
              ['Contrat', 'Assuré', 'Prime'],
              ['C001', 'Camille Martin', 540],
              ['C002', 'Lucas Bernard', 780],
              ['C003', 'Léa Dubois', 615],
            ],
            formats: { C: 'eur' },
          },
          tip: 'Cliquez sur une cellule de l’exemple : son adresse s’affiche dans la barre de formule.',
        },
        {
          title: 'Écrire une formule',
          body: `Une formule commence **toujours** par le signe \`=\`. Elle peut contenir :
- des nombres : \`=540*12\`
- des **références** à d’autres cellules : \`=C2+C3\`
- des opérateurs : \`+\` addition, \`-\` soustraction, \`*\` multiplication, \`/\` division, \`^\` puissance

L’avantage des références : si la valeur de C2 change, le résultat se met à jour tout seul. C’est le principe même du tableur.`,
          sheet: {
            rows: [
              ['Libellé', 'Valeur'],
              ['Prime mensuelle', 45],
              ['Nombre de mois', 12],
              ['Prime annuelle', '=B2*B3'],
            ],
            formats: { B2: 'eur', B4: 'eur' },
          },
          tip: 'Cliquez sur B4 pour voir la formule qui calcule la prime annuelle.',
        },
      ],
      exercises: [
        {
          type: 'qcm',
          question: 'Quelle est l’adresse de la cellule située colonne D, ligne 7 ?',
          options: ['D7', '7D', 'L7C4', 'D-7'],
          answer: 0,
          explanation: 'On écrit toujours la lettre de la colonne, puis le numéro de la ligne : D7.',
        },
        {
          type: 'qcm',
          question: 'Par quel caractère doit commencer une formule ?',
          options: ['$', '=', '#', '@'],
          answer: 1,
          explanation: 'Le signe = indique à Excel qu’il doit calculer le contenu de la cellule au lieu de l’afficher tel quel.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en B4 la prime annuelle à partir de la prime mensuelle (B2) et du nombre de mois (B3).',
          sheet: {
            rows: [
              ['Libellé', 'Valeur'],
              ['Prime mensuelle', 62.5],
              ['Nombre de mois', 12],
              ['Prime annuelle', null],
            ],
            formats: { B2: 'eur', B4: 'eur' },
          },
          target: 'B4',
          solution: '=B2*B3',
          hint: 'Multipliez les deux cellules avec l’opérateur *.',
          explanation: '=B2*B3 donne 750 €. Utiliser les références plutôt que « =62,5*12 » permet de mettre à jour le calcul automatiquement.',
        },
        {
          type: 'formula',
          prompt: 'Trois sinistres ont été déclarés. Calculez leur montant total en B5.',
          sheet: {
            rows: [
              ['Sinistre', 'Montant'],
              ['Bris de glace', 420],
              ['Dégât des eaux', 2350],
              ['Vol', 1180],
              ['Total', null],
            ],
            formats: { B: 'eur' },
          },
          target: 'B5',
          solution: '=B2+B3+B4',
          explanation: '=B2+B3+B4 donne 3 950 €. Dans la leçon suivante, vous verrez la fonction SOMME, plus pratique quand il y a beaucoup de lignes.',
        },
        {
          type: 'formula',
          prompt: 'Une prime est de 900 € par an. Elle est réglée en 4 échéances trimestrielles sans frais. Calculez le montant d’une échéance en B4.',
          sheet: {
            rows: [
              ['Libellé', 'Valeur'],
              ['Prime annuelle', 900],
              ['Nombre d’échéances', 4],
              ['Montant par échéance', null],
            ],
            formats: { B2: 'eur', B4: 'eur' },
          },
          target: 'B4',
          solution: '=B2/B3',
          explanation: '=B2/B3 donne 225 € par trimestre.',
        },
      ],
    },
    {
      id: 'bases-2',
      title: 'Les fonctions essentielles',
      summary: 'SOMME, MOYENNE, MIN, MAX et NB sur une plage de cellules.',
      theory: [
        {
          title: 'Les plages de cellules',
          body: `Une **plage** désigne un bloc de cellules contiguës. On l’écrit avec deux-points : \`B2:B6\` signifie « de B2 jusqu’à B6 », soit 5 cellules.

Une plage peut aussi couvrir plusieurs colonnes : \`A2:C6\` est un rectangle de 3 colonnes sur 5 lignes.`,
        },
        {
          title: 'Les fonctions',
          body: `Une **fonction** est un calcul prêt à l’emploi. Elle s’écrit \`NOM(arguments)\`. Dans Excel en français, les arguments sont séparés par un **point-virgule** \`;\`.

- \`=SOMME(B2:B6)\` additionne la plage
- \`=MOYENNE(B2:B6)\` calcule la moyenne
- \`=MIN(B2:B6)\` et \`=MAX(B2:B6)\` donnent la plus petite et la plus grande valeur
- \`=NB(B2:B6)\` compte les cellules contenant un nombre`,
          sheet: {
            rows: [
              ['Sinistre', 'Montant'],
              ['S001', 1200],
              ['S002', 350],
              ['S003', 4800],
              ['S004', 920],
              ['S005', 2730],
              ['Total', '=SOMME(B2:B6)'],
              ['Moyenne', '=MOYENNE(B2:B6)'],
            ],
            formats: { B: 'eur' },
          },
          tip: 'Ici l’application accepte aussi les noms anglais (SUM, AVERAGE…) et la virgule comme séparateur, mais prenez l’habitude des noms français : c’est ce que vous verrez dans Excel en français.',
        },
      ],
      exercises: [
        {
          type: 'qcm',
          question: 'Combien de cellules contient la plage A2:A10 ?',
          options: ['8', '9', '10', '2'],
          answer: 1,
          explanation: 'De la ligne 2 à la ligne 10 incluses : 10 − 2 + 1 = 9 cellules.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en B8 le total des primes encaissées avec la fonction SOMME.',
          sheet: {
            rows: [
              ['Contrat', 'Prime'],
              ['C001', 540],
              ['C002', 780],
              ['C003', 615],
              ['C004', 1020],
              ['C005', 455],
              ['C006', 890],
              ['Total', null],
            ],
            formats: { B: 'eur' },
          },
          target: 'B8',
          solution: '=SOMME(B2:B7)',
          requires: ['SOMME'],
          explanation: '=SOMME(B2:B7) donne 4 300 €.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en B8 la prime moyenne du portefeuille.',
          sheet: {
            rows: [
              ['Contrat', 'Prime'],
              ['C001', 540],
              ['C002', 780],
              ['C003', 615],
              ['C004', 1020],
              ['C005', 455],
              ['C006', 890],
              ['Moyenne', null],
            ],
            formats: { B: 'eur' },
          },
          target: 'B8',
          solution: '=MOYENNE(B2:B7)',
          requires: ['MOYENNE'],
          explanation: '=MOYENNE(B2:B7) donne environ 716,67 €.',
        },
        {
          type: 'formula',
          prompt: 'Quel est le plus gros sinistre de la liste ? Affichez-le en B8.',
          sheet: {
            rows: [
              ['Sinistre', 'Montant'],
              ['S001', 1200],
              ['S002', 350],
              ['S003', 4800],
              ['S004', 920],
              ['S005', 12730],
              ['S006', 2100],
              ['Plus gros', null],
            ],
            formats: { B: 'eur' },
          },
          target: 'B8',
          solution: '=MAX(B2:B7)',
          requires: ['MAX'],
          explanation: '=MAX(B2:B7) renvoie 12 730 €. En assurance, on surveille les « sinistres graves » qui pèsent lourd dans les résultats.',
        },
        {
          type: 'formula',
          prompt: 'Certains contrats n’ont pas encore de prime saisie. Comptez en B8 le nombre de primes renseignées.',
          sheet: {
            rows: [
              ['Contrat', 'Prime'],
              ['C001', 540],
              ['C002', null],
              ['C003', 615],
              ['C004', 'à saisir'],
              ['C005', 455],
              ['C006', 890],
              ['Nb primes', null],
            ],
            formats: { B: 'eur' },
          },
          target: 'B8',
          solution: '=NB(B2:B7)',
          requires: ['NB'],
          explanation: 'NB ne compte que les nombres : 4. Pour compter toutes les cellules non vides (texte compris), on utiliserait NBVAL.',
        },
      ],
    },
    {
      id: 'bases-3',
      title: 'Références relatives et absolues',
      summary: 'Recopier une formule sans erreur grâce au symbole $.',
      theory: [
        {
          title: 'La recopie de formules',
          body: `Quand on recopie une formule vers le bas (poignée de recopie ou Ctrl+D), Excel **décale les références**. La formule \`=B2*C2\` écrite en D2 devient \`=B3*C3\` en D3, \`=B4*C4\` en D4, etc.

C’est une **référence relative** : elle est relative à la position de la formule. C’est très pratique pour appliquer le même calcul à chaque ligne.`,
        },
        {
          title: 'Bloquer une référence avec $',
          body: `Parfois, une cellule doit rester **fixe** : un taux de taxe, un taux de commission, un taux d’intérêt… On ajoute alors un \`$\` devant la colonne et/ou la ligne :
- \`$F$1\` : colonne et ligne bloquées (**référence absolue**)
- \`F$1\` : seule la ligne est bloquée
- \`$F1\` : seule la colonne est bloquée

Dans Excel, la touche **F4** ajoute les \`$\` automatiquement.`,
          sheet: {
            rows: [
              ['Contrat', 'Prime HT', 'Prime TTC', '', 'Taxe', 0.09],
              ['C001', 500, '=B2*(1+$F$1)', null, null, null],
              ['C002', 800, '=B3*(1+$F$1)', null, null, null],
              ['C003', 650, '=B4*(1+$F$1)', null, null, null],
            ],
            formats: { B: 'eur', C: 'eur', F1: 'pct' },
          },
          tip: 'Cliquez sur C2, C3 puis C4 : la référence B change, mais $F$1 reste identique.',
        },
      ],
      exercises: [
        {
          type: 'qcm',
          question: 'La formule =A2*B2 est en C2. On la recopie en C5. Que devient-elle ?',
          options: ['=A2*B2', '=A5*B5', '=A5*B2', '=D5*E5'],
          answer: 1,
          explanation: 'Les deux références sont relatives : elles descendent de 3 lignes, comme la formule.',
        },
        {
          type: 'qcm',
          question: 'Quelle référence reste identique, quelle que soit la cellule où l’on recopie la formule ?',
          options: ['F1', 'F$1', '$F1', '$F$1'],
          answer: 3,
          explanation: '$F$1 bloque à la fois la colonne et la ligne : c’est une référence absolue.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en C2 la commission du courtier : prime × taux de commission (en F1). Votre formule sera recopiée jusqu’en C6 : pensez à bloquer le taux !',
          sheet: {
            rows: [
              ['Contrat', 'Prime', 'Commission', '', 'Taux de commission', 0.12],
              ['C001', 540, null],
              ['C002', 780, null],
              ['C003', 615, null],
              ['C004', 1020, null],
              ['C005', 455, null],
            ],
            formats: { B: 'eur', C: 'eur', F1: 'pct' },
            widths: [80, 90, 110, 30, 150, 70],
          },
          target: 'C2',
          fillTo: 'C6',
          solution: '=B2*$F$1',
          hint: 'Sans $, la référence F1 deviendrait F2, F3… qui sont vides.',
          explanation: '=B2*$F$1 : B2 est relative (elle suit la ligne), $F$1 est absolue (le taux ne bouge pas).',
        },
        {
          type: 'formula',
          prompt: 'Calculez en C2 la prime TTC, sachant que la taxe (en F1) s’ajoute à la prime HT. La formule sera recopiée jusqu’en C6.',
          sheet: {
            rows: [
              ['Contrat', 'Prime HT', 'Prime TTC', '', 'Taux de taxe', 0.09],
              ['C001', 540, null],
              ['C002', 780, null],
              ['C003', 615, null],
              ['C004', 1020, null],
              ['C005', 455, null],
            ],
            formats: { B: 'eur', C: 'eur', F1: 'pct' },
            widths: [80, 90, 110, 30, 120, 70],
          },
          target: 'C2',
          fillTo: 'C6',
          solution: '=B2*(1+$F$1)',
          hint: 'Prime TTC = Prime HT × (1 + taux). N’oubliez pas les parenthèses.',
          explanation: '=B2*(1+$F$1) : les parenthèses sont indispensables, sinon Excel calcule B2×1 puis ajoute 9 %.',
        },
      ],
    },
    {
      id: 'bases-4',
      title: 'Les conditions avec SI',
      summary: 'Afficher un résultat différent selon une condition : SI, ET, OU.',
      theory: [
        {
          title: 'La fonction SI',
          body: `\`=SI(condition; valeur_si_vrai; valeur_si_faux)\`

La condition compare deux valeurs avec \`=\`, \`<>\` (différent), \`<\`, \`>\`, \`<=\`, \`>=\`.

Exemple : \`=SI(B2>10000;"Grave";"Standard")\` classe un sinistre comme grave s’il dépasse 10 000 €. Le texte s’écrit **entre guillemets**.`,
          sheet: {
            rows: [
              ['Sinistre', 'Montant', 'Catégorie'],
              ['S001', 2300, '=SI(B2>10000;"Grave";"Standard")'],
              ['S002', 18500, '=SI(B3>10000;"Grave";"Standard")'],
              ['S003', 760, '=SI(B4>10000;"Grave";"Standard")'],
            ],
            formats: { B: 'eur' },
          },
        },
        {
          title: 'Combiner des conditions : ET, OU',
          body: `- \`ET(cond1; cond2)\` est vrai si **toutes** les conditions sont vraies
- \`OU(cond1; cond2)\` est vrai si **au moins une** condition est vraie

Exemple : un jeune conducteur paie une surprime s’il a moins de 25 ans **ou** moins de 3 ans de permis :
\`=SI(OU(B2<25;C2<3);"Surprime";"Normal")\``,
        },
        {
          title: 'Franchise : un cas typique',
          body: `La **franchise** est la part du sinistre qui reste à la charge de l’assuré. L’assureur indemnise : montant − franchise, mais jamais un montant négatif.

\`=SI(B2>F1;B2-F1;0)\`, ou plus court : \`=MAX(0;B2-F1)\``,
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'En C2, affichez « Grave » si le montant du sinistre dépasse 10 000 €, sinon « Standard ». La formule sera recopiée jusqu’en C6.',
          sheet: {
            rows: [
              ['Sinistre', 'Montant', 'Catégorie'],
              ['S001', 2300, null],
              ['S002', 18500, null],
              ['S003', 760, null],
              ['S004', 10000, null],
              ['S005', 42000, null],
            ],
            formats: { B: 'eur' },
          },
          target: 'C2',
          fillTo: 'C6',
          solution: '=SI(B2>10000;"Grave";"Standard")',
          requires: ['SI'],
          explanation: 'Attention à S004 : 10 000 n’est pas strictement supérieur à 10 000, il est donc « Standard ».',
        },
        {
          type: 'formula',
          prompt: 'Calculez en C2 l’indemnité versée après application de la franchise (F1). Si le sinistre est inférieur à la franchise, l’indemnité est 0. Formule recopiée jusqu’en C6.',
          sheet: {
            rows: [
              ['Sinistre', 'Montant', 'Indemnité', '', 'Franchise', 300],
              ['S001', 1250, null],
              ['S002', 180, null],
              ['S003', 300, null],
              ['S004', 4600, null],
              ['S005', 95, null],
            ],
            formats: { B: 'eur', C: 'eur', F1: 'eur' },
          },
          target: 'C2',
          fillTo: 'C6',
          solution: '=SI(B2>$F$1;B2-$F$1;0)',
          hint: 'Utilisez SI (ou MAX) et bloquez la franchise avec $.',
          explanation: '=SI(B2>$F$1;B2-$F$1;0) ou =MAX(0;B2-$F$1) donnent le même résultat.',
        },
        {
          type: 'qcm',
          question: 'Que renvoie =ET(25>18; 3>5) ?',
          options: ['VRAI', 'FAUX', '#VALEUR!', '2'],
          answer: 1,
          explanation: 'ET exige que toutes les conditions soient vraies. 3>5 est faux, donc le résultat est FAUX.',
        },
        {
          type: 'formula',
          prompt: 'En D2, affichez « Surprime » si l’assuré a moins de 25 ans OU moins de 3 ans de permis, sinon « Normal ». Formule recopiée jusqu’en D6.',
          sheet: {
            rows: [
              ['Assuré', 'Âge', 'Ans de permis', 'Tarif'],
              ['Hugo', 22, 4, null],
              ['Chloé', 34, 1, null],
              ['Louis', 45, 25, null],
              ['Manon', 19, 1, null],
              ['Nathan', 28, 8, null],
            ],
          },
          target: 'D2',
          fillTo: 'D6',
          solution: '=SI(OU(B2<25;C2<3);"Surprime";"Normal")',
          requires: ['SI', 'OU'],
          explanation: 'Hugo (22 ans), Chloé (1 an de permis) et Manon cumulent au moins un critère : ils ont une surprime.',
        },
      ],
    },
    {
      id: 'bases-5',
      title: 'Pourcentages et arrondis',
      summary: 'Taux d’évolution, parts en pourcentage et fonction ARRONDI.',
      theory: [
        {
          title: 'Les pourcentages dans Excel',
          body: `Un pourcentage est un nombre comme un autre : **12 %** vaut **0,12**. Le format « pourcentage » ne change que l’affichage.

- **Taux d’évolution** : \`=(nouvelle valeur − ancienne valeur) / ancienne valeur\`
- **Part** d’un élément dans un total : \`=élément / total\` (avec le total bloqué par des $ si on recopie)`,
          sheet: {
            rows: [
              ['Année', 'Primes', 'Évolution'],
              [2023, 1250000, null],
              [2024, 1340000, '=(B3-B2)/B2'],
            ],
            formats: { B: 'eur0', C: 'pct2' },
          },
        },
        {
          title: 'Arrondir',
          body: `\`=ARRONDI(nombre; nb_décimales)\` arrondit au plus proche. \`ARRONDI(12,345;2)\` donne **12,35**.

Variantes : \`ARRONDI.SUP\` (toujours vers le haut) et \`ARRONDI.INF\` (toujours vers le bas).

Important : le format d’affichage n’arrondit **pas** la valeur. Si un calcul doit utiliser une prime arrondie au centime, il faut utiliser ARRONDI.`,
        },
      ],
      exercises: [
        {
          type: 'formula',
          prompt: 'Calculez en C3 le taux d’évolution du chiffre d’affaires entre 2023 et 2024.',
          sheet: {
            rows: [
              ['Année', 'Primes', 'Évolution'],
              [2023, 2400000, null],
              [2024, 2580000, null],
            ],
            formats: { B: 'eur0', C: 'pct2' },
          },
          target: 'C3',
          solution: '=(B3-B2)/B2',
          explanation: '(2 580 000 − 2 400 000) / 2 400 000 = 7,5 %. On peut aussi écrire =B3/B2-1.',
        },
        {
          type: 'formula',
          prompt: 'Calculez en C2 la part de chaque branche dans le total des primes (B6). Formule recopiée jusqu’en C5.',
          sheet: {
            rows: [
              ['Branche', 'Primes', 'Part'],
              ['Auto', 450000, null],
              ['Habitation', 230000, null],
              ['Santé', 180000, null],
              ['Prévoyance', 140000, null],
              ['Total', '=SOMME(B2:B5)', null],
            ],
            formats: { B: 'eur0', C: 'pct' },
          },
          target: 'C2',
          fillTo: 'C5',
          solution: '=B2/$B$6',
          explanation: '=B2/$B$6 : le total doit être bloqué, sinon la recopie diviserait par B7, B8… qui sont vides (#DIV/0!).',
        },
        {
          type: 'formula',
          prompt: 'La prime mensuelle est la prime annuelle divisée par 12. Calculez-la en B3, arrondie au centime.',
          sheet: {
            rows: [
              ['Libellé', 'Valeur'],
              ['Prime annuelle', 1000],
              ['Prime mensuelle', null],
            ],
            formats: { B: 'general' },
          },
          target: 'B3',
          solution: '=ARRONDI(B2/12;2)',
          requires: ['ARRONDI'],
          explanation: '1000 / 12 = 83,3333… et =ARRONDI(B2/12;2) donne 83,33.',
        },
        {
          type: 'qcm',
          question: 'Une cellule contient 0,075 et est affichée au format pourcentage. Qu’affiche-t-elle ?',
          options: ['0,075 %', '7,5 %', '75 %', '0,75 %'],
          answer: 1,
          explanation: '0,075 × 100 = 7,5 %. Le format multiplie seulement l’affichage par 100.',
        },
      ],
    },
  ],
}

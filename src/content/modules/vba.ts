import { SINISTRES } from '../../lib/datasets'
import type { Module } from '../types'

const ouvertsPlus2000 = SINISTRES.filter((s) => s.statut === 'Ouvert' && s.montant > 2000).length
const chargeOuverts = SINISTRES.filter((s) => s.statut === 'Ouvert').reduce((a, s) => a + s.montant, 0)

export const vba: Module = {
  id: 'vba',
  title: 'VBA : automatiser Excel',
  description: 'Macros, variables, cellules, boucles, fonctions personnalisées et automatisation d’un reporting sinistres.',
  icon: '⚙️',
  color: '#ca5010',
  level: 'Avancé',
  lessons: [
    {
      id: 'vba-1',
      title: 'Premiers pas avec VBA',
      summary: 'L’éditeur, les modules et votre première macro.',
      theory: [
        {
          title: 'Qu’est-ce que VBA ?',
          body: `**VBA** (*Visual Basic for Applications*) est le langage de programmation intégré à Excel. Il sert à **automatiser** les tâches répétitives : importer des fichiers, mettre en forme un reporting, contrôler des données, générer des courriers…

**Pour commencer :**
- Affichez l’onglet **Développeur** : Fichier > Options > Personnaliser le ruban > cocher « Développeur »
- Ouvrez l’éditeur VBA avec **Alt + F11**
- Menu **Insertion > Module** pour créer une feuille de code
- Enregistrez le classeur au format **.xlsm** (classeur prenant en charge les macros), sinon le code est perdu`,
        },
        {
          title: 'Une procédure Sub',
          body: `Une macro est une **procédure** qui commence par \`Sub NomDeLaMacro()\` et se termine par \`End Sub\`. On l’exécute avec **F5** dans l’éditeur, ou depuis Excel par Développeur > Macros.

\`MsgBox\` affiche une boîte de message. Les textes s’écrivent entre guillemets. Une ligne commençant par une apostrophe \`'\` est un **commentaire**, ignoré par VBA.`,
          code: `Sub Bonjour()
    ' Ma première macro
    MsgBox "Bienvenue dans le reporting sinistres !"
End Sub`,
        },
        {
          title: 'L’enregistreur de macros',
          body: `Développeur > **Enregistrer une macro** : Excel écrit le code VBA correspondant à vos actions. C’est un excellent moyen d’apprendre la syntaxe, mais le code produit est souvent lourd (beaucoup de \`Select\`). On apprendra à écrire un code plus propre.`,
        },
      ],
      exercises: [
        {
          type: 'qcm',
          question: 'Sous quel format devez-vous enregistrer un classeur qui contient des macros ?',
          options: ['.xlsx', '.xlsm', '.csv', '.docm'],
          answer: 1,
          explanation: 'Le format .xlsx ne peut pas contenir de macros : Excel supprime le code à l’enregistrement.',
        },
        {
          type: 'qcm',
          question: 'Quel raccourci ouvre l’éditeur VBA ?',
          options: ['Ctrl + F11', 'Alt + F11', 'F5', 'Ctrl + M'],
          answer: 1,
          explanation: 'Alt + F11 bascule entre Excel et l’éditeur VBA.',
        },
        {
          type: 'fill',
          prompt: 'Complétez la macro pour qu’elle affiche « Reporting terminé ».',
          code: `[[0]] FinReporting()
    [[1]] "Reporting terminé"
End [[2]]`,
          blanks: [['Sub'], ['MsgBox'], ['Sub']],
          explanation: 'Une procédure commence par Sub, se termine par End Sub, et MsgBox affiche le message.',
        },
        {
          type: 'order',
          prompt: 'Remettez les lignes de la macro dans le bon ordre.',
          lines: ['Sub Accueil()', '    \' Message affiché à l\'ouverture', '    MsgBox "Bonjour, chargez le fichier du jour"', 'End Sub'],
          explanation: 'Sub en premier, End Sub en dernier ; le commentaire et l’instruction se placent entre les deux.',
        },
      ],
    },
    {
      id: 'vba-2',
      title: 'Variables et types',
      summary: 'Stocker des valeurs : Dim, types et Option Explicit.',
      theory: [
        {
          title: 'Déclarer une variable',
          body: `Une **variable** stocke une valeur en mémoire. On la déclare avec \`Dim\` et on précise son **type** :

- \`Long\` : nombre entier (compteur, numéro de ligne)
- \`Double\` : nombre à virgule (prime, montant, taux)
- \`String\` : texte (nom, branche)
- \`Boolean\` : True ou False
- \`Date\` : une date

L’opérateur \`&\` concatène (colle) des textes.`,
          code: `Sub CalculPrime()
    Dim primeHT As Double
    Dim taux As Double
    Dim branche As String

    primeHT = 540
    taux = 0.09
    branche = "Auto"

    MsgBox "Prime TTC " & branche & " : " & primeHT * (1 + taux)
End Sub`,
        },
        {
          title: 'Option Explicit',
          body: `Placez \`Option Explicit\` tout en haut de chaque module : VBA refusera alors toute variable non déclarée. Cela évite des bugs très difficiles à trouver, comme une faute de frappe dans un nom de variable (\`primeHt\` au lieu de \`primeHT\`), qui créerait silencieusement une nouvelle variable vide.`,
          tip: 'Dans l’éditeur : Outils > Options > cocher « Déclaration des variables obligatoire » pour l’ajouter automatiquement.',
        },
      ],
      exercises: [
        {
          type: 'qcm',
          question: 'Quel type choisir pour stocker un montant de sinistre comme 1 245,80 € ?',
          options: ['Long', 'Double', 'String', 'Boolean'],
          answer: 1,
          explanation: 'Double stocke les nombres décimaux. Long ne garde que la partie entière.',
        },
        {
          type: 'fill',
          prompt: 'Déclarez les variables avec le bon type.',
          code: `Dim nbContrats As [[0]]
Dim tauxCommission As [[1]]
Dim nomAssure As [[2]]`,
          blanks: [['Long', 'Integer'], ['Double', 'Single', 'Currency'], ['String']],
          explanation: 'Un nombre de contrats est entier (Long), un taux est décimal (Double), un nom est du texte (String).',
        },
        {
          type: 'qcm',
          question: 'Qu’affiche ce code ?',
          code: `Dim a As Double
Dim b As Double
a = 1200
b = 0.25
MsgBox "Frais : " & a * b`,
          options: ['Frais : a * b', 'Frais : 300', 'Frais : 1200,25', 'Une erreur'],
          answer: 1,
          explanation: 'a * b est calculé (300), puis collé au texte grâce à &.',
        },
        {
          type: 'qcm',
          question: 'À quoi sert Option Explicit ?',
          options: [
            'À accélérer les macros',
            'À obliger la déclaration de toutes les variables',
            'À afficher les erreurs en français',
            'À protéger le code par mot de passe',
          ],
          answer: 1,
          explanation: 'Une faute de frappe dans un nom de variable déclenche alors une erreur de compilation au lieu d’un bug silencieux.',
        },
      ],
    },
    {
      id: 'vba-3',
      title: 'Lire et écrire dans les cellules',
      summary: 'Range, Cells, Worksheets et la dernière ligne remplie.',
      theory: [
        {
          title: 'Range et Cells',
          body: `- \`Range("B2").Value\` : la cellule B2
- \`Cells(2, 3).Value\` : ligne 2, **colonne 3**, donc C2. Pratique dans les boucles, car ligne et colonne sont des nombres
- \`Worksheets("Sinistres").Range("A1")\` : une cellule d’une feuille précise

On **lit** une cellule en la mettant à droite du \`=\`, on **écrit** en la mettant à gauche.`,
          code: `Sub CopiePrime()
    Dim prime As Double
    prime = Worksheets("Contrats").Range("G2").Value   ' lecture
    Worksheets("Synthese").Cells(1, 2).Value = prime     ' écriture en B1
End Sub`,
        },
        {
          title: 'Trouver la dernière ligne',
          body: `Le nombre de lignes d’un fichier change tous les mois. Pour trouver la dernière ligne remplie de la colonne A :

\`derniere = Cells(Rows.Count, 1).End(xlUp).Row\`

C’est l’équivalent de se placer tout en bas de la colonne A et de faire Ctrl + ↑.`,
          tip: 'Évitez Select et Activate (très présents dans l’enregistreur) : agissez directement sur les cellules, le code est plus rapide et plus fiable.',
        },
      ],
      exercises: [
        {
          type: 'qcm',
          question: 'Quelle cellule désigne Cells(4, 2) ?',
          options: ['D2', 'B4', 'D4', 'B2'],
          answer: 1,
          explanation: 'Cells(ligne, colonne) : ligne 4, colonne 2 (B), soit B4. Attention, c’est l’ordre inverse de l’adresse « B4 ».',
        },
        {
          type: 'fill',
          prompt: 'Écrivez la valeur 0,09 dans la cellule F1 de la feuille « Parametres ».',
          code: `Worksheets("[[0]]").Range("[[1]]").[[2]] = 0.09`,
          blanks: [['Parametres'], ['F1'], ['Value']],
          explanation: 'Worksheets("Parametres").Range("F1").Value = 0.09. En VBA, le séparateur décimal est toujours le point.',
        },
        {
          type: 'fill',
          prompt: 'Complétez l’instruction qui trouve la dernière ligne remplie de la colonne A.',
          code: `derniere = Cells(Rows.Count, [[0]]).End([[1]]).Row`,
          blanks: [['1'], ['xlUp']],
          explanation: 'On part de la dernière ligne de la feuille, colonne 1, et on remonte (xlUp) jusqu’à la première cellule remplie.',
        },
        {
          type: 'qcm',
          question: 'La cellule A1 contient 500. Que contient B1 après ce code ?',
          code: `Range("B1").Value = Range("A1").Value * 2
Range("A1").Value = 0`,
          options: ['0', '500', '1000', 'Une formule =A1*2'],
          answer: 2,
          explanation: 'VBA écrit une valeur (1000), pas une formule : modifier A1 ensuite ne change pas B1.',
        },
      ],
    },
    {
      id: 'vba-4',
      title: 'Conditions et boucles',
      summary: 'If…Then…Else et For…Next pour traiter chaque ligne.',
      theory: [
        {
          title: 'Les conditions',
          body: `\`If condition Then … ElseIf … Else … End If\`

Les opérateurs : \`=\`, \`<>\`, \`<\`, \`>\`, \`<=\`, \`>=\`, et pour combiner : \`And\`, \`Or\`, \`Not\`.`,
          code: `If montant > 10000 Then
    categorie = "Grave"
ElseIf montant > 2000 Then
    categorie = "Moyen"
Else
    categorie = "Attritionnel"
End If`,
        },
        {
          title: 'La boucle For',
          body: `\`For i = début To fin … Next i\` répète un bloc en faisant varier **i**. Combinée à \`Cells(i, colonne)\`, elle parcourt toutes les lignes d’un tableau.

Exemple : classer chaque sinistre (montant en colonne E) et écrire la catégorie en colonne G.`,
          code: `Sub ClasserSinistres()
    Dim i As Long, derniere As Long
    Dim montant As Double

    derniere = Cells(Rows.Count, 1).End(xlUp).Row
    For i = 2 To derniere            ' ligne 1 = en-têtes
        montant = Cells(i, 5).Value
        If montant > 10000 Then
            Cells(i, 7).Value = "Grave"
        Else
            Cells(i, 7).Value = "Standard"
        End If
    Next i
End Sub`,
        },
      ],
      exercises: [
        {
          type: 'fill',
          prompt: 'Complétez la boucle qui additionne les primes de la colonne G, de la ligne 2 à la dernière ligne.',
          code: `total = 0
[[0]] i = 2 [[1]] derniere
    total = total + Cells(i, [[2]]).Value
[[3]] i`,
          blanks: [['For'], ['To'], ['7'], ['Next']],
          explanation: 'For i = 2 To derniere … Next i. La colonne G est la 7ᵉ colonne.',
        },
        {
          type: 'qcm',
          question: 'Qu’affiche ce code ?',
          code: `Dim i As Long, total As Long
total = 0
For i = 1 To 4
    total = total + i
Next i
MsgBox total`,
          options: ['4', '10', '5', '0'],
          answer: 1,
          explanation: '1 + 2 + 3 + 4 = 10.',
        },
        {
          type: 'order',
          prompt: 'Remettez dans l’ordre la macro qui compte les sinistres ouverts (statut en colonne F).',
          lines: [
            'Sub CompterOuverts()',
            '    Dim i As Long, nb As Long',
            '    For i = 2 To Cells(Rows.Count, 1).End(xlUp).Row',
            '        If Cells(i, 6).Value = "Ouvert" Then nb = nb + 1',
            '    Next i',
            '    MsgBox nb & " sinistres ouverts"',
            'End Sub',
          ],
          explanation: 'Déclarations, boucle avec la condition à l’intérieur, puis affichage du résultat après la boucle.',
        },
        {
          type: 'fill',
          prompt: 'Complétez la condition : un sinistre est « Prioritaire » s’il est ouvert ET supérieur à 5 000 €.',
          code: `If Cells(i, 6).Value = "Ouvert" [[0]] Cells(i, 5).Value > 5000 [[1]]
    Cells(i, 7).Value = "Prioritaire"
End [[2]]`,
          blanks: [['And'], ['Then'], ['If']],
          explanation: 'And combine les deux conditions ; If … Then … End If.',
        },
        {
          type: 'numeric',
          prompt: 'Sur le fichier sinistres 2024, écrivez une macro qui compte les sinistres ouverts dont le montant dépasse 2 000 €. Combien en trouvez-vous ?',
          file: 'sinistres',
          answer: ouvertsPlus2000,
          tolerance: 0,
          unit: 'sinistres',
          hint: 'Statut en colonne 6 (F), montant en colonne 5 (E). Vérifiez avec NB.SI.ENS !',
          explanation: 'Vérification par formule : =NB.SI.ENS(F:F;"Ouvert";E:E;">2000").',
        },
      ],
    },
    {
      id: 'vba-5',
      title: 'Fonctions personnalisées',
      summary: 'Créer vos propres fonctions utilisables dans les cellules.',
      theory: [
        {
          title: 'Function au lieu de Sub',
          body: `Une **Function** renvoie une valeur. Placée dans un module standard, elle devient utilisable **directement dans une cellule**, comme SOMME ou VPM. On l’appelle une **UDF** (*User Defined Function*).

La valeur renvoyée est affectée au **nom de la fonction**.`,
          code: `Function PrimePure(frequence As Double, coutMoyen As Double) As Double
    PrimePure = frequence * coutMoyen
End Function

Function PrimeCommerciale(primePure As Double, chargement As Double) As Double
    PrimeCommerciale = primePure / (1 - chargement)
End Function`,
          tip: 'Dans une cellule : =PrimePure(B2;C2). Une UDF ne peut pas modifier d’autres cellules : elle ne fait que renvoyer une valeur.',
        },
        {
          title: 'Un exemple métier : le coefficient bonus-malus',
          body: `Le coefficient bonus-malus auto démarre à 1. Chaque année sans sinistre responsable, il est multiplié par 0,95 (plancher 0,50).`,
          code: `Function CoefBonus(anneesSansSinistre As Long) As Double
    Dim c As Double, i As Long
    c = 1
    For i = 1 To anneesSansSinistre
        c = c * 0.95
    Next i
    If c < 0.5 Then c = 0.5
    CoefBonus = Round(c, 2)
End Function`,
        },
      ],
      exercises: [
        {
          type: 'fill',
          prompt: 'Complétez la fonction qui calcule le ratio S/P.',
          code: `[[0]] RatioSP(sinistres As Double, primes As Double) As Double
    If primes = 0 Then
        [[1]] = 0
    Else
        RatioSP = sinistres / primes
    End If
End [[2]]`,
          blanks: [['Function'], ['RatioSP'], ['Function']],
          explanation: 'La valeur de retour est affectée au nom de la fonction ; le test évite une division par zéro.',
        },
        {
          type: 'qcm',
          question: 'Comment utiliser la fonction PrimePure dans la cellule D2 ?',
          options: ['=PrimePure(B2;C2)', 'Call PrimePure(B2, C2)', '=Sub PrimePure(B2;C2)', 'Elle n’est utilisable qu’en VBA'],
          answer: 0,
          explanation: 'Une Function publique d’un module standard s’utilise comme n’importe quelle fonction Excel.',
        },
        {
          type: 'qcm',
          question: 'Que renvoie CoefBonus(3) ?',
          code: `Function CoefBonus(anneesSansSinistre As Long) As Double
    Dim c As Double, i As Long
    c = 1
    For i = 1 To anneesSansSinistre
        c = c * 0.95
    Next i
    If c < 0.5 Then c = 0.5
    CoefBonus = Round(c, 2)
End Function`,
          options: ['0,85', '0,86', '0,95', '0,5'],
          answer: 1,
          explanation: '0,95³ = 0,857375, arrondi à 0,86.',
        },
        {
          type: 'order',
          prompt: 'Remettez dans l’ordre la fonction qui calcule une prime TTC.',
          lines: [
            'Function PrimeTTC(primeHT As Double, taux As Double) As Double',
            '    PrimeTTC = primeHT * (1 + taux)',
            'End Function',
          ],
          explanation: 'Déclaration de la fonction avec ses paramètres et son type de retour, affectation du résultat, End Function.',
        },
      ],
    },
    {
      id: 'vba-6',
      title: 'Projet : automatiser un reporting',
      summary: 'Une macro complète qui produit une synthèse des sinistres par branche.',
      theory: [
        {
          title: 'L’objectif',
          body: `Chaque mois, un gestionnaire reçoit le fichier des sinistres et doit produire une synthèse par branche : nombre de sinistres, charge totale, charge des sinistres ouverts. On automatise :

- Créer (ou vider) une feuille « Synthese »
- Pour chaque branche, calculer les indicateurs avec \`WorksheetFunction\`, qui donne accès aux fonctions Excel depuis VBA, avec leurs **noms anglais** (\`CountIf\`, \`SumIf\`, \`SumIfs\`)
- Mettre en forme le résultat`,
        },
        {
          title: 'Le code complet',
          body: `Lisez attentivement ce code : les exercices portent dessus. Remarquez l’utilisation de \`With\` qui évite de répéter le nom de la feuille, et du tableau \`Array\` pour la liste des branches.`,
          code: `Option Explicit

Sub SyntheseSinistres()
    Dim src As Worksheet, dst As Worksheet
    Dim branches As Variant, i As Long
    Dim plageBranche As Range, plageMontant As Range, plageStatut As Range

    Set src = Worksheets("Sinistres")
    Set plageBranche = src.Range("C:C")
    Set plageMontant = src.Range("E:E")
    Set plageStatut = src.Range("F:F")

    Application.DisplayAlerts = False
    On Error Resume Next
    Worksheets("Synthese").Delete
    On Error GoTo 0
    Application.DisplayAlerts = True

    Set dst = Worksheets.Add(After:=src)
    dst.Name = "Synthese"

    branches = Array("Auto", "Habitation", "Santé", "Prévoyance")
    With dst
        .Range("A1:D1").Value = Array("Branche", "Nb sinistres", "Charge", "Charge ouverts")
        For i = 0 To UBound(branches)
            .Cells(i + 2, 1).Value = branches(i)
            .Cells(i + 2, 2).Value = WorksheetFunction.CountIf(plageBranche, branches(i))
            .Cells(i + 2, 3).Value = WorksheetFunction.SumIf(plageBranche, branches(i), plageMontant)
            .Cells(i + 2, 4).Value = WorksheetFunction.SumIfs(plageMontant, plageBranche, branches(i), plageStatut, "Ouvert")
        Next i
        .Range("A1:D1").Font.Bold = True
        .Range("C2:D5").NumberFormat = "#,##0.00 €"
        .Columns("A:D").AutoFit
    End With

    MsgBox "Synthèse générée !", vbInformation
End Sub`,
        },
      ],
      exercises: [
        {
          type: 'qcm',
          question: 'Pourquoi la boucle va-t-elle de 0 à UBound(branches) ?',
          options: [
            'Parce que la feuille commence en ligne 0',
            'Parce qu’un tableau créé avec Array commence à l’indice 0',
            'Pour sauter la ligne d’en-tête',
            'C’est une erreur, il faudrait commencer à 1',
          ],
          answer: 1,
          explanation: 'Array("Auto", …) crée un tableau indexé de 0 à 3. UBound renvoie le dernier indice (3).',
        },
        {
          type: 'qcm',
          question: 'À quoi sert le bloc On Error Resume Next … On Error GoTo 0 autour de .Delete ?',
          options: [
            'À ignorer l’erreur si la feuille « Synthese » n’existe pas encore',
            'À supprimer toutes les erreurs du classeur',
            'À relancer la macro en cas d’erreur',
            'À rien, on peut l’enlever',
          ],
          answer: 0,
          explanation: 'Au premier lancement, la feuille n’existe pas : sans ce bloc, Delete provoquerait une erreur. On réactive ensuite la gestion normale des erreurs.',
        },
        {
          type: 'fill',
          prompt: 'Complétez l’appel pour calculer le nombre de sinistres ouverts de la branche branches(i).',
          code: `.Cells(i + 2, 5).Value = WorksheetFunction.[[0]](plageBranche, branches(i), plageStatut, "[[1]]")`,
          blanks: [['CountIfs'], ['Ouvert']],
          explanation: 'CountIfs est le nom anglais de NB.SI.ENS. En VBA, les arguments sont toujours séparés par des virgules.',
        },
        {
          type: 'numeric',
          prompt: 'Exécutez la macro sur le fichier sinistres 2024 (enregistré en .xlsm ; la feuille s’appelle déjà « Sinistres »). Quelle est la charge totale des sinistres ouverts, toutes branches confondues ?',
          file: 'sinistres',
          answer: chargeOuverts,
          tolerance: 1,
          unit: '€',
          hint: 'Additionnez la colonne D de la synthèse, ou vérifiez avec =SOMME.SI(F:F;"Ouvert";E:E).',
          explanation: 'C’est le montant que le gestionnaire doit suivre de près : ces sinistres ne sont pas encore réglés.',
        },
      ],
    },
  ],
}

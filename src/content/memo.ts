export interface MemoEntry {
  fr: string
  en: string
  syntax: string
  description: string
  example?: string
}

export const MEMO: { category: string; entries: MemoEntry[] }[] = [
  {
    category: 'Calculs de base',
    entries: [
      { fr: 'SOMME', en: 'SUM', syntax: 'SOMME(plage)', description: 'Additionne des nombres.', example: '=SOMME(B2:B100)' },
      { fr: 'MOYENNE', en: 'AVERAGE', syntax: 'MOYENNE(plage)', description: 'Moyenne arithmétique.', example: '=MOYENNE(B2:B100)' },
      { fr: 'MIN / MAX', en: 'MIN / MAX', syntax: 'MAX(plage)', description: 'Plus petite / plus grande valeur.', example: '=MAX(E:E)' },
      { fr: 'NB', en: 'COUNT', syntax: 'NB(plage)', description: 'Compte les cellules contenant un nombre.' },
      { fr: 'NBVAL', en: 'COUNTA', syntax: 'NBVAL(plage)', description: 'Compte les cellules non vides.' },
      { fr: 'ARRONDI', en: 'ROUND', syntax: 'ARRONDI(nombre; décimales)', description: 'Arrondit au plus proche (aussi ARRONDI.SUP, ARRONDI.INF).', example: '=ARRONDI(B2/12;2)' },
      { fr: 'SOMMEPROD', en: 'SUMPRODUCT', syntax: 'SOMMEPROD(plage1; plage2)', description: 'Multiplie ligne à ligne puis additionne.', example: '=SOMMEPROD(B2:B6;C2:C6)' },
    ],
  },
  {
    category: 'Logique',
    entries: [
      { fr: 'SI', en: 'IF', syntax: 'SI(condition; si_vrai; si_faux)', description: 'Renvoie une valeur selon une condition.', example: '=SI(B2>10000;"Grave";"Standard")' },
      { fr: 'ET / OU', en: 'AND / OR', syntax: 'ET(cond1; cond2)', description: 'Combine des conditions.', example: '=SI(OU(B2<25;C2<3);"Surprime";"Normal")' },
      { fr: 'SI.CONDITIONS', en: 'IFS', syntax: 'SI.CONDITIONS(cond1; val1; cond2; val2…)', description: 'Plusieurs conditions sans imbriquer des SI.' },
      { fr: 'SIERREUR', en: 'IFERROR', syntax: 'SIERREUR(formule; si_erreur)', description: 'Remplace une erreur par une valeur.', example: '=SIERREUR(B2/C2;0)' },
    ],
  },
  {
    category: 'Calculs conditionnels',
    entries: [
      { fr: 'NB.SI', en: 'COUNTIF', syntax: 'NB.SI(plage; critère)', description: 'Compte selon un critère.', example: '=NB.SI(D:D;"Auto")' },
      { fr: 'SOMME.SI', en: 'SUMIF', syntax: 'SOMME.SI(plage_critère; critère; plage_somme)', description: 'Additionne selon un critère.', example: '=SOMME.SI(D:D;"Auto";G:G)' },
      { fr: 'MOYENNE.SI', en: 'AVERAGEIF', syntax: 'MOYENNE.SI(plage_critère; critère; plage_moyenne)', description: 'Moyenne selon un critère.' },
      { fr: 'NB.SI.ENS', en: 'COUNTIFS', syntax: 'NB.SI.ENS(plage1; critère1; plage2; critère2…)', description: 'Compte selon plusieurs critères.' },
      { fr: 'SOMME.SI.ENS', en: 'SUMIFS', syntax: 'SOMME.SI.ENS(plage_somme; plage1; critère1…)', description: 'Additionne selon plusieurs critères.', example: '=SOMME.SI.ENS(G:G;D:D;"Auto";E:E;"Nord")' },
      { fr: 'MAX.SI.ENS', en: 'MAXIFS', syntax: 'MAX.SI.ENS(plage_max; plage1; critère1…)', description: 'Maximum selon des critères (aussi MIN.SI.ENS).' },
    ],
  },
  {
    category: 'Recherche',
    entries: [
      { fr: 'RECHERCHEV', en: 'VLOOKUP', syntax: 'RECHERCHEV(valeur; table; n°_col; FAUX)', description: 'Cherche dans la 1ʳᵉ colonne et renvoie la colonne demandée.', example: '=RECHERCHEV(B2;Contrats!A:G;7;FAUX)' },
      { fr: 'RECHERCHEX', en: 'XLOOKUP', syntax: 'RECHERCHEX(valeur; plage_cherchée; plage_renvoyée; [si_absent])', description: 'Recherche moderne (Excel 2021 et 365).' },
      { fr: 'INDEX / EQUIV', en: 'INDEX / MATCH', syntax: 'INDEX(plage; EQUIV(valeur; plage_cherchée; 0))', description: 'Recherche compatible avec toutes les versions.' },
    ],
  },
  {
    category: 'Finance',
    entries: [
      { fr: 'VPM', en: 'PMT', syntax: 'VPM(taux; nb_périodes; va)', description: 'Échéance constante d’un emprunt.', example: '=VPM(3,5%/12;240;-200000)' },
      { fr: 'VA', en: 'PV', syntax: 'VA(taux; nb_périodes; versement)', description: 'Valeur actuelle d’une suite de versements.', example: '=VA(3%;15;-1200)' },
      { fr: 'VC', en: 'FV', syntax: 'VC(taux; nb_périodes; versement; [va])', description: 'Valeur future (capitalisée).', example: '=VC(3%;10;0;-10000)' },
      { fr: 'TAUX', en: 'RATE', syntax: 'TAUX(nb_périodes; versement; va)', description: 'Taux d’un emprunt ou d’un placement.' },
      { fr: 'NPM', en: 'NPER', syntax: 'NPM(taux; versement; va)', description: 'Nombre de périodes nécessaires.' },
      { fr: 'INTPER / PRINCPER', en: 'IPMT / PPMT', syntax: 'INTPER(taux; période; nb_périodes; va)', description: 'Part d’intérêts / de capital d’une échéance.' },
      { fr: 'VAN', en: 'NPV', syntax: 'VAN(taux; flux_1_à_n)', description: 'Valeur actuelle nette (le flux de t = 0 s’ajoute à part).', example: '=B2+VAN(8%;B3:B7)' },
      { fr: 'TRI', en: 'IRR', syntax: 'TRI(flux_0_à_n)', description: 'Taux de rentabilité interne.', example: '=TRI(B2:B7)' },
    ],
  },
  {
    category: 'Texte',
    entries: [
      { fr: 'CONCAT', en: 'CONCAT', syntax: 'CONCAT(texte1; texte2…)', description: 'Assemble des textes (ou l’opérateur &).', example: '=A2&" - "&B2' },
      { fr: 'GAUCHE / DROITE', en: 'LEFT / RIGHT', syntax: 'GAUCHE(texte; nb_caractères)', description: 'Extrait le début / la fin d’un texte.', example: '=GAUCHE(A2;1)' },
      { fr: 'NBCAR', en: 'LEN', syntax: 'NBCAR(texte)', description: 'Nombre de caractères.' },
    ],
  },
]

export const SHORTCUTS: [string, string][] = [
  ['F4', 'Ajouter / changer les $ d’une référence'],
  ['Ctrl + D', 'Recopier vers le bas'],
  ['Ctrl + Maj + L', 'Activer / désactiver les filtres'],
  ['Ctrl + L', 'Transformer une plage en Tableau'],
  ['Ctrl + ↓ / ↑', 'Aller à la fin / au début des données'],
  ['Alt + =', 'Somme automatique'],
  ['F2', 'Modifier la cellule active'],
  ['Alt + F11', 'Ouvrir l’éditeur VBA'],
  ['F5 (éditeur VBA)', 'Exécuter la macro'],
  ['F8 (éditeur VBA)', 'Exécuter pas à pas'],
]

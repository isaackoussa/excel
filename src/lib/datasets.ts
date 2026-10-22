/**
 * Jeux de données fictifs mais réalistes, générés de façon déterministe : les réponses
 * des exercices sont donc toujours les mêmes que dans les fichiers téléchargés.
 */

function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round2 = (x: number) => Math.round(x * 100) / 100

export type Branche = 'Auto' | 'Habitation' | 'Santé' | 'Prévoyance'
export const BRANCHES: Branche[] = ['Auto', 'Habitation', 'Santé', 'Prévoyance']
export const REGIONS = ['Île-de-France', 'Nord', 'Ouest', 'Sud', 'Est']

export interface Contrat {
  contrat: string
  assure: string
  age: number
  branche: Branche
  region: string
  dateEffet: Date
  prime: number
}

export interface Sinistre {
  sinistre: string
  contrat: string
  branche: Branche
  dateSurvenance: Date
  montant: number
  statut: 'Ouvert' | 'Clos'
}

const PRENOMS = ['Camille', 'Lucas', 'Léa', 'Hugo', 'Chloé', 'Louis', 'Manon', 'Nathan', 'Inès', 'Jules', 'Sarah', 'Adam', 'Emma', 'Yanis', 'Lina', 'Karim', 'Julie', 'Thomas', 'Amira', 'Paul']
const NOMS = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'Benali', 'Roux', 'Fournier', 'Nguyen', 'Mercier']

const PRIME_BORNES: Record<Branche, [number, number]> = {
  Auto: [350, 1400],
  Habitation: [150, 700],
  Santé: [600, 2400],
  Prévoyance: [200, 1200],
}
const SINISTRE_BORNES: Record<Branche, [number, number]> = {
  Auto: [200, 6500],
  Habitation: [150, 6000],
  Santé: [50, 4000],
  Prévoyance: [1000, 20000],
}
/** Nombre de sinistres par branche (calibré pour des ratios S/P réalistes). */
const NB_SINISTRES: Record<Branche, number> = { Auto: 50, Habitation: 25, Santé: 60, Prévoyance: 5 }

function pickBranche(r: number): Branche {
  return r < 0.4 ? 'Auto' : r < 0.7 ? 'Habitation' : r < 0.9 ? 'Santé' : 'Prévoyance'
}

function dateIn2024(r: number) {
  return new Date(Date.UTC(2024, 0, 1 + Math.floor(r * 366)))
}

export const PORTEFEUILLE: Contrat[] = (() => {
  const r = rng(2024)
  return Array.from({ length: 400 }, (_, i) => {
    const branche = pickBranche(r())
    const [lo, hi] = PRIME_BORNES[branche]
    return {
      contrat: `C${String(i + 1).padStart(4, '0')}`,
      assure: `${PRENOMS[Math.floor(r() * PRENOMS.length)]} ${NOMS[Math.floor(r() * NOMS.length)]}`,
      age: 18 + Math.floor(r() * 63),
      branche,
      region: REGIONS[Math.floor(r() * REGIONS.length)],
      dateEffet: dateIn2024(r()),
      prime: round2(lo + r() * (hi - lo)),
    }
  })
})()

export const SINISTRES: Sinistre[] = (() => {
  const r = rng(77)
  const drafts = BRANCHES.flatMap((branche) => {
    const contrats = PORTEFEUILLE.filter((c) => c.branche === branche)
    const [lo, hi] = SINISTRE_BORNES[branche]
    return Array.from({ length: NB_SINISTRES[branche] }, () => ({
      contrat: contrats[Math.floor(r() * contrats.length)].contrat,
      branche,
      dateSurvenance: dateIn2024(r()),
      // Distribution asymétrique : beaucoup de petits sinistres, quelques gros.
      montant: round2(lo + Math.pow(r(), 2.2) * (hi - lo)),
      statut: (r() < 0.3 ? 'Ouvert' : 'Clos') as Sinistre['statut'],
    }))
  })
  drafts.sort((a, b) => a.dateSurvenance.getTime() - b.dateSurvenance.getTime())
  return drafts.map((d, i) => ({ sinistre: `S${String(i + 1).padStart(4, '0')}`, ...d }))
})()

/** Table de mortalité simplifiée (loi de Gompertz-Makeham), 100 000 naissances. */
export const MORTALITE: { age: number; lx: number }[] = (() => {
  const A = 0.0005
  const B = 0.00003
  const c = 1.1
  const out: { age: number; lx: number }[] = []
  let l = 100000
  for (let x = 0; x <= 105; x++) {
    out.push({ age: x, lx: Math.round(l) })
    const q = 1 - Math.exp(-(A + (B * Math.pow(c, x) * (c - 1)) / Math.log(c)))
    l = l * (1 - q)
  }
  return out
})()

export const lx = (age: number) => MORTALITE[age].lx

/** Triangle des règlements cumulés (k€), années de survenance 2019 à 2024. */
export const TRIANGLE: number[][] = [
  [3200, 5100, 5800, 6100, 6200, 6230],
  [3500, 5600, 6400, 6700, 6820],
  [3700, 5900, 6750, 7050],
  [4100, 6500, 7400],
  [4300, 6900],
  [4600],
]
export const TRIANGLE_ANNEES = [2019, 2020, 2021, 2022, 2023, 2024]

/** Méthode Chain Ladder : facteurs de développement, charges ultimes et provision totale. */
export function chainLadder(tri: number[][]) {
  const n = tri.length
  const factors: number[] = []
  for (let j = 0; j < n - 1; j++) {
    let num = 0
    let den = 0
    for (let i = 0; i < n - j - 1; i++) {
      num += tri[i][j + 1]
      den += tri[i][j]
    }
    factors.push(num / den)
  }
  const ultimates = tri.map((row) => {
    let u = row[row.length - 1]
    for (let j = row.length - 1; j < n - 1; j++) u *= factors[j]
    return u
  })
  const reserves = ultimates.map((u, i) => u - tri[i][tri[i].length - 1])
  return { factors, ultimates, reserves, total: reserves.reduce((a, b) => a + b, 0) }
}

/** Mensualité d'un prêt (positive). */
export function mensualite(capital: number, tauxAnnuel: number, mois: number) {
  const r = tauxAnnuel / 12
  return (capital * r) / (1 - Math.pow(1 + r, -mois))
}

export const EMPRUNT = { capital: 180000, taux: 0.036, mois: 240 }

// ---------- Description des fichiers téléchargeables ----------

export type DatasetId = 'portefeuille' | 'sinistres' | 'mortalite' | 'triangle' | 'emprunt'

interface Column {
  header: string
  width: number
  numFmt?: string
}

export interface Dataset {
  id: DatasetId
  fileName: string
  title: string
  description: string
  sheetName: string
  columns: Column[]
  rows: () => (string | number | Date | null)[][]
  /** Consignes ajoutées dans un onglet séparé. */
  instructions: string[]
}

const EUR = '#,##0.00 "€"'

export const DATASETS: Record<DatasetId, Dataset> = {
  portefeuille: {
    id: 'portefeuille',
    fileName: 'portefeuille_contrats.xlsx',
    title: 'Portefeuille de contrats',
    description: '400 contrats d’assurance (Auto, Habitation, Santé, Prévoyance) avec la région, l’âge de l’assuré et la prime annuelle.',
    sheetName: 'Contrats',
    columns: [
      { header: 'Contrat', width: 10 },
      { header: 'Assuré', width: 20 },
      { header: 'Âge', width: 7 },
      { header: 'Branche', width: 13 },
      { header: 'Région', width: 15 },
      { header: 'Date d’effet', width: 13, numFmt: 'dd/mm/yyyy' },
      { header: 'Prime annuelle', width: 15, numFmt: EUR },
    ],
    rows: () => PORTEFEUILLE.map((c) => [c.contrat, c.assure, c.age, c.branche, c.region, c.dateEffet, c.prime]),
    instructions: [
      'Calculez le total des primes par branche avec SOMME.SI.',
      'Comptez les contrats Auto de la région Nord avec NB.SI.ENS.',
      'Construisez un tableau croisé dynamique : Région en lignes, Branche en colonnes, Somme de la prime en valeurs.',
      'Calculez l’âge moyen des assurés en Prévoyance avec MOYENNE.SI.',
    ],
  },
  sinistres: {
    id: 'sinistres',
    fileName: 'sinistres_2024.xlsx',
    title: 'Sinistres 2024',
    description: '140 sinistres survenus en 2024, rattachés aux contrats du portefeuille, avec leur montant et leur statut.',
    sheetName: 'Sinistres',
    columns: [
      { header: 'Sinistre', width: 10 },
      { header: 'Contrat', width: 10 },
      { header: 'Branche', width: 13 },
      { header: 'Date de survenance', width: 18, numFmt: 'dd/mm/yyyy' },
      { header: 'Montant', width: 14, numFmt: EUR },
      { header: 'Statut', width: 9 },
    ],
    rows: () => SINISTRES.map((s) => [s.sinistre, s.contrat, s.branche, s.dateSurvenance, s.montant, s.statut]),
    instructions: [
      'Calculez la charge totale des sinistres par branche.',
      'Comptez les sinistres encore ouverts.',
      'Retrouvez la région de chaque sinistre avec RECHERCHEX dans le fichier portefeuille.',
      'Calculez le ratio S/P par branche (sinistres / primes).',
    ],
  },
  mortalite: {
    id: 'mortalite',
    fileName: 'table_mortalite.xlsx',
    title: 'Table de mortalité',
    description: 'Nombre de survivants lx de 0 à 105 ans pour 100 000 naissances (table simplifiée à but pédagogique).',
    sheetName: 'Table',
    columns: [
      { header: 'Âge x', width: 8 },
      { header: 'lx', width: 12, numFmt: '#,##0' },
    ],
    rows: () => MORTALITE.map((m) => [m.age, m.lx]),
    instructions: [
      'Ajoutez une colonne dx = lx − lx+1 (nombre de décès entre x et x+1).',
      'Ajoutez une colonne qx = dx / lx (probabilité de décéder dans l’année).',
      'Calculez la probabilité qu’une personne de 40 ans atteigne 70 ans.',
    ],
  },
  triangle: {
    id: 'triangle',
    fileName: 'triangle_reglements.xlsx',
    title: 'Triangle de règlements',
    description: 'Règlements cumulés (en k€) par année de survenance 2019–2024 et année de développement, pour appliquer la méthode Chain Ladder.',
    sheetName: 'Triangle',
    columns: [
      { header: 'Survenance', width: 12 },
      ...[1, 2, 3, 4, 5, 6].map((d) => ({ header: `Dév ${d}`, width: 10, numFmt: '#,##0' })),
    ],
    rows: () => TRIANGLE.map((row, i) => [TRIANGLE_ANNEES[i], ...row, ...Array(6 - row.length).fill(null)]),
    instructions: [
      'Calculez les facteurs de développement f1 à f5 (somme colonne j+1 / somme colonne j sur les mêmes années).',
      'Complétez le triangle pour obtenir la charge ultime de chaque année.',
      'Provision = charge ultime − règlements déjà effectués. Calculez la provision totale.',
    ],
  },
  emprunt: {
    id: 'emprunt',
    fileName: 'emprunt_immobilier.xlsx',
    title: 'Emprunt immobilier',
    description: 'Paramètres d’un prêt immobilier (180 000 €, 3,6 %, 20 ans) pour construire un tableau d’amortissement mensuel complet.',
    sheetName: 'Paramètres',
    columns: [
      { header: 'Paramètre', width: 22 },
      { header: 'Valeur', width: 14 },
    ],
    rows: () => [
      ['Capital emprunté', EMPRUNT.capital],
      ['Taux annuel', EMPRUNT.taux],
      ['Durée (mois)', EMPRUNT.mois],
    ],
    instructions: [
      'Calculez la mensualité avec VPM (taux mensuel = taux annuel / 12).',
      'Construisez le tableau : Mois, Capital début, Intérêts, Amortissement, Capital fin (240 lignes).',
      'Vérifiez que le capital restant tombe à 0 au 240e mois.',
      'Calculez le coût total des intérêts.',
    ],
  },
}

export async function downloadDataset(id: DatasetId) {
  const ds = DATASETS[id]
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Tableur Pro'
  const ws = wb.addWorksheet(ds.sheetName, { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = ds.columns.map((c) => ({ header: c.header, width: c.width, style: c.numFmt ? { numFmt: c.numFmt } : {} }))
  ds.rows().forEach((r) => ws.addRow(r))
  if (id === 'emprunt') ws.getCell('B3').numFmt = '0.00%'
  const header = ws.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF107C41' } }
  if (id !== 'emprunt' && id !== 'triangle') ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ds.columns.length } }

  const info = wb.addWorksheet('Consignes')
  info.getColumn(1).width = 100
  info.addRow([ds.title]).font = { bold: true, size: 14 }
  info.addRow([ds.description])
  info.addRow([])
  info.addRow(['À faire :']).font = { bold: true }
  ds.instructions.forEach((t, i) => info.addRow([`${i + 1}. ${t}`]))

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = ds.fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

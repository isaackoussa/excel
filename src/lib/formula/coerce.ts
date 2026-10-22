import { FormulaError, isError, isRange, type Scalar, type Value } from './types'

export const VALUE_ERR = () => new FormulaError('#VALEUR!')

/** Lit un nombre écrit à la française ou à l'anglaise : « 1 234,5 », « 1234.5 », « 12% ». */
export function parseNumberText(s: string): number | null {
  let t = s.trim().replace(/[\s  ]/g, '').replace(/€$/, '')
  let pct = false
  if (t.endsWith('%')) {
    pct = true
    t = t.slice(0, -1)
  }
  if (/^[-+]?\d+(,\d+)?$/.test(t)) t = t.replace(',', '.')
  if (!/^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(t)) return null
  const n = parseFloat(t)
  return pct ? n / 100 : n
}

export function toScalar(v: Value): Scalar {
  if (isRange(v)) {
    if (v.values.length === 1 && v.values[0].length === 1) return v.values[0][0]
    return VALUE_ERR()
  }
  return v
}

export function toNumber(v: Value): number | FormulaError {
  const s = toScalar(v)
  if (isError(s)) return s
  if (s === null) return 0
  if (typeof s === 'number') return s
  if (typeof s === 'boolean') return s ? 1 : 0
  if (s === '') return 0
  const n = parseNumberText(s)
  return n === null ? VALUE_ERR() : n
}

export function toBool(v: Value): boolean | FormulaError {
  const s = toScalar(v)
  if (isError(s)) return s
  if (typeof s === 'boolean') return s
  if (s === null) return false
  if (typeof s === 'number') return s !== 0
  const u = s.toUpperCase()
  if (u === 'VRAI' || u === 'TRUE') return true
  if (u === 'FAUX' || u === 'FALSE') return false
  return VALUE_ERR()
}

export function toText(v: Value): string | FormulaError {
  const s = toScalar(v)
  if (isError(s)) return s
  if (s === null) return ''
  if (typeof s === 'boolean') return s ? 'VRAI' : 'FAUX'
  if (typeof s === 'number') return formatGeneral(s)
  return s
}

/** Format « Standard » d'Excel en français (virgule décimale, sans séparateur de milliers). */
export function formatGeneral(n: number): string {
  if (!isFinite(n)) return '#NOMBRE!'
  const r = parseFloat(n.toPrecision(12))
  return String(r).replace('.', ',')
}

/** Tous les scalaires d'une liste d'arguments, plages aplaties. */
export function flatten(args: Value[]): Scalar[] {
  const out: Scalar[] = []
  for (const a of args) {
    if (isRange(a)) for (const row of a.values) out.push(...row)
    else out.push(a)
  }
  return out
}

/**
 * Nombres pour les fonctions d'agrégation (SOMME, MOYENNE…) : dans une plage, seuls les
 * nombres comptent ; un argument direct est converti.
 */
export function numbersOf(args: Value[]): number[] | FormulaError {
  const out: number[] = []
  for (const a of args) {
    if (isRange(a)) {
      for (const row of a.values)
        for (const c of row) {
          if (isError(c)) return c
          if (typeof c === 'number') out.push(c)
        }
    } else {
      const n = toNumber(a)
      if (isError(n)) return n
      out.push(n)
    }
  }
  return out
}

function typeRank(v: Scalar): number {
  if (typeof v === 'number') return 0
  if (typeof v === 'string') return 1
  return 2
}

/** Comparaison à la manière d'Excel : nombres < textes < booléens, textes sans casse. */
export function compare(a: Scalar, b: Scalar): number {
  if (a === null) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0
  if (b === null) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0
  const ra = typeRank(a)
  const rb = typeRank(b)
  if (ra !== rb) return ra - rb
  if (typeof a === 'string') return a.localeCompare(b as string, 'fr', { sensitivity: 'base' })
  const na = Number(a)
  const nb = Number(b)
  return na === nb ? 0 : na < nb ? -1 : 1
}

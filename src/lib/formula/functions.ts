import {
  compare,
  flatten,
  numbersOf,
  parseNumberText,
  toBool,
  toNumber,
  toScalar,
  toText,
  VALUE_ERR,
} from './coerce'
import { FormulaError, isError, isRange, type RangeValue, type Scalar, type Value } from './types'

export type Impl = (args: Value[]) => Value
/** Fonctions dont les arguments sont évalués à la demande (SI n'évalue que la branche utile). */
export type LazyImpl = (args: (() => Value)[]) => Value

const NA = () => new FormulaError('#N/A')
const DIV0 = () => new FormulaError('#DIV/0!')
const NUM = () => new FormulaError('#NOMBRE!')

function arity(args: unknown[], min: number, max = min) {
  if (args.length < min || args.length > max) throw new FormulaError('#VALEUR!', 'Nombre d’arguments incorrect')
}

function num(v: Value | undefined, dflt?: number): number {
  if (v === undefined || v === '') {
    if (dflt === undefined) throw VALUE_ERR()
    return dflt
  }
  const n = toNumber(v)
  if (isError(n)) throw n
  return n
}

function asRange(v: Value): RangeValue {
  return isRange(v) ? v : { kind: 'range', values: [[v]] }
}

/** Vecteur 1D d'une plage d'une seule ligne ou colonne. */
function vector(v: Value): Scalar[] {
  const r = asRange(v)
  if (r.values.length === 1) return r.values[0]
  if (r.values[0].length === 1) return r.values.map((row) => row[0])
  throw VALUE_ERR()
}

// ---------- Critères (SOMME.SI, NB.SI…) ----------

export function makeCriterion(crit: Value): (v: Scalar) => boolean {
  const c = toScalar(crit)
  if (isError(c)) throw c
  if (typeof c === 'number' || typeof c === 'boolean') return (v) => v !== null && compare(v, c) === 0
  const s = String(c ?? '')
  const m = /^(<=|>=|<>|<|>|=)?(.*)$/s.exec(s)!
  const op = m[1] ?? '='
  const operand = m[2]
  const n = parseNumberText(operand)
  if (n !== null) {
    return (v) => {
      if (typeof v !== 'number') return op === '<>'
      const d = v === n ? 0 : v < n ? -1 : 1
      return op === '=' ? d === 0 : op === '<>' ? d !== 0 : op === '<' ? d < 0 : op === '>' ? d > 0 : op === '<=' ? d <= 0 : d >= 0
    }
  }
  if (op === '=' || op === '<>') {
    const esc = operand.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')
    const re = new RegExp(`^${esc}$`, 'i')
    const match = (v: Scalar) => (v === null ? operand === '' : re.test(String(v)))
    return op === '=' ? match : (v) => !match(v)
  }
  return (v) => {
    if (typeof v !== 'string') return false
    const d = compare(v, operand)
    return op === '<' ? d < 0 : op === '>' ? d > 0 : op === '<=' ? d <= 0 : d >= 0
  }
}

function sameShape(a: RangeValue, b: RangeValue) {
  return a.values.length === b.values.length && a.values[0].length === b.values[0].length
}

/** Positions (i, j) satisfaisant toutes les paires (plage ; critère). */
function matchingCells(pairs: Value[], ref?: RangeValue): [number, number][] {
  if (pairs.length === 0 || pairs.length % 2 !== 0) throw VALUE_ERR()
  const ranges: RangeValue[] = []
  const crits: ((v: Scalar) => boolean)[] = []
  for (let k = 0; k < pairs.length; k += 2) {
    ranges.push(asRange(pairs[k]))
    crits.push(makeCriterion(pairs[k + 1]))
  }
  const base = ref ?? ranges[0]
  for (const r of ranges) if (!sameShape(r, base)) throw VALUE_ERR()
  const out: [number, number][] = []
  base.values.forEach((row, i) =>
    row.forEach((_, j) => {
      if (ranges.every((r, k) => crits[k](r.values[i][j]))) out.push([i, j])
    }),
  )
  return out
}

function numsAt(r: RangeValue, cells: [number, number][]): number[] {
  const out: number[] = []
  for (const [i, j] of cells) {
    const v = r.values[i][j]
    if (isError(v)) throw v
    if (typeof v === 'number') out.push(v)
  }
  return out
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : DIV0())

// ---------- Finance ----------

function pmt(r: number, n: number, pv: number, fv = 0, type = 0) {
  if (r === 0) return -(pv + fv) / n
  const f = Math.pow(1 + r, n)
  return (-(r * (fv + pv * f))) / ((1 + r * type) * (f - 1))
}
function fv(r: number, n: number, p: number, pv = 0, type = 0) {
  if (r === 0) return -(pv + p * n)
  const f = Math.pow(1 + r, n)
  return -(pv * f + (p * (1 + r * type) * (f - 1)) / r)
}
function pv(r: number, n: number, p: number, fvv = 0, type = 0) {
  if (r === 0) return -(fvv + p * n)
  const f = Math.pow(1 + r, n)
  return -(fvv + (p * (1 + r * type) * (f - 1)) / r) / f
}
function ipmt(r: number, per: number, n: number, pvv: number, fvv = 0, type = 0) {
  if (per < 1 || per > n) throw NUM()
  const p = pmt(r, n, pvv, fvv, type)
  if (type === 1 && per === 1) return 0
  const balance = type === 1 ? fv(r, per - 2, p, pvv, 1) - p : fv(r, per - 1, p, pvv, 0)
  return balance * r
}
function npv(r: number, flows: number[]) {
  return flows.reduce((acc, c, i) => acc + c / Math.pow(1 + r, i + 1), 0)
}
function solve(f: (x: number) => number, guess: number): number {
  let x = guess
  for (let i = 0; i < 100; i++) {
    const y = f(x)
    if (Math.abs(y) < 1e-10) return x
    const h = 1e-7
    const d = (f(x + h) - y) / h
    if (d === 0 || !isFinite(d)) break
    const nx = x - y / d
    if (Math.abs(nx - x) < 1e-12) return nx
    x = nx
  }
  if (Math.abs(f(x)) < 1e-6) return x
  throw NUM()
}

function round(x: number, digits: number, mode: 'near' | 'up' | 'down') {
  const k = Math.pow(10, digits)
  const a = Math.abs(x) * k
  const corrected = parseFloat(a.toPrecision(15))
  const r = mode === 'near' ? Math.round(corrected) : mode === 'up' ? Math.ceil(corrected) : Math.floor(corrected)
  return (Math.sign(x) * r) / k
}

// ---------- Table des fonctions ----------

export const FUNCTIONS: Record<string, Impl> = {
  SOMME: (a) => {
    const xs = numbersOf(a)
    return isError(xs) ? xs : sum(xs)
  },
  MOYENNE: (a) => {
    const xs = numbersOf(a)
    return isError(xs) ? xs : avg(xs)
  },
  MIN: (a) => {
    const xs = numbersOf(a)
    return isError(xs) ? xs : xs.length ? Math.min(...xs) : 0
  },
  MAX: (a) => {
    const xs = numbersOf(a)
    return isError(xs) ? xs : xs.length ? Math.max(...xs) : 0
  },
  PRODUIT: (a) => {
    const xs = numbersOf(a)
    return isError(xs) ? xs : xs.reduce((p, x) => p * x, 1)
  },
  MEDIANE: (a) => {
    const xs = numbersOf(a)
    if (isError(xs)) return xs
    if (!xs.length) return NUM()
    const s = [...xs].sort((x, y) => x - y)
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
  },
  NB: (a) => flatten(a).filter((v) => typeof v === 'number').length,
  NBVAL: (a) => flatten(a).filter((v) => v !== null && v !== '').length,
  'NB.VIDE': (a) => flatten(a).filter((v) => v === null || v === '').length,
  ARRONDI: (a) => (arity(a, 2), round(num(a[0]), num(a[1]), 'near')),
  'ARRONDI.SUP': (a) => (arity(a, 2), round(num(a[0]), num(a[1]), 'up')),
  'ARRONDI.INF': (a) => (arity(a, 2), round(num(a[0]), num(a[1]), 'down')),
  ENT: (a) => (arity(a, 1), Math.floor(num(a[0]))),
  ABS: (a) => (arity(a, 1), Math.abs(num(a[0]))),
  MOD: (a) => {
    arity(a, 2)
    const d = num(a[1])
    if (d === 0) return DIV0()
    const n = num(a[0])
    return n - d * Math.floor(n / d)
  },
  RACINE: (a) => {
    arity(a, 1)
    const x = num(a[0])
    return x < 0 ? NUM() : Math.sqrt(x)
  },
  PUISSANCE: (a) => (arity(a, 2), Math.pow(num(a[0]), num(a[1]))),
  EXP: (a) => (arity(a, 1), Math.exp(num(a[0]))),
  LN: (a) => {
    arity(a, 1)
    const x = num(a[0])
    return x <= 0 ? NUM() : Math.log(x)
  },
  ET: (a) => {
    for (const v of flatten(a)) {
      if (v === null) continue
      const b = toBool(v)
      if (isError(b)) return b
      if (!b) return false
    }
    return true
  },
  OU: (a) => {
    for (const v of flatten(a)) {
      if (v === null) continue
      const b = toBool(v)
      if (isError(b)) return b
      if (b) return true
    }
    return false
  },
  NON: (a) => {
    arity(a, 1)
    const b = toBool(a[0])
    return isError(b) ? b : !b
  },
  'SOMME.SI': (a) => {
    arity(a, 2, 3)
    const range = asRange(a[0])
    const target = a[2] !== undefined ? asRange(a[2]) : range
    if (!sameShape(range, target)) return VALUE_ERR()
    return sum(numsAt(target, matchingCells([a[0], a[1]])))
  },
  'NB.SI': (a) => (arity(a, 2), matchingCells(a).length),
  'MOYENNE.SI': (a) => {
    arity(a, 2, 3)
    const target = a[2] !== undefined ? asRange(a[2]) : asRange(a[0])
    return avg(numsAt(target, matchingCells([a[0], a[1]], target)))
  },
  'SOMME.SI.ENS': (a) => {
    const target = asRange(a[0])
    return sum(numsAt(target, matchingCells(a.slice(1), target)))
  },
  'NB.SI.ENS': (a) => matchingCells(a).length,
  'MOYENNE.SI.ENS': (a) => {
    const target = asRange(a[0])
    return avg(numsAt(target, matchingCells(a.slice(1), target)))
  },
  'MAX.SI.ENS': (a) => {
    const target = asRange(a[0])
    const xs = numsAt(target, matchingCells(a.slice(1), target))
    return xs.length ? Math.max(...xs) : 0
  },
  'MIN.SI.ENS': (a) => {
    const target = asRange(a[0])
    const xs = numsAt(target, matchingCells(a.slice(1), target))
    return xs.length ? Math.min(...xs) : 0
  },
  SOMMEPROD: (a) => {
    if (!a.length) return VALUE_ERR()
    const rs = a.map(asRange)
    for (const r of rs) if (!sameShape(r, rs[0])) return VALUE_ERR()
    let total = 0
    rs[0].values.forEach((row, i) =>
      row.forEach((_, j) => {
        total += rs.reduce((p, r) => {
          const v = r.values[i][j]
          if (isError(v)) throw v
          return p * (typeof v === 'number' ? v : 0)
        }, 1)
      }),
    )
    return total
  },
  RECHERCHEV: (a) => {
    arity(a, 3, 4)
    const key = toScalar(a[0])
    if (isError(key)) return key
    const table = asRange(a[1])
    const col = num(a[2])
    const approx = a[3] === undefined ? true : toBool(a[3])
    if (isError(approx)) return approx
    if (col < 1 || col > table.values[0].length) return new FormulaError('#REF!')
    let found = -1
    if (!approx) {
      found = table.values.findIndex((row) => row[0] !== null && compare(row[0], key) === 0)
    } else {
      for (let i = 0; i < table.values.length; i++) {
        const v = table.values[i][0]
        if (v === null) continue
        if (compare(v, key) <= 0) found = i
        else break
      }
    }
    return found < 0 ? NA() : table.values[found][col - 1]
  },
  RECHERCHEX: (a) => {
    arity(a, 3, 5)
    const key = toScalar(a[0])
    if (isError(key)) return key
    const look = vector(a[1])
    const ret = vector(a[2])
    if (look.length !== ret.length) return VALUE_ERR()
    const mode = a[4] === undefined ? 0 : num(a[4])
    let idx = look.findIndex((v) => v !== null && compare(v, key) === 0)
    if (idx < 0 && mode !== 0) {
      let best = -1
      look.forEach((v, i) => {
        if (v === null || typeof v !== typeof key) return
        const c = compare(v, key)
        if ((mode === -1 && c < 0 && (best < 0 || compare(v, look[best]) > 0)) || (mode === 1 && c > 0 && (best < 0 || compare(v, look[best]) < 0)))
          best = i
      })
      idx = best
    }
    if (idx < 0) return a[3] !== undefined ? toScalar(a[3]) : NA()
    return ret[idx]
  },
  INDEX: (a) => {
    arity(a, 2, 3)
    const r = asRange(a[0])
    let row = num(a[1])
    let col = a[2] === undefined ? 1 : num(a[2])
    if (a[2] === undefined && r.values.length === 1) {
      col = row
      row = 1
    }
    if (row < 1 || col < 1 || row > r.values.length || col > r.values[0].length) return new FormulaError('#REF!')
    return r.values[row - 1][col - 1]
  },
  EQUIV: (a) => {
    arity(a, 2, 3)
    const key = toScalar(a[0])
    if (isError(key)) return key
    const v = vector(a[1])
    const type = a[2] === undefined ? 1 : num(a[2])
    if (type === 0) {
      const crit = typeof key === 'string' ? makeCriterion(key) : (x: Scalar) => x !== null && compare(x, key) === 0
      const i = v.findIndex(crit)
      return i < 0 ? NA() : i + 1
    }
    let found = -1
    for (let i = 0; i < v.length; i++) {
      if (v[i] === null) continue
      const c = compare(v[i], key)
      if (type > 0 ? c <= 0 : c >= 0) found = i
      else break
    }
    return found < 0 ? NA() : found + 1
  },
  VPM: (a) => (arity(a, 3, 5), pmt(num(a[0]), num(a[1]), num(a[2]), num(a[3], 0), num(a[4], 0))),
  VC: (a) => (arity(a, 3, 5), fv(num(a[0]), num(a[1]), num(a[2]), num(a[3], 0), num(a[4], 0))),
  VA: (a) => (arity(a, 3, 5), pv(num(a[0]), num(a[1]), num(a[2]), num(a[3], 0), num(a[4], 0))),
  NPM: (a) => {
    arity(a, 3, 5)
    const r = num(a[0])
    const p = num(a[1])
    const pvv = num(a[2])
    const fvv = num(a[3], 0)
    const type = num(a[4], 0)
    if (r === 0) return p === 0 ? NUM() : -(pvv + fvv) / p
    const x = (p * (1 + r * type) - fvv * r) / (p * (1 + r * type) + pvv * r)
    return x <= 0 ? NUM() : Math.log(x) / Math.log(1 + r)
  },
  TAUX: (a) => {
    arity(a, 3, 6)
    const n = num(a[0])
    const p = num(a[1])
    const pvv = num(a[2])
    const fvv = num(a[3], 0)
    const type = num(a[4], 0)
    const f = (r: number) => {
      if (Math.abs(r) < 1e-12) return pvv + p * n + fvv
      const g = Math.pow(1 + r, n)
      return pvv * g + (p * (1 + r * type) * (g - 1)) / r + fvv
    }
    return solve(f, num(a[5], 0.1))
  },
  INTPER: (a) => (arity(a, 4, 6), ipmt(num(a[0]), num(a[1]), num(a[2]), num(a[3]), num(a[4], 0), num(a[5], 0))),
  PRINCPER: (a) => {
    arity(a, 4, 6)
    const [r, per, n, pvv, fvv, type] = [num(a[0]), num(a[1]), num(a[2]), num(a[3]), num(a[4], 0), num(a[5], 0)]
    return pmt(r, n, pvv, fvv, type) - ipmt(r, per, n, pvv, fvv, type)
  },
  VAN: (a) => {
    if (a.length < 2) return VALUE_ERR()
    const xs = numbersOf(a.slice(1))
    return isError(xs) ? xs : npv(num(a[0]), xs)
  },
  TRI: (a) => {
    arity(a, 1, 2)
    const xs = numbersOf([a[0]])
    if (isError(xs)) return xs
    if (!xs.some((x) => x > 0) || !xs.some((x) => x < 0)) return NUM()
    return solve((r) => xs.reduce((acc, c, i) => acc + c / Math.pow(1 + r, i), 0), num(a[1], 0.1))
  },
  CONCAT: (a) => {
    let s = ''
    for (const v of flatten(a)) {
      const t = toText(v)
      if (isError(t)) return t
      s += t
    }
    return s
  },
  GAUCHE: (a) => {
    arity(a, 1, 2)
    const t = toText(a[0])
    return isError(t) ? t : t.slice(0, num(a[1], 1))
  },
  DROITE: (a) => {
    arity(a, 1, 2)
    const t = toText(a[0])
    const n = num(a[1], 1)
    return isError(t) ? t : n === 0 ? '' : t.slice(-n)
  },
  NBCAR: (a) => {
    arity(a, 1)
    const t = toText(a[0])
    return isError(t) ? t : t.length
  },
  MAJUSCULE: (a) => {
    arity(a, 1)
    const t = toText(a[0])
    return isError(t) ? t : t.toUpperCase()
  },
  MINUSCULE: (a) => {
    arity(a, 1)
    const t = toText(a[0])
    return isError(t) ? t : t.toLowerCase()
  },
}

export const LAZY_FUNCTIONS: Record<string, LazyImpl> = {
  SI: (a) => {
    arity(a, 2, 3)
    const c = toBool(a[0]())
    if (isError(c)) return c
    if (c) return a[1]()
    return a[2] ? a[2]() : false
  },
  SIERREUR: (a) => {
    arity(a, 2)
    const v = a[0]()
    const s = isRange(v) ? v : toScalar(v)
    return isError(s) ? a[1]() : v
  },
  'SI.NON.DISP': (a) => {
    arity(a, 2)
    const v = a[0]()
    const s = isRange(v) ? v : toScalar(v)
    return isError(s) && s.code === '#N/A' ? a[1]() : v
  },
  'SI.CONDITIONS': (a) => {
    if (a.length < 2 || a.length % 2) return VALUE_ERR()
    for (let i = 0; i < a.length; i += 2) {
      const c = toBool(a[i]())
      if (isError(c)) return c
      if (c) return a[i + 1]()
    }
    return NA()
  },
}

/** Noms anglais → noms français, pour accepter les deux. */
export const ALIASES: Record<string, string> = {
  SUM: 'SOMME',
  AVERAGE: 'MOYENNE',
  PRODUCT: 'PRODUIT',
  MEDIAN: 'MEDIANE',
  COUNT: 'NB',
  COUNTA: 'NBVAL',
  COUNTBLANK: 'NB.VIDE',
  ROUND: 'ARRONDI',
  ROUNDUP: 'ARRONDI.SUP',
  ROUNDDOWN: 'ARRONDI.INF',
  INT: 'ENT',
  SQRT: 'RACINE',
  POWER: 'PUISSANCE',
  AND: 'ET',
  OR: 'OU',
  NOT: 'NON',
  IF: 'SI',
  IFERROR: 'SIERREUR',
  IFNA: 'SI.NON.DISP',
  IFS: 'SI.CONDITIONS',
  SUMIF: 'SOMME.SI',
  COUNTIF: 'NB.SI',
  AVERAGEIF: 'MOYENNE.SI',
  SUMIFS: 'SOMME.SI.ENS',
  COUNTIFS: 'NB.SI.ENS',
  AVERAGEIFS: 'MOYENNE.SI.ENS',
  MAXIFS: 'MAX.SI.ENS',
  MINIFS: 'MIN.SI.ENS',
  SUMPRODUCT: 'SOMMEPROD',
  VLOOKUP: 'RECHERCHEV',
  XLOOKUP: 'RECHERCHEX',
  MATCH: 'EQUIV',
  PMT: 'VPM',
  FV: 'VC',
  PV: 'VA',
  NPER: 'NPM',
  RATE: 'TAUX',
  IPMT: 'INTPER',
  PPMT: 'PRINCPER',
  NPV: 'VAN',
  IRR: 'TRI',
  CONCATENATE: 'CONCAT',
  CONCATENER: 'CONCAT',
  LEFT: 'GAUCHE',
  RIGHT: 'DROITE',
  LEN: 'NBCAR',
  UPPER: 'MAJUSCULE',
  LOWER: 'MINUSCULE',
}

export function canonicalName(name: string): string {
  return ALIASES[name] ?? name
}

import { parseAddress, toAddress } from './address'
import { compare, formatGeneral, parseNumberText, toNumber, toScalar, toText } from './coerce'
import { canonicalName, FUNCTIONS, LAZY_FUNCTIONS } from './functions'
import { functionsUsed, ParseError, parseFormula } from './parser'
import { FormulaError, isError, isRange, type Node, type Scalar, type Value } from './types'

export type RawCell = string | number | boolean | null

/** Décalage appliqué aux références relatives (simule la recopie d'une formule). */
export interface Shift {
  dc: number
  dr: number
}

type CellDef =
  | { kind: 'value'; v: Scalar }
  | { kind: 'formula'; ast: Node; shift: Shift }
  | { kind: 'bad'; error: FormulaError }

const NO_SHIFT: Shift = { dc: 0, dr: 0 }

/** Interprète une saisie comme le ferait Excel : nombre, pourcentage, booléen ou texte. */
export function parseInput(raw: RawCell): Scalar {
  if (raw === null || typeof raw === 'number' || typeof raw === 'boolean') return raw
  if (raw.trim() === '') return null
  const n = parseNumberText(raw)
  if (n !== null) return n
  const u = raw.trim().toUpperCase()
  if (u === 'VRAI') return true
  if (u === 'FAUX') return false
  return raw
}

export function compile(src: string): { ast: Node } | { error: string } {
  const body = src.trim().replace(/^[=+]/, '')
  try {
    return { ast: parseFormula(body) }
  } catch (e) {
    return { error: e instanceof ParseError || e instanceof Error ? e.message : 'Formule invalide' }
  }
}

export class SheetModel {
  private defs = new Map<string, CellDef>()
  private cache = new Map<string, Scalar>()
  private visiting = new Set<string>()

  constructor(cells: Record<string, RawCell> = {}) {
    for (const [addr, raw] of Object.entries(cells)) this.set(addr, raw)
  }

  set(addr: string, raw: RawCell, shift: Shift = NO_SHIFT) {
    const key = addr.toUpperCase()
    this.cache.clear()
    if (typeof raw === 'string' && raw.trim().startsWith('=')) {
      const c = compile(raw)
      this.defs.set(key, 'ast' in c ? { kind: 'formula', ast: c.ast, shift } : { kind: 'bad', error: new FormulaError('#NOM?', c.error) })
    } else {
      this.defs.set(key, { kind: 'value', v: parseInput(raw) })
    }
  }

  get(addr: string): Scalar {
    const { col, row } = parseAddress(addr)
    return this.getAt(col, row)
  }

  getAt(col: number, row: number): Scalar {
    const key = toAddress(col, row)
    if (this.cache.has(key)) return this.cache.get(key)!
    const def = this.defs.get(key)
    if (!def) return null
    if (def.kind === 'value') return def.v
    if (def.kind === 'bad') return def.error
    if (this.visiting.has(key)) return new FormulaError('#CIRC!', 'Référence circulaire')
    this.visiting.add(key)
    let result: Scalar
    try {
      const v = evaluate(def.ast, this, def.shift)
      result = isRange(v) ? toScalar(v) : v
      if (typeof result === 'number' && !isFinite(result)) result = new FormulaError('#NOMBRE!')
    } finally {
      this.visiting.delete(key)
    }
    this.cache.set(key, result)
    return result
  }
}

function resolve(ref: Extract<Node, { t: 'ref' }>, shift: Shift) {
  return { col: ref.absCol ? ref.col : ref.col + shift.dc, row: ref.absRow ? ref.row : ref.row + shift.dr }
}

export function evaluate(node: Node, sheet: SheetModel, shift: Shift = NO_SHIFT): Value {
  try {
    return evalNode(node, sheet, shift)
  } catch (e) {
    if (e instanceof FormulaError) return e
    throw e
  }
}

function evalNode(node: Node, sheet: SheetModel, shift: Shift): Value {
  switch (node.t) {
    case 'num':
      return node.v
    case 'str':
      return node.v
    case 'bool':
      return node.v
    case 'ref': {
      const { col, row } = resolve(node, shift)
      if (col < 0 || row < 0) return new FormulaError('#REF!')
      return sheet.getAt(col, row)
    }
    case 'range': {
      const a = resolve(node.from, shift)
      const b = resolve(node.to, shift)
      if (Math.min(a.col, b.col, a.row, b.row) < 0) return new FormulaError('#REF!')
      const values: Scalar[][] = []
      for (let r = Math.min(a.row, b.row); r <= Math.max(a.row, b.row); r++) {
        const line: Scalar[] = []
        for (let c = Math.min(a.col, b.col); c <= Math.max(a.col, b.col); c++) line.push(sheet.getAt(c, r))
        values.push(line)
      }
      return { kind: 'range', values }
    }
    case 'neg': {
      const n = toNumber(evalNode(node.e, sheet, shift))
      return isError(n) ? n : -n
    }
    case 'pct': {
      const n = toNumber(evalNode(node.e, sheet, shift))
      return isError(n) ? n : n / 100
    }
    case 'func': {
      const name = canonicalName(node.name)
      const lazy = LAZY_FUNCTIONS[name]
      if (lazy) return lazy(node.args.map((a) => () => evalNode(a, sheet, shift)))
      const fn = FUNCTIONS[name]
      if (!fn) return new FormulaError('#NOM?', `Fonction inconnue : ${node.name}`)
      const args = node.args.map((a) => evalNode(a, sheet, shift))
      return fn(args)
    }
    case 'bin': {
      const l = evalNode(node.l, sheet, shift)
      const r = evalNode(node.r, sheet, shift)
      if (node.op === '&') {
        const a = toText(l)
        if (isError(a)) return a
        const b = toText(r)
        return isError(b) ? b : a + b
      }
      if (['=', '<>', '<', '>', '<=', '>='].includes(node.op)) {
        const a = toScalar(l)
        if (isError(a)) return a
        const b = toScalar(r)
        if (isError(b)) return b
        const c = compare(a, b)
        switch (node.op) {
          case '=':
            return c === 0
          case '<>':
            return c !== 0
          case '<':
            return c < 0
          case '>':
            return c > 0
          case '<=':
            return c <= 0
          default:
            return c >= 0
        }
      }
      const a = toNumber(l)
      if (isError(a)) return a
      const b = toNumber(r)
      if (isError(b)) return b
      switch (node.op) {
        case '+':
          return a + b
        case '-':
          return a - b
        case '*':
          return a * b
        case '/':
          return b === 0 ? new FormulaError('#DIV/0!') : a / b
        case '^':
          return Math.pow(a, b)
      }
      return new FormulaError('#VALEUR!')
    }
  }
}

// ---------- Réécriture d'une formule (affichage après recopie) ----------

function refText(ref: Extract<Node, { t: 'ref' }>, shift: Shift) {
  const { col, row } = resolve(ref, shift)
  if (col < 0 || row < 0) return '#REF!'
  const addr = toAddress(col, row)
  const m = /^([A-Z]+)(\d+)$/.exec(addr)!
  return `${ref.absCol ? '$' : ''}${m[1]}${ref.absRow ? '$' : ''}${m[2]}`
}

const PREC: Record<string, number> = { '=': 1, '<>': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '&': 2, '+': 3, '-': 3, '*': 4, '/': 4, '^': 5 }

export function formulaToString(node: Node, shift: Shift = NO_SHIFT, parentPrec = 0): string {
  switch (node.t) {
    case 'num':
      return formatGeneral(node.v)
    case 'str':
      return `"${node.v.replace(/"/g, '""')}"`
    case 'bool':
      return node.v ? 'VRAI' : 'FAUX'
    case 'ref':
      return refText(node, shift)
    case 'range':
      return `${refText(node.from, shift)}:${refText(node.to, shift)}`
    case 'neg':
      return `-${formulaToString(node.e, shift, 6)}`
    case 'pct':
      return `${formulaToString(node.e, shift, 7)}%`
    case 'func':
      return `${canonicalName(node.name)}(${node.args.map((a) => formulaToString(a, shift)).join(';')})`
    case 'bin': {
      const p = PREC[node.op]
      const s = `${formulaToString(node.l, shift, p)}${node.op}${formulaToString(node.r, shift, p + 1)}`
      return p < parentPrec ? `(${s})` : s
    }
  }
}

/** Fonctions utilisées par une formule, en noms français canoniques. */
export function usedFunctions(src: string): string[] {
  const c = compile(src)
  if (!('ast' in c)) return []
  return [...functionsUsed(c.ast)].map(canonicalName)
}

export { isError, FormulaError }
export type { Scalar }

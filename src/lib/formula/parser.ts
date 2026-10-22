import { colToIndex } from './address'
import type { Node } from './types'

type Tok =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'ref'; v: string }
  | { k: 'name'; v: string }
  | { k: 'op'; v: string }
  | { k: '(' | ')' | 'sep' | ':' }

export class ParseError extends Error {}

const REF_RE = /^\$?[A-Z]{1,3}\$?[0-9]+$/
const NAME_RE = /^[A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_.]*/
const DOLLAR_REF_RE = /^\$?[A-Za-z]{1,3}\$?[0-9]+/

/** Supprime les accents et met en majuscules : « année » → « ANNEE ». */
export function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
}

function tokenize(src: string, sep: string, dec: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === ' ' || c === '\t' || c === '\n') {
      i++
      continue
    }
    if (c === '"') {
      let s = ''
      i++
      while (i < src.length) {
        if (src[i] === '"') {
          if (src[i + 1] === '"') {
            s += '"'
            i += 2
            continue
          }
          break
        }
        s += src[i++]
      }
      if (src[i] !== '"') throw new ParseError('Guillemet fermant manquant')
      i++
      toks.push({ k: 'str', v: s })
      continue
    }
    const numMatch = new RegExp(`^(\\d+(\\${dec}\\d*)?|\\${dec}\\d+)`).exec(src.slice(i))
    if (numMatch && !/^\d+[A-Za-z$]/.test(src.slice(i)) ) {
      toks.push({ k: 'num', v: parseFloat(numMatch[0].replace(dec, '.')) })
      i += numMatch[0].length
      continue
    }
    if (c === '$') {
      const m = DOLLAR_REF_RE.exec(src.slice(i))
      if (!m) throw new ParseError(`Référence invalide près de « ${src.slice(i, i + 6)} »`)
      toks.push({ k: 'ref', v: m[0].toUpperCase() })
      i += m[0].length
      continue
    }
    const nm = NAME_RE.exec(src.slice(i))
    if (nm) {
      // « A1$ » n'existe pas, mais « A$1 » oui : on tente d'abord une référence avec $.
      const refm = DOLLAR_REF_RE.exec(src.slice(i))
      const next = src[i + nm[0].length]
      if (refm && refm[0].length >= nm[0].length && src[i + refm[0].length] !== '(') {
        toks.push({ k: 'ref', v: refm[0].toUpperCase() })
        i += refm[0].length
        continue
      }
      const word = nm[0]
      if (next !== '(' && REF_RE.test(word.toUpperCase())) {
        toks.push({ k: 'ref', v: word.toUpperCase() })
      } else {
        toks.push({ k: 'name', v: word })
      }
      i += word.length
      continue
    }
    if (c === sep) {
      toks.push({ k: 'sep' })
      i++
      continue
    }
    if (c === '(' || c === ')' || c === ':') {
      toks.push({ k: c })
      i++
      continue
    }
    const two = src.slice(i, i + 2)
    if (two === '<=' || two === '>=' || two === '<>') {
      toks.push({ k: 'op', v: two })
      i += 2
      continue
    }
    if ('+-*/^&=<>%'.includes(c)) {
      toks.push({ k: 'op', v: c })
      i++
      continue
    }
    throw new ParseError(`Caractère inattendu « ${c} »`)
  }
  return toks
}

function refNode(s: string): Extract<Node, { t: 'ref' }> {
  const m = /^(\$?)([A-Z]{1,3})(\$?)(\d+)$/.exec(s)
  if (!m) throw new ParseError(`Référence invalide : ${s}`)
  return { t: 'ref', absCol: m[1] === '$', col: colToIndex(m[2]), absRow: m[3] === '$', row: parseInt(m[4], 10) - 1 }
}

class Parser {
  pos = 0
  constructor(private toks: Tok[]) {}

  peek(): Tok | undefined {
    return this.toks[this.pos]
  }
  isOp(...ops: string[]) {
    const t = this.peek()
    return t?.k === 'op' && ops.includes(t.v)
  }
  next(): Tok {
    const t = this.toks[this.pos++]
    if (!t) throw new ParseError('Formule incomplète')
    return t
  }

  parse(): Node {
    const n = this.comparison()
    if (this.pos < this.toks.length) {
      const t = this.peek()!
      if (t.k === 'sep') throw new ParseError('Séparateur inattendu : en français, séparez les arguments par « ; »')
      if (t.k === ')') throw new ParseError('Parenthèse fermante en trop')
      throw new ParseError('Formule mal construite')
    }
    return n
  }

  comparison(): Node {
    let l = this.concat()
    while (this.isOp('=', '<>', '<', '>', '<=', '>=')) {
      const op = (this.next() as { v: string }).v
      l = { t: 'bin', op, l, r: this.concat() }
    }
    return l
  }
  concat(): Node {
    let l = this.additive()
    while (this.isOp('&')) {
      this.next()
      l = { t: 'bin', op: '&', l, r: this.additive() }
    }
    return l
  }
  additive(): Node {
    let l = this.mult()
    while (this.isOp('+', '-')) {
      const op = (this.next() as { v: string }).v
      l = { t: 'bin', op, l, r: this.mult() }
    }
    return l
  }
  mult(): Node {
    let l = this.power()
    while (this.isOp('*', '/')) {
      const op = (this.next() as { v: string }).v
      l = { t: 'bin', op, l, r: this.power() }
    }
    return l
  }
  power(): Node {
    let l = this.unary()
    while (this.isOp('^')) {
      this.next()
      l = { t: 'bin', op: '^', l, r: this.unary() }
    }
    return l
  }
  unary(): Node {
    if (this.isOp('-')) {
      this.next()
      return { t: 'neg', e: this.unary() }
    }
    if (this.isOp('+')) {
      this.next()
      return this.unary()
    }
    return this.postfix()
  }
  postfix(): Node {
    let e = this.primary()
    while (this.isOp('%')) {
      this.next()
      e = { t: 'pct', e }
    }
    return e
  }
  primary(): Node {
    const t = this.next()
    switch (t.k) {
      case 'num':
        return { t: 'num', v: t.v }
      case 'str':
        return { t: 'str', v: t.v }
      case 'ref': {
        const from = refNode(t.v)
        if (this.peek()?.k === ':') {
          this.next()
          const t2 = this.next()
          if (t2.k !== 'ref') throw new ParseError('Plage invalide après « : »')
          return { t: 'range', from, to: refNode(t2.v) }
        }
        return from
      }
      case 'name': {
        const name = normalizeName(t.v)
        if (this.peek()?.k !== '(') {
          if (name === 'VRAI' || name === 'TRUE') return { t: 'bool', v: true }
          if (name === 'FAUX' || name === 'FALSE') return { t: 'bool', v: false }
          throw new ParseError(`Nom inconnu « ${t.v} » (oubli des guillemets autour d'un texte ?)`)
        }
        this.next()
        const args: Node[] = []
        if (this.peek()?.k === ')') {
          this.next()
          return { t: 'func', name, args }
        }
        for (;;) {
          // Argument vide : « SI(A1>0;;1) »
          if (this.peek()?.k === 'sep' || this.peek()?.k === ')') args.push({ t: 'str', v: '' })
          else args.push(this.comparison())
          const sepOrClose = this.next()
          if (sepOrClose.k === ')') break
          if (sepOrClose.k !== 'sep') throw new ParseError(`Séparateur « ; » ou « ) » attendu dans ${name}`)
        }
        return { t: 'func', name, args }
      }
      case '(': {
        const e = this.comparison()
        const c = this.next()
        if (c.k !== ')') throw new ParseError('Parenthèse fermante manquante')
        return e
      }
      default:
        throw new ParseError('Formule mal construite')
    }
  }
}

function hasTopLevelSemicolon(src: string) {
  let inStr = false
  for (const c of src) {
    if (c === '"') inStr = !inStr
    else if (c === ';' && !inStr) return true
  }
  return false
}

/**
 * Analyse une formule (sans le « = » initial).
 * Convention française (« ; » entre arguments, « , » décimale) si la formule contient
 * un « ; », sinon convention anglaise ; en cas d'échec on retente en français.
 */
export function parseFormula(src: string): Node {
  const fr = () => new Parser(tokenize(src, ';', ',')).parse()
  if (hasTopLevelSemicolon(src)) return fr()
  try {
    return new Parser(tokenize(src, ',', '.')).parse()
  } catch (e) {
    try {
      return fr()
    } catch {
      throw e
    }
  }
}

/** Liste des fonctions utilisées dans une formule (noms normalisés). */
export function functionsUsed(node: Node, acc = new Set<string>()): Set<string> {
  switch (node.t) {
    case 'func':
      acc.add(node.name)
      node.args.forEach((a) => functionsUsed(a, acc))
      break
    case 'bin':
      functionsUsed(node.l, acc)
      functionsUsed(node.r, acc)
      break
    case 'neg':
    case 'pct':
      functionsUsed(node.e, acc)
      break
  }
  return acc
}

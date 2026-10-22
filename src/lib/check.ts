import type { FillExercise, FormulaExercise, NumericExercise, SheetSpec } from '../content/types'
import { parseAddress, toAddress } from './formula/address'
import { parseNumberText } from './formula/coerce'
import { compile, SheetModel, usedFunctions, type Shift } from './formula/engine'
import { formatValue } from './formula/format'
import { isError, type Scalar } from './formula/types'

export interface CheckResult {
  ok: boolean
  message?: string
}

export interface FormulaOverride {
  addr: string
  formula: string
  shift: Shift
}

/** Cellules remplies par la recopie d'une formule de `target` jusqu'à `fillTo` (vers le bas). */
export function fillTargets(target: string, fillTo?: string): { addr: string; shift: Shift }[] {
  const t = parseAddress(target)
  if (!fillTo) return [{ addr: target.toUpperCase(), shift: { dc: 0, dr: 0 } }]
  const end = parseAddress(fillTo)
  const out: { addr: string; shift: Shift }[] = []
  for (let r = t.row; r <= end.row; r++) out.push({ addr: toAddress(t.col, r), shift: { dc: 0, dr: r - t.row } })
  return out
}

export function buildModel(sheet: SheetSpec, overrides: FormulaOverride[] = []): SheetModel {
  const model = new SheetModel()
  sheet.rows.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v !== null && v !== '') model.set(toAddress(c, r), v)
    }),
  )
  for (const o of overrides) model.set(o.addr, o.formula, o.shift)
  return model
}

function sameValue(a: Scalar, b: Scalar): boolean {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b))
  if (typeof a === 'string' && typeof b === 'string') return a.trim().toLowerCase() === b.trim().toLowerCase()
  if (isError(a) || isError(b)) return false
  return a === b
}

function overridesFor(ex: FormulaExercise, formula: string): FormulaOverride[] {
  return fillTargets(ex.target, ex.fillTo).map((t) => ({ ...t, formula }))
}

export function checkFormula(ex: FormulaExercise, input: string): CheckResult {
  const text = input.trim()
  if (!text) return { ok: false, message: 'Saisissez une formule dans la cellule.' }
  if (!text.startsWith('=')) return { ok: false, message: 'Une formule doit commencer par le signe =.' }
  const c = compile(text)
  if ('error' in c) return { ok: false, message: c.error }

  const used = usedFunctions(text)
  const missing = (ex.requires ?? []).filter((f) => !used.includes(f))
  if (missing.length) return { ok: false, message: `Utilisez la fonction ${missing.join(', ')} dans votre formule.` }

  const user = buildModel(ex.sheet, overridesFor(ex, text))
  const expected = buildModel(ex.sheet, overridesFor(ex, ex.solution))
  for (const { addr } of fillTargets(ex.target, ex.fillTo)) {
    const got = user.get(addr)
    const want = expected.get(addr)
    if (!sameValue(got, want)) {
      const shown = isError(got) ? `l’erreur ${got.code}` : `« ${formatValue(got)} »`
      const where = ex.fillTo && addr !== ex.target.toUpperCase() ? ` après recopie en ${addr}` : ` en ${addr}`
      return { ok: false, message: `Résultat incorrect${where} : on obtient ${shown}.` }
    }
  }
  return { ok: true }
}

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').replace(/^"|"$/g, '').toLowerCase()

export function checkFill(ex: FillExercise, answers: string[]): CheckResult {
  const wrong = ex.blanks.map((accepted, i) => accepted.some((a) => normalize(a) === normalize(answers[i] ?? ''))).filter((ok) => !ok).length
  if (wrong === 0) return { ok: true }
  return { ok: false, message: wrong === 1 ? 'Un trou est incorrect.' : `${wrong} trous sont incorrects.` }
}

export function checkOrder(lines: string[], answer: string[]): CheckResult {
  return lines.every((l, i) => l === answer[i]) ? { ok: true } : { ok: false, message: 'L’ordre n’est pas encore le bon.' }
}

export function numericTolerance(ex: NumericExercise) {
  return ex.tolerance ?? Math.abs(ex.answer) * 0.005
}

export function checkNumeric(ex: NumericExercise, input: string): CheckResult {
  const n = parseNumberText(input)
  if (n === null) return { ok: false, message: 'Saisissez un nombre (ex. : 1234,56).' }
  return Math.abs(n - ex.answer) <= numericTolerance(ex) + 1e-9 ? { ok: true } : { ok: false, message: 'Ce n’est pas le bon résultat.' }
}

import { describe, expect, it } from 'vitest'
import { buildModel, checkFill, checkFormula, checkNumeric, checkOrder, fillTargets } from '../lib/check'
import { formatNumber } from '../lib/formula/format'
import { isError } from '../lib/formula/types'
import { ALL_LESSONS, MODULES } from './index'

describe('contenu pédagogique', () => {
  it('identifiants de leçons uniques', () => {
    const ids = ALL_LESSONS.map((l) => l.lesson.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  for (const mod of MODULES) {
    for (const lesson of mod.lessons) {
      describe(`${lesson.id} — ${lesson.title}`, () => {
        it('les exemples de la théorie se calculent sans erreur', () => {
          for (const s of lesson.theory) {
            if (!s.sheet) continue
            const model = buildModel(s.sheet)
            s.sheet.rows.forEach((row, r) =>
              row.forEach((v, c) => {
                if (typeof v === 'string' && v.startsWith('=')) {
                  const got = model.getAt(c, r)
                  expect(isError(got), `${s.title} ${v} → ${String(got)}`).toBe(false)
                }
              }),
            )
          }
        })

        lesson.exercises.forEach((ex, i) => {
          it(`exercice ${i + 1} (${ex.type}) est cohérent`, () => {
            expect(ex.explanation.length).toBeGreaterThan(0)
            switch (ex.type) {
              case 'qcm':
                expect(ex.answer).toBeGreaterThanOrEqual(0)
                expect(ex.answer).toBeLessThan(ex.options.length)
                break
              case 'formula': {
                expect(checkFormula(ex, ex.solution)).toEqual({ ok: true })
                const model = buildModel(ex.sheet, fillTargets(ex.target, ex.fillTo).map((t) => ({ ...t, formula: ex.solution })))
                const values = fillTargets(ex.target, ex.fillTo).map((t) => model.get(t.addr))
                values.forEach((v) => expect(isError(v)).toBe(false))
                // Garde-fou contre une feuille mal alignée (références vers des cellules vides).
                expect(values.some((v) => v !== 0 && v !== null && v !== '')).toBe(true)
                // La cellule cible doit être vide dans l'énoncé.
                expect(buildModel(ex.sheet).get(ex.target)).toBeNull()
                // Une réponse vide ou fausse est refusée.
                expect(checkFormula(ex, '=0').ok).toBe(false)
                break
              }
              case 'fill': {
                const holes = ex.code.match(/\[\[\d+\]\]/g) ?? []
                expect(holes.length).toBe(ex.blanks.length)
                expect(checkFill(ex, ex.blanks.map((b) => b[0])).ok).toBe(true)
                expect(checkFill(ex, ex.blanks.map(() => 'xxx')).ok).toBe(false)
                break
              }
              case 'order':
                expect(ex.lines.length).toBeGreaterThan(1)
                expect(checkOrder(ex.lines, ex.lines).ok).toBe(true)
                expect(checkOrder([...ex.lines].reverse(), ex.lines).ok).toBe(false)
                break
              case 'numeric':
                expect(Number.isFinite(ex.answer)).toBe(true)
                expect(checkNumeric(ex, formatNumber(ex.answer, 4).replace(/\s/g, '')).ok).toBe(true)
                break
            }
          })
        })
      })
    }
  }
})

describe('recopie et références absolues', () => {
  it('une formule sans $ est refusée quand la recopie l’exige', () => {
    const lesson = ALL_LESSONS.find((l) => l.lesson.id === 'bases-3')!.lesson
    const ex = lesson.exercises.find((e) => e.type === 'formula' && e.fillTo)
    if (!ex || ex.type !== 'formula') throw new Error('exercice introuvable')
    expect(checkFormula(ex, '=B2*F1').ok).toBe(false)
    expect(checkFormula(ex, '=B2*$F$1').ok).toBe(true)
    expect(checkFormula(ex, '=B2*F$1').ok).toBe(true)
  })

  it('accepte les noms anglais et la virgule', () => {
    const lesson = ALL_LESSONS.find((l) => l.lesson.id === 'bases-2')!.lesson
    const ex = lesson.exercises.find((e) => e.type === 'formula')
    if (!ex || ex.type !== 'formula') throw new Error('exercice introuvable')
    expect(checkFormula(ex, '=SUM(B2:B7)').ok).toBe(true)
    expect(checkFormula(ex, '=B2+B3+B4+B5+B6+B7').ok).toBe(false) // SOMME exigée
  })
})

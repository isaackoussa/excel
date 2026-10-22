import { useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react'
import type { SheetSpec } from '../content/types'
import { buildModel, type FormulaOverride } from '../lib/check'
import { indexToCol, parseAddress, toAddress } from '../lib/formula/address'
import { compile, formulaToString } from '../lib/formula/engine'
import { formatValue, type Fmt } from '../lib/formula/format'
import { isError, type Scalar } from '../lib/formula/types'

interface SheetProps {
  spec: SheetSpec
  /** Saisies de l'utilisateur, par adresse. */
  edits?: Record<string, string>
  /** Adresses modifiables, ou 'all' (bac à sable). */
  editable?: string[] | 'all'
  /** Cellules remplies par recopie de la formule de l'utilisateur. */
  fills?: FormulaOverride[]
  onEdit?: (addr: string, text: string) => void
  /** Appelé quand l'utilisateur valide avec Entrée dans une cellule d'exercice. */
  onSubmit?: () => void
  /** Taille minimale de la grille (bac à sable). */
  minCols?: number
  minRows?: number
  /** Cellule sélectionnée au départ. */
  initialSelection?: string
  locked?: boolean
}

/** Caractères après lesquels un clic sur une cellule insère sa référence dans la formule. */
const REF_TRIGGERS = '=(;,+-*/^&<>:'

function fmtFor(spec: SheetSpec, addr: string): Fmt {
  const col = addr.replace(/\d+/g, '')
  return spec.formats?.[addr] ?? spec.formats?.[col] ?? 'general'
}

export function Sheet({
  spec,
  edits = {},
  editable = [],
  fills = [],
  onEdit,
  onSubmit,
  minCols = 0,
  minRows = 0,
  initialSelection,
  locked = false,
}: SheetProps) {
  const [selected, setSelected] = useState<string | null>(initialSelection ?? null)
  const [focused, setFocused] = useState(false)
  const activeInput = useRef<HTMLInputElement | null>(null)
  /** Référence en cours d'insertion par glisser (début dans le texte, longueur, cellule d'ancrage). */
  const dragRef = useRef<{ start: number; len: number; anchor: string } | null>(null)
  /** Évite que le clic qui insère une référence ne déplace aussi la sélection. */
  const suppressClick = useRef(false)
  /** Position du curseur à rétablir après insertion d'une référence. */
  const pendingCaret = useRef<number | null>(null)

  // Appliqué juste après le rendu, avant que l'utilisateur ne puisse taper un autre caractère.
  useLayoutEffect(() => {
    const input = activeInput.current
    if (pendingCaret.current === null || !input) return
    input.focus()
    input.setSelectionRange(pendingCaret.current, pendingCaret.current)
    pendingCaret.current = null
  })

  const isEditable = (addr: string) => !locked && (editable === 'all' || editable.includes(addr))

  const model = useMemo(() => {
    const overrides: FormulaOverride[] = [
      ...Object.entries(edits).map(([addr, formula]) => ({ addr, formula, shift: { dc: 0, dr: 0 } })),
      ...fills,
    ]
    return buildModel(spec, overrides)
  }, [spec, edits, fills])

  const fillMap = useMemo(() => new Map(fills.map((f) => [f.addr, f])), [fills])

  const nCols = Math.max(minCols, ...spec.rows.map((r) => r.length), ...[...Object.keys(edits), ...fills.map((f) => f.addr)].map((a) => parseAddress(a).col + 1))
  const nRows = Math.max(minRows, spec.rows.length, ...[...Object.keys(edits), ...fills.map((f) => f.addr)].map((a) => parseAddress(a).row + 1))

  function rawContent(addr: string): string {
    if (addr in edits) return edits[addr]
    const fill = fillMap.get(addr)
    if (fill) {
      const c = compile(fill.formula)
      return 'ast' in c ? `=${formulaToString(c.ast, fill.shift)}` : fill.formula
    }
    const { col, row } = parseAddress(addr)
    const v = spec.rows[row]?.[col]
    if (v === null || v === undefined) return ''
    if (typeof v === 'number') return formatValue(v)
    return v
  }

  function insertReference(ref: string, replace?: { start: number; len: number }) {
    const input = activeInput.current
    if (!input || !selected) return
    const text = input.value
    const start = replace ? replace.start : (input.selectionStart ?? text.length)
    const end = replace ? replace.start + replace.len : (input.selectionEnd ?? text.length)
    const next = text.slice(0, start) + ref + text.slice(end)
    pendingCaret.current = start + ref.length
    onEdit?.(selected, next)
    return start
  }

  function canInsertReference(): boolean {
    const input = activeInput.current
    if (!focused || !input || !input.value.startsWith('=')) return false
    const caret = input.selectionStart ?? input.value.length
    const before = input.value.slice(0, caret).trimEnd()
    return REF_TRIGGERS.includes(before[before.length - 1] ?? '')
  }

  function handleMouseDown(e: MouseEvent, addr: string) {
    if (addr !== selected && canInsertReference()) {
      e.preventDefault()
      suppressClick.current = true
      const start = insertReference(addr)
      if (start !== undefined) dragRef.current = { start, len: addr.length, anchor: addr }
      return
    }
    dragRef.current = null
  }

  function handleMouseEnter(addr: string) {
    const drag = dragRef.current
    if (!drag) return
    const a = parseAddress(drag.anchor)
    const b = parseAddress(addr)
    const ref =
      addr === drag.anchor
        ? addr
        : `${toAddress(Math.min(a.col, b.col), Math.min(a.row, b.row))}:${toAddress(Math.max(a.col, b.col), Math.max(a.row, b.row))}`
    insertReference(ref, drag)
    dragRef.current = { ...drag, len: ref.length }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (editable === 'all' && selected) {
        const { col, row } = parseAddress(selected)
        setSelected(toAddress(col, Math.min(row + 1, nRows - 1)))
      } else {
        ;(e.target as HTMLInputElement).blur()
        onSubmit?.()
      }
    } else if (e.key === 'Escape') {
      ;(e.target as HTMLInputElement).blur()
    }
  }

  const inputProps = (addr: string) => ({
    value: edits[addr] ?? '',
    onChange: (e: ChangeEvent<HTMLInputElement>) => onEdit?.(addr, e.target.value),
    onFocus: (e: FocusEvent<HTMLInputElement>) => {
      activeInput.current = e.target
      setFocused(true)
    },
    onBlur: () => setFocused(false),
    onKeyDown: handleKeyDown,
    spellCheck: false,
    autoComplete: 'off',
    autoCapitalize: 'off',
  })

  function display(v: Scalar, addr: string) {
    return formatValue(v, fmtFor(spec, addr))
  }

  const selectedEditable = selected !== null && isEditable(selected)

  return (
    <div className="sheet" onMouseUp={() => (dragRef.current = null)}>
      <div className="formula-bar">
        <span className="name-box">{selected ?? ''}</span>
        <span className="fx">fx</span>
        {selectedEditable ? (
          <input className="fx-input" {...inputProps(selected)} placeholder="Tapez votre formule, ex. =SOMME(B2:B6)" />
        ) : (
          <span className="fx-text">{selected ? rawContent(selected) : ''}</span>
        )}
      </div>
      <div className="sheet-scroll">
        <table className="grid">
          <thead>
            <tr>
              <th className="corner" />
              {Array.from({ length: nCols }, (_, c) => (
                <th key={c} style={spec.widths?.[c] ? { minWidth: spec.widths[c] } : undefined}>
                  {indexToCol(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: nRows }, (_, r) => (
              <tr key={r}>
                <th>{r + 1}</th>
                {Array.from({ length: nCols }, (_, c) => {
                  const addr = toAddress(c, r)
                  const value = model.getAt(c, r)
                  const editableCell = isEditable(addr)
                  const isSel = addr === selected
                  const classes = ['cell']
                  if (r === 0 && editable !== 'all') classes.push('header')
                  if (typeof value === 'number') classes.push('num')
                  if (isError(value)) classes.push('error')
                  if (editableCell && editable !== 'all') classes.push('target')
                  if (fillMap.has(addr)) classes.push('filled')
                  if (isSel) classes.push('selected')
                  return (
                    <td
                      key={c}
                      className={classes.join(' ')}
                      onMouseDown={(e) => handleMouseDown(e, addr)}
                      onMouseEnter={() => handleMouseEnter(addr)}
                      onClick={() => {
                        if (suppressClick.current) suppressClick.current = false
                        else setSelected(addr)
                      }}
                      title={isError(value) && value.message ? value.message : undefined}
                    >
                      {editableCell && isSel ? (
                        <input className="cell-input" autoFocus {...inputProps(addr)} />
                      ) : editableCell && !edits[addr] && editable !== 'all' ? (
                        <span className="placeholder">?</span>
                      ) : (
                        display(value, addr)
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

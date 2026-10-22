import { useEffect, useMemo, useRef, useState } from 'react'
import type { Exercise, FillExercise, FormulaExercise, NumericExercise, OrderExercise, QcmExercise } from '../content/types'
import { checkFill, checkFormula, checkNumeric, checkOrder, fillTargets, type CheckResult } from '../lib/check'
import { DATASETS } from '../lib/datasets'
import { formatNumber } from '../lib/formula/format'
import { CodeBlock, highlightVba } from './CodeBlock'
import { DownloadButton } from './DownloadButton'
import { Sheet } from './Sheet'

export type ExerciseStatus = 'idle' | 'correct' | 'wrong' | 'revealed'

export interface Answer {
  ready: boolean
  check: () => CheckResult
}

interface Props<E> {
  ex: E
  status: ExerciseStatus
  onAnswer: (a: Answer) => void
  onSubmit: () => void
}

const done = (s: ExerciseStatus) => s === 'correct' || s === 'revealed'

function Hint({ text }: { text?: string }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  return open ? (
    <p className="hint">💡 {text}</p>
  ) : (
    <button type="button" className="link-button" onClick={() => setOpen(true)}>
      💡 Afficher un indice
    </button>
  )
}

function Qcm({ ex, status, onAnswer }: Props<QcmExercise>) {
  const [choice, setChoice] = useState<number | null>(null)
  useEffect(() => {
    onAnswer({ ready: choice !== null, check: () => (choice === ex.answer ? { ok: true } : { ok: false, message: 'Ce n’est pas la bonne réponse.' }) })
  }, [choice, ex, onAnswer])
  return (
    <div className="exercise">
      <h2 className="prompt">{ex.question}</h2>
      {ex.code && <CodeBlock code={ex.code} />}
      {ex.sheet && <Sheet spec={ex.sheet} locked />}
      <div className="options">
        {ex.options.map((opt, i) => {
          const classes = ['option']
          if (choice === i) classes.push('chosen')
          if (done(status) && i === ex.answer) classes.push('right')
          if (status === 'wrong' && choice === i) classes.push('wrong')
          return (
            <button key={i} type="button" className={classes.join(' ')} disabled={done(status)} onClick={() => setChoice(i)}>
              <span className="option-key">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Formula({ ex, status, onAnswer, onSubmit }: Props<FormulaExercise>) {
  const target = ex.target.toUpperCase()
  const [text, setText, textRef] = useLatest('')
  const shown = status === 'revealed' ? ex.solution : text
  const fills = useMemo(
    () => (shown.trim().startsWith('=') ? fillTargets(ex.target, ex.fillTo).slice(1).map((t) => ({ ...t, formula: shown })) : []),
    [shown, ex],
  )
  useEffect(() => {
    onAnswer({ ready: text.trim().length > 0, check: () => checkFormula(ex, textRef.current) })
  }, [text, ex, onAnswer, textRef])
  return (
    <div className="exercise">
      <h2 className="prompt">{ex.prompt}</h2>
      <Sheet
        spec={ex.sheet}
        edits={{ [target]: shown }}
        editable={[target]}
        fills={fills}
        onEdit={(_, t) => setText(t)}
        onSubmit={onSubmit}
        initialSelection={target}
        locked={done(status)}
      />
      <p className="sheet-help">
        Cliquez sur la cellule <strong>{target}</strong> et tapez votre formule. Astuce : pendant la saisie, cliquez sur une cellule pour insérer sa
        référence.
        {ex.fillTo && (
          <>
            {' '}
            La formule est automatiquement recopiée jusqu’en <strong>{ex.fillTo}</strong> (cellules vertes).
          </>
        )}
      </p>
      {status === 'revealed' && (
        <p className="solution">
          Solution : <code>{ex.solution}</code>
        </p>
      )}
      {!done(status) && <Hint text={ex.hint} />}
    </div>
  )
}

function Fill({ ex, status, onAnswer, onSubmit }: Props<FillExercise>) {
  const [answers, setAnswers, answersRef] = useLatest<string[]>(() => ex.blanks.map(() => ''))
  useEffect(() => {
    onAnswer({ ready: answers.every((a) => a.trim()), check: () => checkFill(ex, answersRef.current) })
  }, [answers, ex, onAnswer, answersRef])
  const revealed = status === 'revealed'
  return (
    <div className="exercise">
      <h2 className="prompt">{ex.prompt}</h2>
      <pre className="code">
        {ex.code.split('\n').map((line, li) => (
          <div key={li}>
            {line.split(/(\[\[\d+\]\])/).map((part, pi) => {
              const m = /^\[\[(\d+)\]\]$/.exec(part)
              if (!m) return <span key={pi}>{highlightVba(part)}</span>
              const k = Number(m[1])
              const width = Math.max(4, ...ex.blanks[k].map((b) => b.length)) + 2
              return (
                <input
                  key={pi}
                  className="blank"
                  style={{ width: `${width}ch` }}
                  value={revealed ? ex.blanks[k][0] : answers[k]}
                  disabled={done(status)}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  onChange={(e) => setAnswers((prev) => prev.map((a, i) => (i === k ? e.target.value : a)))}
                  onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                />
              )
            })}
          </div>
        ))}
      </pre>
      {!done(status) && <Hint text={ex.hint} />}
    </div>
  )
}

/**
 * État d'une saisie texte, doublé d'une référence toujours à jour : la vérification
 * déclenchée par Entrée juste après une frappe doit lire la toute dernière valeur.
 */
function useLatest<T>(initial: T | (() => T)) {
  const [value, setValue] = useState(initial)
  const ref = useRef(value)
  const set = (v: T | ((prev: T) => T)) => {
    const next = typeof v === 'function' ? (v as (prev: T) => T)(ref.current) : v
    ref.current = next
    setValue(next)
  }
  return [value, set, ref] as const
}

/** Mélange déterministe qui garantit un ordre différent de la solution. */
function shuffled(lines: string[]): string[] {
  const out = [...lines]
  let seed = lines.join('').length
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280
    const j = Math.floor((seed / 233280) * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  if (out.every((l, i) => l === lines[i])) out.reverse()
  return out
}

function Order({ ex, status, onAnswer }: Props<OrderExercise>) {
  const [lines, setLines] = useState(() => shuffled(ex.lines))
  useEffect(() => {
    onAnswer({ ready: true, check: () => checkOrder(lines, ex.lines) })
  }, [lines, ex, onAnswer])
  const shown = status === 'revealed' ? ex.lines : lines
  const move = (i: number, d: number) =>
    setLines((prev) => {
      const next = [...prev]
      ;[next[i], next[i + d]] = [next[i + d], next[i]]
      return next
    })
  return (
    <div className="exercise">
      <h2 className="prompt">{ex.prompt}</h2>
      <ol className="order-list">
        {shown.map((line, i) => (
          <li key={line} className="order-item">
            <code className="order-code">{highlightVba(line.trimStart())}</code>
            <span className="order-buttons">
              <button type="button" aria-label="Monter" disabled={done(status) || i === 0} onClick={() => move(i, -1)}>
                ↑
              </button>
              <button type="button" aria-label="Descendre" disabled={done(status) || i === shown.length - 1} onClick={() => move(i, 1)}>
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Numeric({ ex, status, onAnswer, onSubmit }: Props<NumericExercise>) {
  const [text, setText, textRef] = useLatest('')
  useEffect(() => {
    onAnswer({ ready: text.trim().length > 0, check: () => checkNumeric(ex, textRef.current) })
  }, [text, ex, onAnswer, textRef])
  return (
    <div className="exercise">
      <h2 className="prompt">{ex.prompt}</h2>
      {ex.file && (
        <div className="file-card">
          <span className="file-icon">📥</span>
          <div>
            <strong>{DATASETS[ex.file].title}</strong>
            <p>{DATASETS[ex.file].description}</p>
          </div>
          <DownloadButton id={ex.file} />
        </div>
      )}
      <div className="numeric-row">
        <input
          className="numeric-input"
          inputMode="decimal"
          placeholder="Votre réponse"
          value={status === 'revealed' ? formatNumber(ex.answer, 2) : text}
          disabled={done(status)}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
        {ex.unit && <span className="unit">{ex.unit}</span>}
      </div>
      {!done(status) && <Hint text={ex.hint} />}
    </div>
  )
}

export function ExerciseView(props: Props<Exercise>) {
  const { ex } = props
  switch (ex.type) {
    case 'qcm':
      return <Qcm {...props} ex={ex} />
    case 'formula':
      return <Formula {...props} ex={ex} />
    case 'fill':
      return <Fill {...props} ex={ex} />
    case 'order':
      return <Order {...props} ex={ex} />
    case 'numeric':
      return <Numeric {...props} ex={ex} />
  }
}

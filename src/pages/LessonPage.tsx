import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CodeBlock } from '../components/CodeBlock'
import { ExerciseView, type Answer, type ExerciseStatus } from '../components/Exercises'
import { Markdown } from '../components/Markdown'
import { Sheet } from '../components/Sheet'
import { ALL_LESSONS, findLesson } from '../content'
import type { CheckResult } from '../lib/check'
import { useAuth } from '../lib/auth'
import { completeLesson, isUnlocked, type CompletionResult } from '../lib/progress'

const XP_FIRST_TRY = 10
const XP_RETRY = 5

export function LessonPage() {
  const { id = '' } = useParams()
  const entry = findLesson(id)
  const { progress } = useAuth()

  if (!entry) {
    return (
      <div className="page narrow">
        <h1>Leçon introuvable</h1>
        <Link to="/app">Retour au parcours</Link>
      </div>
    )
  }
  if (!isUnlocked(progress, id)) {
    return (
      <div className="page narrow center">
        <div className="big-icon">🔒</div>
        <h1>Leçon verrouillée</h1>
        <p>Terminez d’abord la leçon précédente du module « {entry.module.title} ».</p>
        <Link className="btn btn-primary" to="/app">
          Retour au parcours
        </Link>
      </div>
    )
  }
  // La clé réinitialise complètement l'état quand on passe à la leçon suivante.
  return <LessonPlayer key={id} lessonId={id} />
}

function LessonPlayer({ lessonId }: { lessonId: string }) {
  const { module, lesson } = findLesson(lessonId)!
  const navigate = useNavigate()
  const { progress, saveProgress } = useAuth()

  const nTheory = lesson.theory.length
  const nSteps = nTheory + lesson.exercises.length
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<ExerciseStatus>('idle')
  const [feedback, setFeedback] = useState<CheckResult | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const scores = useRef<number[]>([])
  const xp = useRef(0)
  const [result, setResult] = useState<CompletionResult | null>(null)

  const isTheory = step < nTheory
  const exercise = isTheory ? null : lesson.exercises[step - nTheory]

  const onAnswer = useCallback((a: Answer) => {
    setAnswer(a)
    setStatus((s) => (s === 'wrong' ? 'idle' : s))
  }, [])

  const finish = useCallback(async () => {
    const score = scores.current.reduce((a, b) => a + b, 0) / lesson.exercises.length
    const r = completeLesson(progress, lesson.id, score, xp.current)
    setResult(r)
    await saveProgress(r.progress)
  }, [lesson, progress, saveProgress])

  const goNext = useCallback(() => {
    if (step + 1 >= nSteps) {
      void finish()
      return
    }
    setStep(step + 1)
    setStatus('idle')
    setFeedback(null)
    setAttempts(0)
    setAnswer(null)
    window.scrollTo({ top: 0 })
  }, [step, nSteps, finish])

  const verify = useCallback(() => {
    if (!answer?.ready || status === 'correct' || status === 'revealed') return
    const r = answer.check()
    setFeedback(r)
    if (r.ok) {
      setStatus('correct')
      const first = attempts === 0
      xp.current += first ? XP_FIRST_TRY : XP_RETRY
      scores.current.push(first ? 1 : 0.5)
    } else {
      setStatus('wrong')
      setAttempts((a) => a + 1)
    }
  }, [answer, status, attempts])

  const reveal = () => {
    setStatus('revealed')
    setFeedback(null)
    scores.current.push(0)
  }

  const primary = useCallback(() => {
    if (isTheory || status === 'correct' || status === 'revealed') goNext()
    else verify()
  }, [isTheory, status, goNext, verify])

  // Entrée = action principale, sauf dans un champ (géré par les exercices eux-mêmes).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || result) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
      primary()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [primary, result])

  if (result) {
    const idx = ALL_LESSONS.findIndex((l) => l.lesson.id === lesson.id)
    const next = ALL_LESSONS[idx + 1]
    const sameModuleNext = next && next.module.id === module.id ? next : null
    const pct = Math.round((scores.current.reduce((a, b) => a + b, 0) / lesson.exercises.length) * 100)
    return (
      <div className="lesson-done">
        <div className="big-icon">{pct === 100 ? '🏆' : pct >= 60 ? '🎉' : '💪'}</div>
        <h1>Leçon terminée !</h1>
        <p className="muted">{lesson.title}</p>
        <div className="done-stats">
          <div className="done-stat xp">
            <span>+{result.xpGained}</span>XP
          </div>
          <div className="done-stat">
            <span>{pct} %</span>réussite
          </div>
          <div className="done-stat streak">
            <span>🔥 {result.progress.streak.current}</span>
            {result.progress.streak.current > 1 ? 'jours de suite' : 'jour'}
          </div>
        </div>
        {result.newBadges.length > 0 && (
          <div className="new-badges">
            <h2>Nouveau{result.newBadges.length > 1 ? 'x' : ''} badge{result.newBadges.length > 1 ? 's' : ''}</h2>
            {result.newBadges.map((b) => (
              <div key={b.id} className="badge earned">
                <span className="badge-icon">{b.icon}</span>
                <strong>{b.title}</strong>
                <small>{b.description}</small>
              </div>
            ))}
          </div>
        )}
        <div className="done-actions">
          {sameModuleNext && (
            <button type="button" className="btn btn-primary" onClick={() => navigate(`/app/lecon/${sameModuleNext.lesson.id}`)}>
              Leçon suivante : {sameModuleNext.lesson.title}
            </button>
          )}
          <Link className="btn btn-secondary" to="/app">
            Retour au parcours
          </Link>
        </div>
      </div>
    )
  }

  const section = isTheory ? lesson.theory[step] : null

  return (
    <div className="lesson">
      <header className="lesson-top">
        <Link to="/app" className="close" aria-label="Quitter la leçon">
          ✕
        </Link>
        <div className="progress-track" aria-label={`Étape ${step + 1} sur ${nSteps}`}>
          <div className="progress-fill" style={{ width: `${(step / nSteps) * 100}%`, background: module.color }} />
        </div>
        <span className="step-count">
          {step + 1}/{nSteps}
        </span>
      </header>

      <main className="lesson-body">
        {section ? (
          <article className="theory">
            <p className="eyebrow" style={{ color: module.color }}>
              {module.icon} {lesson.title} · Cours
            </p>
            <h1>{section.title}</h1>
            <Markdown text={section.body} />
            {section.code && <CodeBlock code={section.code} />}
            {section.sheet && <Sheet spec={section.sheet} locked />}
            {section.tip && <p className="tip">💡 {section.tip}</p>}
          </article>
        ) : (
          exercise && (
            <>
              <p className="eyebrow" style={{ color: module.color }}>
                Exercice {step - nTheory + 1} sur {lesson.exercises.length}
              </p>
              <ExerciseView key={step} ex={exercise} status={status} onAnswer={onAnswer} onSubmit={primary} />
            </>
          )
        )}
      </main>

      <footer className={`lesson-bar ${status}`}>
        <div className="lesson-bar-inner">
          <div className="feedback">
            {status === 'correct' && (
              <>
                <strong>✅ Bravo !</strong>
                <p>{exercise?.explanation}</p>
              </>
            )}
            {status === 'wrong' && feedback && (
              <>
                <strong>❌ Pas tout à fait</strong>
                <p>{feedback.message}</p>
              </>
            )}
            {status === 'revealed' && (
              <>
                <strong>📖 Solution</strong>
                <p>{exercise?.explanation}</p>
              </>
            )}
          </div>
          <div className="bar-actions">
            {!isTheory && attempts >= 2 && status !== 'correct' && status !== 'revealed' && (
              <button type="button" className="btn btn-ghost" onClick={reveal}>
                Voir la solution
              </button>
            )}
            {isTheory ? (
              <button type="button" className="btn btn-primary" onClick={goNext}>
                {step === nTheory - 1 ? 'Passer aux exercices' : 'Suivant'}
              </button>
            ) : status === 'correct' || status === 'revealed' ? (
              <button type="button" className="btn btn-primary" onClick={goNext}>
                {step + 1 >= nSteps ? 'Terminer' : 'Continuer'}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" disabled={!answer?.ready} onClick={verify}>
                Vérifier
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

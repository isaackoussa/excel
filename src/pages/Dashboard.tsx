import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MODULES, TOTAL_LESSONS } from '../content'
import { useAuth } from '../lib/auth'
import { currentStreak, isUnlocked, levelInfo, nextLesson, xpToday } from '../lib/progress'

function Ring({ value, size = 64, color = '#107c41', children }: { value: number; size?: number; color?: string; children: ReactNode }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-bg" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          className="ring-fg"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, value))}
        />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  )
}

export function Dashboard() {
  const { user, progress } = useAuth()
  const lvl = levelInfo(progress.xp)
  const streak = currentStreak(progress)
  const today = xpToday(progress)
  const next = nextLesson(progress)
  const doneCount = Object.keys(progress.lessons).length

  return (
    <div className="page">
      <section className="hello">
        <div>
          <h1>Bonjour {user?.displayName} 👋</h1>
          <p className="muted">
            {doneCount === 0
              ? 'Bienvenue ! Commencez par la première leçon : 10 minutes suffisent.'
              : `${doneCount} leçon${doneCount > 1 ? 's' : ''} terminée${doneCount > 1 ? 's' : ''} sur ${TOTAL_LESSONS}. Continuez comme ça !`}
          </p>
        </div>
      </section>

      <section className="stats">
        <div className="stat card">
          <Ring value={today / progress.dailyGoal} color="#f7630c">
            <strong>{today}</strong>
          </Ring>
          <div>
            <strong>Objectif du jour</strong>
            <span className="muted">
              {today >= progress.dailyGoal ? 'Atteint, bravo ! 🎯' : `${today} / ${progress.dailyGoal} XP`}
            </span>
          </div>
        </div>
        <div className="stat card">
          <div className="stat-icon">🔥</div>
          <div>
            <strong>
              {streak} jour{streak > 1 ? 's' : ''}
            </strong>
            <span className="muted">Série en cours (record : {progress.streak.best})</span>
          </div>
        </div>
        <div className="stat card">
          <Ring value={lvl.progress} color="#107c41">
            <strong>{lvl.level}</strong>
          </Ring>
          <div>
            <strong>{lvl.title}</strong>
            <span className="muted">{lvl.nextTitle ? `${progress.xp} XP · encore ${lvl.toNext} XP` : `${progress.xp} XP · niveau max`}</span>
          </div>
        </div>
      </section>

      {next && (
        <Link to={`/app/lecon/${next.lesson.id}`} className="continue card" style={{ borderColor: next.module.color }}>
          <span className="continue-icon" style={{ background: next.module.color }}>
            {next.module.icon}
          </span>
          <span className="continue-text">
            <small>{doneCount === 0 ? 'Commencer' : 'Continuer'} · {next.module.title}</small>
            <strong>{next.lesson.title}</strong>
            <span className="muted">{next.lesson.summary}</span>
          </span>
          <span className="btn btn-primary">C’est parti</span>
        </Link>
      )}

      <h2 className="section-title">Votre parcours</h2>
      <div className="modules">
        {MODULES.map((m) => {
          const done = m.lessons.filter((l) => progress.lessons[l.id]).length
          return (
            <section key={m.id} className="module card">
              <header className="module-head">
                <span className="module-icon" style={{ background: m.color }}>
                  {m.icon}
                </span>
                <div>
                  <span className="pill">{m.level}</span>
                  <h3>{m.title}</h3>
                  <p className="muted">{m.description}</p>
                </div>
              </header>
              <div className="module-progress">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${(done / m.lessons.length) * 100}%`, background: m.color }} />
                </div>
                <span className="muted">
                  {done}/{m.lessons.length}
                </span>
              </div>
              <ol className="path">
                {m.lessons.map((l, i) => {
                  const result = progress.lessons[l.id]
                  const unlocked = isUnlocked(progress, l.id)
                  const state = result ? 'done' : unlocked ? 'open' : 'locked'
                  const content = (
                    <>
                      <span className="node" style={state !== 'locked' ? { background: m.color } : undefined}>
                        {state === 'done' ? (result.score >= 1 ? '★' : '✓') : state === 'locked' ? '🔒' : i + 1}
                      </span>
                      <span className="path-text">
                        <strong>{l.title}</strong>
                        <small className="muted">
                          {l.summary}
                          {result && ` · ${Math.round(result.score * 100)} %`}
                        </small>
                      </span>
                    </>
                  )
                  return (
                    <li key={l.id} className={`path-item ${state}`}>
                      {unlocked ? <Link to={`/app/lecon/${l.id}`}>{content}</Link> : <div>{content}</div>}
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>
    </div>
  )
}

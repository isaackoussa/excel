import { useState, type FormEvent } from 'react'
import { DownloadButton } from '../components/DownloadButton'
import { Sheet } from '../components/Sheet'
import { MEMO, SHORTCUTS } from '../content/memo'
import { TOTAL_LESSONS } from '../content'
import { useAuth } from '../lib/auth'
import { DATASETS } from '../lib/datasets'
import { BADGES, currentStreak, levelInfo } from '../lib/progress'

export function ResourcesPage() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const memo = MEMO.map((c) => ({
    ...c,
    entries: c.entries.filter((e) => !q || `${e.fr} ${e.en} ${e.description}`.toLowerCase().includes(q)),
  })).filter((c) => c.entries.length)

  return (
    <div className="page">
      <h1>Ressources</h1>
      <p className="muted">Les fichiers de données des exercices et un mémo des fonctions à garder sous la main.</p>

      <h2 className="section-title">Fichiers d’entraînement</h2>
      <div className="datasets">
        {Object.values(DATASETS).map((d) => (
          <div key={d.id} className="card dataset">
            <h3>📄 {d.title}</h3>
            <p className="muted">{d.description}</p>
            <details>
              <summary>Idées d’exercices</summary>
              <ol>
                {d.instructions.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            </details>
            <DownloadButton id={d.id} />
          </div>
        ))}
      </div>

      <h2 className="section-title">Mémo des fonctions</h2>
      <input className="search" placeholder="Rechercher une fonction (ex. : recherche, VPM, SUMIF…)" value={query} onChange={(e) => setQuery(e.target.value)} />
      {memo.map((c) => (
        <section key={c.category} className="memo-section">
          <h3>{c.category}</h3>
          <div className="memo-table">
            {c.entries.map((e) => (
              <div key={e.fr} className="memo-row">
                <div>
                  <strong>{e.fr}</strong>
                  <small className="muted"> · {e.en}</small>
                </div>
                <code>{e.syntax}</code>
                <span>
                  {e.description}
                  {e.example && (
                    <>
                      {' '}
                      <code className="example">{e.example}</code>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
      {memo.length === 0 && <p className="muted">Aucune fonction ne correspond à « {query} ».</p>}

      <h2 className="section-title">Raccourcis utiles</h2>
      <div className="card shortcuts">
        {SHORTCUTS.map(([k, d]) => (
          <div key={k} className="shortcut">
            <kbd>{k}</kbd>
            <span>{d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SANDBOX_START: Record<string, string> = {
  A1: 'Contrat',
  B1: 'Prime',
  C1: 'Taxe',
  A2: 'C001',
  B2: '540',
  C2: '=B2*9%',
  A3: 'C002',
  B3: '780',
  A4: 'Total',
  B4: '=SOMME(B2:B3)',
}

export function SandboxPage() {
  const [edits, setEdits] = useState<Record<string, string>>(SANDBOX_START)
  return (
    <div className="page">
      <h1>Bac à sable</h1>
      <p className="muted">
        Une feuille libre pour tester vos formules. Cliquez sur une cellule et tapez une valeur ou une formule ; pendant la saisie d’une formule,
        cliquez (ou glissez) sur d’autres cellules pour insérer leurs références. Les noms français et anglais des fonctions sont acceptés.
      </p>
      <div className="sandbox-actions">
        <button type="button" className="btn btn-secondary" onClick={() => setEdits({})}>
          Vider la feuille
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setEdits(SANDBOX_START)}>
          Exemple
        </button>
      </div>
      <Sheet
        spec={{ rows: [] }}
        edits={edits}
        editable="all"
        minCols={8}
        minRows={15}
        initialSelection="C3"
        onEdit={(addr, text) =>
          setEdits((prev) => {
            const next = { ...prev }
            if (text === '') delete next[addr]
            else next[addr] = text
            return next
          })
        }
      />
    </div>
  )
}

export function ProfilePage() {
  const { user, progress, mode, signOut, updateDisplayName } = useAuth()
  const [name, setName] = useState(user?.displayName ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lvl = levelInfo(progress.xp)
  const done = Object.keys(progress.lessons).length

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await updateDisplayName(name.trim())
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="page">
      <h1>Mon profil</h1>
      <div className="profile-grid">
        <div className="card">
          <h2>{user?.displayName}</h2>
          <p className="muted">{user?.email}</p>
          <p>
            Offre : <span className="pill">{user?.plan === 'premium' ? 'Premium' : 'Gratuite'}</span>
          </p>
          {mode === 'demo' && <p className="demo-note">Mode démo : progression stockée sur cet appareil uniquement.</p>}
          <form className="form" onSubmit={submit}>
            <label>
              Nom affiché
              <input
                required
                maxLength={40}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSaved(false)
                }}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="btn btn-secondary">{saved ? 'Enregistré ✓' : 'Enregistrer'}</button>
          </form>
          <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
            Se déconnecter
          </button>
        </div>
        <div className="card">
          <h2>Statistiques</h2>
          <ul className="kv">
            <li>
              <span>Niveau</span>
              <strong>
                {lvl.level} · {lvl.title}
              </strong>
            </li>
            <li>
              <span>Expérience</span>
              <strong>{progress.xp} XP</strong>
            </li>
            <li>
              <span>Leçons terminées</span>
              <strong>
                {done} / {TOTAL_LESSONS}
              </strong>
            </li>
            <li>
              <span>Série en cours</span>
              <strong>🔥 {currentStreak(progress)}</strong>
            </li>
            <li>
              <span>Meilleure série</span>
              <strong>{progress.streak.best} jours</strong>
            </li>
          </ul>
        </div>
      </div>
      <h2 className="section-title">Badges</h2>
      <div className="badges">
        {BADGES.map((b) => {
          const earned = progress.badges.includes(b.id)
          return (
            <div key={b.id} className={`badge ${earned ? 'earned' : ''}`}>
              <span className="badge-icon">{b.icon}</span>
              <strong>{b.title}</strong>
              <small>{b.description}</small>
            </div>
          )
        })}
      </div>
    </div>
  )
}

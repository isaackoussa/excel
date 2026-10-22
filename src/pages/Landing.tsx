import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Sheet } from '../components/Sheet'
import { MODULES, TOTAL_LESSONS } from '../content'
import type { SheetSpec } from '../content/types'
import { useAuth } from '../lib/auth'
import { checkFormula } from '../lib/check'

const DEMO_SHEET: SheetSpec = {
  rows: [
    ['Branche', 'Primes', 'Sinistres', 'S/P'],
    ['Auto', 820000, 590000, null],
  ],
  formats: { B: 'eur0', C: 'eur0', D: 'pct' },
}

function TryIt() {
  const [text, setText] = useState('')
  const result = text.trim().startsWith('=')
    ? checkFormula({ type: 'formula', prompt: '', sheet: DEMO_SHEET, target: 'D2', solution: '=C2/B2', explanation: '' }, text)
    : null
  return (
    <div className="card try-it">
      <p className="eyebrow">Essayez tout de suite</p>
      <p>
        Calculez en <strong>D2</strong> le ratio sinistres / primes de la branche Auto.
      </p>
      <Sheet spec={DEMO_SHEET} edits={{ D2: text }} editable={['D2']} onEdit={(_, t) => setText(t)} initialSelection="D2" />
      <p className={`try-feedback ${result?.ok ? 'ok' : ''}`}>
        {result?.ok ? '✅ Exact ! 72 % : c’est le fameux ratio S/P. Créez un compte pour continuer.' : 'Astuce : tapez =C2/B2'}
      </p>
    </div>
  )
}

export function Landing() {
  const { user, loading } = useAuth()
  if (!loading && user) return <Navigate to="/app" replace />

  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo />
        <nav>
          <Link to="/connexion" className="btn btn-ghost">
            Se connecter
          </Link>
          <Link to="/inscription" className="btn btn-primary">
            Commencer
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div>
          <h1>
            Maîtrisez <span className="accent">Excel et VBA</span> pour la finance et l’assurance
          </h1>
          <p className="lead">
            Des leçons courtes, des exercices interactifs directement dans le navigateur et de vrais fichiers de données : portefeuille de contrats,
            sinistres, tables de mortalité, triangles de provisionnement.
          </p>
          <div className="hero-cta">
            <Link to="/inscription" className="btn btn-primary btn-lg">
              Créer mon compte gratuit
            </Link>
            <span className="muted">
              {TOTAL_LESSONS} leçons · 5 modules · aucun prérequis
            </span>
          </div>
        </div>
        <TryIt />
      </section>

      <section className="features">
        <div className="feature">
          <span>🧮</span>
          <h3>Un vrai tableur intégré</h3>
          <p>Tapez vos formules en français (SOMME, RECHERCHEV, VPM…) et voyez le résultat immédiatement, comme dans Excel.</p>
        </div>
        <div className="feature">
          <span>📥</span>
          <h3>Des fichiers réalistes</h3>
          <p>Téléchargez des classeurs .xlsx pour vous entraîner dans votre propre Excel, puis validez votre résultat dans l’application.</p>
        </div>
        <div className="feature">
          <span>🔥</span>
          <h3>Progressez chaque jour</h3>
          <p>Points d’expérience, séries de jours, niveaux et badges : 10 minutes par jour suffisent pour progresser.</p>
        </div>
      </section>

      <section className="landing-modules">
        <h2>Le parcours</h2>
        <div className="landing-module-list">
          {MODULES.map((m) => (
            <div key={m.id} className="card landing-module">
              <span className="module-icon" style={{ background: m.color }}>
                {m.icon}
              </span>
              <div>
                <h3>{m.title}</h3>
                <p className="muted">{m.description}</p>
                <small>
                  {m.lessons.length} leçons · {m.level}
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <Logo />
        <p className="muted">Excel et VBA appliqués à la finance et à l’assurance. Les données des exercices sont fictives.</p>
      </footer>
    </div>
  )
}

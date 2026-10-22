import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuth } from '../lib/auth'

function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { mode } = useAuth()
  return (
    <div className="auth-page">
      <Link to="/" className="auth-logo">
        <Logo />
      </Link>
      <div className="card auth-card">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
        {mode === 'demo' && (
          <p className="demo-note">
            Mode démo : aucun serveur n’est configuré, votre progression est enregistrée uniquement sur cet appareil.
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { busy, error, run } = useSubmit()

  if (user) return <Navigate to="/app" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await signIn(email.trim(), password)
      navigate('/app')
    })
  }

  return (
    <AuthCard title="Connexion" subtitle="Reprenez votre parcours là où vous l’avez laissé.">
      <form onSubmit={submit} className="form">
        <label>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Mot de passe
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p className="auth-links">
        <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        <span>
          Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
        </span>
      </p>
    </AuthCard>
  )
}

export function SignupPage() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const { busy, error, run } = useSubmit()

  if (user) return <Navigate to="/app" replace />

  if (sent) {
    return (
      <AuthCard title="Vérifiez vos emails 📬">
        <p>
          Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour activer votre compte, puis connectez-vous.
        </p>
        <Link className="btn btn-primary btn-block" to="/connexion">
          Aller à la connexion
        </Link>
      </AuthCard>
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
      const { needsConfirmation } = await signUp(email.trim(), password, name.trim())
      if (needsConfirmation) setSent(true)
      else navigate('/app')
    })
  }

  return (
    <AuthCard title="Créer un compte" subtitle="Gratuit. Votre progression est sauvegardée sur tous vos appareils.">
      <form onSubmit={submit} className="form">
        <label>
          Prénom ou pseudo
          <input autoComplete="given-name" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Mot de passe <small>(8 caractères minimum)</small>
          <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="auth-links">
        <span>
          Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
        </span>
      </p>
    </AuthCard>
  )
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { busy, error, run } = useSubmit()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await resetPassword(email.trim())
      setSent(true)
    })
  }

  return (
    <AuthCard title="Mot de passe oublié" subtitle="Recevez un lien pour choisir un nouveau mot de passe.">
      {sent ? (
        <p>Si un compte existe pour {email}, un email vient de lui être envoyé.</p>
      ) : (
        <form onSubmit={submit} className="form">
          <label>
            Email
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
      )}
      <p className="auth-links">
        <Link to="/connexion">Retour à la connexion</Link>
      </p>
    </AuthCard>
  )
}

export function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const { busy, error, run } = useSubmit()

  if (!loading && !user) {
    return (
      <AuthCard title="Lien expiré">
        <p>Ce lien n’est plus valide. Demandez-en un nouveau.</p>
        <Link className="btn btn-primary btn-block" to="/mot-de-passe-oublie">
          Nouveau lien
        </Link>
      </AuthCard>
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.')
      await updatePassword(password)
      navigate('/app')
    })
  }

  return (
    <AuthCard title="Nouveau mot de passe">
      <form onSubmit={submit} className="form">
        <label>
          Nouveau mot de passe
          <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy || loading}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </AuthCard>
  )
}

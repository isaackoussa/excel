import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { emptyProgress, normalizeProgress, type Progress } from './progress'
import { supabase } from './supabase'

export interface AppUser {
  id: string
  email: string
  displayName: string
  plan: 'free' | 'premium'
}

interface AuthState {
  mode: 'supabase' | 'demo'
  loading: boolean
  user: AppUser | null
  progress: Progress
  /** Vrai quand l'utilisateur arrive depuis le lien « mot de passe oublié ». */
  recovery: boolean
  signUp(email: string, password: string, displayName: string): Promise<{ needsConfirmation: boolean }>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
  updatePassword(password: string): Promise<void>
  updateDisplayName(name: string): Promise<void>
  saveProgress(p: Progress): Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const DEMO_USER_KEY = 'tp-demo-user'
const progressKey = (userId: string) => `tp-progress-${userId}`

function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Stockage indisponible (navigation privée) : on continue sans sauvegarde locale.
  }
}

const MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, 'Email ou mot de passe incorrect.'],
  [/email not confirmed/i, 'Votre email n’est pas encore confirmé : cliquez sur le lien reçu par email.'],
  [/already registered|already been registered/i, 'Un compte existe déjà avec cet email.'],
  [/password should be at least/i, 'Le mot de passe doit contenir au moins 8 caractères.'],
  [/rate limit|too many/i, 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'],
  [/invalid email|unable to validate email/i, 'Adresse email invalide.'],
  [/same password|should be different/i, 'Le nouveau mot de passe doit être différent de l’ancien.'],
]

function frenchError(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e)
  const found = MESSAGES.find(([re]) => re.test(msg))
  return new Error(found ? found[1] : `Une erreur est survenue : ${msg}`)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const mode = supabase ? 'supabase' : 'demo'
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [progress, setProgress] = useState<Progress>(emptyProgress())
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(false)

  // Mode démo : compte fictif stocké dans le navigateur.
  useEffect(() => {
    if (supabase) return
    const demo = readLocal<AppUser>(DEMO_USER_KEY)
    if (demo) {
      setUser(demo)
      setProgress(normalizeProgress(readLocal(progressKey(demo.id))))
    }
    setLoading(false)
  }, [])

  // Mode Supabase : suivi de la session.
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(s)
      if (!s) {
        setUser(null)
        setProgress(emptyProgress())
        setLoading(false)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  const email = session?.user.email ?? ''
  useEffect(() => {
    if (!supabase || !userId) return
    let cancelled = false
    setLoading(true)
    supabase
      .from('profiles')
      .select('display_name, plan, progress')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        const backup = readLocal(progressKey(userId))
        setUser({
          id: userId,
          email,
          displayName: data?.display_name || email.split('@')[0],
          plan: data?.plan === 'premium' ? 'premium' : 'free',
        })
        setProgress(normalizeProgress(error || !data ? backup : data.progress))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId, email])

  const signUp = useCallback(async (mail: string, password: string, displayName: string) => {
    if (!supabase) {
      const demo: AppUser = { id: 'demo', email: mail, displayName, plan: 'free' }
      writeLocal(DEMO_USER_KEY, demo)
      setUser(demo)
      setProgress(normalizeProgress(readLocal(progressKey(demo.id))))
      return { needsConfirmation: false }
    }
    const { data, error } = await supabase.auth.signUp({
      email: mail,
      password,
      options: { data: { display_name: displayName }, emailRedirectTo: `${window.location.origin}/app` },
    })
    if (error) throw frenchError(error)
    // Supabase ne renvoie pas d'erreur pour un email déjà inscrit : il renvoie un utilisateur sans identité.
    if (data.user && data.user.identities?.length === 0) throw new Error('Un compte existe déjà avec cet email.')
    return { needsConfirmation: !data.session }
  }, [])

  const signIn = useCallback(async (mail: string, password: string) => {
    if (!supabase) {
      const existing = readLocal<AppUser>(DEMO_USER_KEY)
      const demo: AppUser = existing ?? { id: 'demo', email: mail, displayName: mail.split('@')[0], plan: 'free' }
      writeLocal(DEMO_USER_KEY, demo)
      setUser(demo)
      setProgress(normalizeProgress(readLocal(progressKey(demo.id))))
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email: mail, password })
    if (error) throw frenchError(error)
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) {
      writeLocal(DEMO_USER_KEY, null)
      setUser(null)
      setProgress(emptyProgress())
      return
    }
    await supabase.auth.signOut()
  }, [])

  const resetPassword = useCallback(async (mail: string) => {
    if (!supabase) throw new Error('La réinitialisation du mot de passe n’est pas disponible en mode démo.')
    const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: `${window.location.origin}/reinitialiser` })
    if (error) throw frenchError(error)
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error('Indisponible en mode démo.')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw frenchError(error)
    setRecovery(false)
  }, [])

  const updateDisplayName = useCallback(
    async (name: string) => {
      if (!user) return
      const next = { ...user, displayName: name }
      if (supabase) {
        const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', user.id)
        if (error) throw frenchError(error)
      } else {
        writeLocal(DEMO_USER_KEY, next)
      }
      setUser(next)
    },
    [user],
  )

  const saveProgress = useCallback(
    async (p: Progress) => {
      if (!user) return
      setProgress(p)
      writeLocal(progressKey(user.id), p)
      if (supabase) {
        const { error } = await supabase
          .from('profiles')
          .update({ progress: p, updated_at: new Date().toISOString() })
          .eq('id', user.id)
        if (error) console.error('Sauvegarde de la progression impossible', error)
      }
    },
    [user],
  )

  const value = useMemo<AuthState>(
    () => ({
      mode,
      loading,
      user,
      progress,
      recovery,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      updateDisplayName,
      saveProgress,
    }),
    [mode, loading, user, progress, recovery, signUp, signIn, signOut, resetPassword, updatePassword, updateDisplayName, saveProgress],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}

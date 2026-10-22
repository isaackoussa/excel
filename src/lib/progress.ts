import { ALL_LESSONS, MODULES } from '../content'

export interface LessonResult {
  /** Meilleur score obtenu, entre 0 et 1. */
  score: number
  completedAt: string
  attempts: number
}

export interface Progress {
  xp: number
  lessons: Record<string, LessonResult>
  streak: { current: number; best: number; lastDay: string | null }
  /** XP gagnés par jour (AAAA-MM-JJ), conservés sur 60 jours. */
  xpByDay: Record<string, number>
  badges: string[]
  dailyGoal: number
}

export function emptyProgress(): Progress {
  return { xp: 0, lessons: {}, streak: { current: 0, best: 0, lastDay: null }, xpByDay: {}, badges: [], dailyGoal: 30 }
}

/** Complète un objet de progression incomplet (ancienne version, données corrompues). */
export function normalizeProgress(raw: unknown): Progress {
  const base = emptyProgress()
  if (!raw || typeof raw !== 'object') return base
  const p = raw as Partial<Progress>
  return {
    xp: typeof p.xp === 'number' ? p.xp : 0,
    lessons: p.lessons && typeof p.lessons === 'object' ? p.lessons : {},
    streak: { ...base.streak, ...(p.streak ?? {}) },
    xpByDay: p.xpByDay && typeof p.xpByDay === 'object' ? p.xpByDay : {},
    badges: Array.isArray(p.badges) ? p.badges : [],
    dailyGoal: typeof p.dailyGoal === 'number' ? p.dailyGoal : base.dailyGoal,
  }
}

export function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number)
  const [y2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

/** Série en cours : remise à zéro si l'élève a manqué plus d'un jour. */
export function currentStreak(p: Progress, now = new Date()): number {
  if (!p.streak.lastDay) return 0
  return daysBetween(p.streak.lastDay, dayKey(now)) <= 1 ? p.streak.current : 0
}

export function xpToday(p: Progress, now = new Date()): number {
  return p.xpByDay[dayKey(now)] ?? 0
}

// ---------- Niveaux ----------

export const LEVELS = [
  { xp: 0, title: 'Stagiaire' },
  { xp: 100, title: 'Assistant' },
  { xp: 300, title: 'Analyste junior' },
  { xp: 600, title: 'Analyste' },
  { xp: 1000, title: 'Analyste senior' },
  { xp: 1600, title: 'Chargé d’études actuarielles' },
  { xp: 2400, title: 'Actuaire' },
  { xp: 3500, title: 'Actuaire expert' },
]

export function levelInfo(xp: number) {
  let i = 0
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++
  const next = LEVELS[i + 1]
  const floor = LEVELS[i].xp
  return {
    level: i + 1,
    title: LEVELS[i].title,
    nextTitle: next?.title,
    progress: next ? (xp - floor) / (next.xp - floor) : 1,
    toNext: next ? next.xp - xp : 0,
  }
}

// ---------- Badges ----------

export interface Badge {
  id: string
  icon: string
  title: string
  description: string
  earned: (p: Progress) => boolean
}

const moduleDone = (id: string) => (p: Progress) =>
  MODULES.find((m) => m.id === id)!.lessons.every((l) => p.lessons[l.id])

export const BADGES: Badge[] = [
  { id: 'first', icon: '🎯', title: 'Premier pas', description: 'Terminer une première leçon', earned: (p) => Object.keys(p.lessons).length >= 1 },
  { id: 'perfect', icon: '💎', title: 'Sans faute', description: 'Réussir une leçon à 100 %', earned: (p) => Object.values(p.lessons).some((l) => l.score >= 1) },
  { id: 'streak3', icon: '🔥', title: 'En rythme', description: 'Série de 3 jours', earned: (p) => p.streak.best >= 3 },
  { id: 'streak7', icon: '🚀', title: 'Semaine parfaite', description: 'Série de 7 jours', earned: (p) => p.streak.best >= 7 },
  { id: 'xp500', icon: '⭐', title: '500 XP', description: 'Cumuler 500 points d’expérience', earned: (p) => p.xp >= 500 },
  ...MODULES.map((m) => ({
    id: `module-${m.id}`,
    icon: m.icon,
    title: m.title,
    description: 'Terminer toutes les leçons du module',
    earned: moduleDone(m.id),
  })),
  { id: 'all', icon: '🏆', title: 'Diplômé', description: 'Terminer tout le parcours', earned: (p) => ALL_LESSONS.every((l) => p.lessons[l.lesson.id]) },
]

// ---------- Fin de leçon ----------

export interface CompletionResult {
  progress: Progress
  xpGained: number
  newBadges: Badge[]
  streakIncreased: boolean
}

/** Bonus de fin de leçon, réduit de moitié quand on rejoue une leçon déjà terminée. */
export const LESSON_BONUS = 20

export function completeLesson(prev: Progress, lessonId: string, score: number, exerciseXp: number, now = new Date()): CompletionResult {
  const already = prev.lessons[lessonId]
  const xpGained = Math.round((exerciseXp + LESSON_BONUS) * (already ? 0.5 : 1))
  const today = dayKey(now)

  let { current, best, lastDay } = prev.streak
  let streakIncreased = false
  if (lastDay !== today) {
    current = lastDay && daysBetween(lastDay, today) === 1 ? current + 1 : 1
    best = Math.max(best, current)
    lastDay = today
    streakIncreased = true
  }

  const xpByDay: Record<string, number> = {}
  for (const [k, v] of Object.entries(prev.xpByDay)) if (daysBetween(k, today) < 60) xpByDay[k] = v
  xpByDay[today] = (xpByDay[today] ?? 0) + xpGained

  const progress: Progress = {
    ...prev,
    xp: prev.xp + xpGained,
    lessons: {
      ...prev.lessons,
      [lessonId]: {
        score: Math.max(score, already?.score ?? 0),
        completedAt: now.toISOString(),
        attempts: (already?.attempts ?? 0) + 1,
      },
    },
    streak: { current, best, lastDay },
    xpByDay,
  }
  const newBadges = BADGES.filter((b) => !prev.badges.includes(b.id) && b.earned(progress))
  progress.badges = [...prev.badges, ...newBadges.map((b) => b.id)]
  return { progress, xpGained, newBadges, streakIncreased }
}

// ---------- Déverrouillage ----------

/** Les modules sont tous ouverts ; dans un module, une leçon s'ouvre quand la précédente est terminée. */
export function isUnlocked(p: Progress, lessonId: string): boolean {
  const entry = ALL_LESSONS.find((l) => l.lesson.id === lessonId)
  if (!entry) return false
  if (entry.index === 0) return true
  return Boolean(p.lessons[entry.module.lessons[entry.index - 1].id])
}

/** Prochaine leçon conseillée : la première non terminée et accessible. */
export function nextLesson(p: Progress) {
  return ALL_LESSONS.find((l) => !p.lessons[l.lesson.id] && isUnlocked(p, l.lesson.id))
}

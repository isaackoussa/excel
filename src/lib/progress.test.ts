import { describe, expect, it } from 'vitest'
import { completeLesson, currentStreak, emptyProgress, isUnlocked, levelInfo, nextLesson, normalizeProgress } from './progress'

const day = (s: string) => new Date(`${s}T12:00:00`)

describe('progression', () => {
  it('XP, bonus et rejouer une leçon', () => {
    const r1 = completeLesson(emptyProgress(), 'bases-1', 1, 40, day('2026-03-01'))
    expect(r1.xpGained).toBe(60)
    expect(r1.newBadges.map((b) => b.id)).toEqual(['first', 'perfect'])
    const r2 = completeLesson(r1.progress, 'bases-1', 0.5, 40, day('2026-03-01'))
    expect(r2.xpGained).toBe(30)
    expect(r2.progress.lessons['bases-1'].score).toBe(1)
    expect(r2.progress.xpByDay['2026-03-01']).toBe(90)
  })

  it('série de jours consécutifs', () => {
    let p = emptyProgress()
    p = completeLesson(p, 'bases-1', 1, 10, day('2026-03-01')).progress
    p = completeLesson(p, 'bases-2', 1, 10, day('2026-03-02')).progress
    const r = completeLesson(p, 'bases-3', 1, 10, day('2026-03-03'))
    expect(r.progress.streak.current).toBe(3)
    expect(r.newBadges.some((b) => b.id === 'streak3')).toBe(true)
    expect(currentStreak(r.progress, day('2026-03-04'))).toBe(3)
    expect(currentStreak(r.progress, day('2026-03-05'))).toBe(0)
    const after = completeLesson(r.progress, 'bases-4', 1, 10, day('2026-03-06'))
    expect(after.progress.streak).toMatchObject({ current: 1, best: 3 })
  })

  it('déverrouillage des leçons', () => {
    const p = emptyProgress()
    expect(isUnlocked(p, 'bases-1')).toBe(true)
    expect(isUnlocked(p, 'bases-2')).toBe(false)
    expect(isUnlocked(p, 'vba-1')).toBe(true)
    expect(nextLesson(p)?.lesson.id).toBe('bases-1')
    const done = completeLesson(p, 'bases-1', 1, 10).progress
    expect(isUnlocked(done, 'bases-2')).toBe(true)
    expect(nextLesson(done)?.lesson.id).toBe('bases-2')
  })

  it('niveaux', () => {
    expect(levelInfo(0)).toMatchObject({ level: 1, title: 'Stagiaire' })
    expect(levelInfo(150)).toMatchObject({ level: 2, toNext: 150 })
    expect(levelInfo(99999).progress).toBe(1)
  })

  it('normalise des données incomplètes', () => {
    expect(normalizeProgress(null)).toEqual(emptyProgress())
    expect(normalizeProgress({ xp: 12 }).xp).toBe(12)
  })
})

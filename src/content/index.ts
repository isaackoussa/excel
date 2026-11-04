import { actuariat } from './modules/actuariat'
import { bases } from './modules/bases'
import { finance } from './modules/finance'
import { modelisation } from './modules/modelisation'
import { portefeuille } from './modules/portefeuille'
import { vba } from './modules/vba'
import type { Lesson, Module } from './types'

export const MODULES: Module[] = [bases, portefeuille, finance, modelisation, actuariat, vba]

export const ALL_LESSONS: { module: Module; lesson: Lesson; index: number }[] = MODULES.flatMap((module) =>
  module.lessons.map((lesson, index) => ({ module, lesson, index })),
)

export function findLesson(id: string) {
  return ALL_LESSONS.find((l) => l.lesson.id === id)
}

export const TOTAL_LESSONS = ALL_LESSONS.length

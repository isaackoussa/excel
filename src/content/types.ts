import type { Fmt } from '../lib/formula/format'
import type { DatasetId } from '../lib/datasets'

export type SheetCell = string | number | null

/** Petite feuille de calcul affichée dans une leçon. La ligne 1 sert d'en-têtes. */
export interface SheetSpec {
  rows: SheetCell[][]
  /** Format par colonne (« C ») ou par cellule (« C3 »). */
  formats?: Record<string, Fmt>
  /** Largeur des colonnes en pixels. */
  widths?: number[]
}

interface Base {
  /** Explication affichée après la réponse. */
  explanation: string
  hint?: string
}

export interface QcmExercise extends Base {
  type: 'qcm'
  question: string
  code?: string
  sheet?: SheetSpec
  options: string[]
  answer: number
}

export interface FormulaExercise extends Base {
  type: 'formula'
  prompt: string
  sheet: SheetSpec
  /** Cellule où l'élève tape sa formule. */
  target: string
  /** Formule de référence : sert à calculer le résultat attendu. */
  solution: string
  /** La formule est recopiée vers le bas jusqu'à cette cellule (test des $). */
  fillTo?: string
  /** Fonctions qui doivent apparaître dans la formule. */
  requires?: string[]
}

export interface FillExercise extends Base {
  type: 'fill'
  prompt: string
  /** Code avec des trous notés [[0]], [[1]]… */
  code: string
  /** Réponses acceptées pour chaque trou (sans tenir compte de la casse). */
  blanks: string[][]
}

export interface OrderExercise extends Base {
  type: 'order'
  prompt: string
  /** Lignes dans le bon ordre ; elles sont mélangées à l'affichage. */
  lines: string[]
}

export interface NumericExercise extends Base {
  type: 'numeric'
  prompt: string
  answer: number
  /** Écart absolu accepté. Par défaut 0,5 % de la réponse. */
  tolerance?: number
  unit?: string
  /** Fichier Excel à télécharger pour faire l'exercice. */
  file?: DatasetId
}

export type Exercise = QcmExercise | FormulaExercise | FillExercise | OrderExercise | NumericExercise

export interface TheorySection {
  title: string
  /** Texte en Markdown simplifié : **gras**, `code`, listes « - », paragraphes. */
  body: string
  code?: string
  sheet?: SheetSpec
  tip?: string
}

export interface Lesson {
  id: string
  title: string
  summary: string
  theory: TheorySection[]
  exercises: Exercise[]
}

export interface Module {
  id: string
  title: string
  description: string
  icon: string
  color: string
  level: 'Débutant' | 'Intermédiaire' | 'Avancé'
  lessons: Lesson[]
}

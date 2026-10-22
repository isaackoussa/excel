export type ErrorCode = '#N/A' | '#DIV/0!' | '#VALEUR!' | '#REF!' | '#NOM?' | '#NOMBRE!' | '#CIRC!'

export class FormulaError {
  constructor(public code: ErrorCode, public message = '') {}
  toString() {
    return this.code
  }
}

export type Scalar = number | string | boolean | null | FormulaError

export interface RangeValue {
  kind: 'range'
  values: Scalar[][]
}

export type Value = Scalar | RangeValue

export function isRange(v: Value): v is RangeValue {
  return typeof v === 'object' && v !== null && (v as RangeValue).kind === 'range'
}

export function isError(v: unknown): v is FormulaError {
  return v instanceof FormulaError
}

export type Node =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'ref'; col: number; row: number; absCol: boolean; absRow: boolean }
  | { t: 'range'; from: Extract<Node, { t: 'ref' }>; to: Extract<Node, { t: 'ref' }> }
  | { t: 'func'; name: string; args: Node[] }
  | { t: 'bin'; op: string; l: Node; r: Node }
  | { t: 'neg'; e: Node }
  | { t: 'pct'; e: Node }

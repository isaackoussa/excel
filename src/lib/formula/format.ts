import { formatGeneral } from './coerce'
import { isError, type Scalar } from './types'

export type Fmt = 'general' | 'eur' | 'eur0' | 'pct' | 'pct2' | 'int' | 'dec2' | 'dec4' | 'dec6'

const nf = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat('fr-FR', opts)
const FORMATTERS: Record<Exclude<Fmt, 'general'>, Intl.NumberFormat> = {
  eur: nf({ style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }),
  eur0: nf({ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
  pct: nf({ style: 'percent', maximumFractionDigits: 0 }),
  pct2: nf({ style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  int: nf({ maximumFractionDigits: 0 }),
  dec2: nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  dec4: nf({ minimumFractionDigits: 4, maximumFractionDigits: 4 }),
  dec6: nf({ minimumFractionDigits: 6, maximumFractionDigits: 6 }),
}

export function formatValue(v: Scalar, fmt: Fmt = 'general'): string {
  if (v === null) return ''
  if (isError(v)) return v.code
  if (typeof v === 'boolean') return v ? 'VRAI' : 'FAUX'
  if (typeof v === 'string') return v
  if (fmt === 'general') return formatGeneral(v)
  return FORMATTERS[fmt].format(v)
}

/** Nombre lisible en français, sans format imposé (pour les messages). */
export function formatNumber(n: number, digits = 2): string {
  return nf({ maximumFractionDigits: digits }).format(n)
}

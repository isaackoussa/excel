/** Conversions entre adresses Excel (« B3 ») et coordonnées 0-indexées. */

export function colToIndex(col: string): number {
  let n = 0
  for (const ch of col.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

export function indexToCol(i: number): string {
  let s = ''
  let n = i + 1
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export function parseAddress(addr: string): { col: number; row: number } {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(addr.trim())
  if (!m) throw new Error(`Adresse invalide : ${addr}`)
  return { col: colToIndex(m[1]), row: parseInt(m[2], 10) - 1 }
}

export function toAddress(col: number, row: number): string {
  return `${indexToCol(col)}${row + 1}`
}

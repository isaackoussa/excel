import type { ReactNode } from 'react'

/** Gras (**…**) et code (`…`) dans une ligne de texte. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    out.push(tok.startsWith('**') ? <strong key={k++}>{tok.slice(2, -2)}</strong> : <code key={k++}>{tok.slice(1, -1)}</code>)
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** Markdown minimal : paragraphes, listes à puces, gras et code. */
export function Markdown({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/)
  return (
    <div className="md">
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        const items = lines.filter((l) => l.startsWith('- '))
        if (items.length === lines.length) {
          return (
            <ul key={i}>
              {items.map((l, j) => (
                <li key={j}>{inline(l.slice(2))}</li>
              ))}
            </ul>
          )
        }
        if (items.length > 0) {
          const intro = lines.filter((l) => !l.startsWith('- '))
          return (
            <div key={i}>
              <p>{inline(intro.join(' '))}</p>
              <ul>
                {items.map((l, j) => (
                  <li key={j}>{inline(l.slice(2))}</li>
                ))}
              </ul>
            </div>
          )
        }
        return <p key={i}>{inline(lines.join(' '))}</p>
      })}
    </div>
  )
}

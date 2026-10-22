import type { ReactNode } from 'react'

const KEYWORDS = new Set(
  'Sub End Function Dim As Set If Then Else ElseIf For To Next Each In Do Loop While Until With Exit Call Option Explicit Long Double String Boolean Integer Single Currency Variant Date Object Range Worksheet And Or Not True False Nothing On Error Resume GoTo Private Public Const ByVal ByRef New Step'.split(
    ' ',
  ),
)

/** Coloration syntaxique simple du VBA : commentaires, textes, mots-clés, nombres. */
export function highlightVba(line: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /('.*$)|("(?:[^"]|"")*")|(\b[A-Za-z_]\w*\b)|(\b\d+(?:\.\d+)?\b)/g
  let last = 0
  let k = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index))
    if (m[1]) out.push(<span key={k++} className="tok-comment">{m[1]}</span>)
    else if (m[2]) out.push(<span key={k++} className="tok-string">{m[2]}</span>)
    else if (m[3]) out.push(KEYWORDS.has(m[3]) ? <span key={k++} className="tok-kw">{m[3]}</span> : m[3])
    else out.push(<span key={k++} className="tok-num">{m[4]}</span>)
    last = m.index + m[0].length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="code">
      {code.split('\n').map((line, i) => (
        <div key={i}>{line ? highlightVba(line) : ' '}</div>
      ))}
    </pre>
  )
}

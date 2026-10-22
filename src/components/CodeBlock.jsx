import { useState } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('python', python)

// Syntax theme that matches the glass/aurora palette
const darkTheme = {
  'code[class*="language-"]': {
    color: '#a5b4fc',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: '0.8rem',
    lineHeight: '1.6',
    whiteSpace: 'pre',
  },
  'token.comment':    { color: '#6b7a99', fontStyle: 'italic' },
  'token.keyword':    { color: '#c4b5fd' },
  'token.string':     { color: '#7ee7c7' },
  'token.number':     { color: '#fb923c' },
  'token.operator':   { color: '#f0abfc' },
  'token.function':   { color: '#67e8f9' },
  'token.punctuation':{ color: '#8b93b8' },
}

function detectLang(code) {
  if (/import\s|def\s|pickle\.|class\s/.test(code)) return 'python'
  return 'bash'
}

export default function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback — silently fail
    }
  }

  const lang = detectLang(code)

  return (
    <div className="relative mt-2 rounded-lg border border-white/[0.09] overflow-hidden group">
      <SyntaxHighlighter
        language={lang}
        style={darkTheme}
        customStyle={{
          margin: 0,
          padding: '0.75rem 1rem',
          background: 'rgba(9, 8, 24, 0.75)',
          backdropFilter: 'blur(10px)',
          borderRadius: 0,
        }}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        aria-label="Copy command"
        className="absolute top-2 right-2
                   bg-dark-border hover:bg-dark-card2
                   text-gray-400 hover:text-accent-cyan
                   border border-dark-border/50
                   rounded px-2 py-0.5 text-xs font-medium
                   transition-all duration-200
                   opacity-0 group-hover:opacity-100"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}

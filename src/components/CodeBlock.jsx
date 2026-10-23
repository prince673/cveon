import { useState } from 'react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('python', python)

// GitHub-dark-inspired syntax theme
const darkTheme = {
  'code[class*="language-"]': {
    color: '#c9d1d9',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: '0.8rem',
    lineHeight: '1.6',
    whiteSpace: 'pre',
  },
  'token.comment':    { color: '#8b949e', fontStyle: 'italic' },
  'token.keyword':    { color: '#ff7b72' },
  'token.string':     { color: '#a5d6ff' },
  'token.number':     { color: '#79c0ff' },
  'token.operator':   { color: '#ff7b72' },
  'token.function':   { color: '#d2a8ff' },
  'token.punctuation':{ color: '#8b949e' },
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
    <div className="relative mt-2 rounded-md border border-dark-border overflow-hidden group">
      <SyntaxHighlighter
        language={lang}
        style={darkTheme}
        customStyle={{
          margin: 0,
          padding: '0.75rem 1rem',
          background: '#0d1117',
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
                   bg-[#21262d] hover:bg-[#30363d]
                   text-[#8b949e] hover:text-gray-100
                   border border-dark-border
                   rounded px-2 py-0.5 text-xs font-medium
                   transition-colors duration-150
                   opacity-0 group-hover:opacity-100"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}

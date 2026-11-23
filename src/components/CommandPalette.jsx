import { useEffect, useMemo, useRef, useState } from 'react'
import { SearchIcon } from './icons'

// Ctrl/Cmd+K command palette: jump between views, reopen recent searches,
// toggle the theme. Keyboard-first (arrows + Enter), fully in-memory.

export default function CommandPalette({ open, onClose, actions }) {
  const [query, setQuery] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return
    // Let the modal mount before grabbing focus.
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter(a =>
      a.label.toLowerCase().includes(q) ||
      (a.hint || '').toLowerCase().includes(q)
    )
  }, [actions, query])

  // Clamp at render time instead of in an effect — no cascading renders.
  const active = Math.min(idx, Math.max(filtered.length - 1, 0))

  if (!open) return null

  function run(action) {
    if (!action) return
    onClose()
    // Let the palette unmount before the action changes the view.
    setTimeout(() => action.run(), 0)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(filtered[active])
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="card-flat w-full max-w-lg !p-0 overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-dark-border">
          <SearchIcon size={14} className="text-[#8b949e]" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setIdx(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or CVE ID…"
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder-[#6e7681]
                       focus:outline-none"
            aria-label="Command palette input"
            spellCheck={false}
            autoComplete="off"
          />
          <kbd className="text-[10px] font-mono text-gray-500 border border-dark-border rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto py-1.5" role="listbox">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-500">No matching commands.</p>
          )}
          {filtered.map((a, i) => (
            <button
              key={a.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setIdx(i)}
              onMouseDown={e => { e.preventDefault(); run(a) }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                i === active ? 'bg-dark-card2 text-gray-100' : 'text-[#8b949e]'
              }`}
            >
              <span className="flex-1 truncate">{a.label}</span>
              {a.hint && (
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wide shrink-0">
                  {a.hint}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 h-8 border-t border-dark-border text-[10px] text-gray-500">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span className="ml-auto font-mono">Ctrl/Cmd+K</span>
        </div>
      </div>
    </div>
  )
}

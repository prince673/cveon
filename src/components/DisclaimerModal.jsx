import { useState, useRef } from 'react'
import { WarningIcon, CheckIcon } from './icons'

const AGREED_KEY = 'cve_explorer_agreed'

const RULES = [
  'Only test systems you own or have explicit written permission to test',
  'Unauthorized access to computer systems is illegal (CFAA, Computer Misuse Act, etc.)',
  'Exploitation guides use placeholder targets — never run against live systems',
  'The developers assume no liability for misuse of this tool',
]

export default function DisclaimerModal({ onAgree }) {
  // sessionStorage keeps the acknowledgement alive for the current tab only.
  // Closing the tab erases it — the app never persists anything between
  // sessions, keeping the zero-footprint guarantee.
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(AGREED_KEY))
  const [checked, setChecked] = useState(false)
  const panelRef = useRef(null)

  // Focus trap: Tab and Shift+Tab cycle inside the dialog while it is open,
  // so keyboard users can never tab into the page behind the modal.
  function handleKeyDown(e) {
    if (e.key !== 'Tab') return
    const focusables = panelRef.current?.querySelectorAll(
      'button, input, [href], select, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusables?.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  function handleAgree() {
    if (!checked) return
    sessionStorage.setItem(AGREED_KEY, '1')
    setVisible(false)
    onAgree?.()
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.85)' }}
         onKeyDown={handleKeyDown}>

      <div ref={panelRef}
           role="dialog"
           aria-modal="true"
           aria-labelledby="disclaimer-title"
           className="card-flat relative max-w-lg w-full animate-scale-in"
           style={{
             boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
             padding: '32px',
           }}>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <span className="flex items-center justify-center w-11 h-11 rounded-md
                           text-[#d29922] shrink-0"
                style={{
                  background: 'rgba(210,153,34,0.1)',
                  border: '1px solid rgba(210,153,34,0.3)',
                }}>
            <WarningIcon size={20} />
          </span>
          <div>
            <h2 id="disclaimer-title" className="text-base font-bold text-gray-100 leading-none mb-1">Educational use only</h2>
            <p className="text-[12px] text-[#8b949e]">Please read before proceeding</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#8b949e] mb-5 leading-relaxed">
          This tool is intended <strong className="text-gray-200">solely</strong> for authorized
          security research and education. All exploitation guides are for{' '}
          <strong className="text-gray-200">demonstration purposes only</strong>.
        </p>

        {/* Rules */}
        <ul className="space-y-3 mb-5">
          {RULES.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-[#8b949e]">
              <span className="flex items-center justify-center w-5 h-5 rounded shrink-0 mt-0.5
                    bg-dark-card2 border border-dark-border">
                <CheckIcon size={10} className="text-[#3fb950]" />
              </span>
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>

        {/* Placeholder note */}
        <div className="mb-6 px-4 py-3 rounded-md text-xs text-[#8b949e] leading-relaxed"
             style={{
               background: 'rgba(210,153,34,0.06)',
               borderLeft: '3px solid rgba(210,153,34,0.4)',
             }}>
          All commands use{' '}
          <code className="text-[#d29922] font-mono">[TARGET_URL]</code> and{' '}
          <code className="text-[#d29922] font-mono">[ATTACKER_IP]</code> placeholders.
        </div>

        {/* Checkbox — a native input stretched over the whole row keeps keyboard,
            screen-reader and pointer users (the text is part of the toggle target);
            it is invisible but not clipped, so it is genuinely clickable everywhere */}
        <label className="relative flex items-center gap-3 mb-5 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={checked}
            autoFocus
            onChange={e => setChecked(e.target.checked)}
            className="peer opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
          <div
            className={`w-5 h-5 rounded border flex items-center justify-center shrink-0
                        border-dark-border bg-dark-card2 group-hover:border-[#484f58]
                        peer-checked:border-[#58a6ff] peer-checked:bg-[#58a6ff]/20
                        peer-focus-visible:border-[#58a6ff]
                        transition-colors duration-150`}
          >            {checked && <CheckIcon size={11} className="text-[#58a6ff]" />}
          </div>
          <span className="text-sm text-[#8b949e] group-hover:text-gray-300 transition-colors">
            I understand and agree to use this tool responsibly
          </span>
        </label>

        {/* CTA */}
        <button
          onClick={handleAgree}
          disabled={!checked}
          className="btn-primary w-full"
        >
          Proceed to CVEon
        </button>
      </div>
    </div>
  )
}

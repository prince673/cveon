import { useState } from 'react'
import { WarningIcon, CheckIcon } from './icons'

const AGREED_KEY = 'cve_explorer_agreed'

const RULES = [
  'Only test systems you own or have explicit written permission to test',
  'Unauthorized access to computer systems is illegal (CFAA, Computer Misuse Act, etc.)',
  'Exploitation guides use placeholder targets — never run against live systems',
  'The developers assume no liability for misuse of this tool',
]

export default function DisclaimerModal({ onAgree }) {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(AGREED_KEY))
  const [checked, setChecked] = useState(false)

  function handleAgree() {
    if (!checked) return
    sessionStorage.setItem(AGREED_KEY, '1')
    setVisible(false)
    onAgree?.()
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)' }}>

      <div className="relative max-w-lg w-full animate-scale-in"
           style={{
             background: 'rgba(17,21,32,0.92)',
             border: '1px solid rgba(255,255,255,0.08)',
             borderRadius: '20px',
             boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px -16px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07)',
             padding: '36px',
           }}>

        {/* Top inner highlight */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r
                        from-transparent via-white/15 to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <span className="relative flex items-center justify-center w-12 h-12 rounded-2xl
                           text-amber-400 flex-shrink-0"
                style={{
                  background: 'rgba(217,160,63,0.1)',
                  border: '1px solid rgba(217,160,63,0.25)',
                  boxShadow: '0 0 20px -4px rgba(217,160,63,0.4)',
                }}>
            <WarningIcon size={22} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white leading-none mb-1">Educational Use Only</h2>
            <p className="text-[12px] text-gray-600">Please read before proceeding</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-5 leading-relaxed">
          This tool is intended <strong className="text-gray-200">solely</strong> for authorized
          security research and education. All exploitation guides are for{' '}
          <strong className="text-gray-200">demonstration purposes only</strong>.
        </p>

        {/* Rules */}
        <ul className="space-y-3 mb-5">
          {RULES.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
              <span className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5"
                    style={{
                      background: 'rgba(91,141,239,0.12)',
                      border: '1px solid rgba(91,141,239,0.25)',
                    }}>
                <CheckIcon size={10} className="text-accent-cyan" />
              </span>
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>

        {/* Placeholder note */}
        <div className="mb-6 px-4 py-3 rounded-xl text-xs text-gray-500 leading-relaxed"
             style={{
               background: 'rgba(217,160,63,0.06)',
               borderLeft: '3px solid rgba(217,160,63,0.5)',
             }}>
          All commands use{' '}
          <code className="text-amber-300 font-mono">[TARGET_URL]</code> and{' '}
          <code className="text-amber-300 font-mono">[ATTACKER_IP]</code> placeholders.
        </div>

        {/* Checkbox */}
        <label className="flex items-center gap-3 mb-5 cursor-pointer group">
          <div
            onClick={() => setChecked(v => !v)}
            className={`w-5 h-5 rounded-md border flex items-center justify-center
                        transition-all duration-200 shrink-0 ${
              checked
                ? 'border-accent-cyan bg-accent-cyan/20'
                : 'border-white/15 bg-white/[0.03] group-hover:border-white/25'
            }`}
          >
            {checked && <CheckIcon size={11} className="text-accent-cyan" />}
          </div>
          <span className="text-sm text-gray-400 select-none group-hover:text-gray-300 transition-colors">
            I understand and agree to use this tool responsibly
          </span>
        </label>

        {/* CTA */}
        <button
          onClick={handleAgree}
          disabled={!checked}
          className="btn-primary w-full"
        >
          Proceed to CVE Explorer
        </button>
      </div>
    </div>
  )
}
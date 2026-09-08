import { useState } from 'react'
import { WarningIcon } from './icons'

const AGREED_KEY = 'cve_explorer_agreed'

export default function DisclaimerModal({ onAgree }) {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(AGREED_KEY))

  function handleAgree() {
    sessionStorage.setItem(AGREED_KEY, '1')
    setVisible(false)
    onAgree?.()
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
                    bg-black/85 backdrop-blur-sm">
      <div className="bg-dark-card border border-dark-border rounded-xl
                      max-w-lg w-full p-8 animate-fade-up">

        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center justify-center w-10 h-10 rounded-lg
                           bg-amber-500/10 border border-amber-500/30 text-amber-500">
            <WarningIcon size={20} />
          </span>
          <h2 className="text-lg font-semibold text-white">Educational use only</h2>
        </div>

        <p className="text-sm text-gray-300 mb-4 leading-relaxed">
          This tool is intended <strong className="text-gray-100">solely</strong> for authorized
          security research and education.
        </p>

        <ul className="text-sm text-gray-400 space-y-2.5 mb-5">
          {[
            'Only test systems you own or have explicit written permission to test',
            'Unauthorized access to computer systems is illegal (CFAA, Computer Misuse Act, etc.)',
            'Exploitation guides use placeholder targets — never run them against live systems',
            'The developers assume no liability for misuse of this tool',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-1 h-1 rounded-full bg-accent-cyan mt-2 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-gray-500 mb-6 border-l-2 border-amber-500/60 pl-3 leading-relaxed">
          All commands use <code className="text-amber-300">[TARGET_URL]</code> and{' '}
          <code className="text-amber-300">[ATTACKER_IP]</code> placeholders and are for
          educational demonstration only.
        </p>

        <button onClick={handleAgree} className="btn-primary w-full">
          I understand — proceed
        </button>
      </div>
    </div>
  )
}
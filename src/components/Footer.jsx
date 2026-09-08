import { WarningIcon } from './icons'

const LINKS = [
  { label: 'NVD', href: 'https://nvd.nist.gov' },
  { label: 'MITRE CVE', href: 'https://cve.mitre.org' },
  { label: 'CIRCL API', href: 'https://cve.circl.lu' },
  { label: 'OWASP', href: 'https://owasp.org' },
  { label: 'CISA KEV', href: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
]

export default function Footer() {
  return (
    <footer className="border-t border-dark-border bg-dark-bg2 mt-12 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-start gap-3 border border-red-500/25 bg-red-500/[0.06]
                        rounded-xl px-5 py-4 mb-6">
          <WarningIcon size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 leading-relaxed">
            <strong className="text-red-400">Legal disclaimer:</strong> CVE Explorer is intended
            for <strong className="text-gray-100">authorized security research and education only</strong>.
            Unauthorized testing is illegal. Developers assume no liability for misuse.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-600">
          {LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-200 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="text-center text-xs text-gray-700 mt-4">
          © {new Date().getFullYear()} CVE Explorer v4.0 · Data from NVD, CIRCL, FIRST EPSS & CISA KEV
        </p>
      </div>
    </footer>
  )
}
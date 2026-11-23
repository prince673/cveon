const LINKS = [
  { label: 'NVD',       href: 'https://nvd.nist.gov' },
  { label: 'MITRE CVE', href: 'https://cve.mitre.org' },
  { label: 'CIRCL API', href: 'https://cve.circl.lu' },
  { label: 'OWASP',     href: 'https://owasp.org' },
  { label: 'CISA KEV',  href: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
]

// ⚠️ Replace 'cveon' below with your own Buy Me a Coffee username.
export const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/0x70'

export default function Footer() {
  return (
    <footer className="border-t border-dark-border mt-16 py-6 px-4">
      <div className="max-w-4xl mx-auto">

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mb-3">
          {LINKS.map(l => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#8b949e] hover:text-accent-cyan transition-colors duration-150
                         inline-flex items-center px-2 py-1.5 -my-1.5"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Privacy line is the product promise — stated plainly */}
        <p className="text-center text-[11px] text-gray-400 mb-1.5">
          Client-side only · no accounts · no tracking · nothing stored
        </p>
        <p className="text-center text-[10px] text-gray-400 mb-3">
          For authorized security research and education only. Unauthorized testing is illegal.
        </p>
        <p className="text-center text-[10px] text-gray-400 font-mono">
          CVEon v4.0 · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}

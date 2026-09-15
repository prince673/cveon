const LINKS = [
  { label: 'NVD',       href: 'https://nvd.nist.gov' },
  { label: 'MITRE CVE', href: 'https://cve.mitre.org' },
  { label: 'CIRCL API', href: 'https://cve.circl.lu' },
  { label: 'OWASP',     href: 'https://owasp.org' },
  { label: 'CISA KEV',  href: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
]

const DATA_SOURCES = ['NVD', 'CIRCL', 'FIRST EPSS', 'CISA KEV']

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.05] mt-16 py-8 px-4"
            style={{ background: 'rgba(7,9,14,0.8)' }}>
      {/* Top accent line */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <div className="max-w-4xl mx-auto">

        {/* Data source pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="text-[11px] text-gray-700 mr-1">Powered by</span>
          {DATA_SOURCES.map(s => (
            <span key={s} className="source-pill">{s}</span>
          ))}
        </div>

        {/* Nav links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-5">
          {LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-gray-300 transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Legal line */}
        <p className="text-center text-[11px] text-gray-700 mb-2">
          For authorized security research and education only. Unauthorized testing is illegal.
        </p>
        <p className="text-center text-[10px] text-gray-800">
          © {new Date().getFullYear()} CVEon v4.0
        </p>
      </div>
    </footer>
  )
}
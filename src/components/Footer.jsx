const LINKS = [
  { label: 'NVD',       href: 'https://nvd.nist.gov' },
  { label: 'MITRE CVE', href: 'https://cve.mitre.org' },
  { label: 'CIRCL API', href: 'https://cve.circl.lu' },
  { label: 'OWASP',     href: 'https://owasp.org' },
  { label: 'CISA KEV',  href: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
]

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] mt-16 py-8 px-4 glass">
      {/* Top accent line */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-indigo/30 to-transparent" />

      <div className="max-w-4xl mx-auto">

        {/* Brand + privacy pill */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <span className="text-xs text-gray-500">
            Powered by <span className="font-semibold text-gray-300">CVEon</span>
          </span>
          <span className="pill text-[10px] text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
            Zero storage · Zero tracking · Zero footprint
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-5">
          {LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-accent-indigo transition-colors duration-150"
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

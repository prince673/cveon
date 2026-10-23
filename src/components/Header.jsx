import { ShieldIcon, SearchIcon, ListIcon, CompareIcon } from './icons'

const NAV = [
  { key: 'home',    view: 'home',    label: 'Search',  icon: SearchIcon },
  { key: 'batch',   view: 'batch',   label: 'Batch',   icon: ListIcon },
  { key: 'compare', view: 'compare', label: 'Compare', icon: CompareIcon },
]

export default function Header({ view, onNavigate }) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-dark-border">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Brand */}
        <button
          onClick={() => onNavigate?.('home')}
          className="flex items-center gap-2.5 select-none group"
          aria-label="CVEon home"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-md
                           bg-dark-card2 border border-dark-border text-accent-cyan
                           group-hover:border-[#484f58] transition-colors duration-150">
            <ShieldIcon size={14} />
          </span>
          <span className="font-semibold text-[15px] tracking-tight text-gray-100">
            CVEon
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-gray-600">
            v4.0
          </span>
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV.map(item => {
            const NavIcon = item.icon
            const active = view === item.view
            return (
              <button
                key={item.key}
                onClick={() => onNavigate?.(item.view)}
                className={`flex items-center gap-1.5 px-3 h-8 rounded-md text-[13px]
                            transition-colors duration-150 ${
                  active
                    ? 'bg-dark-card2 text-gray-100'
                    : 'text-[#8b949e] hover:text-gray-100'
                }`}
              >
                <NavIcon size={13} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* NVD link */}
        <a
          href="https://nvd.nist.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1 text-xs
                     text-[#8b949e] hover:text-accent-cyan transition-colors duration-150"
        >
          NVD
          <span className="text-[9px] opacity-60">↗</span>
        </a>
      </div>
    </header>
  )
}

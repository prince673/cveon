import { ShieldIcon, SearchIcon, ChartIcon, ListIcon, CompareIcon } from './icons'

const NAV = [
  { key: 'home',    view: 'home',    label: 'Search',  icon: SearchIcon },
  { key: 'batch',   view: 'batch',   label: 'Batch',   icon: ListIcon },
  { key: 'compare', view: 'compare', label: 'Compare', icon: CompareIcon },
]

export default function Header({ view, onNavigate }) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-white/[0.06]">
      {/* Animated top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/50 to-transparent" />

      <div className="max-w-4xl mx-auto px-4 h-15 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <button
          onClick={() => onNavigate?.('home')}
          className="flex items-center gap-3 select-none group"
          aria-label="CVEon home"
        >
          <span className="relative flex items-center justify-center w-8 h-8 rounded-xl
                           bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20
                           border border-accent-cyan/25 text-accent-cyan
                           transition-all duration-300
                           group-hover:shadow-glow-soft group-hover:border-accent-cyan/40">
            <ShieldIcon size={16} />
            <span className="absolute inset-0 rounded-xl bg-accent-cyan/10 opacity-0
                             group-hover:opacity-100 transition-opacity duration-300" />
          </span>
          <span className="font-bold text-[15px] tracking-tight text-gray-100">
            CVE<span className="gradient-text">on</span>
          </span>
          <span className="hidden sm:inline text-[9px] font-mono
                           text-gray-600 border border-dark-border rounded-md px-1.5 py-0.5
                           bg-white/[0.03]">
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
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                            transition-all duration-200 ${
                  active
                    ? 'text-gray-100'
                    : 'text-gray-500 hover:text-gray-200'
                }`}
                style={active ? {
                  background: 'rgba(91,141,239,0.12)',
                  border: '1px solid rgba(91,141,239,0.2)',
                  boxShadow: '0 0 12px -4px rgba(91,141,239,0.3)',
                } : {
                  background: 'rgba(255,255,255,0)',
                  border: '1px solid transparent',
                }}
              >
                <NavIcon size={14} />
                <span className="hidden sm:inline">{item.label}</span>
                {active && (
                  <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2
                                   w-6 h-px rounded-full bg-accent-cyan
                                   shadow-[0_0_8px_2px_rgba(91,141,239,0.6)]" />
                )}
              </button>
            )
          })}
        </nav>

        {/* NVD link */}
        <a
          href="https://nvd.nist.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1 text-[11px] font-medium
                     text-gray-600 hover:text-accent-cyan transition-colors duration-200
                     px-2.5 py-1.5 rounded-lg hover:bg-accent-cyan/[0.06]"
        >
          NVD
          <span className="text-[9px] mt-px opacity-60">↗</span>
        </a>
      </div>
    </header>
  )
}
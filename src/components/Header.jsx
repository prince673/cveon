import { ShieldIcon, SearchIcon, ChartIcon, BellIcon, ListIcon, CompareIcon } from './icons'

const NAV = [
  { key: 'home', view: 'home', label: 'Search', icon: SearchIcon },
  { key: 'batch', view: 'batch', label: 'Batch', icon: ListIcon },
  { key: 'compare', view: 'compare', label: 'Compare', icon: CompareIcon },
  { key: 'analytics', view: 'analytics', label: 'Analytics', icon: ChartIcon },
  { key: 'alerts', view: 'alerts', label: 'Alerts', icon: BellIcon },
]

export default function Header({ view, onNavigate, alertCount = 0 }) {
  return (
    <header className="sticky top-0 z-40 border-b border-dark-border bg-dark-bg2/95 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        <button
          onClick={() => onNavigate?.('home')}
          className="flex items-center gap-2.5 select-none"
          aria-label="CVE Explorer home"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-lg
                           bg-accent-cyan/15 border border-accent-cyan/30 text-accent-cyan">
            <ShieldIcon size={15} />
          </span>
          <span className="font-bold text-[15px] tracking-tight text-gray-100">
            CVE<span className="text-accent-cyan">&nbsp;Explorer</span>
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-gray-600
                           border border-dark-border rounded px-1.5 py-0.5">
            v4.0
          </span>
        </button>

        <nav className="flex items-center gap-1">
          {NAV.map(item => {
            const NavIcon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => onNavigate?.(item.view)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                            transition-colors duration-150 ${
                  view === item.view
                    ? 'bg-white/[0.06] text-gray-100'
                    : 'text-gray-400 hover:text-gray-100'
                }`}
              >
                <NavIcon size={15} />
                <span className="hidden sm:inline">{item.label}</span>
                {item.key === 'alerts' && alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1
                                   bg-red-500 text-white text-[10px] font-semibold
                                   rounded-full flex items-center justify-center">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <a
          href="https://nvd.nist.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 text-xs text-gray-500
                     hover:text-gray-200 transition-colors"
        >
          NVD
          <span className="text-[10px] mt-px">↗</span>
        </a>
      </div>
    </header>
  )
}
import { ShieldIcon, SearchIcon, ListIcon, CompareIcon, CoffeeIcon, CommandIcon } from './icons'
import NotificationBell from './NotificationBell'
import ThemeToggle from './ThemeToggle'
import ThreatTicker from './ThreatTicker'

const NAV = [
  { key: 'home',    view: 'home',    label: 'Search',  icon: SearchIcon },
  { key: 'batch',   view: 'batch',   label: 'Batch',   icon: ListIcon },
  { key: 'compare', view: 'compare', label: 'Compare', icon: CompareIcon },
]

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/0x70'

export default function Header({ view, onNavigate, onSearchCve, theme, onToggleTheme, onOpenPalette }) {
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
                           bg-gradient-to-br from-[#1f6feb] to-[#bc8cff] border border-white/20 text-white
                           shadow-[0_0_18px_rgba(88,166,255,0.4)]
                           group-hover:shadow-[0_0_26px_rgba(139,148,255,0.55)]
                           group-hover:scale-105 transition-all duration-200">
            <ShieldIcon size={14} />
          </span>
          <span className="font-semibold text-[15px] tracking-tight text-gray-100">
            CVE<span className="text-gradient">on</span>
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-gray-400">
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

        {/* Right side: threat ticker, palette, theme, NVD link + Notification bell + Buy Me a Coffee */}
        <div className="flex items-center gap-2">
          <ThreatTicker onClick={() => onNavigate?.('kev')} onSelectCve={onSearchCve} />

          <button
            onClick={onOpenPalette}
            className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs
                       text-[#8b949e] hover:text-gray-100 border border-dark-border
                       hover:border-[#484f58] transition-colors duration-150"
            aria-label="Open command palette"
            title="Command palette (Ctrl/Cmd+K)"
          >
            <CommandIcon size={12} />
            <span className="font-mono text-[10px]">Ctrl K</span>
          </button>

          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <a
            href="https://nvd.nist.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 text-xs px-2 py-1.5 -my-1
                       text-[#8b949e] hover:text-accent-cyan transition-colors duration-150"
          >
            NVD
            <span className="text-[9px] opacity-60">↗</span>
          </a>

          {/* Notification Bell */}
          <NotificationBell onSelectCve={onSearchCve} />

          {/* Buy Me a Coffee — compact */}
          <a
            href={BUY_ME_A_COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[13px]
                       text-[#8b949e] hover:text-amber-300 hover:bg-dark-card2
                       transition-colors duration-150"
            aria-label="Buy me a coffee"
          >
            <CoffeeIcon size={14} />
            <span className="hidden sm:inline">Support</span>
          </a>
        </div>
      </div>
    </header>
  )
}

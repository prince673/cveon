const STEPS = [
  { label: 'NVD',      color: '#5b8def' },
  { label: 'CIRCL',    color: '#7b83d4' },
  { label: 'EPSS',     color: '#e879a0' },
  { label: 'CISA KEV', color: '#d9a03f' },
]

export default function LoadingSpinner({ message = 'Fetching vulnerability intelligence…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 animate-fade-in">

      {/* Multi-ring spinner */}
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
        <div className="absolute inset-0 rounded-full border-2 border-t-accent-cyan border-r-transparent
                        border-b-transparent border-l-transparent animate-spin-slow"
             style={{ filter: 'drop-shadow(0 0 8px rgba(91,141,239,0.7))' }} />

        {/* Middle ring */}
        <div className="absolute inset-[6px] rounded-full border-2 border-white/[0.04]" />
        <div className="absolute inset-[6px] rounded-full border-2 border-b-accent-purple border-t-transparent
                        border-l-transparent border-r-transparent animate-spin-med"
             style={{ filter: 'drop-shadow(0 0 6px rgba(123,131,212,0.6))' }} />

        {/* Inner ring */}
        <div className="absolute inset-[12px] rounded-full border-[1.5px] border-white/[0.04]" />
        <div className="absolute inset-[12px] rounded-full border-[1.5px] border-t-transparent
                        border-r-accent-pink border-b-transparent border-l-transparent animate-spin-fast"
             style={{ filter: 'drop-shadow(0 0 4px rgba(232,121,160,0.6))' }} />

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse"
               style={{ boxShadow: '0 0 8px 2px rgba(91,141,239,0.6)' }} />
        </div>
      </div>

      {/* Message */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-gray-400 animate-pulse">{message}</p>

        {/* Data source dots cycling */}
        <div className="flex items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  background: s.color,
                  boxShadow: `0 0 6px 1px ${s.color}80`,
                  animationDelay: `${i * 0.35}s`,
                  animationDuration: '1.4s',
                }}
              />
              <span className="text-[10px] text-gray-700 font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
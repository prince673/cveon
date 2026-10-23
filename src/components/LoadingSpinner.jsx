const STEPS = ['NVD', 'CIRCL', 'EPSS', 'CISA KEV']

export default function LoadingSpinner({ message = 'Fetching vulnerability intelligence…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-6 h-6 border-2 border-dark-card2 border-t-accent-cyan rounded-full animate-spin-slow" />
      <p className="text-sm text-[#8b949e]">{message}</p>
      <p className="text-[11px] text-[#6e7681] font-mono">
        {STEPS.join(' · ')}
      </p>
    </div>
  )
}

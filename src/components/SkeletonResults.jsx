// Shimmering skeleton that mirrors the results-page layout, shown while a
// lookup is in flight. Communicates structure (and therefore progress) far
// better than a single spinner.

export default function SkeletonResults() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading vulnerability results">
      <div className="card">
        {/* Title row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="skeleton h-7 w-56" />
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-7 w-24 ml-auto" />
        </div>

        {/* Severity scale */}
        <div className="skeleton h-2 w-full mb-6" />

        {/* Stat strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[0, 1, 2].map(i => (
            <div key={i} className="stat-box">
              <div className="skeleton h-3 w-20 mb-2" />
              <div className="skeleton h-6 w-16" />
              <div className="skeleton h-2.5 w-24 mt-2" />
            </div>
          ))}
        </div>

        {/* Meta grid */}
        <div className="inset-panel grid grid-cols-3 gap-4 p-4 mb-5">
          {[0, 1, 2].map(i => (
            <div key={i}>
              <div className="skeleton h-2.5 w-16 mb-2" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-[92%]" />
          <div className="skeleton h-3 w-[70%]" />
        </div>
      </div>

      {/* Risk assessment card */}
      <div className="card">
        <div className="flex items-start gap-6">
          <div className="skeleton h-28 w-28 rounded-full shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-3 w-28" />
                <div className="skeleton h-2 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

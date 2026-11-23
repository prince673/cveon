import { WarningIcon } from './icons'
import SeverityBadge from './SeverityBadge'
import { formatDate } from '../utils/formatters'

export default function LatestCvePopup({ cve, onClose, onSelectCve }) {
  if (!cve) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Latest CVE alert: ${cve.id}`}
    >

      <div
        className="card-flat relative max-w-lg w-full animate-scale-in"
        style={{
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          padding: '32px',
        }}
      >

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <span
            className="flex items-center justify-center w-11 h-11 rounded-md shrink-0"
            style={{
              background: 'rgba(210,153,34,0.1)',
              border: '1px solid rgba(210,153,34,0.3)',
            }}
          >
            <WarningIcon size={20} />
          </span>
          <div>
            <h2 className="text-base font-bold text-gray-100 leading-none mb-1">
              New CVE detected
            </h2>
            <p className="text-[12px] text-[#8b949e]">Latest from the NVD feed</p>
          </div>
        </div>

        {/* CVE summary */}
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="font-mono font-bold text-2xl text-gray-100 tracking-tight">
            {cve.id}
          </h3>
          {cve.score != null && <SeverityBadge score={cve.score} />}
        </div>
        <p className="text-[12px] text-[#8b949e] mb-5">
          Published {formatDate(cve.published)}
        </p>

        {/* CVSS score */}
        {cve.score != null && (
          <div className="mb-5">
            <div className="section-label mb-1.5">CVSS Score</div>
            <div className="text-xl font-bold tracking-tight text-gray-100">
              {cve.score} / 10
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
          {cve.description}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button onClick={() => onSelectCve?.(cve.id)} className="btn-primary w-full">
            View Full Details
          </button>
          <button onClick={onClose} className="btn-ghost w-full">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

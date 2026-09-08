import { useState, useCallback, useEffect } from 'react'
import { listAlerts, markAlertRead, markAllAlertsRead, acknowledgeAlert, getUnreadAlertCount } from '../services/api'
import { BellIcon } from './icons'

const SEVERITY_CLASS = {
  critical: 'border-red-500/30 bg-red-500/[0.05]',
  high: 'border-orange-500/30 bg-orange-500/[0.05]',
  medium: 'border-yellow-500/30 bg-yellow-500/[0.05]',
  info: 'border-blue-500/30 bg-blue-500/[0.05]',
}

const SEVERITY_DOTS = {
  critical: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  info: 'bg-blue-400',
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'kev_update', label: 'KEV' },
  { key: 'epss_increase', label: 'EPSS' },
  { key: 'new_exploit', label: 'Exploits' },
]

export default function AlertPanel() {
  const [filter, setFilter] = useState('all')
  const [alerts, setAlerts] = useState([])
  const [unread, setUnread] = useState(0)
  const [tick, setTick] = useState(0)
  const bump = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    const opts = filter === 'unread' ? { unreadOnly: true } : filter !== 'all' ? { type: filter } : {}
    listAlerts(opts).then(data => setAlerts(data ?? [])).catch(() => setAlerts([]))
    getUnreadAlertCount().then(d => setUnread(d.count ?? 0)).catch(() => setUnread(0))
  }, [filter, tick])

  function handleMarkRead(id) { markAlertRead(id).then(() => bump()) }
  function handleAcknowledge(id) { acknowledgeAlert(id).then(() => bump()) }
  function handleMarkAllRead() { markAllAlertsRead().then(() => bump()) }

  return (
    <div className="card">
      <header className="flex items-center gap-2.5 mb-4">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg
                         bg-white/[0.06] border border-dark-border text-gray-400">
          <BellIcon size={15} />
        </span>
        <h3 className="text-sm font-semibold text-white">Alerts</h3>
        {unread > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-semibold min-w-[16px] h-4 px-1
                           rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
        <button onClick={handleMarkAllRead} className="ml-auto text-xs text-gray-500 hover:text-gray-200">
          Mark all read
        </button>
      </header>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(ff => (
          <button
            key={ff.key}
            onClick={() => setFilter(ff.key)}
            className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
              filter === ff.key
                ? 'border-accent-cyan/50 text-accent-cyan bg-accent-cyan/10'
                : 'border-dark-border text-gray-500 hover:text-gray-300 hover:border-white/20'
            }`}
          >
            {ff.label}
          </button>
        ))}
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">No alerts.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-0.5">
          {alerts.slice(0, 50).map(alert => (
            <div
              key={alert.id}
              className={`border rounded-lg p-3.5 ${SEVERITY_CLASS[alert.severity] || SEVERITY_CLASS.info} ${
                !alert.read ? 'border-l-2 border-l-accent-cyan' : ''
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOTS[alert.severity]}`} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-100">{alert.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-2.5 mt-2">
                    <span className="text-[10px] text-gray-600">{new Date(alert.created_at).toLocaleString()}</span>
                    {alert.cve_id && (
                      <span className="text-[10px] font-mono text-accent-cyan">{alert.cve_id}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!alert.read && (
                    <button onClick={() => handleMarkRead(alert.id)} className="text-[10px] text-gray-500 hover:text-gray-200">Read</button>
                  )}
                  {!alert.acknowledged && (
                    <button onClick={() => handleAcknowledge(alert.id)} className="text-[10px] text-accent-cyan hover:underline">Ack</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
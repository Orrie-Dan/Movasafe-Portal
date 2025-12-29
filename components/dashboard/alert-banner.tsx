import { AlertTriangle } from 'lucide-react'

export interface Alert {
  type: string
  message: string
  priority: 'high' | 'medium' | 'low'
}

export interface AlertBannerProps {
  alerts: Alert[]
  className?: string
}

export function AlertBanner({ alerts, className = '' }: AlertBannerProps) {
  if (alerts.length === 0) return null

  return (
    <div className={`bg-slate-900 border-b border-slate-800 px-6 py-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-yellow-400" />
        <span className="text-slate-300">
          {alerts.length} active alert{alerts.length > 1 ? 's' : ''}:{' '}
          {alerts.map((a) => a.message).join(', ')}
        </span>
      </div>
    </div>
  )
}


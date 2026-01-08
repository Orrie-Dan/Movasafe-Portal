'use client'

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { AlertCard, AlertCardProps, AlertType } from './AlertCard'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export interface Alert extends Omit<AlertCardProps, 'type'> {
  type: AlertType
  id: string
}

export interface AlertCenterProps {
  alerts: Alert[]
  onAlertClick?: (alert: Alert) => void
  maxVisible?: number
  title?: string
  description?: string
  className?: string
}

export function AlertCenter({
  alerts,
  onAlertClick,
  maxVisible = 10,
  title = 'Alert & Notification Center',
  description = 'System alerts and notifications',
  className,
}: AlertCenterProps) {
  const visibleAlerts = alerts.slice(0, maxVisible)
  const hasAlerts = visibleAlerts.length > 0

  return (
    <Card className={`bg-white dark:bg-black border-slate-200 dark:border-slate-800 ${className}`}>
      <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <CardTitle size="md" className="flex items-center gap-2 relative z-10">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
          {title}
        </CardTitle>
        <CardDescription className="relative z-10">{description}</CardDescription>
      </div>
      <CardContent>
        {hasAlerts ? (
          <div className="space-y-3">
            {visibleAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                {...alert}
                onAction={onAlertClick ? () => onAlertClick(alert) : alert.onAction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <p>No active alerts</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


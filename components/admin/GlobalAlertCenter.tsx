'use client'

import { useState } from 'react'
import { AlertCenter, type Alert } from '@/components/dashboard/alerts/AlertCenter'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter, CheckCircle2 } from 'lucide-react'

export interface GlobalAlert extends Alert {
  severity: 'critical' | 'high' | 'medium' | 'low'
  alertType: 'fraud' | 'system' | 'compliance' | 'sla'
  acknowledged?: boolean
  assignedTo?: string
}

interface GlobalAlertCenterProps {
  alerts: GlobalAlert[]
  onAlertClick?: (alert: GlobalAlert) => void
  onAcknowledge?: (alertId: string) => void
  onAssign?: (alertId: string, userId: string) => void
}

export function GlobalAlertCenter({
  alerts,
  onAlertClick,
  onAcknowledge,
  onAssign,
}: GlobalAlertCenterProps) {
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  const filteredAlerts = alerts.filter(alert => {
    if (filterType !== 'all' && alert.alertType !== filterType) return false
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false
    return true
  })

  const alertCards: Alert[] = filteredAlerts.map(alert => ({
    id: alert.id,
    type: alert.type,
    title: alert.title,
    description: alert.description,
    count: alert.count,
    onAction: () => {
      if (onAcknowledge && !alert.acknowledged) {
        onAcknowledge(alert.id)
      } else if (onAlertClick) {
        onAlertClick(alert)
      }
    },
    actionLabel: alert.acknowledged ? 'View' : 'Acknowledge',
    icon: alert.icon,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="fraud">Fraud</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="sla">SLA</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          {filteredAlerts.length} alerts
        </Badge>
      </div>
      <AlertCenter
        alerts={alertCards}
        onAlertClick={onAlertClick as (alert: Alert) => void}
        title="Global Alert Center"
        description="System-wide alerts and notifications"
      />
    </div>
  )
}


'use client'

import { PageHeader } from '@/components/admin/PageHeader'
import { GlobalAlertCenter, type GlobalAlert } from '@/components/admin/GlobalAlertCenter'
import { useRiskOverview } from '@/hooks/useRiskOverview'
import { toast } from '@/hooks/use-toast'
import { useMemo } from 'react'

export default function AdminAlertsPage() {
  const risk = useRiskOverview(15000)

  const alerts = useMemo<GlobalAlert[]>(
    () =>
      risk.alerts.map((alert) => ({
        id: alert.id,
        title: alert.title,
        description: `${alert.description} · ${alert.elapsedMinutes} min ago`,
        type: alert.severity === 'critical' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info',
        severity: alert.severity === 'critical' ? 'critical' : alert.severity === 'medium' ? 'medium' : 'low',
        alertType: 'fraud',
        count: 1,
      })),
    [risk.alerts]
  )

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 dark:bg-slate-900/50">
      <PageHeader title="Live Alerts" description="Real-time risk and fraud alerts with one-click actions" />
      <GlobalAlertCenter
        alerts={alerts}
        onAlertClick={(alert) => {
          toast({
            title: 'Review started',
            description: `Opened alert ${alert.id} for investigation.`,
          })
        }}
        onAcknowledge={(id) => {
          toast({
            title: 'Alert acknowledged',
            description: `Alert ${id} marked as acknowledged.`,
          })
        }}
      />
    </div>
  )
}

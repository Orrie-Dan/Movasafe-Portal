'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiGetNotifications } from '@/lib/api/notifications'
import { apiGetAdminRiskOverview } from '@/lib/api/analytics'
import type { RiskAlert } from '@/lib/types/risk'

function inferSeverity(message: string): 'critical' | 'medium' | 'low' {
  const text = message.toLowerCase()
  if (text.includes('aml') || text.includes('watchlist') || text.includes('takeover') || text.includes('fraud')) {
    return 'critical'
  }
  if (text.includes('velocity') || text.includes('impossible travel') || text.includes('kyc') || text.includes('sim')) {
    return 'medium'
  }
  return 'low'
}

export function useRiskOverview(refreshMs = 30000) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [fraudRate, setFraudRate] = useState(0)
  const [falsePositiveRate, setFalsePositiveRate] = useState(0)
  const [avgReviewTimeMinutes, setAvgReviewTimeMinutes] = useState(0)
  const [accountsFrozen, setAccountsFrozen] = useState(0)
  const [blockedTransactions, setBlockedTransactions] = useState(0)
  const [backendOpenCriticalAlerts, setBackendOpenCriticalAlerts] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        const [overview, notificationsRes] = await Promise.all([
          apiGetAdminRiskOverview(),
          apiGetNotifications({ page: 0, limit: 50 }),
        ])

        const notifications = notificationsRes?.data ?? []

        const mappedAlerts: RiskAlert[] = notifications.slice(0, 20).map((n) => ({
          id: n.id,
          severity: inferSeverity(`${n.title} ${n.message}`),
          title: n.title,
          description: n.message,
          createdAt: n.createdAt,
          elapsedMinutes: Math.max(1, Math.floor((Date.now() - new Date(n.createdAt).getTime()) / 60000)),
          status: n.status === 'sent' ? 'resolved' : 'open',
          actions: ['review', 'dismiss', 'escalate'],
        }))

        if (!active) return

        const autoBlocked = overview?.kpis?.autoBlockedTransactionCount ?? 0
        const manualBlocked = overview?.kpis?.manualBlockedTransactionCount ?? 0

        setAlerts(mappedAlerts)
        setFraudRate((overview?.kpis?.fraudRateBps ?? 0) / 100)
        setBlockedTransactions(autoBlocked + manualBlocked)
        setFalsePositiveRate(overview?.kpis?.falsePositiveRatePct ?? 0)
        setAvgReviewTimeMinutes(overview?.kpis?.avgReviewTimeMinutes ?? 0)
        setAccountsFrozen(overview?.kpis?.accountsFrozenOrRestrictedCount ?? 0)
        setBackendOpenCriticalAlerts(overview?.kpis?.openCriticalAlertsCount ?? null)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load risk overview')
      } finally {
        if (active) setLoading(false)
      }
    }

    run()
    const interval = window.setInterval(run, refreshMs)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [refreshMs])

  const openCriticalAlerts = useMemo(
    () => (backendOpenCriticalAlerts ?? alerts.filter((a) => a.severity === 'critical' && a.status === 'open').length),
    [alerts, backendOpenCriticalAlerts]
  )

  return {
    loading,
    error,
    alerts,
    fraudRate,
    blockedTransactions,
    falsePositiveRate,
    avgReviewTimeMinutes,
    accountsFrozen,
    openCriticalAlerts,
  }
}

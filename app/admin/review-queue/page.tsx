'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ViewDetailsDialog } from '@/components/admin/ViewDetailsDialog'
import { getSlaState, getSlaToneClass } from '@/lib/utils/sla'
import { formatDistanceToNowStrict } from 'date-fns'
import { apiGetDisputedTransactions, apiResolveDispute, type Transaction } from '@/lib/api/transactions'
import { apiGetUsers } from '@/lib/api/users'
import { apiGetAllTransactions } from '@/lib/api'
import { apiGetExternalAuditLogsAll } from '@/lib/api/audit-logs'
import { toast } from '@/hooks/use-toast'
import { Eye } from 'lucide-react'

type QueueFilter = 'all' | 'assigned_to_me' | 'unassigned' | 'escalated' | 'closed_today'

type QueueCase = {
  transactionId: string
  userId: string
  firstName: string
  lastName: string
  alertTypes: string[]
  riskScore: number
  createdAt: string
  assignedAnalyst?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'escalated' | 'closed'
  transactionReference?: string
  amount?: number
  riskReasons: string[]
  description?: string
}

type RiskFactor = {
  name: string
  points: number
  evidence: string
}

type MitigatingSignal = {
  name: string
  evidence: string
}

export default function ReviewQueuePage() {
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all')
  const [loading, setLoading] = useState(true)
  const [queueCases, setQueueCases] = useState<QueueCase[]>([])
  const [selectedCase, setSelectedCase] = useState<QueueCase | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailFactors, setDetailFactors] = useState<RiskFactor[]>([])
  const [mitigatingSignals, setMitigatingSignals] = useState<MitigatingSignal[]>([])
  const [detailNarrative, setDetailNarrative] = useState('')
  const [detailRecommendation, setDetailRecommendation] = useState('')
  const [approvingTransactionId, setApprovingTransactionId] = useState<string | null>(null)

  const handleApproveCase = async (queueCase: QueueCase) => {
    try {
      setApprovingTransactionId(queueCase.transactionId)
      await apiResolveDispute(
        queueCase.transactionId,
        'UPHOLD',
        'Approved from review queue after analyst review.'
      )

      setQueueCases((prev) =>
        prev.map((c) =>
          c.transactionId === queueCase.transactionId ? { ...c, status: 'closed' } : c
        )
      )

      toast({
        title: 'Approved',
        description: `Case ${queueCase.transactionReference || queueCase.transactionId} approved successfully.`,
      })
    } catch (error) {
      toast({
        title: 'Approval failed',
        description: error instanceof Error ? error.message : 'Failed to approve review case',
        variant: 'destructive',
      })
    } finally {
      setApprovingTransactionId(null)
    }
  }

  useEffect(() => {
    const loadQueue = async () => {
      try {
        setLoading(true)
        const [disputed, usersResponse] = await Promise.all([
          apiGetDisputedTransactions(),
          apiGetUsers({ page: 0, limit: 1000 }),
        ])
        const usersById = new Map(usersResponse.data.map((u) => [u.id, u]))
        const mapped: QueueCase[] = disputed.map((tx: Transaction) => {
          const description = (tx.description || '').toLowerCase()
          const amount = tx.amount || 0
          const escalatedKeywords = ['aml', 'watchlist', 'fraud', 'takeover']
          const escalated = escalatedKeywords.some((k) => description.includes(k))
          const riskScore = Math.max(25, Math.min(99, Math.round((amount / 10000) + (escalated ? 35 : 15))))
          const priority: QueueCase['priority'] = riskScore >= 85 ? 'critical' : riskScore >= 70 ? 'high' : riskScore >= 50 ? 'medium' : 'low'
          const riskReasons: string[] = []
          if (amount >= 1000000) {
            riskReasons.push(`High amount: ${(amount).toLocaleString()} RWF`)
          } else if (amount >= 500000) {
            riskReasons.push(`Medium-high amount: ${(amount).toLocaleString()} RWF`)
          } else {
            riskReasons.push(`Base amount risk: ${(amount).toLocaleString()} RWF`)
          }
          if (escalated) {
            riskReasons.push('Escalation keywords detected (AML/watchlist/fraud/takeover)')
          }
          if (description.includes('velocity')) {
            riskReasons.push('Velocity-pattern keyword present in transaction description')
          }
          if (description.includes('kyc')) {
            riskReasons.push('KYC mismatch indicator present in transaction description')
          }
          if (description.includes('travel') || description.includes('geo')) {
            riskReasons.push('Geolocation anomaly indicator present in transaction description')
          }
          if (!riskReasons.length) {
            riskReasons.push('Baseline disputed-transaction risk model applied')
          }
          const user = usersById.get(tx.userId)
          const fullName = user?.fullName || tx.userName || ''
          const nameParts = fullName.trim().split(/\s+/).filter(Boolean)
          const firstName = nameParts[0] || '-'
          const lastName = nameParts.slice(1).join(' ') || '-'
          return {
            transactionId: tx.id,
            userId: tx.userId || 'unknown',
            firstName,
            lastName,
            alertTypes: [tx.description || 'Disputed transaction'],
            riskScore,
            createdAt: tx.createdAt,
            assignedAnalyst: (tx as any)?.transactionDetails?.assignedAnalyst || undefined,
            priority,
            status: escalated ? 'escalated' : 'open',
            transactionReference: tx.internalReference,
            amount: tx.amount,
            riskReasons,
            description: tx.description,
          }
        })
        setQueueCases(mapped)
      } catch (error) {
        toast({
          title: 'Queue load failed',
          description: error instanceof Error ? error.message : 'Failed to fetch review queue data',
          variant: 'destructive',
        })
        setQueueCases([])
      } finally {
        setLoading(false)
      }
    }
    loadQueue()
  }, [])

  const data = useMemo(() => {
    if (queueFilter === 'assigned_to_me') return queueCases.filter((c) => c.assignedAnalyst === 'me')
    if (queueFilter === 'unassigned') return queueCases.filter((c) => !c.assignedAnalyst)
    if (queueFilter === 'escalated') return queueCases.filter((c) => c.status === 'escalated')
    if (queueFilter === 'closed_today') return queueCases.filter((c) => c.status === 'closed')
    return queueCases
  }, [queueFilter, queueCases])

  const columns: Column<QueueCase>[] = [
    {
      key: 'transactionReference',
      header: 'Transaction / Internal Ref',
      accessor: (c) => c.transactionReference || c.transactionId,
      sortable: true,
    },
    { key: 'firstName', header: 'First Name', accessor: (c) => c.firstName, sortable: true },
    { key: 'lastName', header: 'Last Name', accessor: (c) => c.lastName, sortable: true },
    { key: 'alerts', header: 'Alert Type(s)', accessor: (c) => c.alertTypes.join(', ') },
    { key: 'riskScore', header: 'Risk Score', accessor: (c) => c.riskScore, sortable: true },
    {
      key: 'timeInQueue',
      header: 'Time In Queue',
      accessor: (c) => {
        const minutes = Math.max(1, Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 60000))
        const state = getSlaState(minutes)
        return <span className={getSlaToneClass(state)}>{formatDistanceToNowStrict(new Date(c.createdAt))}</span>
      },
    },
    { key: 'priority', header: 'Priority', accessor: (c) => <Badge variant={c.priority === 'critical' ? 'destructive' : 'outline'}>{c.priority}</Badge> },
    {
      key: 'actions',
      header: 'Quick Action',
      accessor: (c) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={approvingTransactionId === c.transactionId || c.status === 'closed'}
            onClick={() => handleApproveCase(c)}
          >
            {approvingTransactionId === c.transactionId ? 'Approving...' : 'Approve'}
          </Button>
          <Button size="sm" variant="destructive">Escalate</Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSelectedCase(c)}
            title="View details"
            aria-label="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  useEffect(() => {
    const loadCaseContext = async () => {
      if (!selectedCase) {
        setDetailFactors([])
        setMitigatingSignals([])
        setDetailNarrative('')
        setDetailRecommendation('')
        return
      }

      try {
        setDetailLoading(true)
        const [userTxRes, auditRes] = await Promise.all([
          apiGetAllTransactions({
            page: 0,
            limit: 200,
            userId: selectedCase.userId,
            sortBy: 'createdAt',
            order: 'DESC',
          }),
          apiGetExternalAuditLogsAll({
            page: 0,
            limit: 200,
            sortBy: 'createdAt',
            order: 'DESC',
          }),
        ])

        const userTxs = userTxRes?.data?.content ?? []
        const auditLogs = auditRes?.data?.content ?? []
        const relatedAuditLogs = auditLogs.filter((log) => {
          const actorIdMatch = String(log.actorId || '') === selectedCase.userId
          const entityIdMatch = String(log.entityId || '') === selectedCase.userId
          const actorName = `${selectedCase.firstName} ${selectedCase.lastName}`.trim().toLowerCase()
          const displayName = String(log.actorDisplayName || '').toLowerCase()
          const displayNameMatch = !!actorName && displayName.includes(actorName)
          return actorIdMatch || entityIdMatch || displayNameMatch
        })
        const amount = selectedCase.amount ?? 0
        const baselineTxs = userTxs.filter((t) => t.id !== selectedCase.transactionId)
        const baselineAvg = baselineTxs.length
          ? baselineTxs.reduce((sum, t) => sum + (t.amount || 0), 0) / baselineTxs.length
          : 0
        const amountRatio = baselineAvg > 0 ? amount / baselineAvg : 1
        const amountPoints = Math.min(35, Math.round(Math.max(0, amountRatio - 1) * 12))

        const eventTime = new Date(selectedCase.createdAt).getTime()
        const oneHourWindow = userTxs.filter((t) => {
          const ts = new Date(t.createdAt).getTime()
          return Math.abs(ts - eventTime) <= 60 * 60 * 1000
        }).length
        const velocityPoints = oneHourWindow > 8 ? 25 : oneHourWindow > 5 ? 16 : oneHourWindow > 3 ? 8 : 0

        const recent30 = userTxs.slice(0, 30)
        const recentFailures = recent30.filter((t) => ['FAILED', 'CANCELLED', 'ROLLED_BACK'].includes(String(t.status))).length
        const failRate = recent30.length ? recentFailures / recent30.length : 0
        const failurePoints = Math.min(20, Math.round(failRate * 40))

        const sessionEvents = relatedAuditLogs.filter((log) => {
          const action = String(log.action || '').toLowerCase()
          const details = String(log.details || '').toLowerCase()
          return (
            action.includes('login') ||
            action.includes('session') ||
            action.includes('auth') ||
            details.includes('login') ||
            details.includes('session') ||
            details.includes('auth')
          )
        }).length
        const sessionPoints = sessionEvents > 8 ? 12 : sessionEvents > 4 ? 8 : sessionEvents > 2 ? 4 : 0

        const text = `${selectedCase.description || ''} ${selectedCase.alertTypes.join(' ')}`.toLowerCase()
        const strongSignals = ['aml', 'watchlist', 'takeover', 'sim swap', 'structuring'].filter((k) => text.includes(k))
        const keywordPoints = strongSignals.length ? Math.min(22, strongSignals.length * 8) : 0

        const factors: RiskFactor[] = [
          {
            name: 'Amount vs user baseline',
            points: amountPoints,
            evidence:
              baselineAvg > 0
                ? `${amount.toLocaleString()} RWF vs avg ${Math.round(baselineAvg).toLocaleString()} RWF (${amountRatio.toFixed(2)}x)`
                : `${amount.toLocaleString()} RWF (no reliable user baseline found)`,
          },
          {
            name: 'Short-window transaction velocity',
            points: velocityPoints,
            evidence: `${oneHourWindow} user transactions within +/- 60 minutes of this event`,
          },
          {
            name: 'Recent failed/cancelled ratio',
            points: failurePoints,
            evidence: `${recentFailures}/${recent30.length || 0} recent transactions (${(failRate * 100).toFixed(1)}%)`,
          },
          {
            name: 'Session/auth pattern from audit logs',
            points: sessionPoints,
            evidence: `${sessionEvents} login/session/auth events in ${relatedAuditLogs.length} related audit records`,
          },
          {
            name: 'Explicit high-risk signal terms',
            points: keywordPoints,
            evidence: strongSignals.length ? `Matched: ${strongSignals.join(', ')}` : 'No explicit high-risk term matched',
          },
        ]
        const positiveFactors = factors.filter((f) => f.points > 0)

        const computedScore = Math.max(20, Math.min(99, factors.reduce((sum, f) => sum + f.points, 0)))
        const topFactor = [...factors].sort((a, b) => b.points - a.points)[0]
        const totalRiskPoints = factors.reduce((sum, f) => sum + f.points, 0)
        const mitigations: MitigatingSignal[] = []
        if (baselineAvg > 0 && amountRatio < 1) {
          mitigations.push({
            name: 'Amount below user baseline',
            evidence: `${amount.toLocaleString()} RWF is ${(amountRatio * 100).toFixed(0)}% of baseline average`,
          })
        }
        if (oneHourWindow <= 2) {
          mitigations.push({
            name: 'Low short-window velocity',
            evidence: `${oneHourWindow} transaction(s) around event time`,
          })
        }
        if (recent30.length > 0 && failRate < 0.1) {
          mitigations.push({
            name: 'Stable recent transaction outcomes',
            evidence: `${((1 - failRate) * 100).toFixed(1)}% recent success/non-failure rate`,
          })
        }
        if (relatedAuditLogs.length === 0) {
          mitigations.push({
            name: 'No linked suspicious audit footprint',
            evidence: 'No related login/session/auth anomalies found in recent audit logs',
          })
        }
        setDetailFactors(positiveFactors)
        setMitigatingSignals(mitigations)
        if (totalRiskPoints === 0) {
          setDetailNarrative(
            `Risk score ${selectedCase.riskScore}/100 is currently explained by the base disputed-transaction floor, with no additional risk uplift from available context signals.`
          )
          setDetailRecommendation('Recommended path: quick approve after standard policy checks.')
        } else {
          setDetailNarrative(
            `Primary contributor: ${topFactor.name} (+${topFactor.points} pts). Queue score ${selectedCase.riskScore}/100 reflects elevated risk context.`
          )
          setDetailRecommendation('Recommended path: continue manual review and escalate if additional corroborating evidence appears.')
        }
      } catch (error) {
        setDetailFactors([])
        setMitigatingSignals([])
        setDetailNarrative('Unable to load extended context factors for this transaction.')
        setDetailRecommendation('Recommendation unavailable until context data loads successfully.')
      } finally {
        setDetailLoading(false)
      }
    }

    loadCaseContext()
  }, [selectedCase])

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 dark:bg-slate-900/50">
      <PageHeader title="Review Queue" description="Operational analyst queue with SLA status visibility" />
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="mb-4 w-64">
            <Select value={queueFilter} onValueChange={(value) => setQueueFilter(value as QueueFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Queue view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Open Cases</SelectItem>
                <SelectItem value="assigned_to_me">Assigned to me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="closed_today">Closed today</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTable data={data} columns={columns} pagination={{ pageSize: 10 }} loading={loading} />
        </CardContent>
      </Card>

      {selectedCase && (
        <ViewDetailsDialog
          open={!!selectedCase}
          onOpenChange={(open) => {
            if (!open) setSelectedCase(null)
          }}
          title="Review Queue Case"
          subtitle={selectedCase.transactionReference || selectedCase.transactionId}
          maxWidth="3xl"
          badge={<Badge variant={selectedCase.priority === 'critical' ? 'destructive' : 'outline'}>{selectedCase.priority}</Badge>}
          sections={[
            {
              title: 'Case Summary',
              gridCols: 2,
              fields: [
                { label: 'Transaction ID', value: selectedCase.transactionId },
                { label: 'Internal Reference', value: selectedCase.transactionReference || '—' },
                { label: 'Status', value: selectedCase.status },
                { label: 'First Name', value: selectedCase.firstName },
                { label: 'Last Name', value: selectedCase.lastName },
                { label: 'User ID', value: selectedCase.userId },
              ],
            },
            {
              title: 'Risk Context',
              gridCols: 2,
              fields: [
                { label: 'Risk Score', value: selectedCase.riskScore },
                { label: 'Alert Types', value: selectedCase.alertTypes.join(', ') },
                { label: 'Transaction Ref', value: selectedCase.transactionReference || '—' },
                { label: 'Amount', value: selectedCase.amount ? `${selectedCase.amount.toLocaleString()} RWF` : '—' },
                { label: 'Created', value: new Date(selectedCase.createdAt).toLocaleString() },
                { label: 'Time in Queue', value: formatDistanceToNowStrict(new Date(selectedCase.createdAt)) },
              ],
            },
            {
              title: 'Risk Score Breakdown',
              children: (
                <div className="space-y-2">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {detailLoading ? 'Loading contextual scoring evidence...' : detailNarrative || 'No contextual scoring evidence available.'}
                  </p>
                  {!detailLoading && !!detailRecommendation && (
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{detailRecommendation}</p>
                  )}
                  {!detailLoading && detailFactors.length > 0 && (
                    <div className="space-y-2">
                      {detailFactors.map((factor, idx) => (
                        <div
                          key={`${selectedCase.transactionId}-factor-${idx}`}
                          className="rounded-md border border-slate-200 dark:border-slate-800 p-2"
                        >
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {factor.name}: +{factor.points} pts
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{factor.evidence}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {!detailLoading && mitigatingSignals.length > 0 && (
                    <div className="mt-3 rounded-md border border-emerald-200/60 dark:border-emerald-900/60 p-3">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">Mitigating Signals</p>
                      <div className="space-y-1.5">
                        {mitigatingSignals.map((signal, idx) => (
                          <div key={`${selectedCase.transactionId}-mitigation-${idx}`}>
                            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{signal.name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{signal.evidence}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  )
}

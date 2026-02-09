'use client'

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { PageHeader } from '@/components/admin/PageHeader'
import { AnalyticsFilterBar } from '@/components/admin/analytics/AnalyticsFilterBar'
import { SummaryMetricsCards } from '@/components/admin/analytics/SummaryMetricsCards'
import { WalletOverviewCards } from '@/components/admin/analytics/WalletOverviewCards'
import { CoreTrendsSection } from '@/components/admin/analytics/CoreTrendsSection'
import { TransactionAnalyticsSection } from '@/components/admin/analytics/TransactionAnalyticsSection'
import { UserAnalyticsSection } from '@/components/admin/analytics/UserAnalyticsSection'
import { RevenueFeesSection } from '@/components/admin/analytics/RevenueFeesSection'
import { RiskBehaviorSection } from '@/components/admin/analytics/RiskBehaviorSection'
import { useAnalytics } from '@/hooks/useAnalytics'
import { 
  computeCoreTrendsData,
  computeTransactionAnalyticsData,
  computeAvgTransactionValueData,
  computeUserAnalyticsData,
  computeRevenueData,
  computeRevenueByTypeData,
  computeRiskData,
  computeRiskScoreDistribution,
  computeSummaryMetrics,
} from '@/lib/utils/analytics'
import { BarChart3, AlertCircle, DollarSign, Clock, Scale } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiGetDisputedEscrows } from '@/lib/api/escrows'
import type { EscrowTransaction } from '@/lib/types/escrows'
import { MetricCardEnhanced } from '@/components/dashboard/metrics/MetricCardEnhanced'
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from 'recharts'

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [disputedEscrows, setDisputedEscrows] = useState<EscrowTransaction[]>([])

  const {
    filteredTransactions,
    loading,
    authError,
    filters,
    setFilters,
    getDateRange,
  } = useAnalytics()

  const { startDate, endDate } = getDateRange()

  // Fetch disputed escrows for escrow dispute metrics section
  useEffect(() => {
    const fetchDisputed = async () => {
      try {
        const data = await apiGetDisputedEscrows()
        setDisputedEscrows(data || [])
      } catch {
        setDisputedEscrows([])
      }
    }
    fetchDisputed()
  }, [])

  // Escrow dispute metrics (mirrors escrow disputes page)
  const escrowMetrics = useMemo(() => {
    let filtered = disputedEscrows
    if (startDate && endDate) {
      filtered = disputedEscrows.filter(e => {
        const createdAt = new Date(e.createdAt)
        return createdAt >= startDate && createdAt <= endDate
      })
    }

    const disputed = filtered.filter(e => e.status === 'DISPUTED' || (e as any).escrowStatus === 'DISPUTED')
    const resolved = filtered.filter(e => 
      e.status === 'RELEASED' || 
      e.status === 'REFUNDED' || 
      (e as any).escrowStatus === 'RELEASED' || 
      (e as any).escrowStatus === 'REFUNDED'
    )
    const refunded = filtered.filter(e => 
      e.status === 'REFUNDED' || 
      (e as any).escrowStatus === 'REFUNDED' || 
      (e as any).resolutionAction === 'REFUND'
    )
    const released = filtered.filter(e => 
      e.status === 'RELEASED' || 
      (e as any).escrowStatus === 'RELEASED' || 
      (e as any).resolutionAction === 'RELEASE'
    )

    const clientWins = refunded.length
    const vendorWins = released.length
    const totalResolved = resolved.length

    const clientWinRate = totalResolved > 0 ? ((clientWins / totalResolved) * 100).toFixed(1) : '0'
    const vendorWinRate = totalResolved > 0 ? ((vendorWins / totalResolved) * 100).toFixed(1) : '0'
    const fairnessIndex = (1 - Math.abs(Number(clientWinRate) - Number(vendorWinRate)) / 100).toFixed(2)

    // Resolution time calculation: AVG(disputeResolvedAt - disputedAt) for resolved disputes
    const resolutionTimes = resolved
      .filter(e => {
        const resolvedAt = (e as any).disputeResolvedAt ? new Date((e as any).disputeResolvedAt) : null
        const disputedAt = (e as any).disputedAt ? new Date((e as any).disputedAt) : (e.createdAt ? new Date(e.createdAt) : null)
        return resolvedAt && disputedAt
      })
      .map(e => {
        const disputedAt = (e as any).disputedAt ? new Date((e as any).disputedAt).getTime() : new Date(e.createdAt).getTime()
        const resolvedTime = new Date((e as any).disputeResolvedAt as string).getTime()
        return (resolvedTime - disputedAt) / (1000 * 60 * 60 * 24)
      })

    const avgResolutionTime =
      resolutionTimes.length > 0 ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1) : '0'

    const now = new Date().getTime()

    const totalDisputedAmount = disputed.reduce((sum, e) => sum + ((e as any).escrowAmount || e.amount || 0), 0)
    const totalValueAtRisk = totalDisputedAmount

    const totalCommissionAtRisk = disputed.reduce((sum, e) => sum + ((e as any).commissionAmount || 0), 0)
    const commissionPercents = disputed
      .map(e => (typeof (e as any).commissionPercentage === 'number' ? (e as any).commissionPercentage : null))
      .filter((v): v is number => v !== null)
    const avgCommissionPct =
      commissionPercents.length > 0
        ? (commissionPercents.reduce((a, b) => a + b, 0) / commissionPercents.length).toFixed(1)
        : '0'

    const disputeAges = disputed
      .map(e => {
        const base = (e as any).disputedAt ? new Date((e as any).disputedAt).getTime() : (e.createdAt ? new Date(e.createdAt).getTime() : null)
        if (!base) return null
        return (now - base) / (1000 * 60 * 60 * 24)
      })
      .filter((v): v is number => v !== null)
    const avgDisputeAgeDays =
      disputeAges.length > 0 ? (disputeAges.reduce((a, b) => a + b, 0) / disputeAges.length).toFixed(1) : '0'

    const expirationDaysValues = disputed
      .map(e => (typeof (e as any).expirationDays === 'number' ? (e as any).expirationDays : null))
      .filter((v): v is number => v !== null)
    const avgExpirationDays =
      expirationDaysValues.length > 0
        ? (expirationDaysValues.reduce((a, b) => a + b, 0) / expirationDaysValues.length).toFixed(1)
        : '0'

    const disputesApproachingExpiry = disputed.filter(e => {
      if ((e as any).isExpired) return false
      const effective = (e as any).effectiveExpiresAt || (e as any).expiresAt
      if (!effective) return false
      const expTime = new Date(effective as string).getTime()
      const diffDays = (expTime - now) / (1000 * 60 * 60 * 24)
      return diffDays >= 0 && diffDays <= 7
    }).length

    return {
      hasData: disputedEscrows.length > 0,
      pendingDisputes: disputed.length,
      totalResolved,
      clientWinRate,
      vendorWinRate,
      fairnessIndex,
      clientWins,
      vendorWins,
      avgResolutionTime,
      totalDisputedAmount,
      totalValueAtRisk,
      totalCommissionAtRisk,
      avgCommissionPct,
      avgDisputeAgeDays,
      avgExpirationDays,
      disputesApproachingExpiry,
    }
  }, [disputedEscrows, startDate, endDate])

  // Escrow disputes trends data for charts (similar to disputes page)
  const escrowTrends = useMemo(() => {
    if (!disputedEscrows.length) return []

    const monthlyData: Array<{
      month: string
      monthYear: string
      'New Disputes': number
      'Resolved Disputes': number
    }> = []

    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now)
      monthStart.setMonth(now.getMonth() - i, 1)
      monthStart.setHours(0, 0, 0, 0)

      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthStart.getMonth() + 1)

      const monthLabel = monthStart.toLocaleString('en-US', { month: 'short', year: 'numeric' })

      const newDisputes = disputedEscrows.filter((e) => {
        const created = new Date(e.createdAt)
        return created >= monthStart && created < monthEnd && (e.status === 'DISPUTED' || (e as any).escrowStatus === 'DISPUTED')
      }).length

      const resolvedDisputes = disputedEscrows.filter((e) => {
        const resolvedAt = (e as any).disputeResolvedAt
        if (!resolvedAt) return false
        const resolvedDate = new Date(resolvedAt as string)
        return resolvedDate >= monthStart && resolvedDate < monthEnd
      }).length

      monthlyData.push({
        month: monthStart.toLocaleString('en-US', { month: 'short' }),
        monthYear: monthLabel,
        'New Disputes': newDisputes,
        'Resolved Disputes': resolvedDisputes,
      })
    }

    return monthlyData
  }, [disputedEscrows])

  // Compute all analytics data
  const coreTrendsData = useMemo(
    () => computeCoreTrendsData(filteredTransactions, startDate, endDate),
    [filteredTransactions, startDate, endDate]
  )

  const transactionAnalyticsData = useMemo(
    () => computeTransactionAnalyticsData(filteredTransactions),
    [filteredTransactions]
  )

  const avgTransactionValueData = useMemo(
    () => computeAvgTransactionValueData(filteredTransactions, startDate, endDate),
    [filteredTransactions, startDate, endDate]
  )

  const userAnalyticsData = useMemo(
    () => computeUserAnalyticsData(filteredTransactions, startDate, endDate),
    [filteredTransactions, startDate, endDate]
  )

  const revenueData = useMemo(
    () => computeRevenueData(filteredTransactions, startDate, endDate),
    [filteredTransactions, startDate, endDate]
  )

  const revenueByTypeData = useMemo(
    () => computeRevenueByTypeData(filteredTransactions),
    [filteredTransactions]
  )

  const riskData = useMemo(
    () => computeRiskData(filteredTransactions, startDate, endDate),
    [filteredTransactions, startDate, endDate]
  )

  const riskScoreDistribution = useMemo(
    () => computeRiskScoreDistribution(filteredTransactions),
    [filteredTransactions]
  )

  const summaryMetrics = useMemo(
    () => computeSummaryMetrics(filteredTransactions),
    [filteredTransactions]
  )

  // Authentication check removed - allow access without login

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-white dark:bg-black">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                Analytics & Insights
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Explore trends, patterns, and insights to understand performance over time
              </p>
            </div>
          </div>

      <AnalyticsFilterBar filters={filters} onChange={setFilters} />

      {/* Wallets metrics section (moved from Wallets page) */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            Wallets
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor wallet balances and reserved funds
          </p>
        </div>
        <WalletOverviewCards />
      </section>

      {/* Escrow Disputes Metrics (from /api/admin/escrows/disputed) */}
      {escrowMetrics.hasData && (
        <section className="space-y-4">
          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    Escrow Disputes – Core Metrics
                  </h2>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Row 1: Operational KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCardEnhanced
              title="Pending Disputes"
              value={escrowMetrics.pendingDisputes}
              icon={AlertCircle}
              variant="warning"
              format="number"
            />
            <MetricCardEnhanced
              title="Total Disputed Amount"
              value={escrowMetrics.totalDisputedAmount}
              icon={DollarSign}
              variant="negative"
              format="currency"
              currency="RWF"
            />
            <MetricCardEnhanced
              title="Avg Dispute Age (days)"
              value={Number(escrowMetrics.avgDisputeAgeDays)}
              icon={Clock}
              variant="default"
              format="number"
            />
            <MetricCardEnhanced
              title="Avg Expiration Window (days)"
              value={Number(escrowMetrics.avgExpirationDays)}
              icon={Clock}
              variant="default"
              format="number"
            />
            <MetricCardEnhanced
              title="Disputes Near Expiry (7d)"
              value={escrowMetrics.disputesApproachingExpiry}
              icon={AlertCircle}
              variant="warning"
              format="number"
            />
          </div>

          {/* Row 2: Financial & Fairness Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCardEnhanced
              title="Value at Risk"
              value={escrowMetrics.totalValueAtRisk}
              icon={DollarSign}
              variant="negative"
              format="currency"
              currency="RWF"
            />
            <MetricCardEnhanced
              title="Total Commission at Risk"
              value={escrowMetrics.totalCommissionAtRisk}
              icon={DollarSign}
              variant="default"
              format="currency"
              currency="RWF"
            />
            <MetricCardEnhanced
              title="Avg Commission Rate"
              value={Number(escrowMetrics.avgCommissionPct)}
              icon={Scale}
              variant="default"
              format="percentage"
            />
            <MetricCardEnhanced
              title="Fairness Index"
              value={Number(escrowMetrics.fairnessIndex)}
              icon={Scale}
              variant="default"
              format="number"
            />
          </div>
        </section>
      )}

      <SummaryMetricsCards metrics={summaryMetrics} />

      <CoreTrendsSection data={coreTrendsData} />

      <TransactionAnalyticsSection
        transactionData={transactionAnalyticsData}
        avgValueData={avgTransactionValueData}
      />

      <UserAnalyticsSection userData={userAnalyticsData} coreTrendsData={coreTrendsData} />

      <RevenueFeesSection revenueData={revenueData} revenueByTypeData={revenueByTypeData} />

      <RiskBehaviorSection
        riskData={riskData}
        riskScoreDistribution={riskScoreDistribution}
      />

      {/* Escrow Disputes – Dispute Analytics & Visualizations (black background, no dark blue) */}
      {escrowTrends.length > 0 && (
        <section className="space-y-6">
          <Card className="bg-black border border-gray-800 shadow-lg">
            <CardHeader className="bg-black border-b border-gray-800">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-800">
                  <BarChart3 className="h-5 w-5 text-gray-200" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-white">
                    Dispute Analytics &amp; Visualizations
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-400 mt-1">
                    Visual analysis of dispute patterns, resolution trends, and month‑by‑month volumes from escrow disputes.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-black">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Line chart – Resolution Trends Over Time (tooltip has margin so it doesn’t overlap) */}
                <div className="rounded-lg bg-black p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Resolution Trends Over Time
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={escrowTrends} margin={{ top: 10, right: 30, left: 0, bottom: 36 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis
                        dataKey="month"
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        label={{
                          value: 'Month',
                          position: 'insideBottom',
                          offset: -5,
                          fill: '#9ca3af',
                          style: { fontSize: '12px' },
                        }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        label={{
                          value: 'Number of Disputes',
                          angle: -90,
                          position: 'insideLeft',
                          fill: '#9ca3af',
                          style: { fontSize: '12px' },
                        }}
                      />
                      <RechartsTooltip
                        formatter={(value: any) => [`${value} disputes`, '']}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{
                          backgroundColor: '#111827',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                          color: '#f3f4f6',
                          zIndex: 1000,
                        }}
                        wrapperStyle={{ zIndex: 1000 }}
                      />
                      <RechartsLegend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
                      <Line
                        type="monotone"
                        dataKey="New Disputes"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7 }}
                        name="New Disputes"
                      />
                      <Line
                        type="monotone"
                        dataKey="Resolved Disputes"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7 }}
                        name="Resolved Disputes"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>

                {/* Right: Monthly Dispute Summary */}
                <div className="space-y-6">
                  {/* Pie chart – extra bottom space so tooltip doesn’t overlap labels */}
                  {/* Monthly Dispute Summary */}
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3">Monthly Dispute Summary</h3>
                    <div className="max-h-[280px] overflow-y-auto w-full rounded-lg border border-gray-800">
                      <Table className="w-full min-w-full">
                        <TableHeader>
                          <TableRow className="bg-gray-800 border-gray-700">
                            <TableHead className="text-sm font-semibold text-gray-300">Month</TableHead>
                            <TableHead className="text-right text-sm font-semibold text-gray-300">
                              New Disputes
                            </TableHead>
                            <TableHead className="text-right text-sm font-semibold text-gray-300">
                              Resolved
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {escrowTrends.map((item) => (
                            <TableRow key={item.monthYear} className="hover:bg-gray-800/80 border-gray-800">
                              <TableCell className="text-sm font-medium text-white">{item.monthYear}</TableCell>
                              <TableCell className="text-right text-sm font-semibold text-red-400">
                                {item['New Disputes']}
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold text-green-400">
                                {item['Resolved Disputes']}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
        </div>
  )
}

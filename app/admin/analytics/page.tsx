'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/admin/PageHeader'
import { AnalyticsFilterBar } from '@/components/admin/analytics/AnalyticsFilterBar'
import { SummaryMetricsCards } from '@/components/admin/analytics/SummaryMetricsCards'
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
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  const router = useRouter()
  const {
    filteredTransactions,
    loading,
    authError,
    filters,
    setFilters,
    getDateRange,
  } = useAnalytics()

  const { startDate, endDate } = getDateRange()

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
    <div className="p-6 lg:p-8 space-y-8 bg-slate-50 dark:bg-slate-900/50">
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
        </div>
  )
}

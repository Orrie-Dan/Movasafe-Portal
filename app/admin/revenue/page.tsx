'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Forecasting } from '@/components/financial/Forecasting'
import { ContributionAnalysis } from '@/components/analytics/ContributionAnalysis'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, TrendingUp, Calendar, Store, Users, ArrowUpRight, Activity, Percent, CreditCard } from 'lucide-react'
import type { RevenueMetrics } from '@/lib/types/fintech'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { useMemo } from 'react'

// Mock data - replace with actual API calls
const mockRevenueData = [
  { date: 'Jan', revenue: 1200000, volume: 450 },
  { date: 'Feb', revenue: 1350000, volume: 520 },
  { date: 'Mar', revenue: 1500000, volume: 580 },
  { date: 'Apr', revenue: 1420000, volume: 540 },
  { date: 'May', revenue: 1680000, volume: 620 },
  { date: 'Jun', revenue: 1750000, volume: 650 },
]

const mockRevenueMetrics: RevenueMetrics = {
  totalRevenue: 1750000,
  transactionVolume: 650,
  commissionEarned: 87500,
  period: 'month',
  trend: 12.5,
}

export default function RevenuePage() {
  const [loading, setLoading] = useState(true)
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(mockRevenueMetrics)
  const [forecast, setForecast] = useState<any>(null)

  // Mock data for top merchants/users
  const topMerchants = useMemo(() => [
    { id: 'm1', name: 'Merchant A', revenue: 450000, transactions: 1250, margin: 2.5 },
    { id: 'm2', name: 'Merchant B', revenue: 380000, transactions: 980, margin: 2.8 },
    { id: 'm3', name: 'Merchant C', revenue: 320000, transactions: 850, margin: 2.2 },
  ], [])

  const topUsers = useMemo(() => [
    { id: 'u1', name: 'User A', revenue: 125000, transactions: 450 },
    { id: 'u2', name: 'User B', revenue: 98000, transactions: 320 },
    { id: 'u3', name: 'User C', revenue: 85000, transactions: 280 },
  ], [])

  // Mock cohort analysis data
  const cohortData = useMemo(() => [
    { cohort: 'Jan 2024', users: 1200, revenue: 1500000, retention: 85 },
    { cohort: 'Feb 2024', users: 1350, revenue: 1680000, retention: 82 },
    { cohort: 'Mar 2024', users: 1480, revenue: 1850000, retention: 88 },
  ], [])

  useEffect(() => {
    // TODO: Replace with actual API calls
    // const fetchData = async () => {
    //   const [metrics, forecastData] = await Promise.all([
    //     apiGetRevenueMetrics(),
    //     apiGetRevenueForecast(),
    //   ])
    //   setRevenueMetrics(metrics)
    //   setForecast(forecastData)
    //   setLoading(false)
    // }
    // fetchData()
    setLoading(false)
  }, [])

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-white dark:bg-black min-h-screen">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
          <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          Revenue Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Comprehensive revenue analytics, forecasting, and commission tracking for financial performance monitoring
        </p>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : revenueMetrics ? (
                    `${(revenueMetrics.totalRevenue / 1000000).toFixed(2)}M`
                  ) : (
                    'N/A'
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>
                    {revenueMetrics ? `+${revenueMetrics.trend}%` : 'N/A'} from last period
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transaction Volume</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : revenueMetrics ? (
                    revenueMetrics.transactionVolume.toLocaleString()
                  ) : (
                    'N/A'
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total transactions this period</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commission Earned</p>
                <div className="text-2xl font-bold text-blue-400 mt-1">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : revenueMetrics ? (
                    `${(revenueMetrics.commissionEarned / 1000).toFixed(1)}K`
                  ) : (
                    'N/A'
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total commissions generated</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <div className="text-2xl font-bold text-green-400 mt-1">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : revenueMetrics ? (
                    `+${revenueMetrics.trend}%`
                  ) : (
                    'N/A'
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Period-over-period growth</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Percent className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Chart */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Revenue Trends Analysis
          </CardTitle>
          <CardDescription>
            Historical revenue and transaction volume trends over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <EnhancedLineChart
              data={mockRevenueData}
              dataKeys={[
                { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
                { key: 'volume', name: 'Volume', color: '#10b981' },
              ]}
              xAxisKey="date"
              height={300}
            />
          )}
        </CardContent>
      </Card>

      {/* Revenue Forecasting */}
      <CollapsibleSection
        title="Revenue Forecasting"
        description="Projected revenue and transaction volume"
        defaultExpanded={true}
        icon={Calendar}
      >
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <Forecasting data={forecast} />
        )}
      </CollapsibleSection>

      {/* Contribution Analysis */}
      <CollapsibleSection
        title="Revenue Contribution Analysis"
        description="Breakdown of revenue sources and contributions"
        defaultExpanded={true}
        icon={TrendingUp}
      >
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <ContributionAnalysis data={null} />
        )}
      </CollapsibleSection>

      {/* Top Merchants & Users */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Top Performers Analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analysis of top-performing merchants and users contributing to revenue growth
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-400" />
              Top Performing Merchants
            </CardTitle>
            <CardDescription>
              Leading merchants ranked by revenue generation and transaction volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-700">
                    <TableHead className="text-muted-foreground font-semibold">Merchant</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Revenue</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Transactions</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">FX Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMerchants.map((merchant) => (
                    <TableRow key={merchant.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-medium text-foreground">{merchant.name}</TableCell>
                      <TableCell className="text-green-400 font-semibold">
                        {(merchant.revenue / 1000).toFixed(1)}K RWF
                      </TableCell>
                      <TableCell className="text-muted-foreground">{merchant.transactions.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                          {merchant.margin}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Top Revenue Users
            </CardTitle>
            <CardDescription>
              Users with the highest transaction volume and revenue contribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-700">
                    <TableHead className="text-muted-foreground font-semibold">User</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Revenue</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUsers.map((user) => (
                    <TableRow key={user.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                      <TableCell className="text-green-400 font-semibold">
                        {(user.revenue / 1000).toFixed(1)}K RWF
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.transactions.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Cohort Analysis */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            Cohort Performance Analysis
          </CardTitle>
          <CardDescription>
            User retention rates and revenue performance segmented by acquisition cohort
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead className="text-muted-foreground font-semibold">Cohort Period</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Active Users</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Total Revenue</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Retention Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohortData.map((cohort) => (
                  <TableRow key={cohort.cohort} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-medium text-foreground">{cohort.cohort}</TableCell>
                    <TableCell className="text-muted-foreground">{cohort.users.toLocaleString()}</TableCell>
                    <TableCell className="text-green-400 font-semibold">
                      {(cohort.revenue / 1000000).toFixed(2)}M RWF
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        cohort.retention >= 85
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : cohort.retention >= 75
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }>
                        {cohort.retention}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
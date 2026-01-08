'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Forecasting } from '@/components/financial/Forecasting'
import { ContributionAnalysis } from '@/components/analytics/ContributionAnalysis'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, TrendingUp, Calendar, Store, Users, ArrowUpRight } from 'lucide-react'
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
    <div className="p-6 lg:p-8 space-y-6 bg-black">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
          <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          Revenue Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Revenue analytics, forecasting, and commission tracking
        </p>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="xs" className="z-10 relative">Total Revenue</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {revenueMetrics ? `${(revenueMetrics.totalRevenue / 1000000).toFixed(2)}M` : 'N/A'}
            </div>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {revenueMetrics ? `+${revenueMetrics.trend}%` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="xs" className="z-10 relative">Transaction Volume</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {revenueMetrics ? revenueMetrics.transactionVolume.toLocaleString() : 'N/A'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Transactions this period</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="xs" className="z-10 relative">Commission Earned</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {revenueMetrics ? `${(revenueMetrics.commissionEarned / 1000).toFixed(1)}K` : 'N/A'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total commissions</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="xs" className="z-10 relative">Growth Rate</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {revenueMetrics ? `+${revenueMetrics.trend}%` : 'N/A'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Period-over-period</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Chart */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle className="z-10 relative text-slate-900 dark:text-white">Revenue Trends</CardTitle>
          <CardDescription className="z-10 relative">Revenue and transaction volume over time</CardDescription>
        </div>
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="z-10 relative text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-400" />
              Top Merchants
            </CardTitle>
            <CardDescription className="z-10 relative">Highest revenue generating merchants</CardDescription>
          </div>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead className="text-slate-600 dark:text-slate-400">Merchant</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Revenue</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Transactions</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">FX Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topMerchants.map((merchant) => (
                  <TableRow key={merchant.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium text-slate-900 dark:text-white">{merchant.name}</TableCell>
                    <TableCell className="text-green-400">
                      {(merchant.revenue / 1000).toFixed(1)}K RWF
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{merchant.transactions}</TableCell>
                    <TableCell className="text-blue-400">{merchant.margin}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="z-10 relative text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Top Users
            </CardTitle>
            <CardDescription className="z-10 relative">Highest revenue generating users</CardDescription>
          </div>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead className="text-slate-600 dark:text-slate-400">User</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Revenue</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium text-slate-900 dark:text-white">{user.name}</TableCell>
                    <TableCell className="text-green-400">
                      {(user.revenue / 1000).toFixed(1)}K RWF
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{user.transactions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Analysis */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle className="z-10 relative text-slate-900 dark:text-white">Cohort Analysis</CardTitle>
          <CardDescription className="z-10 relative">User retention and revenue by cohort</CardDescription>
        </div>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead className="text-slate-600 dark:text-slate-400">Cohort</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Users</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Revenue</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Retention %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohortData.map((cohort) => (
                  <TableRow key={cohort.cohort} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium text-slate-900 dark:text-white">{cohort.cohort}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{cohort.users.toLocaleString()}</TableCell>
                    <TableCell className="text-green-400">
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

r
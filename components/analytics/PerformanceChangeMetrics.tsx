'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { PerformanceMetrics } from '@/lib/types/analytics'

export interface PerformanceChangeMetricsProps {
  data: PerformanceMetrics | null
  loading?: boolean
}

export function PerformanceChangeMetrics({ data, loading = false }: PerformanceChangeMetricsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <EmptyState
        title="No performance metrics available"
        description="Performance change metrics will appear here once data is available."
        icon={TrendingUp}
      />
    )
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-400" />
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-400" />
    return <Minus className="h-4 w-4 text-slate-400" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-400'
    if (value < 0) return 'text-red-400'
    return 'text-slate-400'
  }

  return (
    <div className="space-y-6">
      {/* Growth Rates */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="sm" className="relative z-10">Revenue Growth</CardTitle>
            <CardDescription className="relative z-10">Period-over-period change</CardDescription>
          </div>
          <CardContent>
            <div className="flex items-center gap-2">
              {getTrendIcon(data.revenueGrowthRate)}
              <span className={`text-2xl font-bold ${getTrendColor(data.revenueGrowthRate)}`}>
                {data.revenueGrowthRate > 0 ? '+' : ''}{data.revenueGrowthRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="sm" className="relative z-10">Expense Growth</CardTitle>
            <CardDescription className="relative z-10">Period-over-period change</CardDescription>
          </div>
          <CardContent>
            <div className="flex items-center gap-2">
              {getTrendIcon(data.expenseGrowthRate)}
              <span className={`text-2xl font-bold ${getTrendColor(data.expenseGrowthRate)}`}>
                {data.expenseGrowthRate > 0 ? '+' : ''}{data.expenseGrowthRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="sm" className="relative z-10">Profit Growth</CardTitle>
            <CardDescription className="relative z-10">Period-over-period change</CardDescription>
          </div>
          <CardContent>
            <div className="flex items-center gap-2">
              {getTrendIcon(data.profitGrowth)}
              <span className={`text-2xl font-bold ${getTrendColor(data.profitGrowth)}`}>
                {data.profitGrowth > 0 ? '+' : ''}{data.profitGrowth.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="sm" className="relative z-10">Margin Change</CardTitle>
            <CardDescription className="relative z-10">Profit margin change</CardDescription>
          </div>
          <CardContent>
            <div className="flex items-center gap-2">
              {getTrendIcon(data.marginChange)}
              <span className={`text-2xl font-bold ${getTrendColor(data.marginChange)}`}>
                {data.marginChange > 0 ? '+' : ''}{data.marginChange.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Comparisons */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Month-over-Month */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="relative z-10">Month-over-Month Comparison</CardTitle>
            <CardDescription className="relative z-10">Current vs previous month</CardDescription>
          </div>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-300">Revenue</span>
                <span className={`text-2xl font-bold ${getTrendColor(data.momComparison.revenue)}`}>
                  {data.momComparison.revenue > 0 ? '+' : ''}{data.momComparison.revenue.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-300">Expenses</span>
                <span className={`text-2xl font-bold ${getTrendColor(data.momComparison.expenses)}`}>
                  {data.momComparison.expenses > 0 ? '+' : ''}{data.momComparison.expenses.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-300">Profit</span>
                <span className={`text-2xl font-bold ${getTrendColor(data.momComparison.profit)}`}>
                  {data.momComparison.profit > 0 ? '+' : ''}{data.momComparison.profit.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Year-over-Year */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="relative z-10">Year-over-Year Comparison</CardTitle>
            <CardDescription className="relative z-10">Current vs same period last year</CardDescription>
          </div>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-300">Revenue</span>
                <span className={`text-2xl font-bold ${getTrendColor(data.yoyComparison.revenue)}`}>
                  {data.yoyComparison.revenue > 0 ? '+' : ''}{data.yoyComparison.revenue.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-300">Expenses</span>
                <span className={`text-2xl font-bold ${getTrendColor(data.yoyComparison.expenses)}`}>
                  {data.yoyComparison.expenses > 0 ? '+' : ''}{data.yoyComparison.expenses.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-300">Profit</span>
                <span className={`text-2xl font-bold ${getTrendColor(data.yoyComparison.profit)}`}>
                  {data.yoyComparison.profit > 0 ? '+' : ''}{data.yoyComparison.profit.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


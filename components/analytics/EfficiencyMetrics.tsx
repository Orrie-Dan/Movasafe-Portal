'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { TrendingUp, DollarSign } from 'lucide-react'
import type { EfficiencyMetrics as EfficiencyMetricsType } from '@/lib/types/analytics'
import { formatCurrency } from '@/lib/utils/financial'

export interface EfficiencyMetricsProps {
  data: EfficiencyMetricsType | null
  loading?: boolean
}

export function EfficiencyMetrics({ data, loading = false }: EfficiencyMetricsProps) {
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
        title="No efficiency metrics available"
        description="Efficiency metrics will appear here once data is available."
        icon={TrendingUp}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Efficiency KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="sm" className="relative z-10">Cost per Transaction</CardTitle>
            <CardDescription className="relative z-10">Average cost per transaction</CardDescription>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(data.costPerTransaction)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="sm" className="relative z-10">Cost per Service</CardTitle>
            <CardDescription className="relative z-10">Average cost per service</CardDescription>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(data.costPerService)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="sm" className="relative z-10">Revenue per Customer</CardTitle>
            <CardDescription className="relative z-10">Average revenue per customer</CardDescription>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(data.revenuePerCustomer)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="sm" className="relative z-10">Revenue per Employee</CardTitle>
            <CardDescription className="relative z-10">Average revenue per employee</CardDescription>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(data.revenuePerEmployee)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="sm" className="relative z-10">Operating Cost Ratio</CardTitle>
            <CardDescription className="relative z-10">Operating costs as % of revenue</CardDescription>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.operatingCostRatio.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="sm" className="relative z-10">Utilization Rate</CardTitle>
            <CardDescription className="relative z-10">Resource utilization percentage</CardDescription>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.utilizationRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Trends */}
      {data.trends && data.trends.length > 0 && (
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="relative z-10">Efficiency Trends</CardTitle>
            <CardDescription className="relative z-10">Efficiency metrics over time</CardDescription>
          </div>
          <CardContent>
            <EnhancedLineChart
              data={data.trends}
              dataKeys={[
                { key: 'costPerTransaction', name: 'Cost per Transaction', color: '#ef4444' },
                { key: 'revenuePerCustomer', name: 'Revenue per Customer', color: '#10b981' },
              ]}
              xAxisKey="period"
              height={300}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}


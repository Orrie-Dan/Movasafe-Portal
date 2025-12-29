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
        <Card className="bg-black border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle size="sm" className="text-white">Cost per Transaction</CardTitle>
            <CardDescription className="text-slate-400">Average cost per transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(data.costPerTransaction)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle size="sm" className="text-white">Cost per Service</CardTitle>
            <CardDescription className="text-slate-400">Average cost per service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(data.costPerService)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle size="sm" className="text-white">Revenue per Customer</CardTitle>
            <CardDescription className="text-slate-400">Average revenue per customer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(data.revenuePerCustomer)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle size="sm" className="text-white">Revenue per Employee</CardTitle>
            <CardDescription className="text-slate-400">Average revenue per employee</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(data.revenuePerEmployee)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle size="sm" className="text-white">Operating Cost Ratio</CardTitle>
            <CardDescription className="text-slate-400">Operating costs as % of revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {data.operatingCostRatio.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle size="sm" className="text-white">Utilization Rate</CardTitle>
            <CardDescription className="text-slate-400">Resource utilization percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {data.utilizationRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Trends */}
      {data.trends && data.trends.length > 0 && (
        <Card className="bg-black border-slate-800">
          <CardHeader>
            <CardTitle size="md" className="text-white">Efficiency Trends</CardTitle>
            <CardDescription className="text-slate-400">Efficiency metrics over time</CardDescription>
          </CardHeader>
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


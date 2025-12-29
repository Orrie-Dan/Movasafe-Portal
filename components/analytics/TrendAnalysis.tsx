'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { TrendingUp, Calendar, AlertTriangle } from 'lucide-react'
import type { TrendData } from '@/lib/types/analytics'
import { formatCurrency } from '@/lib/utils/financial'

export interface TrendAnalysisProps {
  data: TrendData | null
  loading?: boolean
}

export function TrendAnalysis({ data, loading = false }: TrendAnalysisProps) {
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
        title="No trend analysis available"
        description="Trend analysis will appear here once data is available."
        icon={TrendingUp}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Seasonal Patterns */}
      {data.seasonalPatterns && data.seasonalPatterns.length > 0 && (
        <Card className="bg-black border-slate-800">
          <CardHeader>
            <CardTitle size="md" className="text-white">Seasonal Revenue Patterns</CardTitle>
            <CardDescription className="text-slate-400">Revenue trends by month</CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedLineChart
              data={data.seasonalPatterns}
              dataKeys={[
                { key: 'revenue', name: 'Revenue', color: '#10b981' },
                { key: 'expenses', name: 'Expenses', color: '#ef4444' },
                { key: 'average', name: 'Average', color: '#3b82f6' },
              ]}
              xAxisKey="month"
              height={300}
            />
          </CardContent>
        </Card>
      )}

      {/* Expense Spikes */}
      {data.expenseSpikes && data.expenseSpikes.length > 0 && (
        <Card className="bg-black border-slate-800">
          <CardHeader>
            <CardTitle size="md" className="text-white">Expense Spikes</CardTitle>
            <CardDescription className="text-slate-400">Unusual expense increases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.expenseSpikes.map((spike, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div>
                    <div className="text-sm font-medium text-white">{spike.category}</div>
                    <div className="text-xs text-slate-400">{spike.date}</div>
                    {spike.reason && (
                      <div className="text-xs text-slate-500 mt-1">{spike.reason}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-400">{formatCurrency(spike.amount)}</div>
                    <AlertTriangle className="h-4 w-4 text-red-400 mx-auto mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Peak vs Low Period */}
      {data.peakVsLow && (
        <Card className="bg-black border-slate-800">
          <CardHeader>
            <CardTitle size="md" className="text-white">Peak vs Low Period Performance</CardTitle>
            <CardDescription className="text-slate-400">Comparison of best and worst periods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="text-sm text-slate-400 mb-2">Peak Period</div>
                <div className="text-xl font-semibold text-white mb-3">{data.peakVsLow.peakPeriod.period}</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-300">Revenue</span>
                    <span className="text-sm font-semibold text-green-400">
                      {formatCurrency(data.peakVsLow.peakPeriod.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-300">Expenses</span>
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(data.peakVsLow.peakPeriod.expenses)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-sm text-slate-400 mb-2">Low Period</div>
                <div className="text-xl font-semibold text-white mb-3">{data.peakVsLow.lowPeriod.period}</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-300">Revenue</span>
                    <span className="text-sm font-semibold text-red-400">
                      {formatCurrency(data.peakVsLow.lowPeriod.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-300">Expenses</span>
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(data.peakVsLow.lowPeriod.expenses)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="text-sm text-slate-400 mb-2">Difference</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400">Revenue Gap</div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(data.peakVsLow.difference.revenue)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Expense Gap</div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(data.peakVsLow.difference.expenses)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


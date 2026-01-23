'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { TrendingUp } from 'lucide-react'
import type { CoreTrendsDataPoint } from '@/lib/utils/analytics'

interface CoreTrendsSectionProps {
  data: CoreTrendsDataPoint[]
}

export function CoreTrendsSection({ data }: CoreTrendsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          Core Trends
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Key metrics over time to understand overall performance patterns
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transaction Volume */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Transaction Volume</CardTitle>
            <CardDescription className="z-10 relative">Total transaction value over time</CardDescription>
          </div>
          <CardContent>
            <EnhancedLineChart
              data={data}
              dataKeys={[{ key: 'volume', name: 'Volume (RWF)', color: '#3b82f6' }]}
              xAxisKey="date"
              height={300}
              tooltipFormatter={(value: any) => [
                `${(value as number).toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })} RWF`,
                'Volume',
              ]}
            />
          </CardContent>
        </Card>

        {/* Transaction Count */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Transaction Count</CardTitle>
            <CardDescription className="z-10 relative">Number of transactions over time</CardDescription>
          </div>
          <CardContent>
            <EnhancedLineChart
              data={data}
              dataKeys={[{ key: 'count', name: 'Count', color: '#10b981' }]}
              xAxisKey="date"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Active Users</CardTitle>
            <CardDescription className="z-10 relative">Number of unique active users per day</CardDescription>
          </div>
          <CardContent>
            <EnhancedLineChart
              data={data}
              dataKeys={[{ key: 'activeUsers', name: 'Active Users', color: '#8b5cf6' }]}
              xAxisKey="date"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Failure Rate */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Failure Rate</CardTitle>
            <CardDescription className="z-10 relative">Percentage of failed transactions over time</CardDescription>
          </div>
          <CardContent>
            <EnhancedLineChart
              data={data}
              dataKeys={[{ key: 'failureRate', name: 'Failure Rate (%)', color: '#ef4444' }]}
              xAxisKey="date"
              height={300}
              tooltipFormatter={(value: any) => [`${value.toFixed(2)}%`, 'Failure Rate']}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { DollarSign } from 'lucide-react'
import type { RevenueDataPoint } from '@/lib/utils/analytics'

interface RevenueFeesSectionProps {
  revenueData: RevenueDataPoint[]
  revenueByTypeData: Array<{ type: string; revenue: number; fees: number }>
}

export function RevenueFeesSection({ revenueData, revenueByTypeData }: RevenueFeesSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-400" />
          Revenue & Fees
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Revenue generation and fee collection trends
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fees Collected Over Time */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Fees Collected Over Time</CardTitle>
            <CardDescription className="z-10 relative">Commission and fee collection trend</CardDescription>
          </div>
          <CardContent>
            <EnhancedLineChart
              data={revenueData}
              dataKeys={[{ key: 'fees', name: 'Fees (RWF)', color: '#f59e0b' }]}
              xAxisKey="date"
              height={300}
              tooltipFormatter={(value: any) => [`${(value / 1000).toFixed(1)}K RWF`, 'Fees']}
            />
          </CardContent>
        </Card>

        {/* Revenue by Transaction Type */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Revenue by Transaction Type</CardTitle>
            <CardDescription className="z-10 relative">Total revenue breakdown by transaction type</CardDescription>
          </div>
          <CardContent>
            <EnhancedBarChart
              data={revenueByTypeData}
              dataKey="revenue"
              xAxisKey="type"
              height={300}
              gradientColors={{ start: '#10b981', end: '#059669', startOpacity: 1, endOpacity: 0.8 }}
              name="Revenue (RWF)"
              tooltipFormatter={(value: any) => [`${(value / 1000).toFixed(1)}K RWF`, 'Revenue']}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


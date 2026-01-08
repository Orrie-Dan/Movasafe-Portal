'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { Shield } from 'lucide-react'
import type { RiskDataPoint } from '@/lib/utils/analytics'

interface RiskBehaviorSectionProps {
  riskData: RiskDataPoint[]
  riskScoreDistribution: Array<{ category: string; count: number }>
}

export function RiskBehaviorSection({
  riskData,
  riskScoreDistribution,
}: RiskBehaviorSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-400" />
          Risk & Behavior Patterns
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Risk indicators and flagged transaction patterns
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Flagged Transactions Trend */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Flagged Transactions Trend</CardTitle>
            <CardDescription className="z-10 relative">Failed and rolled back transactions over time</CardDescription>
          </div>
          <CardContent>
            <EnhancedLineChart
              data={riskData}
              dataKeys={[{ key: 'flagged', name: 'Flagged Transactions', color: '#ef4444' }]}
              xAxisKey="date"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Risk Score Distribution */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Risk Score Distribution</CardTitle>
            <CardDescription className="z-10 relative">User risk level distribution based on transaction patterns</CardDescription>
          </div>
          <CardContent>
            <EnhancedBarChart
              data={riskScoreDistribution}
              dataKey="count"
              xAxisKey="category"
              height={300}
              gradientColors={{ start: '#ef4444', end: '#dc2626', startOpacity: 1, endOpacity: 0.8 }}
              name="Users"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


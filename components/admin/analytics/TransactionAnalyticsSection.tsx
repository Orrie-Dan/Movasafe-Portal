'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { CreditCard } from 'lucide-react'
import type { TransactionAnalyticsData } from '@/lib/utils/analytics'

interface TransactionAnalyticsSectionProps {
  transactionData: TransactionAnalyticsData
  avgValueData: Array<{ date: string; avgValue: number }>
}

export function TransactionAnalyticsSection({
  transactionData,
  avgValueData,
}: TransactionAnalyticsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-400" />
          Transaction Analytics
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Breakdown and analysis of transaction patterns by type and status
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Breakdown by Transaction Type */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Breakdown by Transaction Type</CardTitle>
            <CardDescription className="z-10 relative">Transaction count by type</CardDescription>
          </div>
          <CardContent>
            <EnhancedBarChart
              data={transactionData.byType}
              dataKey="count"
              xAxisKey="type"
              height={300}
              gradientColors={{ start: '#3b82f6', end: '#2563eb', startOpacity: 1, endOpacity: 0.8 }}
              name="Count"
            />
          </CardContent>
        </Card>

        {/* Success vs Failure by Type */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Success vs Failure by Type</CardTitle>
            <CardDescription className="z-10 relative">Comparison of successful and failed transactions</CardDescription>
          </div>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart
                data={transactionData.byType.map((item) => ({
                  type: item.type,
                  Successful: item.successful,
                  Failed: item.failed,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis
                  dataKey="type"
                  stroke="#94a3b8"
                  fontSize={12}
                  tick={{ fill: '#cbd5e1' }}
                  tickLine={{ stroke: '#475569' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tick={{ fill: '#cbd5e1' }}
                  tickLine={{ stroke: '#475569' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '12px',
                    boxShadow:
                      '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
                  }}
                  labelStyle={{
                    color: '#e2e8f0',
                    fontWeight: '600',
                    marginBottom: '6px',
                    fontSize: '13px',
                  }}
                  itemStyle={{ color: '#cbd5e1', fontWeight: '500' }}
                />
                <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }} />
                <Bar
                  dataKey="Successful"
                  stackId="status"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar dataKey="Failed" stackId="status" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Average Transaction Value Trend */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Average Transaction Value Trend</CardTitle>
          <CardDescription className="z-10 relative">Average value of successful transactions over time</CardDescription>
        </div>
        <CardContent>
          <EnhancedLineChart
            data={avgValueData}
            dataKeys={[{ key: 'avgValue', name: 'Average Value (RWF)', color: '#10b981' }]}
            xAxisKey="date"
            height={300}
            tooltipFormatter={(value: any) => [`${value.toFixed(2)} RWF`, 'Avg Value']}
          />
        </CardContent>
      </Card>
    </div>
  )
}


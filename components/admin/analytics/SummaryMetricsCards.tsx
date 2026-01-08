'use client'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { CreditCard, DollarSign, Users, CheckCircle2 } from 'lucide-react'
import type { SummaryMetrics } from '@/lib/utils/analytics'

interface SummaryMetricsCardsProps {
  metrics: SummaryMetrics
}

export function SummaryMetricsCards({ metrics }: SummaryMetricsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle size="xs" className="z-10 relative">Total Transactions</CardTitle>
          <CreditCard className="h-4 w-4 text-blue-400 relative z-10" />
        </div>
        <CardContent>
          <div className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">
            {metrics.totalTransactions.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">In selected period</p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
          <CardTitle size="xs" className="z-10 relative">Total Volume</CardTitle>
          <DollarSign className="h-4 w-4 text-green-400 relative z-10" />
        </div>
        <CardContent>
          <div className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">
            {(metrics.totalVolume / 1000).toFixed(1)}K
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">RWF</p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          <CardTitle size="xs" className="z-10 relative">Active Users</CardTitle>
          <Users className="h-4 w-4 text-purple-400 relative z-10" />
        </div>
        <CardContent>
          <div className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">
            {metrics.activeUsers.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Unique users</p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
          <CardTitle size="xs" className="z-10 relative">Success Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-teal-400 relative z-10" />
        </div>
        <CardContent>
          <div className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">
            {metrics.successRate.toFixed(1)}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Transaction success</p>
        </CardContent>
      </Card>
    </div>
  )
}


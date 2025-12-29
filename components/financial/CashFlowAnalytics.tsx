'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { CashFlowWaterfall } from '@/components/dashboard/charts/cash-flow-waterfall'
import { AlertCircle, Wallet, ArrowDown, ArrowUp } from 'lucide-react'
import type { CashFlowData } from '@/lib/types/financial'
import { formatCurrency, calculateDaysOfCash } from '@/lib/utils/financial'

export interface CashFlowAnalyticsProps {
  data: CashFlowData | null
  loading?: boolean
}

export function CashFlowAnalytics({ data, loading = false }: CashFlowAnalyticsProps) {
  if (loading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (!data) {
    return (
      <EmptyState
        title="No cash flow data available"
        description="Cash flow analytics will appear here once data is available."
        icon={Wallet}
      />
    )
  }

  // Prepare waterfall chart data
  const waterfallData = [
    { name: 'Starting Balance', value: data.cashBalance - data.netCashFlow, type: 'net' as const },
    ...data.cashFlowItems.map(item => ({
      name: item.category,
      value: item.amount,
      type: item.type,
    })),
    { name: 'Ending Balance', value: data.cashBalance, type: 'net' as const },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cash Flow Alerts */}
      {data.isLowCash && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-400 text-sm sm:text-base">Low Cash Warning</h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Cash balance ({formatCurrency(data.cashBalance)}) is below threshold ({formatCurrency(data.lowCashThreshold)})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Cash Flow Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(data.totalInflows)}</div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              Total Inflows
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{formatCurrency(data.totalOutflows)}</div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <ArrowDown className="h-3 w-3" />
              Total Outflows
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${data.netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(data.netCashFlow)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Net Cash Flow</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{data.daysOfCashRemaining}</div>
            <p className="text-xs text-slate-400 mt-1">Days of Cash Remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Waterfall */}
      <Card className="bg-black border-slate-800">
        <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between relative z-10 flex-1">
            <div>
              <CardTitle size="md" className="text-white text-sm sm:text-base">Cash Flow Waterfall</CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">Cash flow breakdown</CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px] sm:min-w-0">
              <CashFlowWaterfall data={waterfallData} height={250} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Outstanding Receivables/Payables */}
        <Card className="bg-black border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="text-white text-sm sm:text-base">Outstanding Receivables</CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">Amounts owed to us</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {formatCurrency(data.outstandingReceivables)}
            </div>
            <p className="text-xs sm:text-sm text-slate-400">Expected to be collected</p>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="text-white text-sm sm:text-base">Outstanding Payables</CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">Amounts we owe</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="text-2xl font-bold text-red-400 mb-2">
              {formatCurrency(data.outstandingPayables)}
            </div>
            <p className="text-xs sm:text-sm text-slate-400">Expected to be paid</p>
          </CardContent>
        </Card>
      </div>

      {/* Expected Cash Flow Timeline */}
      <Card className="bg-black border-slate-800">
        <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between relative z-10 flex-1">
            <div>
              <CardTitle size="md" className="text-white text-sm sm:text-base">Expected Cash Flow Timeline</CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">Upcoming inflows and outflows</CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-2">Expected Inflows</h4>
              <div className="space-y-2">
                {data.expectedInflows.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-green-500/20 bg-green-500/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{item.description}</p>
                        <p className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {formatCurrency(item.amount)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-400 mb-2">Expected Outflows</h4>
              <div className="space-y-2">
                {data.expectedOutflows.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-red-500/20 bg-red-500/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{item.description}</p>
                        <p className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        {formatCurrency(item.amount)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



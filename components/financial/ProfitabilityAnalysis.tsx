'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { TrendingUp, Target, DollarSign } from 'lucide-react'
import type { ProfitabilityMetrics } from '@/lib/types/financial'
import { formatCurrency } from '@/lib/utils/financial'

export interface ProfitabilityAnalysisProps {
  data: ProfitabilityMetrics | null
  loading?: boolean
}

export function ProfitabilityAnalysis({ data, loading = false }: ProfitabilityAnalysisProps) {
  if (loading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (!data) {
    return (
      <EmptyState
        title="No profitability data available"
        description="Profitability analysis will appear here once data is available."
        icon={TrendingUp}
      />
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key Profitability Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(data.grossProfit)}</div>
            <p className="text-xs text-slate-400 mt-1">Gross Profit</p>
            <p className="text-xs text-slate-500 mt-1">{data.grossProfitMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(data.netProfit)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Net Profit</p>
            <p className="text-xs text-slate-500 mt-1">{data.netProfitMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{data.breakEvenPoint.units.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-1">Break-Even Units</p>
            <p className="text-xs text-slate-500 mt-1">{formatCurrency(data.breakEvenPoint.revenue)} revenue</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-400">{formatCurrency(data.costPerTransaction)}</div>
            <p className="text-xs text-slate-400 mt-1">Cost per Transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses */}
      <Card className="bg-black border-slate-800">
        <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between relative z-10 flex-1">
            <div>
              <CardTitle size="md" className="text-white text-sm sm:text-base">Revenue vs Expenses</CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">Profitability trend over time</CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="w-full overflow-x-auto">
            <EnhancedLineChart
              data={data.revenueVsExpenses}
              dataKeys={[
                { key: 'revenue', name: 'Revenue', color: '#10b981' },
                { key: 'expenses', name: 'Expenses', color: '#ef4444' },
              ]}
              xAxisKey="date"
              height={250}
              className="min-w-[600px] sm:min-w-0"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Profit Margin by Service */}
        <Card className="bg-black border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="text-white text-sm sm:text-base">Profit Margin by Service</CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">Service profitability breakdown</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="w-full overflow-x-auto">
              <EnhancedBarChart
                data={data.profitMarginByService}
                dataKey="margin"
                xAxisKey="service"
                height={250}
                xAxisAngle={-45}
                className="min-w-[500px] sm:min-w-0"
                gradientColors={{ start: '#10b981', end: '#059669', startOpacity: 0.9, endOpacity: 1 }}
                name="Profit Margin (%)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cost per Service */}
        <Card className="bg-black border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="text-white text-sm sm:text-base">Cost per Service</CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">Average cost breakdown</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {data.costPerService.map((service, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{service.service}</span>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {formatCurrency(service.cost)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Break-Even Analysis */}
      <Card className="bg-black border-slate-800">
        <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between relative z-10 flex-1">
            <div>
              <CardTitle size="md" className="text-white text-sm sm:text-base">Break-Even Analysis</CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">Break-even point and timeline</CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <div className="text-sm text-slate-400 mb-1">Break-Even Units</div>
              <div className="text-2xl font-bold text-white">{data.breakEvenPoint.units.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <div className="text-sm text-slate-400 mb-1">Break-Even Revenue</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(data.breakEvenPoint.revenue)}</div>
            </div>
            <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <div className="text-sm text-slate-400 mb-1">Months to Break-Even</div>
              <div className="text-2xl font-bold text-white">{data.breakEvenPoint.monthsToBreakEven.toFixed(1)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


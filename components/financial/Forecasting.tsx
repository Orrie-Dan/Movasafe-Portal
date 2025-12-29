'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { TrendingUp, Calendar } from 'lucide-react'
import type { ForecastData } from '@/lib/types/financial'
import { formatCurrency } from '@/lib/utils/financial'

export interface ForecastingProps {
  data: ForecastData | null
  loading?: boolean
}

export function Forecasting({ data, loading = false }: ForecastingProps) {
  const [scenario, setScenario] = useState<'best' | 'expected' | 'worst'>('expected')

  if (loading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (!data) {
    return (
      <EmptyState
        title="No forecast data available"
        description="Financial forecasts will appear here once data is available."
        icon={TrendingUp}
      />
    )
  }

  const selectedScenario = data.scenarios.find(s => s.scenario === scenario) || data.scenarios[1]
  const forecastChartData = data.periods.map((period, idx) => ({
    period,
    revenue: selectedScenario.revenue[idx],
    expenses: selectedScenario.expenses[idx],
    cashFlow: selectedScenario.cashFlow[idx],
  }))

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Scenario Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-white">Forecast Scenarios</h3>
          <p className="text-xs sm:text-sm text-slate-400">Select scenario to view projections</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg p-1">
          {(['best', 'expected', 'worst'] as const).map((sc) => (
            <Button
              key={sc}
              variant={scenario === sc ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setScenario(sc)}
              className={
                scenario === sc
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'text-slate-400 hover:text-white'
              }
            >
              {sc.charAt(0).toUpperCase() + sc.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Forecast Chart */}
      <Card className="bg-black border-slate-800">
        <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between relative z-10 flex-1">
            <div>
              <CardTitle size="md" className="text-white text-sm sm:text-base">
                {scenario.charAt(0).toUpperCase() + scenario.slice(1)} Case Forecast
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">
                Revenue, expenses, and cash flow projections ({data.periods.length} months)
              </CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="w-full overflow-x-auto">
            <EnhancedLineChart
              data={forecastChartData}
              dataKeys={[
                { key: 'revenue', name: 'Revenue', color: '#10b981' },
                { key: 'expenses', name: 'Expenses', color: '#ef4444' },
                { key: 'cashFlow', name: 'Cash Flow', color: '#3b82f6' },
              ]}
              xAxisKey="period"
              height={250}
              className="min-w-[600px] sm:min-w-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Forecast Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(selectedScenario.revenue[selectedScenario.revenue.length - 1])}
            </div>
            <p className="text-xs text-slate-400 mt-1">Projected Revenue (Final Month)</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">
              {formatCurrency(selectedScenario.expenses[selectedScenario.expenses.length - 1])}
            </div>
            <p className="text-xs text-slate-400 mt-1">Projected Expenses (Final Month)</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{data.cashRunway} days</div>
            <p className="text-xs text-slate-400 mt-1">Cash Runway</p>
            <p className="text-xs text-slate-500 mt-1">Confidence: {data.confidence}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


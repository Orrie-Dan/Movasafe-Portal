'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { ProvinceDistributionChart } from '@/components/dashboard/charts/ProvinceDistributionChart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { Receipt, TrendingDown } from 'lucide-react'
import type { ExpenseAnalytics as ExpenseAnalyticsType } from '@/lib/types/financial'
import { formatCurrency } from '@/lib/utils/financial'

export interface ExpenseAnalyticsProps {
  data: ExpenseAnalyticsType | null
  loading?: boolean
}

export function ExpenseAnalytics({ data, loading = false }: ExpenseAnalyticsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <EmptyState
        title="No expense data available"
        description="Expense analytics will appear here once data is available."
        icon={Receipt}
      />
    )
  }

  const expenseChartData = data.expenseCategories.map(item => ({
    name: item.category,
    count: item.amount,
    color: item.type === 'fixed' ? '#3b82f6' : '#ef4444',
  }))

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Expenses Over Time */}
      <Card className="bg-black border-slate-800">
        <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between relative z-10 flex-1">
            <div>
              <CardTitle size="md" className="text-white text-sm sm:text-base">Monthly Expenses Trend</CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">Expense trends over time</CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="w-full overflow-x-auto">
            <EnhancedLineChart
              data={data.expensesOverTime}
              dataKeys={[{ key: 'expenses', name: 'Expenses', color: '#ef4444' }]}
              xAxisKey="date"
              height={250}
              className="min-w-[600px] sm:min-w-0"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Expense Categories */}
        <Card className="bg-black border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="text-white text-sm sm:text-base">Expense Categories</CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">Breakdown by category</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="w-full">
              <ProvinceDistributionChart
                data={expenseChartData}
                height={250}
                isMobile={typeof window !== 'undefined' && window.innerWidth < 640}
                colors={expenseChartData.map(item => item.color)}
                centerLabel={{ total: 'Total Expenses', selected: undefined }}
                ariaLabel="Expense categories distribution chart"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cost by Department */}
        <Card className="bg-black border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="text-white text-sm sm:text-base">Cost by Department</CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">Departmental cost breakdown</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="w-full overflow-x-auto">
              <EnhancedBarChart
                data={data.costByDepartment}
                dataKey="cost"
                xAxisKey="department"
                height={250}
                className="min-w-[400px] sm:min-w-0"
                gradientColors={{ start: '#ef4444', end: '#dc2626', startOpacity: 0.9, endOpacity: 1 }}
                name="Cost (RWF)"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Expense Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{formatCurrency(data.totalExpenses)}</div>
            <p className="text-xs text-slate-400 mt-1">Total Expenses</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{formatCurrency(data.fixedCosts)}</div>
            <p className="text-xs text-slate-400 mt-1">Fixed Costs</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{formatCurrency(data.variableCosts)}</div>
            <p className="text-xs text-slate-400 mt-1">Variable Costs</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-400">{formatCurrency(data.fuelCosts)}</div>
            <p className="text-xs text-slate-400 mt-1">Fuel Costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Waste Management Specific Costs */}
      <Card className="bg-black border-slate-800">
        <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between relative z-10 flex-1">
            <div>
              <CardTitle size="md" className="text-white">Operational Costs Breakdown</CardTitle>
              <CardDescription className="text-slate-400">Waste management specific expenses</CardDescription>
            </div>
          </div>
        </div>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <div className="text-sm text-slate-400 mb-1">Operational Costs</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(data.operationalCosts)}</div>
            </div>
            <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <div className="text-sm text-slate-400 mb-1">Staff Costs</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(data.staffCosts)}</div>
            </div>
            <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <div className="text-sm text-slate-400 mb-1">Infrastructure</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(data.infrastructureCosts)}</div>
            </div>
            <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
              <div className="text-sm text-slate-400 mb-1">Logistics</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(data.logisticsCosts)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


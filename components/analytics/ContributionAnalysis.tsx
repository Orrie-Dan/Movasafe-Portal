'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { ProvinceDistributionChart } from '@/components/dashboard/charts/ProvinceDistributionChart'
import { TrendingUp, TrendingDown, Minus, PieChart } from 'lucide-react'
import type { ContributionAnalysis as ContributionAnalysisType } from '@/lib/types/analytics'
import { formatCurrency } from '@/lib/utils/financial'

export interface ContributionAnalysisProps {
  data: ContributionAnalysisType | null
  loading?: boolean
}

export function ContributionAnalysis({ data, loading = false }: ContributionAnalysisProps) {
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
        title="No contribution analysis available"
        description="Contribution analysis will appear here once data is available."
        icon={PieChart}
      />
    )
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-400" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-400" />
    return <Minus className="h-4 w-4 text-slate-400" />
  }

  return (
    <div className="space-y-6">
      {/* Top Revenue Sources */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle size="md" className="relative z-10">Top Revenue Sources</CardTitle>
          <CardDescription className="relative z-10">Revenue contribution by source</CardDescription>
        </div>
        <CardContent>
          <div className="space-y-3">
            {data.topRevenueSources.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  {getTrendIcon(source.trend)}
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{source.source}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(source.amount)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{source.percentage.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">contribution</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Cost Drivers */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle size="md" className="relative z-10">Top Cost Drivers</CardTitle>
          <CardDescription className="relative z-10">Cost contribution by driver</CardDescription>
        </div>
        <CardContent>
          <div className="space-y-3">
            {data.topCostDrivers.map((driver, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  {getTrendIcon(driver.trend)}
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{driver.driver}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(driver.amount)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{driver.percentage.toFixed(1)}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">contribution</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Concentration */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="relative z-10">Revenue Concentration</CardTitle>
            <CardDescription className="relative z-10">How concentrated is revenue?</CardDescription>
          </div>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Top 3 Sources</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.revenueConcentration.top3Percentage.toFixed(1)}%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">of total revenue</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Top 5 Sources</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.revenueConcentration.top5Percentage.toFixed(1)}%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">of total revenue</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Concentration Index</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.revenueConcentration.herfindahlIndex.toFixed(2)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Higher = more concentrated</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Profitability */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="relative z-10">Product Profitability</CardTitle>
            <CardDescription className="relative z-10">Profit margins by product/service</CardDescription>
          </div>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {data.productProfitability.map((product, index) => (
                <div key={index} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{product.product}</div>
                    <div className={`text-sm font-semibold ${product.margin > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {product.margin.toFixed(1)}%
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Revenue</div>
                      <div className="text-slate-900 dark:text-white">{formatCurrency(product.revenue)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Cost</div>
                      <div className="text-slate-900 dark:text-white">{formatCurrency(product.cost)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Profit</div>
                      <div className={`${product.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(product.profit)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


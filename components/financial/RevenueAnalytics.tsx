'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { ProvinceDistributionChart } from '@/components/dashboard/charts/ProvinceDistributionChart'
import { TrendingUp, DollarSign, Users, CreditCard } from 'lucide-react'
import type { RevenueAnalytics as RevenueAnalyticsType } from '@/lib/types/financial'
import { formatCurrency } from '@/lib/utils/financial'

export interface RevenueAnalyticsProps {
  data: RevenueAnalyticsType | null
  loading?: boolean
}

export function RevenueAnalytics({ data, loading = false }: RevenueAnalyticsProps) {
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
        title="No revenue data available"
        description="Revenue analytics will appear here once data is available."
        icon={DollarSign}
      />
    )
  }

  // Prepare mobile money breakdown for Rwanda
  const mobileMoneyBreakdown = data.paymentMethodBreakdown
    .filter(p => p.method === 'mobile_money')
    .map(p => ({
      name: p.provider === 'mtn_momo' ? 'MTN MoMo' : p.provider === 'airtel_money' ? 'Airtel Money' : 'Other',
      count: p.revenue,
      color: p.provider === 'mtn_momo' ? '#ffc107' : '#e91e63',
    }))

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Revenue Over Time */}
      <Card className="bg-black border-slate-800">
        <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between relative z-10 flex-1">
            <div>
              <CardTitle size="md" className="text-white text-sm sm:text-base">Revenue Over Time</CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">Monthly revenue trends</CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="w-full overflow-x-auto">
            <EnhancedLineChart
              data={data.revenueOverTime}
              dataKeys={[{ key: 'revenue', name: 'Revenue', color: '#10b981' }]}
              xAxisKey="date"
              height={250}
              className="min-w-[600px] sm:min-w-0"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Revenue by Category */}
        <Card className="bg-black border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="text-white text-sm sm:text-base">Revenue by Category</CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">Breakdown by service type</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="w-full overflow-x-auto">
              <EnhancedBarChart
                data={data.revenueByCategory}
                dataKey="revenue"
                xAxisKey="category"
                height={250}
                xAxisAngle={-45}
                className="min-w-[500px] sm:min-w-0"
                gradientColors={{ start: '#10b981', end: '#059669', startOpacity: 0.9, endOpacity: 1 }}
                name="Revenue (RWF)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Breakdown - Rwanda Mobile Money Focus */}
        <Card className="bg-black border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="text-white text-sm sm:text-base">Payment Methods</CardTitle>
                <CardDescription className="text-slate-400 text-xs sm:text-sm">Rwanda mobile money breakdown</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            {mobileMoneyBreakdown.length > 0 ? (
              <div className="w-full">
                <ProvinceDistributionChart
                  data={mobileMoneyBreakdown}
                  height={250}
                  isMobile={typeof window !== 'undefined' && window.innerWidth < 640}
                  colors={mobileMoneyBreakdown.map(item => item.color)}
                  centerLabel={{ total: 'Total Mobile Money', selected: undefined }}
                  ariaLabel="Payment method distribution chart"
                />
              </div>
            ) : (
              <EmptyState
                title="No payment data"
                description="Payment method breakdown will appear here."
                icon={CreditCard}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Metrics Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-white">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-slate-400 mt-1">Total Revenue</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(data.recurringRevenue)}</div>
            <p className="text-xs text-slate-400 mt-1">Recurring Revenue</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{formatCurrency(data.oneTimeRevenue)}</div>
            <p className="text-xs text-slate-400 mt-1">One-Time Revenue</p>
          </CardContent>
        </Card>
        
        <Card className="bg-black border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-400">{formatCurrency(data.arpu)}</div>
            <p className="text-xs text-slate-400 mt-1">ARPU (Average Revenue Per User)</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Customer Segment */}
      <Card className="bg-black border-slate-800">
        <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between relative z-10 flex-1">
            <div>
              <CardTitle size="md" className="text-white text-sm sm:text-base">Revenue by Customer Segment</CardTitle>
              <CardDescription className="text-slate-400 text-xs sm:text-sm">Breakdown by customer type</CardDescription>
            </div>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {data.revenueBySegment.map((segment, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{segment.segment}</span>
                  <span className="text-lg font-bold text-green-400">{formatCurrency(segment.revenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>{segment.customerCount.toLocaleString()} customers</span>
                  <span>ARPU: {formatCurrency(segment.arpu)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


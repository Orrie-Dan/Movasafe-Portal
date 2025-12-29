'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Home, Building2, Store } from 'lucide-react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ProvinceDistributionChart } from '@/components/dashboard/charts/ProvinceDistributionChart'
import { apiGetSubscriptionBreakdown } from '@/lib/api'

interface SubscriptionBreakdownProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function SubscriptionBreakdown({
  startDate,
  endDate,
  className,
}: SubscriptionBreakdownProps) {
  const [breakdownData, setBreakdownData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBreakdown()
  }, [startDate, endDate])

  const fetchBreakdown = async () => {
    setLoading(true)
    try {
      const response = await apiGetSubscriptionBreakdown({ startDate, endDate })
      setBreakdownData(response)
    } catch (error) {
      console.error('Failed to fetch subscription breakdown:', error)
    } finally {
      setLoading(false)
    }
  }

  const byCategory = breakdownData?.byCategory || []
  const byFrequency = breakdownData?.byFrequency || []
  const byPaymentPlan = breakdownData?.byPaymentPlan || []
  const totalSubscriptions = breakdownData?.totalSubscriptions || 0

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'household':
        return Home
      case 'commercial':
      case 'business':
        return Store
      case 'institutional':
        return Building2
      default:
        return Users
    }
  }

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Subscription Breakdown
            </CardTitle>
            <CardDescription className="text-slate-400">
              Subscriptions by category, frequency, and payment plan
            </CardDescription>
          </div>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
            {totalSubscriptions.toLocaleString()} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="space-y-6">
            {/* By Category Pie Chart */}
            {byCategory.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Subscriptions by Category</h3>
                <ProvinceDistributionChart
                  data={byCategory.map((item: any) => ({ name: item.category, count: item.count }))}
                  height={300}
                  colors={COLORS}
                  centerLabel={{ total: 'Total Subscriptions', selected: undefined }}
                  ariaLabel="Subscriptions by category distribution chart"
                />
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {byCategory.map((item: any, index: number) => {
                    const Icon = getCategoryIcon(item.category)
                    return (
                      <div
                        key={index}
                        className="p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`h-4 w-4 ${COLORS[index % COLORS.length]}`} />
                          <span className="text-sm text-slate-300">{item.category}</span>
                        </div>
                        <p className="text-xl font-bold text-white">{item.count.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">
                          {((item.count / totalSubscriptions) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* By Frequency */}
            {byFrequency.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Subscriptions by Collection Frequency</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={byFrequency}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="frequency"
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      label={{ value: 'Subscriptions', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="count" name="Subscriptions" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* By Payment Plan */}
            {byPaymentPlan.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Subscriptions by Payment Plan</h3>
                <div className="space-y-2">
                  {byPaymentPlan.map((plan: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                    >
                      <div>
                        <p className="font-medium text-white capitalize">{plan.plan}</p>
                        <p className="text-xs text-slate-400">{plan.count} subscriptions</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{plan.count.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">
                          {((plan.count / totalSubscriptions) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


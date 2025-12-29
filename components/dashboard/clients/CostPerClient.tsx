'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
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
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { apiGetCostPerClient } from '@/lib/api'

interface CostPerClientProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function CostPerClient({
  startDate,
  endDate,
  className,
}: CostPerClientProps) {
  const [costData, setCostData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCostData()
  }, [startDate, endDate])

  const fetchCostData = async () => {
    setLoading(true)
    try {
      const response = await apiGetCostPerClient({ startDate, endDate })
      setCostData(response)
    } catch (error) {
      console.error('Failed to fetch cost per client:', error)
    } finally {
      setLoading(false)
    }
  }

  const avgCostPerClient = costData?.avgCostPerClient || 0
  const avgCostPerCollection = costData?.avgCostPerCollection || 0
  const totalCost = costData?.totalCost || 0
  const trend = costData?.trend || 0

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M RWF`
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K RWF`
    return `${amount.toFixed(0)} RWF`
  }

  const costTrendData = costData?.trendData || []
  const byCategory = costData?.byCategory || []

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-400" />
              Cost Analysis
            </CardTitle>
            <CardDescription className="text-slate-400">
              Cost per client and per collection analysis
            </CardDescription>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Avg Cost/Client</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(avgCostPerClient)}</p>
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              trend < 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}% vs last period
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Avg Cost/Collection</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(avgCostPerCollection)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Cost</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalCost)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="space-y-6">
            {/* Cost Trend */}
            {costTrendData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Cost Trend</h3>
                <EnhancedLineChart
                  data={costTrendData}
                  dataKeys={[
                    { key: 'costPerClient', name: 'Cost per Client', color: '#3b82f6' },
                    { key: 'costPerCollection', name: 'Cost per Collection', color: '#10b981' },
                  ]}
                  xAxisKey="period"
                  height={300}
                />
              </div>
            )}

            {/* Cost by Category */}
            {byCategory.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Cost by Client Category</h3>
                <EnhancedBarChart
                  data={byCategory}
                  dataKey="avgCost"
                  xAxisKey="category"
                  height={250}
                  gradientColors={{ start: '#3b82f6', end: '#2563eb', startOpacity: 0.9, endOpacity: 1 }}
                  name="Avg Cost per Client (RWF)"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, TrendingUp, Calendar } from 'lucide-react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { apiGetWasteTrends } from '@/lib/api'

interface WasteTrendAnalysisProps {
  startDate?: string
  endDate?: string
  className?: string
}

type TrendPeriod = 'daily' | 'weekly' | 'monthly' | 'seasonal'

export function WasteTrendAnalysis({
  startDate,
  endDate,
  className,
}: WasteTrendAnalysisProps) {
  const [trendData, setTrendData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<TrendPeriod>('monthly')

  useEffect(() => {
    fetchTrends()
  }, [startDate, endDate, period])

  const fetchTrends = async () => {
    setLoading(true)
    try {
      const response = await apiGetWasteTrends({
        period,
        startDate,
        endDate,
      })
      setTrendData(response)
    } catch (error) {
      console.error('Failed to fetch waste trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = trendData?.data || []
  const totalWaste = chartData.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
  const avgDaily = period === 'daily' && chartData.length > 0
    ? totalWaste / chartData.length
    : null

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-blue-400" />
              Waste Trend Analysis
            </CardTitle>
            <CardDescription className="text-slate-400">
              Waste collection trends over time
            </CardDescription>
          </div>
          <Select value={period} onChange={(e) => setPeriod(e.target.value as TrendPeriod)}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="seasonal">Seasonal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Total Waste</p>
            <p className="text-2xl font-bold text-white">
              {(totalWaste / 1000).toFixed(1)} tons
            </p>
          </div>
          {avgDaily && (
            <div>
              <p className="text-xs text-slate-400">Avg Daily</p>
              <p className="text-2xl font-bold text-white">
                {(avgDaily / 1000).toFixed(1)} tons
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400">Period</p>
            <p className="text-2xl font-bold text-white capitalize">{period}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-slate-400">No trend data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="period"
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number) => [`${(value / 1000).toFixed(2)} tons`, 'Total Waste']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Total Waste"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              {trendData?.byType && Object.keys(trendData.byType).map((type, index) => {
                const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
                return (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={`byType.${type}`}
                    name={type}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                )
              })}
            </RechartsLineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}


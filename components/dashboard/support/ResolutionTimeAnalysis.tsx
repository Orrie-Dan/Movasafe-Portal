'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, TrendingDown, TrendingUp } from 'lucide-react'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { apiGetResolutionTimeTrends } from '@/lib/api'

interface ResolutionTimeAnalysisProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function ResolutionTimeAnalysis({
  startDate,
  endDate,
  className,
}: ResolutionTimeAnalysisProps) {
  const [trendData, setTrendData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrends()
  }, [startDate, endDate])

  const fetchTrends = async () => {
    setLoading(true)
    try {
      const response = await apiGetResolutionTimeTrends({ startDate, endDate })
      setTrendData(response)
    } catch (error) {
      console.error('Failed to fetch resolution time trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const avgResolutionTime = trendData?.avgResolutionTime || 0
  const trend = trendData?.trend || 0
  const timeData = trendData?.timeData || []
  const byCategory = trendData?.byCategory || []

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="relative z-10 flex-1">
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5 text-blue-400" />
            Resolution Time Analysis
          </CardTitle>
          <CardDescription className="text-slate-400">
            Average resolution time trends and analysis
          </CardDescription>
          <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">Avg Resolution Time</p>
            <p className="text-2xl font-bold text-white">{avgResolutionTime.toFixed(1)} hours</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Trend</p>
            <p className={`text-2xl font-bold flex items-center gap-1 ${
              trend < 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {Math.abs(trend).toFixed(1)}%
            </p>
          </div>
        </div>
        </div>
        <div className="relative z-10">
          <Badge className={
            trend < 0 ? 'bg-green-500/20 text-green-400 border-green-500/50' :
            'bg-red-500/20 text-red-400 border-red-500/50'
          }>
            {trend < 0 ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : (
              <TrendingUp className="h-3 w-3 mr-1" />
            )}
            {Math.abs(trend).toFixed(1)}% vs last period
          </Badge>
        </div>
      </div>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="space-y-6">
            {/* Resolution Time Trend */}
            {timeData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Resolution Time Trend</h3>
                <EnhancedLineChart
                  data={timeData}
                  dataKeys={[
                    { key: 'avgTime', name: 'Avg Resolution Time', color: '#3b82f6' },
                  ]}
                  xAxisKey="period"
                  height={300}
                  yAxisLabel={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                  tooltipFormatter={(value: number) => [`${value.toFixed(1)} hours`, 'Resolution Time']}
                />
              </div>
            )}

            {/* Resolution Time by Category */}
            {byCategory.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Resolution Time by Category</h3>
                <EnhancedBarChart
                  data={byCategory}
                  dataKey="avgTime"
                  xAxisKey="category"
                  height={250}
                  gradientColors={{ start: '#3b82f6', end: '#2563eb', startOpacity: 1, endOpacity: 0.8 }}
                  xAxisAngle={-45}
                  xAxisHeight={80}
                  yAxisLabel={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                  tooltipFormatter={(value: number) => [`${value.toFixed(1)} hours`, 'Resolution Time']}
                  name="Avg Resolution Time"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


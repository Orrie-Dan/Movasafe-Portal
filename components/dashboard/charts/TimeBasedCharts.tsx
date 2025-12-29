'use client'

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { BarChart3, FileText } from 'lucide-react'
import { EnhancedBarChart } from './enhanced-bar-chart'

export interface TimeBasedChartsProps {
  monthlyData: Array<{ month: string; collections: number }>
  weeklyData: Array<{ week: string; label: string; collections: number }>
  dailyData: Array<{ day: string; collections: number }>
  hourlyData: Array<{ hour: number; label: string; collections: number }>
  loading?: boolean
  className?: string
}

export function TimeBasedCharts({
  monthlyData,
  weeklyData,
  dailyData,
  hourlyData,
  loading = false,
  className,
}: TimeBasedChartsProps) {
  if (loading) {
    return null
  }

  if (monthlyData.length === 0 && weeklyData.length === 0 && dailyData.length === 0 && hourlyData.length === 0) {
    return (
      <EmptyState
        title="No Collections Available"
        description="There are no collections to display. Collections will appear here once they are scheduled or completed."
        icon={FileText}
      />
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-5 w-5 text-slate-400" />
        <h2 className="text-xl font-semibold text-white">Time-Based Analytics</h2>
      </div>
      
      {/* Monthly and Weekly Charts - Top Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Collections Chart */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-900/50 bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="text-white relative z-10">Monthly Collections</CardTitle>
            <CardDescription className="text-slate-400 relative z-10">Collections scheduled/completed over the last 12 months</CardDescription>
          </div>
          <CardContent>
            <EnhancedBarChart
              data={monthlyData}
              dataKey="collections"
              xAxisKey="month"
              height={300}
              gradientColors={{ start: '#3b82f6', end: '#2563eb', startOpacity: 1, endOpacity: 0.8 }}
              name="Collections"
            />
          </CardContent>
        </Card>

        {/* Weekly Collections Chart */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-900/50 bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="text-white relative z-10">Weekly Collections</CardTitle>
            <CardDescription className="text-slate-400 relative z-10">Collections scheduled/completed over the last 8 weeks</CardDescription>
          </div>
          <CardContent>
            <EnhancedBarChart
              data={weeklyData}
              dataKey="collections"
              xAxisKey="label"
              height={300}
              gradientColors={{ start: '#f59e0b', end: '#d97706', startOpacity: 1, endOpacity: 0.8 }}
              xAxisAngle={-45}
              xAxisHeight={80}
              name="Collections"
            />
          </CardContent>
        </Card>
      </div>

      {/* Daily and Hourly Collections Charts - Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Collections Chart */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-900/50 bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="text-white relative z-10">Daily Collections</CardTitle>
            <CardDescription className="text-slate-400 relative z-10">Collections scheduled/completed over the last 30 days</CardDescription>
          </div>
          <CardContent>
            <EnhancedBarChart
              data={dailyData}
              dataKey="collections"
              xAxisKey="day"
              height={300}
              gradientColors={{ start: '#10b981', end: '#059669', startOpacity: 1, endOpacity: 0.8 }}
              xAxisAngle={-45}
              xAxisHeight={80}
              xAxisInterval={4}
              name="Collections"
            />
          </CardContent>
        </Card>

        {/* Collections by Hour of Day */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-900/50 bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="text-white relative z-10">Collections by Hour of Day</CardTitle>
            <CardDescription className="text-slate-400 relative z-10">Distribution of collections throughout the day</CardDescription>
          </div>
          <CardContent>
            <EnhancedBarChart
              data={hourlyData}
              dataKey="collections"
              xAxisKey="label"
              height={300}
              gradientColors={{ start: '#8b5cf6', end: '#7c3aed', startOpacity: 1, endOpacity: 0.8 }}
              xAxisAngle={-45}
              xAxisHeight={80}
              xAxisInterval={2}
              name="Collections"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


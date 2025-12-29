'use client'

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'

export interface TrendDataPoint {
  date: string
  [key: string]: string | number
}

export interface PerformanceTrendsProps {
  data: TrendDataPoint[]
  dataKeys: { key: string; name: string; color: string }[]
  title?: string
  description?: string
  height?: number
  className?: string
}

export function PerformanceTrends({
  data,
  dataKeys,
  title = 'Performance Trends',
  description = 'Collection trends over time',
  height = 300,
  className,
}: PerformanceTrendsProps) {
  if (!data || data.length === 0) {
    return null
  }

  return (
    <Card className={`bg-black border-slate-800 ${className}`}>
      <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-900/50 bg-black">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <CardTitle size="md" className="text-white relative z-10">{title}</CardTitle>
        <CardDescription className="text-slate-400 relative z-10">{description}</CardDescription>
      </div>
      <CardContent>
        <EnhancedLineChart
          data={data}
          dataKeys={dataKeys.map(({ key, name, color }) => ({
            key,
            name,
            color,
            dot: { fill: color, r: 3 },
          }))}
          xAxisKey="date"
          height={height}
        />
      </CardContent>
    </Card>
  )
}


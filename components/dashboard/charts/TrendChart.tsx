'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart } from './line-chart'
import { LineChartData } from './line-chart'

export interface TrendChartProps {
  data: LineChartData[]
  dataKeys: Array<{ key: string; name: string; color?: string }>
  period?: string
  comparisonMode?: boolean
  height?: number
  title?: string
  description?: string
  className?: string
}

export function TrendChart({
  data,
  dataKeys,
  period,
  comparisonMode = false,
  height = 300,
  title,
  description,
  className,
}: TrendChartProps) {
  if (!data || data.length === 0) {
    return null
  }

  const chartContent = (
    <LineChart
      data={data}
      dataKeys={dataKeys}
      height={height}
      showLegend={true}
      showGrid={true}
    />
  )

  if (title) {
    return (
      <Card className={`bg-black border-slate-800 ${className}`}>
        <CardHeader>
          {title && <CardTitle size="md">{title}</CardTitle>}
          {description && <CardDescription className="text-slate-400">{description}</CardDescription>}
        </CardHeader>
        <CardContent>{chartContent}</CardContent>
      </Card>
    )
  }

  return <div className={className}>{chartContent}</div>
}


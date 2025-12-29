'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { CHART_COLORS } from '@/components/constants/chart-colors'

export interface PerformanceChartProps {
  data: any[]
  xAxisKey: string
  dataKeys: Array<{ key: string; name: string; color?: string }>
  height?: number
  grouped?: boolean
  title?: string
  description?: string
  className?: string
}

export function PerformanceChart({
  data,
  xAxisKey,
  dataKeys,
  height = 300,
  grouped = false,
  title,
  description,
  className,
}: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return null
  }

  const chartContent = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
        <XAxis
          dataKey={xAxisKey}
          stroke="#94a3b8"
          fontSize={12}
          tick={{ fill: '#cbd5e1' }}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={12}
          tick={{ fill: '#cbd5e1' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
        />
        <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }} />
        {dataKeys.map((dataKey, index) => (
          <Bar
            key={dataKey.key}
            dataKey={dataKey.key}
            name={dataKey.name}
            fill={dataKey.color || CHART_COLORS[index % CHART_COLORS.length]}
            radius={index === dataKeys.length - 1 ? [8, 8, 0, 0] : 0}
            stackId={grouped ? undefined : 'stack'}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
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


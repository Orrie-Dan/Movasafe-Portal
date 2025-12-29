'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart } from './pie-chart'
import { BarChart } from './bar-chart'
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { CHART_COLORS } from '@/components/constants/chart-colors'

export interface CompositionData {
  name: string
  value: number
  [key: string]: string | number
}

export interface CompositionChartProps {
  data: CompositionData[]
  type?: 'pie' | 'bar' | 'stacked'
  height?: number
  title?: string
  description?: string
  className?: string
  dataKey?: string
  stackId?: string
}

export function CompositionChart({
  data,
  type = 'pie',
  height = 300,
  title,
  description,
  className,
  dataKey = 'value',
  stackId,
}: CompositionChartProps) {
  if (!data || data.length === 0) {
    return null
  }

  const pieData = data.map(item => ({ name: item.name, value: item[dataKey] as number }))

  let chartContent: React.ReactNode

  if (type === 'pie') {
    chartContent = <PieChart data={pieData} height={height} showLabels={true} />
  } else if (type === 'stacked') {
    // For stacked bar chart, we need to transform the data
    const categories = Array.from(new Set(data.flatMap(item => Object.keys(item).filter(k => k !== 'name'))))
    chartContent = (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tick={{ fill: '#cbd5e1' }} />
          <YAxis stroke="#94a3b8" fontSize={12} tick={{ fill: '#cbd5e1' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
          />
          <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }} />
          {categories.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId={stackId || 'stack'}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              radius={index === categories.length - 1 ? [8, 8, 0, 0] : 0}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    )
  } else {
    chartContent = <BarChart data={data} dataKey={dataKey} height={height} />
  }

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


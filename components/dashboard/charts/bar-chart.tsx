import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartContainer } from './chart-container'
import { CHART_COLORS } from '@/components/constants/chart-colors'

export interface BarChartProps {
  data: any[]
  dataKey: string
  xAxisKey?: string
  height?: number
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
  barRadius?: number | [number, number, number, number]
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function BarChart({
  data,
  dataKey,
  xAxisKey = 'name',
  height = 300,
  colors = CHART_COLORS,
  showLegend = false,
  showGrid = true,
  barRadius = [8, 8, 0, 0],
  orientation = 'vertical',
  className = '',
}: BarChartProps) {
  const chartContent = (
    <RechartsBarChart
      data={data}
      layout={orientation === 'horizontal' ? 'vertical' : undefined}
      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
    >
      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
      <XAxis
        dataKey={orientation === 'vertical' ? xAxisKey : undefined}
        type={orientation === 'vertical' ? 'category' : 'number'}
        stroke="#9ca3af"
      />
      <YAxis
        dataKey={orientation === 'horizontal' ? xAxisKey : undefined}
        type={orientation === 'horizontal' ? 'category' : 'number'}
        stroke="#9ca3af"
      />
      <Tooltip
        contentStyle={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
        }}
        labelStyle={{ color: '#e2e8f0' }}
      />
      {showLegend && (
        <Legend
          wrapperStyle={{ color: '#cbd5e1' }}
          iconType="circle"
        />
      )}
      <Bar
        dataKey={dataKey}
        fill={colors[0]}
        radius={barRadius}
      />
    </RechartsBarChart>
  )

  return (
    <ChartContainer height={height} className={className}>
      {chartContent}
    </ChartContainer>
  )
}


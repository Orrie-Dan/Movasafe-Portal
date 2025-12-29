import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { ChartContainer } from './chart-container'
import { CHART_COLORS } from '@/components/constants/chart-colors'

export interface AreaChartData {
  name: string
  [key: string]: string | number
}

export interface AreaChartProps {
  data: AreaChartData[]
  dataKey: string
  xAxisKey?: string
  height?: number
  color?: string
  showGrid?: boolean
  gradientId?: string
  className?: string
}

export function AreaChart({
  data,
  dataKey,
  xAxisKey = 'name',
  height = 300,
  color = CHART_COLORS[1],
  showGrid = true,
  gradientId = 'colorArea',
  className = '',
}: AreaChartProps) {
  const chartContent = (
    <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.8} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
      <XAxis dataKey={xAxisKey} stroke="#9ca3af" />
      <YAxis stroke="#9ca3af" />
      <Tooltip
        contentStyle={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
        }}
      />
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        fillOpacity={1}
        fill={`url(#${gradientId})`}
      />
    </RechartsAreaChart>
  )

  return (
    <ChartContainer height={height} className={className}>
      {chartContent}
    </ChartContainer>
  )
}


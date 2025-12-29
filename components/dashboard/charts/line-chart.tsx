import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartContainer } from './chart-container'
import { CHART_COLORS } from '@/components/constants/chart-colors'

export interface LineChartData {
  name: string
  [key: string]: string | number
}

export interface LineChartProps {
  data: LineChartData[]
  dataKeys: Array<{ key: string; name: string; color?: string; strokeDasharray?: string }>
  xAxisKey?: string
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  className?: string
}

export function LineChart({
  data,
  dataKeys,
  xAxisKey = 'name',
  height = 300,
  showLegend = true,
  showGrid = true,
  className = '',
}: LineChartProps) {
  const chartContent = (
    <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
      <XAxis dataKey={xAxisKey} stroke="#9ca3af" />
      <YAxis stroke="#9ca3af" />
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
          iconType="line"
        />
      )}
      {dataKeys.map((dataKey, index) => (
        <Line
          key={dataKey.key}
          type="monotone"
          dataKey={dataKey.key}
          name={dataKey.name}
          stroke={dataKey.color || CHART_COLORS[index % CHART_COLORS.length]}
          strokeWidth={2}
          strokeDasharray={dataKey.strokeDasharray}
        />
      ))}
    </RechartsLineChart>
  )

  return (
    <ChartContainer height={height} className={className}>
      {chartContent}
    </ChartContainer>
  )
}


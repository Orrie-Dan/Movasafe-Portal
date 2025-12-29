import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { ChartContainer } from './chart-container'
import { CHART_COLORS } from '@/components/constants/chart-colors'

export interface PieChartProps {
  data: Array<{ name: string; value: number }>
  height?: number
  colors?: string[]
  showLegend?: boolean
  showLabels?: boolean
  outerRadius?: number
  className?: string
}

export function PieChart({
  data,
  height = 300,
  colors = CHART_COLORS,
  showLegend = true,
  showLabels = true,
  outerRadius = 100,
  className = '',
}: PieChartProps) {
  const chartContent = (
    <RechartsPieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={showLabels}
        label={
          showLabels
            ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`
            : false
        }
        outerRadius={outerRadius}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
        }}
      />
      {showLegend && (
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          wrapperStyle={{ color: '#cbd5e1', fontSize: '11px' }}
        />
      )}
    </RechartsPieChart>
  )

  return (
    <ChartContainer height={height} className={className}>
      {chartContent}
    </ChartContainer>
  )
}


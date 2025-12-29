'use client'

import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { CHART_COLORS } from '@/components/constants/chart-colors'

export interface LineDataKey {
  key: string
  name: string
  color?: string
  strokeWidth?: number
  dot?: { fill?: string; r?: number; strokeWidth?: number; stroke?: string }
  activeDot?: { r?: number; stroke?: string; strokeWidth?: number }
}

export interface EnhancedLineChartProps {
  data: any[]
  dataKeys: LineDataKey[]
  xAxisKey?: string
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  tooltipFormatter?: (value: any, name: string) => [string, string]
  yAxisLabel?: { value: string; angle: number; position: 'insideLeft' | 'insideRight'; style?: any }
  className?: string
}

export function EnhancedLineChart({
  data,
  dataKeys,
  xAxisKey = 'name',
  height = 300,
  showLegend = true,
  showGrid = true,
  tooltipFormatter,
  yAxisLabel,
  className = '',
}: EnhancedLineChartProps) {
  // Handle empty data
  if (!data || data.length === 0 || !dataKeys || dataKeys.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <p className="text-slate-400 text-sm">No data available</p>
      </div>
    )
  }

  return (
    <div className={className} style={{ width: '100%', minHeight: `${height}px` }}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke="#94a3b8"
            fontSize={12}
            tick={{ fill: '#cbd5e1' }}
            tickLine={{ stroke: '#475569' }}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tick={{ fill: '#cbd5e1' }}
            tickLine={{ stroke: '#475569' }}
            label={yAxisLabel}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '10px',
              padding: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}
            itemStyle={{ color: '#cbd5e1', fontWeight: '500' }}
            formatter={tooltipFormatter}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
              iconType="line"
            />
          )}
          {dataKeys.map((dataKey, index) => {
            const color = dataKey.color || CHART_COLORS[index % CHART_COLORS.length]
            return (
              <Line
                key={dataKey.key}
                type="monotone"
                dataKey={dataKey.key}
                name={dataKey.name}
                stroke={color}
                strokeWidth={dataKey.strokeWidth || 2}
                dot={dataKey.dot || { fill: color, r: 4, strokeWidth: 2, stroke: '#1e293b' }}
                activeDot={dataKey.activeDot || { r: 6, stroke: color, strokeWidth: 2 }}
              />
            )
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}


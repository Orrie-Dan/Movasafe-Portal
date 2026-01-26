'use client'

import { useMemo } from 'react'
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { CHART_COLORS } from '@/components/constants/chart-colors'

export interface EnhancedBarChartProps {
  data: any[]
  dataKey: string
  xAxisKey?: string
  height?: number
  colors?: readonly string[]
  gradientColors?: { start: string; end: string; startOpacity?: number; endOpacity?: number }
  xAxisAngle?: number
  xAxisInterval?: number | 'preserveStartEnd' | 'preserveStart' | 'preserveEnd'
  xAxisHeight?: number
  showLegend?: boolean
  showGrid?: boolean
  barRadius?: number | [number, number, number, number]
  animationDuration?: number
  tooltipFormatter?: (value: any, name: string) => [string, string]
  yAxisLabel?: { value: string; angle: number; position: 'insideLeft' | 'insideRight'; style?: any }
  orientation?: 'horizontal' | 'vertical'
  onBarClick?: (data: any) => void
  className?: string
  name?: string
}

export function EnhancedBarChart({
  data,
  dataKey,
  xAxisKey = 'name',
  height = 300,
  colors = CHART_COLORS,
  gradientColors,
  xAxisAngle,
  xAxisInterval,
  xAxisHeight,
  showLegend = false,
  showGrid = true,
  barRadius = [8, 8, 0, 0],
  animationDuration = 600,
  tooltipFormatter,
  yAxisLabel,
  orientation = 'vertical',
  onBarClick,
  className = '',
  name,
}: EnhancedBarChartProps) {
  // Generate unique gradient ID
  const gradientId = useMemo(() => {
    return `barGradient-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Determine colors to use
  const primaryColor = gradientColors ? gradientColors.start : colors[0]
  const secondaryColor = gradientColors ? gradientColors.end : colors[0]
  const startOpacity = gradientColors?.startOpacity ?? 1
  const endOpacity = gradientColors?.endOpacity ?? 0.8

  // Determine tooltip item color (use primary color with slight variation)
  const tooltipItemColor = primaryColor

  // Adjust gradient direction for horizontal bars
  const gradientDirection = orientation === 'horizontal' 
    ? { x1: '0', y1: '0', x2: '1', y2: '0' }
    : { x1: '0', y1: '0', x2: '0', y2: '1' }

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <p className="text-slate-400 text-sm">No data available</p>
      </div>
    )
  }

  return (
    <div className={className} style={{ width: '100%', minHeight: `${height}px` }}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart 
          data={data} 
          layout={orientation === 'horizontal' ? 'vertical' : undefined}
          margin={orientation === 'horizontal' ? { top: 5, right: 20, left: 0, bottom: 5 } : undefined}
        >
          <defs>
            <linearGradient id={gradientId} {...gradientDirection}>
              <stop offset="0%" stopColor={primaryColor} stopOpacity={startOpacity} />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity={endOpacity} />
            </linearGradient>
          </defs>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={orientation === 'horizontal' ? 0.3 : 0.4} />
          )}
          <XAxis
            dataKey={orientation === 'vertical' ? xAxisKey : undefined}
            type={orientation === 'horizontal' ? 'number' : undefined}
            stroke="#94a3b8"
            fontSize={12}
            tick={{ fill: orientation === 'horizontal' ? '#9ca3af' : '#cbd5e1' }}
            tickLine={{ stroke: orientation === 'horizontal' ? '#4b5563' : '#475569' }}
            angle={orientation === 'vertical' ? xAxisAngle : undefined}
            textAnchor={orientation === 'vertical' && xAxisAngle ? 'end' : undefined}
            height={orientation === 'vertical' ? xAxisHeight : undefined}
            interval={orientation === 'vertical' ? xAxisInterval : undefined}
          />
          <YAxis
            dataKey={orientation === 'horizontal' ? xAxisKey : undefined}
            type={orientation === 'horizontal' ? 'category' : undefined}
            stroke="#94a3b8"
            fontSize={12}
            tick={{ fill: orientation === 'horizontal' ? '#e5e7eb' : '#cbd5e1' }}
            tickLine={{ stroke: orientation === 'horizontal' ? '#4b5563' : '#475569' }}
            label={orientation === 'vertical' ? yAxisLabel : undefined}
            width={orientation === 'horizontal' ? 100 : undefined}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: orientation === 'horizontal' ? '#0f172a' : '#0f172a',
              border: orientation === 'horizontal' ? '1px solid #334155' : '1px solid #1e293b',
              borderRadius: orientation === 'horizontal' ? '8px' : '10px',
              padding: '12px',
              boxShadow: orientation === 'horizontal' 
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
                : '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
            }}
            labelStyle={{ 
              color: orientation === 'horizontal' ? '#e5e7eb' : '#e2e8f0', 
              fontWeight: orientation === 'horizontal' ? 'bold' : '600', 
              marginBottom: orientation === 'horizontal' ? '4px' : '6px', 
              fontSize: orientation === 'horizontal' ? '12px' : '13px' 
            }}
            itemStyle={{ 
              color: orientation === 'horizontal' ? '#10b981' : tooltipItemColor, 
              fontWeight: orientation === 'horizontal' ? '600' : '500' 
            }}
            cursor={{ fill: `${primaryColor}1a` }}
            formatter={tooltipFormatter}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
            />
          )}
          <Bar
            dataKey={dataKey}
            fill={gradientColors ? `url(#${gradientId})` : primaryColor}
            radius={barRadius}
            animationDuration={animationDuration}
            animationEasing={orientation === 'horizontal' ? 'ease-out' : undefined}
            name={name}
            onClick={onBarClick}
            style={onBarClick ? { cursor: 'pointer' } : undefined}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}


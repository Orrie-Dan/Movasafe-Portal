'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils/financial'

export interface CashFlowWaterfallProps {
  data: Array<{
    name: string
    value: number
    type: 'inflow' | 'outflow' | 'net'
  }>
  height?: number
}

export function CashFlowWaterfall({ data, height = 300 }: CashFlowWaterfallProps) {
  // Calculate cumulative positions for waterfall
  let cumulative = 0
  const waterfallData = data.map((item) => {
    let start = cumulative
    let end = cumulative
    
    if (item.type === 'net') {
      // Net items: full bar from 0
      start = 0
      end = item.value
      cumulative = item.value
    } else if (item.type === 'inflow') {
      // Inflows: add to cumulative
      end = cumulative + item.value
      cumulative = end
    } else {
      // Outflows: subtract from cumulative
      end = cumulative - item.value
      cumulative = end
    }
    
    return {
      name: item.name,
      start,
      end,
      value: item.value,
      type: item.type,
    }
  })

  const getColor = (type: string) => {
    if (type === 'inflow') return '#10b981' // Green
    if (type === 'outflow') return '#ef4444' // Red
    return '#3b82f6' // Blue for net
  }

  // Calculate domain
  const allValues = waterfallData.flatMap(item => [item.start, item.end])
  const minValue = Math.min(...allValues, 0)
  const maxValue = Math.max(...allValues)
  const padding = (maxValue - minValue) * 0.1

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart 
        data={waterfallData} 
        margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
        barCategoryGap="20%"
      >
        <XAxis
          dataKey="name"
          stroke="#94a3b8"
          fontSize={11}
          tick={{ fill: '#cbd5e1' }}
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={12}
          tick={{ fill: '#cbd5e1' }}
          label={{ value: 'Amount (RWF)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
          domain={[minValue - padding, maxValue + padding]}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload[0]) {
              const data = payload[0].payload as any
              return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
                  <p className="font-semibold text-white mb-2">{data.name}</p>
                  {data.type !== 'net' && (
                    <>
                      <p className="text-sm text-slate-300 mb-1">
                        Start: <span className="text-white font-medium">{formatCurrency(data.start)}</span>
                      </p>
                      <p className="text-sm text-slate-300 mb-1">
                        Change: <span className={`font-medium ${data.type === 'inflow' ? 'text-green-400' : 'text-red-400'}`}>
                          {data.type === 'inflow' ? '+' : '-'}{formatCurrency(data.value)}
                        </span>
                      </p>
                    </>
                  )}
                  <p className="text-sm font-semibold text-white mt-2 pt-2 border-t border-slate-700">
                    End: {formatCurrency(data.end)}
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Bar 
          dataKey="start"
          stackId="base"
          fill="transparent"
          isAnimationActive={false}
        />
        <Bar 
          dataKey={(entry: any) => entry.end - entry.start}
          stackId="base"
          radius={[4, 4, 0, 0]}
        >
          {waterfallData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.type)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

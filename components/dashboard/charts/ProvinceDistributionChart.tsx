'use client'

import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { EmptyState } from '@/components/ui/empty-state'
import { LucideIcon } from 'lucide-react'

export interface ProvinceDistributionChartProps {
  data: Array<{ name: string; count: number }>
  selectedItem?: string | null
  onItemClick?: (name: string) => void
  height?: number
  isMobile?: boolean
  colors?: string[]
  centerLabel?: { total: string; selected?: string }
  emptyState?: { title: string; description: string; icon?: LucideIcon }
  showLegend?: boolean
  showTooltip?: boolean
  ariaLabel?: string
}

export function ProvinceDistributionChart({
  data,
  selectedItem,
  onItemClick,
  height = 300,
  isMobile = false,
  colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'],
  centerLabel = { total: 'Total', selected: undefined },
  emptyState,
  showLegend = true,
  showTooltip = true,
  ariaLabel = 'Distribution chart',
}: ProvinceDistributionChartProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    if (emptyState) {
      return (
        <div style={{ height: `${height}px` }} className="flex items-center justify-center">
          <EmptyState
            title={emptyState.title}
            description={emptyState.description}
            icon={emptyState.icon}
          />
        </div>
      )
    }
    return (
      <div style={{ height: `${height}px` }} className="flex items-center justify-center">
        <p className="text-slate-400">No data available</p>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.count, 0)
  const selectedItemData = selectedItem ? data.find(item => item.name === selectedItem) : null

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart role="img" aria-label={ariaLabel}>
        <defs>
          {data.map((entry, index) => {
            const color = colors[index % colors.length]
            return (
              <linearGradient 
                key={`gradient-${index}`} 
                id={`gradient-${index}`} 
                x1="0" 
                y1="0" 
                x2="1" 
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.7} />
              </linearGradient>
            )
          })}
        </defs>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={isMobile ? 70 : 90}
          innerRadius={isMobile ? 30 : 40}
          label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
            const RADIAN = Math.PI / 180
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5
            const x = cx + radius * Math.cos(-midAngle * RADIAN)
            const y = cy + radius * Math.sin(-midAngle * RADIAN)
            
            if (percent < 0.03) return null
            
            const fontSize = percent < 0.05 ? (isMobile ? 9 : 10) : (isMobile ? 11 : 12)
            
            return (
              <text 
                x={x} 
                y={y} 
                fill="#e2e8f0" 
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fontSize}
                fontWeight="600"
                style={{ pointerEvents: 'none' }}
              >
                {`${(percent * 100).toFixed(0)}%`}
              </text>
            )
          }}
          labelLine={false}
          paddingAngle={3}
          onClick={(data: any) => {
            if (data && data.name && onItemClick) {
              onItemClick(data.name)
            }
          }}
          style={{ cursor: onItemClick ? 'pointer' : 'default' }}
          animationBegin={0}
          animationDuration={600}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => {
            const isSelected = selectedItem === entry.name
            return (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#gradient-${index})`}
                stroke="#1e293b"
                strokeWidth={2}
                style={{ 
                  opacity: selectedItem && !isSelected ? 0.3 : 1,
                  stroke: isSelected ? '#fff' : '#1e293b',
                  strokeWidth: isSelected ? 3 : 2,
                  filter: isSelected ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))' : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                  transition: 'all 0.2s ease',
                }}
              />
            )
          })}
        </Pie>
        {selectedItem && selectedItemData ? (
          <>
            <text 
              x="50%" 
              y="45%" 
              textAnchor="middle" 
              fill="#e2e8f0" 
              fontSize={isMobile ? 18 : 20} 
              fontWeight="bold"
            >
              {selectedItemData.count}
            </text>
            <text 
              x="50%" 
              y="55%" 
              textAnchor="middle" 
              fill="#94a3b8" 
              fontSize={isMobile ? 10 : 11}
            >
              {centerLabel.selected || selectedItem}
            </text>
          </>
        ) : (
          <>
            <text 
              x="50%" 
              y="45%" 
              textAnchor="middle" 
              fill="#e2e8f0" 
              fontSize={isMobile ? 20 : 22} 
              fontWeight="bold"
            >
              {total}
            </text>
            <text 
              x="50%" 
              y="55%" 
              textAnchor="middle" 
              fill="#94a3b8" 
              fontSize={isMobile ? 10 : 11}
            >
              {centerLabel.total}
            </text>
          </>
        )}
        {showTooltip && (
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: '1px solid #1e293b', 
              borderRadius: '10px',
              padding: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}
            itemStyle={{ color: '#cbd5e1', fontWeight: '500' }}
            formatter={(value: any, name: any) => {
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0
              return [`${value} (${percent}%)`, name]
            }}
          />
        )}
        {showLegend && (
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            wrapperStyle={{ color: '#cbd5e1', fontSize: isMobile ? '10px' : '11px' }}
            formatter={(value) => {
              const item = data.find(d => d.name === value)
              const index = data.findIndex(d => d.name === value)
              const color = index >= 0 ? colors[index % colors.length] : '#cbd5e1'
              return (
                <span style={{ color }}>
                  {value}: {item?.count || 0}
                </span>
              )
            }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}


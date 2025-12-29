'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MetricTooltip } from './tooltip'

export interface KpiCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
  tooltip?: string
  subtitle?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function KpiCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  iconColor = 'text-blue-400',
  tooltip,
  subtitle,
  className,
  size = 'md',
}: KpiCardProps) {
  const valueSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-2xl' : 'text-xl'
  const titleSize = size === 'lg' ? 'text-sm' : 'text-xs'
  
  const trendColor = trend === 'up' 
    ? 'text-green-400' 
    : trend === 'down' 
    ? 'text-red-400' 
    : 'text-slate-400'
  
  const TrendIcon = trend === 'up' 
    ? TrendingUp 
    : trend === 'down' 
    ? TrendingDown 
    : Minus

  const card = (
    <Card className={cn('bg-black border-slate-800 hover:border-slate-700 transition-all h-full flex flex-col', className)}>
      <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 border-b border-slate-900/50 bg-black relative flex-shrink-0">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <CardTitle size="xs" className={cn('text-white z-10 relative truncate pr-2', titleSize)}>
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn('h-4 w-4 relative z-10 flex-shrink-0', iconColor)} />
        )}
      </div>
      <CardContent className="pt-4 pb-4 sm:pb-6 flex-1 flex flex-col justify-between">
        <div className={cn('font-bold text-white mb-1', valueSize)}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mb-2">{subtitle}</p>
        )}
        {change !== undefined && (
          <p className={cn('text-xs flex items-center gap-1 mt-auto', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {Math.abs(change).toFixed(1)}% {change > 0 ? 'increase' : change < 0 ? 'decrease' : ''} from last period
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (tooltip) {
    return (
      <MetricTooltip content={tooltip}>
        {card}
      </MetricTooltip>
    )
  }

  return card
}


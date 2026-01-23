'use client'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { MetricTooltip } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MetricCardEnhancedProps {
  title: string
  value: number | string
  unit?: string
  change?: number
  icon: LucideIcon
  variant?: 'default' | 'negative' | 'warning' | 'success'
  format?: 'number' | 'currency' | 'weight' | 'percentage'
  currency?: string
  onClick?: () => void
  tooltip?: React.ReactNode
  className?: string
}

export function MetricCardEnhanced({
  title,
  value,
  unit,
  change,
  icon: Icon,
  variant = 'default',
  format = 'number',
  currency = 'RWF',
  onClick,
  tooltip,
  className,
}: MetricCardEnhancedProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return `${val.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} ${currency}`
      case 'weight':
        return `${val.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} kg`
      case 'percentage':
        return `${val.toFixed(1)}%`
      default:
        return val.toLocaleString()
    }
  }

  const iconColor = {
    default: 'text-blue-400',
    negative: 'text-red-400',
    warning: 'text-yellow-400',
    success: 'text-green-400',
  }[variant]

  const cardContent = (
    <Card
      className={cn(
        'group bg-black border-gray-800 dark:border-gray-800 transition-all duration-300',
        'text-white dark:text-white',
        onClick && 'cursor-pointer hover:border-gray-700/50 hover:shadow-xl hover:shadow-black/10 hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-gray-800 dark:border-gray-800 bg-black dark:bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700/30 to-transparent" />
        <CardTitle size="xs" className="metric-label z-10 relative text-white dark:text-white">{title}</CardTitle>
        <div className="relative z-10">
          <div className={cn('absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300', {
            'bg-gray-700/20': variant === 'default',
            'bg-red-500/20': variant === 'negative',
            'bg-yellow-500/20': variant === 'warning',
            'bg-green-500/20': variant === 'success',
          })} />
          <div className={cn('relative p-2 rounded-full border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3', {
            'bg-gray-800/10 border-gray-800/20': variant === 'default',
            'bg-red-500/10 border-red-500/20': variant === 'negative',
            'bg-yellow-500/10 border-yellow-500/20': variant === 'warning',
            'bg-green-500/10 border-green-500/20': variant === 'success',
          })}>
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
        </div>
      </div>
      <CardContent>
        <div className="metric-value text-2xl font-bold mb-1 text-white dark:text-white">
          {formatValue(value)}
        </div>
        {change !== undefined && (
          <p
            className={cn(
              'text-xs flex items-center gap-1 transition-colors',
              change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </p>
        )}
        {!change && unit && format === 'number' && (
          <p className="text-xs text-white dark:text-white">{unit}</p>
        )}
      </CardContent>
    </Card>
  )

  if (tooltip) {
    return <MetricTooltip content={tooltip}>{cardContent}</MetricTooltip>
  }

  return cardContent
}


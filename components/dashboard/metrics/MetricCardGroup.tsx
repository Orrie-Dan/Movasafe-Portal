'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { MetricCardEnhanced, MetricCardEnhancedProps } from './MetricCardEnhanced'
import { cn } from '@/lib/utils'

export interface MetricCardGroupProps {
  metrics: MetricCardEnhancedProps[]
  loading?: boolean
  columns?: 2 | 3 | 4 | 6
  onMetricClick?: (metric: MetricCardEnhancedProps) => void
  className?: string
}

export function MetricCardGroup({
  metrics,
  loading = false,
  columns = 4,
  onMetricClick,
  className,
}: MetricCardGroupProps) {
  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    6: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }[columns]

  if (loading) {
    return (
      <div className={cn('grid gap-4', gridCols, className)}>
        {[...Array(columns * 2)].map((_, i) => (
          <Card key={i} className="bg-black border-slate-800">
            <div className="p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid gap-4', gridCols, className)}>
      {metrics.map((metric, index) => (
        <MetricCardEnhanced
          key={index}
          {...metric}
          onClick={onMetricClick ? () => onMetricClick(metric) : metric.onClick}
        />
      ))}
    </div>
  )
}


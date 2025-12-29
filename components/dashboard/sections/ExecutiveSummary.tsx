'use client'

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface KPIMetric {
  label: string
  value: number | string
  unit?: string
  change?: number
  format?: 'number' | 'currency' | 'percentage'
}

export interface ExecutiveSummaryProps {
  metrics: KPIMetric[]
  comparison?: { label: string; value: number }[]
  loading?: boolean
  title?: string
  description?: string
  className?: string
}

export function ExecutiveSummary({
  metrics,
  comparison,
  loading = false,
  title = 'Executive Summary - Key Performance Indicators',
  description = 'Overview of critical metrics',
  className,
}: ExecutiveSummaryProps) {
  const formatValue = (metric: KPIMetric): string => {
    if (typeof metric.value === 'string') return metric.value
    
    switch (metric.format) {
      case 'currency':
        if (metric.value >= 1000000) return `${(metric.value / 1000000).toFixed(1)}M`
        if (metric.value >= 1000) return `${(metric.value / 1000).toFixed(1)}K`
        return metric.value.toFixed(0)
      case 'percentage':
        return `${metric.value.toFixed(1)}%`
      default:
        return metric.value.toLocaleString()
    }
  }

  return (
    <Card className={`bg-black border-slate-800 ${className}`}>
      <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-900/50 bg-black">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <CardTitle size="md" className="text-white relative z-10">{title}</CardTitle>
        <CardDescription className="text-slate-400 relative z-10">{description}</CardDescription>
      </div>
      <CardContent>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-slate-700 bg-slate-900/50"
              >
                <div className="text-sm text-slate-400 mb-1">{metric.label}</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatValue(metric)}
                  {metric.unit && metric.format !== 'currency' && ` ${metric.unit}`}
                  {metric.format === 'currency' && ' RWF'}
                </div>
                {metric.change !== undefined && (
                  <div
                    className={`text-xs flex items-center gap-1 ${
                      metric.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {metric.change >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </div>
                )}
                {!metric.change && metric.unit && (
                  <div className="text-xs text-slate-400">{metric.unit}</div>
                )}
              </div>
            ))}
          </div>
        )}
        {comparison && comparison.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {comparison.map((item, index) => (
                <div key={index} className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-2">{item.label}</div>
                  <div className="text-xl font-bold text-white mb-1">
                    {item.value >= 0 ? '+' : ''}{item.value.toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-400">From previous period</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


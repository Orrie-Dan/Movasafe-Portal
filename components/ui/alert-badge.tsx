'use client'

import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AlertBadgeProps {
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description?: string
  className?: string
}

export function AlertBadge({
  severity,
  title,
  description,
  className,
}: AlertBadgeProps) {
  const severityConfig = {
    low: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      border: 'border-yellow-500/20',
      icon: Info,
    },
    medium: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/20',
      icon: AlertCircle,
    },
    high: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/20',
      icon: AlertTriangle,
    },
    critical: {
      bg: 'bg-red-600/20',
      text: 'text-red-500',
      border: 'border-red-600/40',
      icon: XCircle,
    },
  }

  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      config.bg,
      config.border,
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.text)} />
        <div className="flex-1">
          <h4 className={cn('font-semibold mb-1', config.text)}>{title}</h4>
          {description && (
            <p className="text-sm text-slate-300">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}


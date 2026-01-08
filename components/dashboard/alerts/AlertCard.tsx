'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LucideIcon, AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AlertType = 'error' | 'warning' | 'info' | 'success'

export interface AlertCardProps {
  type: AlertType
  title: string
  description: string
  count?: number
  onAction?: () => void
  actionLabel?: string
  icon?: LucideIcon
  className?: string
}

const alertConfig = {
  error: {
    icon: AlertCircle,
    borderColor: 'border-red-500/20',
    bgColor: 'bg-red-500/5',
    textColor: 'text-red-400',
    buttonClass: 'border-red-500/30 text-red-400 hover:bg-red-500/10',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-yellow-500/20',
    bgColor: 'bg-yellow-500/5',
    textColor: 'text-yellow-400',
    buttonClass: 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10',
  },
  info: {
    icon: Info,
    borderColor: 'border-blue-500/20',
    bgColor: 'bg-blue-500/5',
    textColor: 'text-blue-400',
    buttonClass: 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10',
  },
  success: {
    icon: CheckCircle2,
    borderColor: 'border-green-500/20',
    bgColor: 'bg-green-500/5',
    textColor: 'text-green-400',
    buttonClass: 'border-green-500/30 text-green-400 hover:bg-green-500/10',
  },
}

export function AlertCard({
  type,
  title,
  description,
  count,
  onAction,
  actionLabel = 'View',
  icon,
  className,
}: AlertCardProps) {
  const config = alertConfig[type]
  const Icon = icon || config.icon

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        config.borderColor,
        config.bgColor,
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5', config.textColor)} />
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-white">{title}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {count !== undefined ? `${count} ${description}` : description}
          </div>
        </div>
      </div>
      {onAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className={config.buttonClass}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}


'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}

const statusVariants: Record<string, { variant: StatusBadgeProps['variant']; className: string }> = {
  active: { variant: 'success', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  inactive: { variant: 'default', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  suspended: { variant: 'warning', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  locked: { variant: 'error', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  pending: { variant: 'info', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  completed: { variant: 'success', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  failed: { variant: 'error', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  success: { variant: 'success', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  error: { variant: 'error', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const statusConfig = statusVariants[status.toLowerCase()] || {
    variant: variant || 'default',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'border text-xs font-medium',
        statusConfig.className,
        className
      )}
    >
      {status}
    </Badge>
  )
}


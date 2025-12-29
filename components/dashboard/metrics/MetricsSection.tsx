'use client'

import { useState } from 'react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LucideIcon, ChevronUp, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MetricsSectionProps {
  title: string
  icon?: LucideIcon
  defaultExpanded?: boolean
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  children: React.ReactNode
  className?: string
  description?: string
  badge?: string
}

export function MetricsSection({
  title,
  icon: Icon,
  defaultExpanded = true,
  expanded: controlledExpanded,
  onExpandedChange,
  children,
  className,
  description,
  badge,
}: MetricsSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  const setExpanded = onExpandedChange || setInternalExpanded

  return (
    <div className={cn('space-y-4', className)}>
      <Card className="bg-black border-slate-800">
        <div
          className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative cursor-pointer hover:bg-slate-800/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center gap-2 relative z-10">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
            {Icon && <Icon className="h-5 w-5 text-blue-400" />}
            <CardTitle size="md" className="text-white">{title}</CardTitle>
          </div>
          {badge && (
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 relative z-10">
              {badge}
            </Badge>
          )}
        </div>
        {expanded && <CardContent>{children}</CardContent>}
      </Card>
    </div>
  )
}


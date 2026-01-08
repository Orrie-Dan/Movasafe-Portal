'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CollapsibleSectionProps {
  title: string
  description?: string
  defaultExpanded?: boolean
  children: React.ReactNode
  className?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function CollapsibleSection({
  title,
  description,
  defaultExpanded = false,
  children,
  className,
  icon: Icon,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <Card className={cn('bg-white dark:bg-black border-slate-200 dark:border-slate-800', className)}>
      <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="flex items-center justify-between relative z-10 flex-1">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5 text-blue-400" />}
            <div>
              <CardTitle size="md" className="relative z-10">{title}</CardTitle>
              {description && (
                <CardDescription className="relative z-10">{description}</CardDescription>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <CardContent className="pt-6">
          {children}
        </CardContent>
      )}
    </Card>
  )
}


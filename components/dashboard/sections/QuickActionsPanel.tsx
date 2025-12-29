'use client'

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

export interface QuickAction {
  label: string
  icon: LucideIcon
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
}

export interface QuickActionsPanelProps {
  actions: QuickAction[]
  title?: string
  description?: string
  className?: string
}

export function QuickActionsPanel({
  actions,
  title = 'Quick Actions',
  description = 'Common operations',
  className,
}: QuickActionsPanelProps) {
  return (
    <Card className={`bg-black border-slate-800 ${className}`}>
      <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-900/50 bg-black">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <CardTitle size="md" className="text-white relative z-10">{title}</CardTitle>
        <CardDescription className="text-slate-400 relative z-10">{description}</CardDescription>
      </div>
      <CardContent className="space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              className="w-full justify-start bg-slate-900 border-slate-700 text-white hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 active:scale-95"
              onClick={action.onClick}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Icon className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
              {action.label}
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}


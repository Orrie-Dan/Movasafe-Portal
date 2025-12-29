import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DashboardSectionProps {
  children: ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
}

export function DashboardSection({
  children,
  className,
  spacing = 'md',
}: DashboardSectionProps) {
  const spacingClasses = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8',
  }

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}


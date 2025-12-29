import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

export interface DashboardHeaderProps {
  title: string
  description?: string
  period?: string
  onPeriodChange?: (period: string) => void
  periodOptions?: { value: string; label: string }[]
  actions?: ReactNode
  className?: string
}

export function DashboardHeader({
  title,
  description,
  period,
  onPeriodChange,
  periodOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ],
  actions,
  className = '',
}: DashboardHeaderProps) {
  return (
    <div className={`sticky top-0 z-10 border-b border-slate-800 bg-slate-900 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-4">
          {period && onPeriodChange && (
            <Select
              value={period}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onPeriodChange(e.target.value)}
              className="w-40 bg-slate-800 border-slate-700 text-white"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
          {actions}
        </div>
      </div>
    </div>
  )
}


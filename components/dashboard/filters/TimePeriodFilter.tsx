'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'

export type TimePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

export interface TimePeriodFilterProps {
  value: TimePeriod
  onChange: (period: TimePeriod) => void
  customDateRange?: { from: Date | null; to: Date | null }
  onCustomDateRangeChange?: (range: { from: Date | null; to: Date | null }) => void
  showCustom?: boolean
  className?: string
}

export function TimePeriodFilter({
  value,
  onChange,
  customDateRange = { from: null, to: null },
  onCustomDateRangeChange,
  showCustom = true,
  className,
}: TimePeriodFilterProps) {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
  ]

  if (showCustom) {
    periods.push({ value: 'custom', label: 'Custom' })
  }

  const getPeriodLabel = (period: TimePeriod): string => {
    const now = new Date()
    switch (period) {
      case 'today':
        return format(now, 'EEEE, MMMM d, yyyy')
      case 'week':
        return `${format(startOfWeek(now), 'MMM d')} - ${format(endOfWeek(now), 'MMM d, yyyy')}`
      case 'month':
        return format(now, 'MMMM yyyy')
      case 'quarter':
        return `Q${Math.floor(now.getMonth() / 3) + 1} ${format(now, 'yyyy')}`
      case 'year':
        return format(now, 'yyyy')
      default:
        return ''
    }
  }

  return (
    <Card className={`bg-black border-slate-800 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Time Period</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {periods.map((period) => (
              <Button
                key={period.value}
                variant={value === period.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (period.value === 'custom') {
                    onChange('custom')
                  } else {
                    onChange(period.value)
                    if (onCustomDateRangeChange) {
                      onCustomDateRangeChange({ from: null, to: null })
                    }
                  }
                }}
                className={
                  value === period.value
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }
              >
                {period.label}
              </Button>
            ))}
          </div>
          {value !== 'custom' && (
            <div className="text-xs text-slate-400">
              {getPeriodLabel(value)}
            </div>
          )}
        </div>
        {value === 'custom' && onCustomDateRangeChange && (
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-slate-400">From:</Label>
              <Input
                type="date"
                value={customDateRange.from ? format(customDateRange.from, 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  onCustomDateRangeChange({
                    ...customDateRange,
                    from: e.target.value ? new Date(e.target.value) : null,
                  })
                }
                className="bg-slate-800 border-slate-700 text-white w-[180px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-slate-400">To:</Label>
              <Input
                type="date"
                value={customDateRange.to ? format(customDateRange.to, 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  onCustomDateRangeChange({
                    ...customDateRange,
                    to: e.target.value ? new Date(e.target.value) : null,
                  })
                }
                className="bg-slate-800 border-slate-700 text-white w-[180px]"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


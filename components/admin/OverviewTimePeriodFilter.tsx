'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Filter, X } from 'lucide-react'
import { format } from 'date-fns'

export type OverviewPeriod = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

interface OverviewTimePeriodFilterProps {
  value: OverviewPeriod
  onChange: (period: OverviewPeriod) => void
  customDateRange: { from: Date | null; to: Date | null }
  onCustomDateRangeChange: (range: { from: Date | null; to: Date | null }) => void
  onReset: () => void
  defaultExpanded?: boolean
}

export function OverviewTimePeriodFilter({
  value,
  onChange,
  customDateRange,
  onCustomDateRangeChange,
  onReset,
  defaultExpanded = true,
}: OverviewTimePeriodFilterProps) {
  const [filterExpanded, setFilterExpanded] = useState(defaultExpanded)
  const isCustomRangeComplete = value !== 'custom' || (!!customDateRange.from && !!customDateRange.to)

  return (
    <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
      <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="flex items-center justify-between relative z-10 flex-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-400" />
            <CardTitle size="md" className="text-sm sm:text-base">Filters</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterExpanded((prev) => !prev)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm"
          >
            {filterExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>
      {filterExpanded && (
      <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 space-y-4">
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Time Period</label>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-1 flex-wrap">
            {(['all', 'today', 'week', 'month', 'quarter', 'year', 'custom'] as const).map((period) => (
              <Button
                key={period}
                variant={value === period ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  if (period === 'custom') {
                    onChange('custom')
                  } else {
                    onChange(period)
                    onCustomDateRangeChange({ from: null, to: null })
                  }
                }}
                className={
                  value === period
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {value === 'custom' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Start Date</label>
              <Input
                type="date"
                value={customDateRange.from ? format(customDateRange.from, 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  onCustomDateRangeChange({
                    ...customDateRange,
                    from: e.target.value ? new Date(e.target.value) : null,
                  })
                }
                className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">End Date</label>
              <Input
                type="date"
                value={customDateRange.to ? format(customDateRange.to, 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  onCustomDateRangeChange({
                    ...customDateRange,
                    to: e.target.value ? new Date(e.target.value) : null,
                  })
                }
                className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {value === 'custom' && !isCustomRangeComplete && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Select both start and end dates to apply the custom filter.
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </CardContent>
      )}
    </Card>
  )
}


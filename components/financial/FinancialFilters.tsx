'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Filter, X } from 'lucide-react'
import type { FinancialFilters as FinancialFiltersType } from '@/lib/types/financial'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export interface FinancialFiltersProps {
  filters: FinancialFiltersType
  onFiltersChange: (filters: FinancialFiltersType) => void
  onReset: () => void
}

export function FinancialFilters({ filters, onFiltersChange, onReset }: FinancialFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handlePeriodChange = (period: 'month' | 'quarter' | 'year' | 'custom') => {
    let dateRange = filters.dateRange
    
    if (period !== 'custom') {
      const now = new Date()
      if (period === 'month') {
        dateRange = {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd'),
        }
      } else if (period === 'quarter') {
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0)
        dateRange = {
          start: format(quarterStart, 'yyyy-MM-dd'),
          end: format(quarterEnd, 'yyyy-MM-dd'),
        }
      } else if (period === 'year') {
        dateRange = {
          start: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'),
          end: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd'),
        }
      }
    }
    
    onFiltersChange({
      ...filters,
      period,
      dateRange,
    })
  }

  return (
    <Card className="bg-black border-slate-800">
      <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="flex items-center justify-between relative z-10 flex-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            <CardTitle size="md" className="text-white text-sm sm:text-base">Filters</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white text-xs sm:text-sm"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 space-y-4">
          {/* Period Selection */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Time Period</label>
            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg p-1">
              {(['month', 'quarter', 'year', 'custom'] as const).map((period) => (
                <Button
                  key={period}
                  variant={filters.period === period ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handlePeriodChange(period)}
                  className={
                    filters.period === period
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-slate-400 hover:text-white'
                  }
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          {filters.period === 'custom' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      dateRange: { ...filters.dateRange, start: e.target.value },
                    })
                  }
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      dateRange: { ...filters.dateRange, end: e.target.value },
                    })
                  }
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
          )}

          {/* Currency */}
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Currency</label>
            <Select
              value={filters.currency || 'RWF'}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  currency: e.target.value as 'RWF' | 'USD' | 'EUR',
                })
              }
              className="bg-slate-800/50 border-slate-700 text-white"
            >
              <option value="RWF">RWF (Rwandan Franc)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
            </Select>
          </div>

          {/* Reset Button */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="border-slate-700 text-white hover:bg-slate-800"
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


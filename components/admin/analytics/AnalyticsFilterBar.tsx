'use client'

import { useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Filter, Calendar } from 'lucide-react'
import { TransactionType, TransactionStatus } from '@/lib/api'
import type { AnalyticsFilters } from '@/hooks/useAnalytics'

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters
  onChange: (filters: AnalyticsFilters) => void
}

export function AnalyticsFilterBar({ filters, onChange }: AnalyticsFilterBarProps) {
  const initialFiltersRef = useRef<AnalyticsFilters>(filters)

  const updateFilter = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const handleReset = () => {
    onChange(initialFiltersRef.current)
  }

  return (
    <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
            <Filter className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-base">Analytics filters</CardTitle>
            <CardDescription>Refine the metrics and trends shown below.</CardDescription>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="mt-1 w-full sm:mt-0 sm:w-auto"
        >
          Reset filters
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Date Range */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date range
            </label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => updateFilter('dateRange', value as AnalyticsFilters['dateRange'])}
            >
              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === 'custom' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Start date
                </label>
                <Input
                  type="date"
                  value={filters.customStartDate || ''}
                  onChange={(e) => updateFilter('customStartDate', e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  End date
                </label>
                <Input
                  type="date"
                  value={filters.customEndDate || ''}
                  onChange={(e) => updateFilter('customEndDate', e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
            </>
          )}

          {/* Transaction Type */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Transaction type
            </label>
            <Select
              value={filters.transactionType}
              onValueChange={(value) => updateFilter('transactionType', value as AnalyticsFilters['transactionType'])}
            >
              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value={TransactionType.CASH_IN}>Cash in</SelectItem>
                <SelectItem value={TransactionType.CASH_OUT}>Cash out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Status
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter('status', value as AnalyticsFilters['status'])}
            >
              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value={TransactionStatus.SUCCESSFUL}>Successful</SelectItem>
                <SelectItem value={TransactionStatus.FAILED}>Failed</SelectItem>
                <SelectItem value={TransactionStatus.PENDING}>Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min amount */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Min amount (RWF)
            </label>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 1000"
              value={filters.minAmount || ''}
              onChange={(e) => updateFilter('minAmount', e.target.value)}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          {/* Max amount */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Max amount (RWF)
            </label>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 100000"
              value={filters.maxAmount || ''}
              onChange={(e) => updateFilter('maxAmount', e.target.value)}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



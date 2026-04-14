'use client'

import { useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Filter } from 'lucide-react'
import { TransactionType, TransactionStatus } from '@/lib/api'
import type { AnalyticsFilters } from '@/hooks/useAnalytics'
import { OverviewTimePeriodFilter } from '@/components/admin/OverviewTimePeriodFilter'

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters
  onChange: React.Dispatch<React.SetStateAction<AnalyticsFilters>>
}

export function AnalyticsFilterBar({ filters, onChange }: AnalyticsFilterBarProps) {
  const initialFiltersRef = useRef<AnalyticsFilters>(filters)

  const updateFilter = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
    onChange((prev) => ({ ...prev, [key]: value }))
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
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <OverviewTimePeriodFilter
            value={filters.dateRange}
            onChange={(period) => updateFilter('dateRange', period as AnalyticsFilters['dateRange'])}
            customDateRange={{
              from: filters.customStartDate ? new Date(filters.customStartDate) : null,
              to: filters.customEndDate ? new Date(filters.customEndDate) : null,
            }}
            onCustomDateRangeChange={(range) => {
              onChange((prev) => ({
                ...prev,
                customStartDate: range.from ? range.from.toISOString().slice(0, 10) : '',
                customEndDate: range.to ? range.to.toISOString().slice(0, 10) : '',
              }))
            }}
            onReset={handleReset}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

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
        </div>
      </CardContent>
    </Card>
  )
}



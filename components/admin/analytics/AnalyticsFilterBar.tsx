'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Filter, Calendar } from 'lucide-react'
import { TransactionType, TransactionStatus } from '@/lib/api'
import type { AnalyticsFilters } from '@/hooks/useAnalytics'

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilters
  onChange: (filters: AnalyticsFilters) => void
}

export function AnalyticsFilterBar({ filters, onChange }: AnalyticsFilterBarProps) {
  const updateFilter = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-400" />
          <CardTitle size="md">Filters</CardTitle>
        </div>
        <CardDescription>Apply filters to all analytics below</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Date Range */}
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date Range
            </label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => updateFilter('dateRange', value as AnalyticsFilters['dateRange'])}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <SelectValue placeholder="Select range" />
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === 'custom' && (
            <>
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={filters.customStartDate || ''}
                  onChange={(e) => updateFilter('customStartDate', e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={filters.customEndDate || ''}
                  onChange={(e) => updateFilter('customEndDate', e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </>
          )}

          {/* Transaction Type */}
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Transaction Type</label>
            <Select
              value={filters.transactionType}
              onValueChange={(value) => updateFilter('transactionType', value as AnalyticsFilters['transactionType'])}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <SelectValue placeholder="All Types" />
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={TransactionType.CASH_IN}>Cash In</SelectItem>
                <SelectItem value={TransactionType.CASH_OUT}>Cash Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter('status', value as AnalyticsFilters['status'])}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <SelectValue placeholder="All Statuses" />
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={TransactionStatus.SUCCESSFUL}>Success</SelectItem>
                <SelectItem value={TransactionStatus.FAILED}>Failed</SelectItem>
                <SelectItem value={TransactionStatus.PENDING}>Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


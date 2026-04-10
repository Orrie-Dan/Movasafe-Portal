'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Filter, X, RefreshCw } from 'lucide-react'
import { TransactionType, TransactionStatus, TransactionDescription } from '@/lib/api'
import type { TransactionUIFilters } from '@/hooks/useTransactions'

interface TransactionsFilterBarProps {
  filters: TransactionUIFilters
  onChange: Dispatch<SetStateAction<TransactionUIFilters>>
  onReset: () => void
  onRefresh: () => void
}

export function TransactionsFilterBar({
  filters,
  onChange,
  onReset,
  onRefresh,
}: TransactionsFilterBarProps) {
  const updateFilter = <K extends keyof TransactionUIFilters>(
    key: K,
    value: TransactionUIFilters[K]
  ) => {
    onChange((prev) => ({ ...prev, [key]: value }))
  }

  const handleDescriptionsChange = (value: string) => {
    const currentDescriptions = filters.descriptions || []
    if (value === '') {
      // Clear all
      updateFilter('descriptions', [])
    } else if (currentDescriptions.includes(value)) {
      // Remove if already selected
      updateFilter('descriptions', currentDescriptions.filter(d => d !== value))
    } else {
      // Add to selection
      updateFilter('descriptions', [...currentDescriptions, value])
    }
  }

  return (
    <Card className="sticky top-0 z-5 bg-white dark:bg-black border-slate-200 dark:border-slate-800 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-white">Filters</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onRefresh} className="text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onReset} className="text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {/* Transaction Reference */}
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">Transaction Reference (API)</Label>
            <Input
              placeholder="e.g. TRX-REF-12345"
              value={filters.transactionReference}
              onChange={(e) => updateFilter('transactionReference', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* First Name */}
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">First Name</Label>
            <Input
              placeholder="e.g. John"
              value={filters.firstName}
              onChange={(e) => updateFilter('firstName', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Last Name */}
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">Last Name</Label>
            <Input
              placeholder="e.g. Doe"
              value={filters.lastName}
              onChange={(e) => updateFilter('lastName', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* User Phone Number */}
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">User Phone Number</Label>
            <Input
              placeholder="userPhoneNumber"
              value={filters.userPhoneNumber}
              onChange={(e) => updateFilter('userPhoneNumber', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Transaction Type */}
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">Transaction Type</Label>
            <Select
              value={filters.transactionType}
              onValueChange={(value) => updateFilter('transactionType', value as TransactionUIFilters['transactionType'])}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <SelectValue placeholder="--" />
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={TransactionType.CASH_IN}>CASH_IN</SelectItem>
              <SelectItem value={TransactionType.CASH_OUT}>CASH_OUT</SelectItem>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">Description</Label>
            <Select
              value={filters.description}
              onValueChange={(value) => updateFilter('description', value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <SelectValue placeholder="--" />
              <SelectItem value="">All Descriptions</SelectItem>
              {Object.values(TransactionDescription).map((desc) => (
                <SelectItem key={desc} value={desc}>
                  {desc}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Descriptions (Multi-select) */}
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">Descriptions (Multi-select)</Label>
            <div className="border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 max-h-32 overflow-y-auto">
              <Select
                value=""
                onValueChange={handleDescriptionsChange}
                className="h-9 text-sm bg-white dark:bg-slate-900 border-0 text-slate-900 dark:text-white"
              >
                <SelectValue placeholder="Select descriptions..." />
                {Object.values(TransactionDescription).map((desc) => (
                  <SelectItem 
                    key={desc} 
                    value={desc}
                    className={filters.descriptions?.includes(desc) ? 'bg-blue-600/20' : ''}
                  >
                    {desc}
                  </SelectItem>
                ))}
              </Select>
              {filters.descriptions && filters.descriptions.length > 0 && (
                <div className="px-3 py-2 flex flex-wrap gap-1">
                  {filters.descriptions.map((desc) => (
                    <span
                      key={desc}
                      className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded flex items-center gap-1"
                    >
                      {desc}
                      <button
                        onClick={() => handleDescriptionsChange(desc)}
                        className="hover:text-blue-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter('status', value as TransactionUIFilters['status'])}
            >
              <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                <SelectValue placeholder="--" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={TransactionStatus.PENDING}>PENDING</SelectItem>
                <SelectItem value={TransactionStatus.SUCCESSFUL}>SUCCESSFUL</SelectItem>
                <SelectItem value={TransactionStatus.FAILED}>FAILED</SelectItem>
                <SelectItem value={TransactionStatus.ROLLED_BACK}>ROLLED_BACK</SelectItem>
                <SelectItem value={TransactionStatus.CANCELLED}>CANCELLED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min Amount */}
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">Min Amount</Label>
            <Input
              type="number"
              placeholder="minAmount"
              value={filters.minAmount}
              onChange={(e) => updateFilter('minAmount', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Max Amount */}
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">Max Amount</Label>
            <Input
              type="number"
              placeholder="maxAmount"
              value={filters.maxAmount}
              onChange={(e) => updateFilter('maxAmount', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Date Range */}
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">Date Range</Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => {
                onChange((prev) => ({
                  ...prev,
                  dateRange: value as TransactionUIFilters['dateRange'],
                  customStartDate: value === 'custom' ? prev.customStartDate : '',
                  customEndDate: value === 'custom' ? prev.customEndDate : '',
                }))
              }}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <SelectValue placeholder="Select range..." />
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </Select>
          </div>

          {/* Start Date - Only show when custom range is selected */}
          {filters.dateRange === 'custom' && (
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">Start Date</Label>
            <Input
              type="date"
              placeholder="startDate"
              value={filters.customStartDate}
              onChange={(e) => {
                updateFilter('customStartDate', e.target.value)
              }}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          )}

          {/* End Date - Only show when custom range is selected */}
          {filters.dateRange === 'custom' && (
          <div>
            <Label className="text-xs text-slate-700 dark:text-slate-400 mb-1 block">End Date</Label>
            <Input
              type="date"
              placeholder="endDate"
              value={filters.customEndDate}
              onChange={(e) => {
                updateFilter('customEndDate', e.target.value)
              }}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          )}

        </div>
      </CardContent>
    </Card>
  )
}

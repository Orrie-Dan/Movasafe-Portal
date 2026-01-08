'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Filter, X, RefreshCw, Search } from 'lucide-react'
import { TransactionType, TransactionStatus } from '@/lib/api'
import type { TransactionUIFilters } from '@/hooks/useTransactions'

interface TransactionsFilterBarProps {
  filters: TransactionUIFilters
  onChange: (filters: TransactionUIFilters) => void
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
    onChange({ ...filters, [key]: value })
  }

  return (
    <Card className="sticky top-0 z-10 bg-white dark:bg-black border-slate-200 dark:border-slate-800 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-foreground">Filters</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {/* Transaction ID */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Transaction ID</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
              <Input
                placeholder="Search ID..."
                value={filters.transactionId}
                onChange={(e) => updateFilter('transactionId', e.target.value)}
                className="pl-8 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
              />
            </div>
          </div>

          {/* User ID */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">User ID</Label>
            <Input
              placeholder="User ID..."
              value={filters.userId}
              onChange={(e) => updateFilter('userId', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
            />
          </div>

          {/* Wallet ID */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Wallet ID</Label>
            <Input
              placeholder="Wallet ID..."
              value={filters.walletId}
              onChange={(e) => updateFilter('walletId', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
            />
          </div>

          {/* Date Range */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Date Range</Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => updateFilter('dateRange', value as TransactionUIFilters['dateRange'])}
            >
              <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
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
                <Label className="text-xs text-muted-foreground mb-1 block">Start Date</Label>
                <Input
                  type="date"
                  value={filters.customStartDate}
                  onChange={(e) => updateFilter('customStartDate', e.target.value)}
                  className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">End Date</Label>
                <Input
                  type="date"
                  value={filters.customEndDate}
                  onChange={(e) => updateFilter('customEndDate', e.target.value)}
                  className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
                />
              </div>
            </>
          )}

          {/* Status */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter('status', value as TransactionUIFilters['status'])}
            >
              <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={TransactionStatus.SUCCESSFUL}>Success</SelectItem>
                <SelectItem value={TransactionStatus.FAILED}>Failed</SelectItem>
                <SelectItem value={TransactionStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={TransactionStatus.ROLLED_BACK}>Rolled Back</SelectItem>
                <SelectItem value={TransactionStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
            <Select
              value={filters.transactionType}
              onValueChange={(value) => updateFilter('transactionType', value as TransactionUIFilters['transactionType'])}
            >
              <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={TransactionType.CASH_IN}>Cash In</SelectItem>
                <SelectItem value={TransactionType.CASH_OUT}>Cash Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount Range */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Min Amount</Label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => updateFilter('minAmount', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Max Amount</Label>
            <Input
              type="number"
              placeholder="No limit"
              value={filters.maxAmount}
              onChange={(e) => updateFilter('maxAmount', e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


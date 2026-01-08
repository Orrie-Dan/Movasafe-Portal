'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import {
  getTransactionStatusBadge,
  getTransactionTypeIcon,
  formatCurrency,
  getFailureCategory,
  getChannelName,
} from '@/lib/utils/transactions'
import { Transaction, TransactionStatus } from '@/lib/api'
import { format, parseISO } from 'date-fns'
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Eye,
  Users,
  FileText,
} from 'lucide-react'
import type { SortingState, PaginationState } from '@/hooks/useTransactions'

interface TransactionsTableProps {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  sorting: SortingState
  onSort: (column: string) => void
  pagination: PaginationState
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
  onRowClick: (transaction: Transaction) => void
}

export function TransactionsTable({
  transactions,
  loading,
  error,
  sorting,
  onSort,
  pagination,
  totalPages,
  totalCount,
  onPageChange,
  onRowClick,
}: TransactionsTableProps) {
  const getSortIcon = (column: string) => {
    if (sorting.column !== column) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />
    }
    return sorting.direction === 'asc' ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    )
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-400">
            <FileText className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No transactions found"
        description="No transactions match your filters"
      />
    )
  }

  return (
    <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <TableHead
                  className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => onSort('id')}
                >
                  <div className="flex items-center gap-1">
                    Transaction ID
                    {getSortIcon('id')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => onSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Date & Time
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => onSort('userId')}
                >
                  <div className="flex items-center gap-1">
                    User / Wallet
                    {getSortIcon('userId')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => onSort('transactionType')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {getSortIcon('transactionType')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground text-right"
                  onClick={() => onSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => onSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Channel</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Failure Reason
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-20">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const failureInfo = getFailureCategory(transaction.status, transaction.description)
                return (
                  <TableRow
                    key={transaction.id}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => onRowClick(transaction)}
                  >
                    <TableCell className="font-mono text-xs text-foreground">
                      {transaction.id.slice(0, 12)}...
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(parseISO(transaction.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-foreground">
                          {transaction.userId.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getTransactionTypeIcon(transaction.transactionType)}
                        <span className="text-xs text-foreground">{transaction.transactionType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs text-foreground">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn('text-xs', getTransactionStatusBadge(transaction.status))}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {getChannelName(transaction.description)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {transaction.status === TransactionStatus.FAILED ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-red-400">{failureInfo.category}</span>
                          {failureInfo.retryEligible && (
                            <span className="text-xs text-green-400">Retry eligible</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRowClick(transaction)}
                        className="h-7 w-7 p-0"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, totalCount)} of {totalCount}{' '}
              transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}
                disabled={pagination.page === totalPages}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


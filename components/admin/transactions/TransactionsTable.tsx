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
} from '@/lib/utils/transactions'
import { Transaction, TransactionStatus } from '@/lib/api'
import { format, parseISO } from 'date-fns'
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Eye,
  RotateCcw,
  AlertCircle,
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
  onStandardReversal?: (transaction: Transaction) => void
  onForceReversal?: (transaction: Transaction) => void
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
  onStandardReversal,
  onForceReversal,
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

  // Helper to get currency from transaction
  const getCurrency = (transaction: Transaction): string => {
    return transaction.toDetails?.currency || 
           transaction.fromDetails?.currency || 
           transaction.currency || 
           'RWF'
  }

  // Helper to format nullable fields
  const formatNullable = (value: string | null | undefined): string => {
    return value ?? '-'
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
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="No transactions to display"
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
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => onSort('userId')}
                >
                  <div className="flex items-center gap-1">
                    User ID
                    {getSortIcon('userId')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => onSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => onSort('id')}
                >
                  <div className="flex items-center gap-1">
                    Transaction ID
                    {getSortIcon('id')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => onSort('transactionType')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {getSortIcon('transactionType')}
                  </div>
                </TableHead>
                <TableHead className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Description
                </TableHead>
                <TableHead
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white text-right"
                  onClick={() => onSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
                <TableHead
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => onSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  From
                </TableHead>
                <TableHead className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  To
                </TableHead>
                <TableHead className="text-sm font-medium text-slate-600 dark:text-slate-400 w-20">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const currency = getCurrency(transaction)
                const fromAccount = transaction.fromDetails 
                  ? `${formatNullable(transaction.fromDetails.accountName)} (${formatNullable(transaction.fromDetails.accountSource)})`
                  : '-'
                const toAccount = transaction.toDetails
                  ? `${formatNullable(transaction.toDetails.accountName)} (${formatNullable(transaction.toDetails.accountSource)})`
                  : '-'

                return (
                  <TableRow
                    key={transaction.id}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => onRowClick(transaction)}
                  >
                    <TableCell className="font-mono text-sm text-slate-900 dark:text-white">
                      {transaction.userId}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                      {format(parseISO(transaction.createdAt), 'dd MMM yyyy, HH:mm')}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-700 dark:text-slate-300">
                      {formatNullable(transaction.id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getTransactionTypeIcon(transaction.transactionType)}
                        <span className="text-sm text-slate-900 dark:text-white">{transaction.transactionType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                      {formatNullable(transaction.description)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm text-slate-900 dark:text-white">
                      {formatCurrency(transaction.amount, currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn('text-sm', getTransactionStatusBadge(transaction.status))}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                      {fromAccount}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                      {toAccount}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRowClick(transaction)}
                          className="h-8 px-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
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
            <div className="text-sm text-slate-600 dark:text-slate-400">
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
                className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {pagination.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, pagination.page + 1))}
                disabled={pagination.page === totalPages}
                className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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

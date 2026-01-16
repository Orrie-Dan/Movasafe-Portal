'use client'

import { useState } from 'react'
import { apiGetTransactionById, type Transaction, TransactionStatus } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { TransactionsFilterBar } from '@/components/admin/transactions/TransactionsFilterBar'
import { TransactionsTable } from '@/components/admin/transactions/TransactionsTable'
import { TransactionDetailsDialog } from '@/components/admin/transactions/TransactionDetailsDialog'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/utils/transactions'
import { toast } from '@/hooks/use-toast'
import { FileText } from 'lucide-react'

export default function TransactionsPage() {
  const {
    transactions,
    sortedTransactions,
    paginatedTransactions,
    loading,
    error,
    filters,
    setFilters,
    resetFilters,
    sorting,
    handleSort,
    pagination,
    setPagination,
    totalPages,
    refetch,
  } = useTransactions()

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [actionModal, setActionModal] = useState<{
    type: 'retry' | 'refund' | 'reverse' | 'flag' | null
    transaction: Transaction | null
  }>({ type: null, transaction: null })

  const handleViewTransaction = async (transaction: Transaction) => {
    try {
      const fullTransaction = await apiGetTransactionById(transaction.id)
      setSelectedTransaction(fullTransaction)
      setIsDetailOpen(true)
    } catch (err) {
      console.error('Failed to fetch transaction details:', err)
      setSelectedTransaction(transaction)
      setIsDetailOpen(true)
    }
  }

  const handleAction = (type: 'retry' | 'refund' | 'reverse' | 'flag', transaction: Transaction) => {
    setActionModal({ type, transaction })
  }

  const handleRetry = async (transaction: Transaction) => {
    try {
      // TODO: Replace with actual API call
      toast({
        title: 'Success',
        description: 'Transaction retry initiated',
      })
      refetch()
      setActionModal({ type: null, transaction: null })
      if (selectedTransaction?.id === transaction.id) {
        setIsDetailOpen(false)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to retry transaction',
        variant: 'destructive',
      })
    }
  }

  const handleRefund = async (transaction: Transaction) => {
    try {
      // TODO: Replace with actual API call
      toast({
        title: 'Success',
        description: 'Refund processed successfully',
      })
      refetch()
      setActionModal({ type: null, transaction: null })
      if (selectedTransaction?.id === transaction.id) {
        setIsDetailOpen(false)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to process refund',
        variant: 'destructive',
      })
    }
  }

  const handleReverse = async (transaction: Transaction) => {
    try {
      // TODO: Replace with actual API call
      toast({
        title: 'Success',
        description: 'Transaction reversed successfully',
      })
      refetch()
      setActionModal({ type: null, transaction: null })
      if (selectedTransaction?.id === transaction.id) {
        setIsDetailOpen(false)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reverse transaction',
        variant: 'destructive',
      })
    }
  }

  const handleFlag = async (transaction: Transaction) => {
    try {
      // TODO: Replace with actual API call
      toast({
        title: 'Success',
        description: 'Transaction flagged for review',
      })
      refetch()
      setActionModal({ type: null, transaction: null })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to flag transaction',
        variant: 'destructive',
      })
    }
  }

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page })
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-black">
      <PageHeader
        title="Transactions"
        description="Investigate and manage individual transactions"
      />

      <TransactionsFilterBar
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        onRefresh={refetch}
      />

      <TransactionsTable
        transactions={paginatedTransactions}
        loading={loading}
        error={error}
        sorting={sorting}
        onSort={handleSort}
        pagination={pagination}
        totalPages={totalPages}
        totalCount={transactions.length}
        onPageChange={handlePageChange}
        onRowClick={handleViewTransaction}
      />

      <TransactionDetailsDialog
        transaction={selectedTransaction}
        allTransactions={transactions}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onAction={handleAction}
      />

      {/* Action Modals */}
      {actionModal.type && actionModal.transaction && (
        <ConfirmDialog
          open={actionModal.type !== null}
          onOpenChange={(open) => !open && setActionModal({ type: null, transaction: null })}
          title={
            actionModal.type === 'retry'
              ? 'Retry Transaction'
              : actionModal.type === 'refund'
              ? 'Refund Transaction'
              : actionModal.type === 'reverse'
              ? 'Reverse Transaction'
              : 'Flag Transaction for Review'
          }
          description={
            actionModal.type === 'retry'
              ? `Are you sure you want to retry transaction ${actionModal.transaction.id}?`
              : actionModal.type === 'refund'
              ? `Refund amount: ${formatCurrency(actionModal.transaction.amount, actionModal.transaction.currency || actionModal.transaction.toDetails?.currency || actionModal.transaction.fromDetails?.currency || 'RWF')}. This action cannot be undone.`
              : actionModal.type === 'reverse'
              ? `Reverse transaction ${actionModal.transaction.id}. This will undo the transaction and cannot be undone.`
              : `Flag transaction ${actionModal.transaction.id} for manual review.`
          }
          confirmLabel={
            actionModal.type === 'retry'
              ? 'Retry'
              : actionModal.type === 'refund'
              ? 'Refund'
              : actionModal.type === 'reverse'
              ? 'Reverse'
              : 'Flag'
          }
          variant={
            actionModal.type === 'refund' || actionModal.type === 'reverse'
              ? 'destructive'
              : 'default'
          }
          onConfirm={() => {
            if (actionModal.type === 'retry') handleRetry(actionModal.transaction!)
            else if (actionModal.type === 'refund') handleRefund(actionModal.transaction!)
            else if (actionModal.type === 'reverse') handleReverse(actionModal.transaction!)
            else if (actionModal.type === 'flag') handleFlag(actionModal.transaction!)
          }}
        />
      )}
    </div>
  )
}

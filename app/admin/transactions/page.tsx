'use client'

import { useState } from 'react'
import { apiGetTransactionById, type Transaction, TransactionStatus } from '@/lib/api'
import { apiStandardReversal, apiForceReversal } from '@/lib/api/transactions'
import { PageHeader } from '@/components/admin/PageHeader'
import { TransactionsFilterBar } from '@/components/admin/transactions/TransactionsFilterBar'
import { TransactionsTable } from '@/components/admin/transactions/TransactionsTable'
import { TransactionDetailsDialog } from '@/components/admin/transactions/TransactionDetailsDialog'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useTransactions } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/utils/transactions'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  // Reversal states
  const [standardReversalOpen, setStandardReversalOpen] = useState(false)
  const [forceReversalOpen, setForceReversalOpen] = useState(false)
  const [reversalTransaction, setReversalTransaction] = useState<Transaction | null>(null)
  const [reversalReason, setReversalReason] = useState('')
  const [reversalNotes, setReversalNotes] = useState('')
  const [reversalLoading, setReversalLoading] = useState(false)

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
      setActionModal({ type: null, transaction: null })
      setIsDetailOpen(false)
      refetch()
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
      setActionModal({ type: null, transaction: null })
      setIsDetailOpen(false)
      refetch()
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
      setActionModal({ type: null, transaction: null })
      setIsDetailOpen(false)
      refetch()
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
      setActionModal({ type: null, transaction: null })
      setIsDetailOpen(false)
      refetch()
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

  const handleStandardReversal = async () => {
    if (!reversalTransaction || !reversalReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for reversal',
        variant: 'destructive',
      })
      return
    }

    setReversalLoading(true)
    try {
      const idempotencyKey = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

      const payload = {
        reason: reversalReason,
        adminNotes: reversalNotes,
        idempotencyKey,
      }

      const response = await apiStandardReversal(reversalTransaction.internalReference || '', payload)
      
      console.log('Standard reversal response:', response)

      // Show success toast
      toast({
        title: 'Success',
        description: response.message || 'Transfer reversed successfully',
      })
      
      // Close all dialogs
      setStandardReversalOpen(false)
      setIsDetailOpen(false)
      setReversalReason('')
      setReversalNotes('')
      setReversalTransaction(null)
      setSelectedTransaction(null)
      refetch()
    } catch (err) {
      console.error('Standard reversal error:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reverse transaction',
        variant: 'destructive',
      })
    } finally {
      setReversalLoading(false)
    }
  }

  const handleForceReversal = async () => {
    if (!reversalTransaction || !reversalReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for force reversal',
        variant: 'destructive',
      })
      return
    }

    setReversalLoading(true)
    try {
      const idempotencyKey = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

      const payload = {
        reason: reversalReason,
        adminNotes: reversalNotes,
        idempotencyKey,
        createDebtIfInsufficientFunds: true,
        debtDueDays: 0,
      }

      const response = await apiForceReversal(reversalTransaction.internalReference || '', payload)
      
      console.log('Force reversal response:', response)

      // Show success toast
      toast({
        title: 'Success',
        description: response.message || 'Transfer force-reversed with debt created',
      })
      
      // Close all dialogs
      setForceReversalOpen(false)
      setIsDetailOpen(false)
      setReversalReason('')
      setReversalNotes('')
      setReversalTransaction(null)
      setSelectedTransaction(null)
      refetch()
    } catch (err) {
      console.error('Force reversal error:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to force reverse transaction',
        variant: 'destructive',
      })
    } finally {
      setReversalLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-white dark:bg-black">
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
        onStandardReversal={(transaction) => {
          setReversalTransaction(transaction)
          setStandardReversalOpen(true)
        }}
        onForceReversal={(transaction) => {
          setReversalTransaction(transaction)
          setForceReversalOpen(true)
        }}
      />

      <TransactionDetailsDialog
        transaction={selectedTransaction}
        allTransactions={transactions}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onAction={handleAction}
        onStandardReversal={(transaction) => {
          setReversalTransaction(transaction)
          setStandardReversalOpen(true)
          setIsDetailOpen(false)
        }}
        onForceReversal={(transaction) => {
          setReversalTransaction(transaction)
          setForceReversalOpen(true)
          setIsDetailOpen(false)
        }}
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

      {/* Standard Reversal Dialog */}
      {standardReversalOpen && reversalTransaction && (
        <Dialog open={standardReversalOpen} onOpenChange={setStandardReversalOpen}>
          <DialogContent className="bg-gray-950 border border-gray-800 text-white max-w-4xl dark:bg-slate-900 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle>Reverse Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800 dark:bg-slate-800/50 dark:border-slate-700">
                <p className="text-xs text-gray-400 uppercase">Transaction Reference</p>
                <p className="text-sm font-mono text-blue-400 break-all">{reversalTransaction.internalReference}</p>
              </div>
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800 dark:bg-slate-800/50 dark:border-slate-700">
                <p className="text-xs text-gray-400 uppercase">Amount</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(reversalTransaction.amount || 0, reversalTransaction.currency || 'RWF')} {reversalTransaction.currency || 'RWF'}</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Reason for Reversal</label>
                <Input
                  placeholder="e.g., Duplicate transaction, User request..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="bg-gray-900 border-gray-800 text-white dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Admin Notes (Optional)</label>
                <Input
                  placeholder="Additional notes..."
                  value={reversalNotes}
                  onChange={(e) => setReversalNotes(e.target.value)}
                  className="bg-gray-900 border-gray-800 text-white dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-800 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => {
                  setStandardReversalOpen(false)
                  setReversalReason('')
                  setReversalNotes('')
                  setReversalTransaction(null)
                }}
                disabled={reversalLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStandardReversal}
                disabled={reversalLoading || !reversalReason.trim()}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {reversalLoading ? 'Processing...' : 'Reverse Transfer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Force Reversal Dialog */}
      {forceReversalOpen && reversalTransaction && (
        <Dialog open={forceReversalOpen} onOpenChange={setForceReversalOpen}>
          <DialogContent className="bg-gray-950 border border-gray-800 text-white max-w-4xl dark:bg-slate-900 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle>Force Reverse Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-800 p-3 rounded dark:bg-red-900/30 dark:border-red-800">
                <p className="text-sm text-red-400">
                  <strong>Warning:</strong> This will create debt if the receiver has insufficient funds to cover the reversal.
                </p>
              </div>
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800 dark:bg-slate-800/50 dark:border-slate-700">
                <p className="text-xs text-gray-400 uppercase">Transaction Reference</p>
                <p className="text-sm font-mono text-blue-400 break-all">{reversalTransaction.internalReference}</p>
              </div>
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800 dark:bg-slate-800/50 dark:border-slate-700">
                <p className="text-xs text-gray-400 uppercase">Amount</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(reversalTransaction.amount || 0, reversalTransaction.currency || 'RWF')} {reversalTransaction.currency || 'RWF'}</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Reason for Force Reversal</label>
                <Input
                  placeholder="e.g., Dispute resolution, Compliance..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="bg-gray-900 border-gray-800 text-white dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Admin Notes (Optional)</label>
                <Input
                  placeholder="Additional notes..."
                  value={reversalNotes}
                  onChange={(e) => setReversalNotes(e.target.value)}
                  className="bg-gray-900 border-gray-800 text-white dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-800 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => {
                  setForceReversalOpen(false)
                  setReversalReason('')
                  setReversalNotes('')
                  setReversalTransaction(null)
                }}
                disabled={reversalLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleForceReversal}
                disabled={reversalLoading || !reversalReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {reversalLoading ? 'Processing...' : 'Force Reverse'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

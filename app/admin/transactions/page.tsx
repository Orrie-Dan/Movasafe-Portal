'use client'

import { useState, useMemo } from 'react'
import { apiGetTransactionById, type Transaction, TransactionStatus } from '@/lib/api'
import { apiStandardReversal, apiForceReversal } from '@/lib/api/transactions'
import { PageHeader } from '@/components/admin/PageHeader'
import { TransactionsFilterBar } from '@/components/admin/transactions/TransactionsFilterBar'
import { TransactionsTable } from '@/components/admin/transactions/TransactionsTable'
import { ViewDetailsDialog } from '@/components/admin/ViewDetailsDialog'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useTransactions } from '@/hooks/useTransactions'
import {
  formatCurrency,
  getTransactionStatusBadge,
  getTransactionTypeIcon,
  getFailureCategory,
} from '@/lib/utils/transactions'
import { toast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, parseISO } from 'date-fns'
import { FileText, RefreshCw, RotateCcw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TransactionsPage() {
  const navigate = useNavigate()
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
  const [riskActionDialog, setRiskActionDialog] = useState<{
    open: boolean
    actionType: RiskActionType | null
    transaction: Transaction | null
    reasonCode: string
    reasonText: string
  }>({
    open: false,
    actionType: null,
    transaction: null,
    reasonCode: '',
    reasonText: '',
  })

  const handleViewTransaction = async (transaction: Transaction) => {
    try {
      const fullTransaction = await apiGetTransactionById(transaction.id)
      // Fraud queue transactions should navigate to Fraud Detail screen
      if (String(fullTransaction.status).toUpperCase() === String(TransactionStatus.PENDING_REVIEW)) {
        navigate(`/admin/fraud-management/${fullTransaction.id}`)
        return
      }
      setSelectedTransaction(fullTransaction)
      setIsDetailOpen(true)
    } catch (err) {
      console.error('Failed to fetch transaction details:', err)
      if (String(transaction.status).toUpperCase() === String(TransactionStatus.PENDING_REVIEW)) {
        navigate(`/admin/fraud-management/${transaction.id}`)
        return
      }
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

  const openRiskActionDialog = (actionType: RiskActionType, transaction: Transaction) => {
    setRiskActionDialog({
      open: true,
      actionType,
      transaction,
      reasonCode: '',
      reasonText: '',
    })
  }

  const submitRiskAction = async () => {
    if (!riskActionDialog.actionType || !riskActionDialog.transaction) return
    const validationError = validateRiskReason(
      riskActionDialog.actionType,
      riskActionDialog.reasonCode,
      riskActionDialog.reasonText
    )
    if (validationError) {
      toast({ title: 'Missing reason', description: validationError, variant: 'destructive' })
      return
    }

    const payload = buildRiskAuditPayload({
      actionType: riskActionDialog.actionType,
      targetType: 'transaction',
      targetId: riskActionDialog.transaction.id,
      reasonCode: riskActionDialog.reasonCode,
      reasonText: riskActionDialog.reasonText,
      beforeState: { status: riskActionDialog.transaction.status },
      afterState: { status: riskActionDialog.actionType === 'approve' ? 'APPROVED_MANUALLY' : 'REVIEW_REQUIRED' },
    })

    console.log('[Risk Audit Payload]', payload)
    toast({
      title: 'Action recorded',
      description: `${riskActionDialog.actionType.toUpperCase()} saved with mandatory reason.`,
    })
    setRiskActionDialog({
      open: false,
      actionType: null,
      transaction: null,
      reasonCode: '',
      reasonText: '',
    })
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

  const buildTransactionSections = (t: Transaction) => {
    const failureInfo = getFailureCategory(t.status as TransactionStatus, t.description)
    const sections: import('@/components/admin/ViewDetailsDialog').DetailSection[] = [
      {
        title: 'Transaction',
        gridCols: 3,
        fields: [
          {
            label: 'Type',
            value: (
              <span className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-100">
                  {getTransactionTypeIcon(t.transactionType)}
                </span>
                <span className="font-medium text-slate-900 dark:text-white">{t.transactionType}</span>
              </span>
            ),
          },
          { label: 'Amount', value: formatCurrency(t.amount, t.currency || 'RWF') },
          { label: 'Reference', value: <span className="font-mono text-xs">{t.internalReference}</span> },
        ],
      },
    ]
    if (t.description) {
      sections.push({
        title: 'Description',
        children: (
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800 dark:bg-neutral-900 dark:text-neutral-100">
            {t.description}
          </div>
        ),
      })
    }
    // User ID intentionally omitted from details view
    if (t.fromDetails || t.toDetails) {
      sections.push({
        title: 'Accounts',
        children: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {t.fromDetails && (
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-neutral-900">
                <p className="text-[11px] font-semibold mb-1 uppercase tracking-wide text-slate-500 dark:text-neutral-400">From</p>
                {t.fromDetails.accountName && <p className="text-xs text-slate-900 dark:text-white">{t.fromDetails.accountName}</p>}
                <p className="mt-1 text-[11px] font-mono text-slate-600 dark:text-neutral-300 truncate">{t.fromDetails.accountNumber}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-neutral-400">{t.fromDetails.accountSource}</p>
              </div>
            )}
            {t.toDetails && (
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-neutral-900">
                <p className="text-[11px] font-semibold mb-1 uppercase tracking-wide text-slate-500 dark:text-neutral-400">To</p>
                {t.toDetails.accountName && <p className="text-xs text-slate-900 dark:text-white">{t.toDetails.accountName}</p>}
                <p className="mt-1 text-[11px] font-mono text-slate-600 dark:text-neutral-300 truncate">{t.toDetails.accountNumber}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-neutral-400">{t.toDetails.accountSource}</p>
              </div>
            )}
          </div>
        ),
      })
    }
    sections.push({
      title: 'Status',
      gridCols: 2,
      fields: [
        { label: 'Created', value: format(parseISO(t.createdAt), 'PPp') },
        { label: 'Updated', value: format(parseISO(t.updatedAt), 'PPp') },
      ],
    })
    if (t.status === TransactionStatus.FAILED && failureInfo) {
      sections.push({
        title: 'Failure Information',
        children: (
          <div className="space-y-2 text-sm rounded-xl border border-red-200/70 bg-red-50/80 p-4 dark:border-red-900/70 dark:bg-red-950/40">
            <div>
              <Label className="text-[11px] text-red-700/80 dark:text-red-200/90 uppercase tracking-wide">Category</Label>
              <div className="mt-1 text-slate-900 dark:text-slate-50">{failureInfo.category}</div>
            </div>
            {t.description && (
              <div>
                <Label className="text-[11px] text-red-700/80 dark:text-red-200/90 uppercase tracking-wide">Error Description</Label>
                <div className="mt-1 rounded-lg bg-red-100/80 p-3 text-xs text-red-900 dark:bg-red-950/60 dark:text-red-100">{t.description}</div>
              </div>
            )}
            <div>
              <Label className="text-[11px] text-red-700/80 dark:text-red-200/90 uppercase tracking-wide">Can Retry</Label>
              <div className="mt-1 flex items-center gap-1.5">
                {failureInfo.retryEligible ? (
                  <><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-sm text-slate-900 dark:text-slate-50">Yes</span></>
                ) : (
                  <><XCircle className="h-4 w-4 text-red-500" /><span className="text-sm text-slate-900 dark:text-slate-50">No</span></>
                )}
              </div>
            </div>
          </div>
        ),
      })
    }
    return sections
  }

  const buildTransactionActions = (t: Transaction) => {
    const actions: import('@/components/admin/ViewDetailsDialog').ViewDetailsDialogAction[] = []
    if (t.status === TransactionStatus.FAILED) {
      actions.push({
        label: 'Retry',
        icon: <RefreshCw className="h-4 w-4" />,
        onClick: () => {
          setIsDetailOpen(false)
          handleAction('retry', t)
        },
      })
    }
    if (t.status === TransactionStatus.SUCCESSFUL) {
      actions.push({
        label: 'Reverse Transfer',
        icon: <RotateCcw className="h-4 w-4" />,
        onClick: () => {
          setReversalTransaction(t)
          setStandardReversalOpen(true)
          setIsDetailOpen(false)
        },
      })
      actions.push({
        label: 'Force Reverse',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />,
        onClick: () => {
          setReversalTransaction(t)
          setForceReversalOpen(true)
          setIsDetailOpen(false)
        },
      })
    }
    return actions
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
        onBlock={(transaction) => openRiskActionDialog('block', transaction)}
        onFlag={(transaction) => openRiskActionDialog('flag', transaction)}
        onApprove={(transaction) => openRiskActionDialog('approve', transaction)}
      />

      {selectedTransaction && (
        <ViewDetailsDialog
          open={isDetailOpen}
          onOpenChange={(open) => {
            setIsDetailOpen(!!open)
            if (!open) setSelectedTransaction(null)
          }}
          title="Transaction Details"
          subtitle={selectedTransaction.id}
          onCopySubtitle={() => {
            navigator.clipboard.writeText(selectedTransaction.id)
            toast({ title: 'Copied', description: 'Copied to clipboard' })
          }}
          badge={
            <Badge className={getTransactionStatusBadge(selectedTransaction.status) + ' text-xs px-3 py-1'}>
              {selectedTransaction.status}
            </Badge>
          }
          maxWidth="4xl"
          sections={buildTransactionSections(selectedTransaction)}
          actions={buildTransactionActions(selectedTransaction)}
        />
      )}

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

      {riskActionDialog.open && riskActionDialog.actionType && riskActionDialog.transaction && (
        <Dialog
          open={riskActionDialog.open}
          onOpenChange={(open) =>
            setRiskActionDialog((prev) => ({ ...prev, open }))
          }
        >
          <DialogContent className="bg-gray-950 border border-gray-800 text-white max-w-2xl dark:bg-slate-900 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="capitalize">{riskActionDialog.actionType} transaction</DialogTitle>
              <DialogDescription>
                Action for reference {riskActionDialog.transaction.internalReference}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Reason code</Label>
                <Select
                  value={riskActionDialog.reasonCode}
                  onValueChange={(value) => setRiskActionDialog((prev) => ({ ...prev, reasonCode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason code" />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_ACTION_REASONS[riskActionDialog.actionType].map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Reason details</Label>
                <Textarea
                  value={riskActionDialog.reasonText}
                  onChange={(e) => setRiskActionDialog((prev) => ({ ...prev, reasonText: e.target.value }))}
                  placeholder="Provide required action rationale"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRiskActionDialog((prev) => ({ ...prev, open: false }))}>
                  Cancel
                </Button>
                <Button onClick={submitRiskAction}>Submit Action</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

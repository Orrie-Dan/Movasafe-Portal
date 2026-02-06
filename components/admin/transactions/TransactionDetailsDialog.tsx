'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Copy, CheckCircle2, XCircle, AlertTriangle, RefreshCw, DollarSign, ArrowLeftRight, Flag, RotateCcw, AlertCircle } from 'lucide-react'
import { Transaction, TransactionStatus } from '@/lib/api'
import { format, parseISO } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import {
  getTransactionStatusBadge,
  getTransactionTypeIcon,
  formatCurrency,
  getFailureCategory,
  getRelatedFailures,
} from '@/lib/utils/transactions'

interface TransactionDetailsDialogProps {
  transaction: Transaction | null
  allTransactions: Transaction[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: (type: 'retry' | 'refund' | 'reverse' | 'flag', transaction: Transaction) => void
  onStandardReversal?: (transaction: Transaction) => void
  onForceReversal?: (transaction: Transaction) => void
}

export function TransactionDetailsDialog({
  transaction,
  allTransactions,
  open,
  onOpenChange,
  onAction,
  onStandardReversal,
  onForceReversal,
}: TransactionDetailsDialogProps) {
  const [internalNote, setInternalNote] = useState('')

  const failureInfo = useMemo(() => {
    if (!transaction) return null
    return getFailureCategory(transaction.status as TransactionStatus, transaction.description)
  }, [transaction])

  const relatedFailures = useMemo(() => {
    if (!transaction) return []
    return getRelatedFailures(transaction, allTransactions)
  }, [transaction, allTransactions])

  if (!transaction) return null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Copied to clipboard',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200/60 bg-white shadow-xl dark:border-neutral-800/60 dark:bg-black">
        <DialogHeader className="border-b border-slate-200/70 pb-4 mb-4 dark:border-neutral-800/70">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Transaction Details
              </DialogTitle>
              <DialogDescription className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                <span className="font-mono truncate px-2 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-neutral-900 dark:text-neutral-200">
                  {transaction.id}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => copyToClipboard(transaction.id)}
                  title="Copy ID"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </DialogDescription>
            </div>
            <Badge className={getTransactionStatusBadge(transaction.status) + ' text-xs px-3 py-1 rounded-full shadow-sm'}>
              {transaction.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-neutral-800/70 dark:bg-black">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400 mb-3">
              Transaction
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Type
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-100">
                    {getTransactionTypeIcon(transaction.transactionType)}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {transaction.transactionType}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Amount
                </Label>
                <div className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(transaction.amount, transaction.currency || 'RWF')}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Reference
                </Label>
                <div className="mt-1 inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700 dark:bg-neutral-900 dark:text-neutral-200">
                  {transaction.internalReference}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {transaction.description && (
            <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-neutral-800/70 dark:bg-black">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                Description
              </Label>
              <div className="mt-2 text-sm leading-relaxed rounded-lg bg-slate-50 p-3 text-slate-800 dark:bg-neutral-900 dark:text-neutral-100">
                {transaction.description}
              </div>
            </div>
          )}

          {/* Users */}
          <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-neutral-800/70 dark:bg-black">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400 mb-3">
              Users
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  From User ID
                </Label>
                <div className="mt-1 inline-flex items-center rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700 dark:bg-neutral-900 dark:text-neutral-200 truncate">
                  {transaction.userId}
                </div>
              </div>
            </div>
          </div>

          {/* Accounts */}
          {(transaction.fromDetails || transaction.toDetails) && (
            <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-neutral-800/70 dark:bg-black">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400 mb-3">
                Accounts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {transaction.fromDetails && (
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-neutral-900">
                    <p className="text-[11px] font-semibold mb-1 uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                      From
                    </p>
                    {transaction.fromDetails.accountName && (
                      <p className="text-xs text-slate-900 dark:text-white">
                        {transaction.fromDetails.accountName}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] font-mono text-slate-600 dark:text-neutral-300 truncate">
                      {transaction.fromDetails.accountNumber}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-neutral-400">
                      {transaction.fromDetails.accountSource}
                    </p>
                  </div>
                )}
                {transaction.toDetails && (
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-neutral-900">
                    <p className="text-[11px] font-semibold mb-1 uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                      To
                    </p>
                    {transaction.toDetails.accountName && (
                      <p className="text-xs text-slate-900 dark:text-white">
                        {transaction.toDetails.accountName}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] font-mono text-slate-600 dark:text-neutral-300 truncate">
                      {transaction.toDetails.accountNumber}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-neutral-400">
                      {transaction.toDetails.accountSource}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status & Dates */}
          <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-neutral-800/70 dark:bg-black">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400 mb-3">
              Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Created
                </Label>
                <div className="mt-1 text-xs text-slate-800 dark:text-neutral-100">
                  {format(parseISO(transaction.createdAt), 'PPp')}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Updated
                </Label>
                <div className="mt-1 text-xs text-slate-800 dark:text-neutral-100">
                  {format(parseISO(transaction.updatedAt), 'PPp')}
                </div>
              </div>
            </div>
          </div>

          {/* Failure Information */}
          {transaction.status === TransactionStatus.FAILED && failureInfo && (
            <div className="rounded-xl border border-red-200/70 bg-red-50/80 p-4 shadow-sm dark:border-red-900/70 dark:bg-red-950/40">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300 mb-3">
                Failure Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <Label className="text-[11px] text-red-700/80 dark:text-red-200/90 uppercase tracking-wide">
                    Category
                  </Label>
                  <div className="mt-1 text-slate-900 dark:text-slate-50">
                    {failureInfo.category}
                  </div>
                </div>
                {transaction.description && (
                  <div>
                    <Label className="text-[11px] text-red-700/80 dark:text-red-200/90 uppercase tracking-wide">
                      Error Description
                    </Label>
                    <div className="mt-1 rounded-lg bg-red-100/80 p-3 text-xs text-red-900 dark:bg-red-950/60 dark:text-red-100">
                      {transaction.description}
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-[11px] text-red-700/80 dark:text-red-200/90 uppercase tracking-wide">
                    Can Retry
                  </Label>
                  <div className="mt-1 flex items-center gap-1.5">
                    {failureInfo.retryEligible ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-slate-900 dark:text-slate-50">Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-slate-900 dark:text-slate-50">No</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 border-t border-slate-200/70 pt-4 flex flex-col gap-3 dark:border-slate-800/70">
          <div className="flex items-center gap-2">
            {transaction.status === TransactionStatus.FAILED && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  onOpenChange(false)
                  onAction('retry', transaction)
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
          {transaction.status === TransactionStatus.SUCCESSFUL && (
            <div className="flex items-center gap-2 w-full">
              {onStandardReversal && (
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white flex-1 py-4 text-sm"
                  onClick={() => onStandardReversal(transaction)}
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Reverse Transfer
                </Button>
              )}
              {onForceReversal && (
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white flex-1 py-4 text-sm"
                  onClick={() => onForceReversal(transaction)}
                >
                  <AlertCircle className="h-4 w-4 mr-1.5" />
                  Force Reverse
                </Button>
              )}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


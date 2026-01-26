'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Copy, CheckCircle2, XCircle, AlertTriangle, RefreshCw, DollarSign, ArrowLeftRight, Flag } from 'lucide-react'
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
}

export function TransactionDetailsDialog({
  transaction,
  allTransactions,
  open,
  onOpenChange,
  onAction,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Transaction Details</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs truncate">{transaction.id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(transaction.id)}
                  title="Copy ID"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </DialogDescription>
            </div>
            <Badge className={getTransactionStatusBadge(transaction.status)}>
              {transaction.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Transaction</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <div className="flex items-center gap-1 mt-1">
                  {getTransactionTypeIcon(transaction.transactionType)}
                  <span className="font-medium">{transaction.transactionType}</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <div className="font-semibold mt-1">{formatCurrency(transaction.amount, transaction.currency || 'RWF')}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Reference</Label>
                <div className="font-mono text-xs mt-1">{transaction.internalReference}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {transaction.description && (
            <div className="space-y-2 border-t pt-3">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <div className="text-sm bg-slate-100 dark:bg-slate-900 p-2 rounded">{transaction.description}</div>
            </div>
          )}

          {/* Users */}
          <div className="space-y-2 border-t pt-3">
            <h3 className="text-sm font-semibold">Users</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">From User ID</Label>
                <div className="font-mono text-xs mt-1 truncate">{transaction.userId}</div>
              </div>
            </div>
          </div>

          {/* Accounts */}
          {(transaction.fromDetails || transaction.toDetails) && (
            <div className="space-y-2 border-t pt-3">
              <h3 className="text-sm font-semibold">Accounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {transaction.fromDetails && (
                  <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded">
                    <p className="text-xs font-semibold mb-1">From</p>
                    {transaction.fromDetails.accountName && <p className="text-xs">{transaction.fromDetails.accountName}</p>}
                    <p className="text-xs text-muted-foreground font-mono truncate">{transaction.fromDetails.accountNumber}</p>
                    <p className="text-xs text-muted-foreground">{transaction.fromDetails.accountSource}</p>
                  </div>
                )}
                {transaction.toDetails && (
                  <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded">
                    <p className="text-xs font-semibold mb-1">To</p>
                    {transaction.toDetails.accountName && <p className="text-xs">{transaction.toDetails.accountName}</p>}
                    <p className="text-xs text-muted-foreground font-mono truncate">{transaction.toDetails.accountNumber}</p>
                    <p className="text-xs text-muted-foreground">{transaction.toDetails.accountSource}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status & Dates */}
          <div className="space-y-2 border-t pt-3">
            <h3 className="text-sm font-semibold">Status</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <div className="text-xs mt-1">{format(parseISO(transaction.createdAt), 'PPp')}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Updated</Label>
                <div className="text-xs mt-1">{format(parseISO(transaction.updatedAt), 'PPp')}</div>
              </div>
            </div>
          </div>

          {/* Failure Information */}
          {transaction.status === TransactionStatus.FAILED && failureInfo && (
            <div className="space-y-2 border-t pt-3">
              <h3 className="text-sm font-semibold text-red-600">Failure Information</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <div className="mt-1">{failureInfo.category}</div>
                </div>
                {transaction.description && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Error Description</Label>
                    <div className="mt-1 bg-slate-100 dark:bg-slate-900 p-2 rounded text-xs">{transaction.description}</div>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Can Retry</Label>
                  <div className="mt-1 flex items-center gap-1">
                    {failureInfo.retryEligible ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Yes</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>No</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between w-full gap-2">
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
              {transaction.status === TransactionStatus.SUCCESSFUL && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false)
                      onAction('refund', transaction)
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Refund
                  </Button>
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => {
                      onOpenChange(false)
                      onAction('reverse', transaction)
                    }}
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Reverse
                  </Button>
                </>
              )}
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  onOpenChange(false)
                  onAction('flag', transaction)
                }}
              >
                <Flag className="h-4 w-4 mr-2" />
                Flag for Review
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


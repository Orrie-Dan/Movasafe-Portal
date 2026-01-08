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
    return getFailureCategory(transaction.status, transaction.description)
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Transaction Details</DialogTitle>
              <DialogDescription className="mt-1">
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-sm">{transaction.id}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(transaction.id)}
                    title="Copy ID"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </DialogDescription>
            </div>
            <Badge className={getTransactionStatusBadge(transaction.status)}>
              {transaction.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Transaction Type</Label>
              <div className="flex items-center gap-2 text-foreground">
                {getTransactionTypeIcon(transaction.transactionType)}
                <span>{transaction.transactionType}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Amount</Label>
              <div className="text-lg font-bold text-foreground">
                {formatCurrency(transaction.amount, transaction.currency)}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">User ID</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-foreground">{transaction.userId}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(transaction.userId)}
                  title="Copy User ID"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {transaction.counterpartyUserId && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Counterparty User ID</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground">
                    {transaction.counterpartyUserId}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(transaction.counterpartyUserId!)}
                    title="Copy Counterparty ID"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <div className="text-sm text-foreground">{transaction.description || 'N/A'}</div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Currency</Label>
              <div className="text-sm text-foreground">{transaction.currency}</div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Financial Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {transaction.commissionAmount && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Commission</Label>
                  <div className="text-sm font-medium text-blue-400">
                    {formatCurrency(transaction.commissionAmount, transaction.currency)}
                    {transaction.commissionPercentage && (
                      <span className="text-muted-foreground ml-1">
                        ({transaction.commissionPercentage}%)
                      </span>
                    )}
                  </div>
                </div>
              )}
              {transaction.vendorAmount && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Vendor Amount</Label>
                  <div className="text-sm font-medium text-foreground">
                    {formatCurrency(transaction.vendorAmount, transaction.currency)}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Balance Before</Label>
                <div className="text-sm text-muted-foreground">N/A</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Balance After</Label>
                <div className="text-sm text-muted-foreground">N/A</div>
              </div>
            </div>
          </div>

          {/* Lifecycle Timestamps */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Lifecycle Timestamps</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Created At</Label>
                <div className="text-sm text-foreground">
                  {format(parseISO(transaction.createdAt), 'PPpp')}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Updated At</Label>
                <div className="text-sm text-foreground">
                  {format(parseISO(transaction.updatedAt), 'PPpp')}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Initiator Confirmed</Label>
                <div className="text-sm text-foreground">
                  {transaction.initiatorConfirmed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400 inline" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 inline" />
                  )}
                  <span className="ml-1">{transaction.initiatorConfirmed ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Receiver Confirmed</Label>
                <div className="text-sm text-foreground">
                  {transaction.receiverConfirmed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400 inline" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 inline" />
                  )}
                  <span className="ml-1">{transaction.receiverConfirmed ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Failure Information */}
          {transaction.status === TransactionStatus.FAILED && failureInfo && (
            <div className="border-t border-red-500/20 pt-4 bg-red-500/5 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Failure Information
              </h3>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Error Category</Label>
                  <div className="text-sm font-medium text-red-400">{failureInfo.category}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Retry Eligible</Label>
                  <div className="text-sm">
                    {failureInfo.retryEligible ? (
                      <span className="text-green-400">Yes - This transaction can be retried</span>
                    ) : (
                      <span className="text-red-400">No - Manual intervention required</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Error Description</Label>
                  <div className="text-sm text-foreground">
                    {transaction.description || 'No error details available'}
                  </div>
                </div>
              </div>

              {/* Related Failures */}
              {relatedFailures.length > 0 && (
                <div className="mt-4 pt-4 border-t border-red-500/20">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Related Failures ({relatedFailures.length})
                  </Label>
                  <div className="space-y-1">
                    {relatedFailures.map((related) => (
                      <div
                        key={related.id}
                        className="text-xs p-2 bg-slate-100 dark:bg-slate-800 rounded"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-foreground">
                            {related.id.slice(0, 12)}...
                          </span>
                          <span className="text-muted-foreground">
                            {formatCurrency(related.amount, related.currency)}
                          </span>
                        </div>
                        <div className="text-muted-foreground mt-1">
                          {format(parseISO(related.createdAt), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* API Response / Error Codes */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Technical Details</h3>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">From Details</Label>
                <pre className="text-xs p-2 bg-slate-100 dark:bg-slate-900 rounded mt-1 overflow-x-auto text-foreground">
                  {JSON.stringify(transaction.fromDetails || {}, null, 2)}
                </pre>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To Details</Label>
                <pre className="text-xs p-2 bg-slate-100 dark:bg-slate-900 rounded mt-1 overflow-x-auto text-foreground">
                  {JSON.stringify(transaction.toDetails || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Internal Notes</h3>
            <Textarea
              placeholder="Add internal notes about this transaction..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
              rows={3}
            />
          </div>

          {/* Audit History */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Audit History</h3>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground p-2 bg-slate-100 dark:bg-slate-900 rounded">
                <div className="flex items-center justify-between">
                  <span>Transaction created</span>
                  <span>{format(parseISO(transaction.createdAt), 'PPpp')}</span>
                </div>
              </div>
              {transaction.updatedAt !== transaction.createdAt && (
                <div className="text-xs text-muted-foreground p-2 bg-slate-100 dark:bg-slate-900 rounded">
                  <div className="flex items-center justify-between">
                    <span>Transaction updated</span>
                    <span>{format(parseISO(transaction.updatedAt), 'PPpp')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {transaction.status === TransactionStatus.FAILED && (
                <Button
                  variant="outline"
                  size="sm"
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
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false)
                      onAction('refund', transaction)
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Refund
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
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
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onAction('flag', transaction)
                }}
              >
                <Flag className="h-4 w-4 mr-2" />
                Flag for Review
              </Button>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


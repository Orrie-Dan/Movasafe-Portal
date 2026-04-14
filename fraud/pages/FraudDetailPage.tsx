'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { FraudSignalsBadges } from '@/fraud/components/FraudSignalsBadges'
import { apiApproveFraudTransfer, apiGetFraudTransactionById, apiRejectFraudTransfer } from '@/fraud/services/fraudReviewApi'
import type { FraudTransaction } from '@/fraud/types'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

function currencyFrom(tx: FraudTransaction): string {
  return tx.currency || tx.toDetails?.currency || tx.fromDetails?.currency || 'RWF'
}

function formatAmount(amount?: number | null, currency: string = 'RWF'): string {
  const n = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${currency}`
}

function statusBadgeClass(status?: string | null): string {
  const s = String(status ?? '').toUpperCase()
  if (s === 'SUCCESSFUL') return 'bg-green-500/10 text-green-400 border-green-500/20'
  if (s === 'FRAUD_REJECTED') return 'bg-red-500/10 text-red-400 border-red-500/20'
  if (s === 'PENDING_REVIEW') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

export default function FraudDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const transactionId = String(params.transactionId || '')

  const [tx, setTx] = useState<FraudTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [mutating, setMutating] = useState(false)

  const isPendingReview = useMemo(() => String(tx?.status ?? '').toUpperCase() === 'PENDING_REVIEW', [tx?.status])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGetFraudTransactionById(transactionId)
      setTx(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load transaction')
      setTx(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (transactionId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId])

  const handleApprove = async () => {
    if (!tx) return
    setMutating(true)
    try {
      const updated = await apiApproveFraudTransfer(tx.id, notes)
      toast({ title: 'Approved', description: 'Transfer executed and marked successful.' })
      setTx(updated)
      setApproveOpen(false)
      setNotes('')
      // Remove from pending list by navigating back to queue (fresh fetch will drop it)
      navigate('/admin/fraud-management')
    } catch (e) {
      toast({
        title: 'Approval failed',
        description: e instanceof Error ? e.message : 'Unable to approve transfer',
        variant: 'destructive',
      })
    } finally {
      setMutating(false)
    }
  }

  const handleReject = async () => {
    if (!tx) return
    const trimmed = notes.trim()
    if (!trimmed) {
      toast({ title: 'Notes required', description: 'Please provide rejection notes.', variant: 'destructive' })
      return
    }
    setMutating(true)
    try {
      const updated = await apiRejectFraudTransfer(tx.id, trimmed)
      toast({ title: 'Rejected', description: 'Transfer was rejected. No funds moved.' })
      setTx(updated)
      setRejectOpen(false)
      setNotes('')
      navigate('/admin/fraud-management')
    } catch (e) {
      toast({
        title: 'Rejection failed',
        description: e instanceof Error ? e.message : 'Unable to reject transfer',
        variant: 'destructive',
      })
    } finally {
      setMutating(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-white dark:bg-black min-h-screen">
      <PageHeader
        title="Fraud Review"
        description="Approve or reject the transfer before funds movement"
        backButton={{ label: 'Back to Fraud Management', href: '/admin/fraud-management' }}
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 text-sm text-red-400">{error}</CardContent>
        </Card>
      ) : !tx ? (
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6 text-sm text-muted-foreground">Transaction not found.</CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-base">Transaction</CardTitle>
                  <div className="text-xs text-muted-foreground font-mono">{tx.id}</div>
                </div>
                <Badge className={cn('text-xs', statusBadgeClass(tx.status))}>{tx.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPendingReview && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <div className="flex items-center gap-2 text-sm text-yellow-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Pending admin decision</span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Funds have <span className="font-medium">not</span> moved yet. Approving will execute the ledger transfer; rejecting will block it.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="text-xs text-muted-foreground">Amount</div>
                  <div className="mt-1 text-lg font-bold">{formatAmount(tx.amount, currencyFrom(tx))}</div>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="text-xs text-muted-foreground">Created</div>
                  <div className="mt-1 text-sm">{tx.createdAt ? format(parseISO(tx.createdAt), 'PPp') : '—'}</div>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="text-xs text-muted-foreground">Reference</div>
                  <div className="mt-1 text-sm font-mono truncate">{tx.internalReference || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                  <div className="text-xs text-muted-foreground mb-2">Sender</div>
                  <div className="text-sm font-medium">{tx.fromDetails?.ownerName || tx.fromDetails?.accountName || '—'}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{tx.fromDetails?.ownerPhoneNumber || '—'}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{tx.fromDetails?.ownerEmail || '—'}</div>
                  <div className="mt-2 text-xs font-mono text-muted-foreground">{tx.fromDetails?.accountNumber || '—'}</div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                  <div className="text-xs text-muted-foreground mb-2">Recipient</div>
                  <div className="text-sm font-medium">{tx.toDetails?.ownerName || tx.toDetails?.accountName || '—'}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{tx.toDetails?.ownerPhoneNumber || '—'}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{tx.toDetails?.ownerEmail || '—'}</div>
                  <div className="mt-2 text-xs font-mono text-muted-foreground">{tx.toDetails?.accountNumber || '—'}</div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Fraud signals</div>
                  <FraudSignalsBadges fraudSignals={tx.fraudSignals} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Fraud review reason</div>
                  <div className="text-sm">{tx.fraudReviewReason || '—'}</div>
                </div>
              </div>

              {(tx.fraudReviewedAt || tx.fraudReviewedBy) && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
                  <div className="text-xs text-muted-foreground">Review metadata</div>
                  <div className="text-sm">Reviewed by: <span className="font-medium">{tx.fraudReviewedBy || '—'}</span></div>
                  <div className="text-sm">Reviewed at: <span className="font-medium">{tx.fraudReviewedAt ? format(parseISO(tx.fraudReviewedAt), 'PPp') : '—'}</span></div>
                  <div className="text-sm">Notes: <span className="font-medium">{tx.fraudReviewNotes || '—'}</span></div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={load} disabled={mutating}>
                  Refresh
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => { setRejectOpen(true); setNotes('') }}
                  disabled={!isPendingReview || mutating}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => { setApproveOpen(true); setNotes('') }}
                  disabled={!isPendingReview || mutating}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Approve dialog */}
          <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
            <DialogContent className="bg-black border border-slate-800 text-white max-w-xl">
              <DialogHeader>
                <DialogTitle>Approve transfer</DialogTitle>
                <DialogDescription>
                  This will execute the wallet-to-wallet ledger movement and mark the transaction as <strong>SUCCESSFUL</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <div className="text-xs text-slate-400">Review notes (optional)</div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for audit trail..."
                  className="bg-black border-slate-700 text-white"
                />
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={mutating}>
                  Cancel
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={mutating}>
                  {mutating ? 'Approving...' : 'Approve'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reject dialog */}
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogContent className="bg-black border border-slate-800 text-white max-w-xl">
              <DialogHeader>
                <DialogTitle>Reject transfer</DialogTitle>
                <DialogDescription>
                  Rejection requires notes. No funds will move; status becomes <strong>FRAUD_REJECTED</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <div className="text-xs text-slate-400">Rejection notes (required)</div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain why this transfer is rejected..."
                  className="bg-black border-slate-700 text-white"
                />
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={mutating}>
                  Cancel
                </Button>
                <Button className="bg-red-600 hover:bg-red-700" onClick={handleReject} disabled={mutating}>
                  {mutating ? 'Rejecting...' : 'Reject'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}


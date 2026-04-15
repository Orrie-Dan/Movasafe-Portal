'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { apiGetFraudReviewTransactions, apiApproveFraudReview, apiRejectFraudReview, type Transaction } from '@/lib/api/transactions'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, CheckCircle2, Search, ShieldCheck, ShieldX } from 'lucide-react'

type FraudDecision = 'APPROVE' | 'REJECT'

function getSignals(tx: any): string[] {
  const raw = tx?.signals ?? tx?.riskSignals ?? tx?.riskIndicators ?? tx?.fraudSignals
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()]
  return []
}

function getReviewReason(tx: any): string {
  return (
    tx?.reviewReason ??
    tx?.riskReason ??
    tx?.fraudReason ??
    tx?.fraudReviewReason ??
    tx?.reason ??
    tx?.description ??
    '—'
  )
}

function getWalletLabel(details: any): string {
  if (!details) return '—'
  const source = details.accountSource ?? details.source ?? details.type
  const number = details.accountNumber ?? details.number ?? details.phoneNumber
  const name = details.accountName ?? details.name
  return [name, source, number].filter(Boolean).join(' • ') || '—'
}

function StatusBadge({ status }: { status: string }) {
  const normalized = String(status ?? '').toUpperCase()
  if (normalized === 'PENDING_REVIEW') return <Badge variant="secondary">PENDING_REVIEW</Badge>
  if (normalized === 'SUCCESSFUL') return <Badge className="bg-green-600 text-white">SUCCESSFUL</Badge>
  if (normalized === 'FRAUD_REJECTED') return <Badge variant="destructive">FRAUD_REJECTED</Badge>
  return <Badge variant="outline">{normalized || '—'}</Badge>
}

export default function RiskFraudPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Transaction[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [decision, setDecision] = useState<FraudDecision | null>(null)
  const [notes, setNotes] = useState('')
  const [notesError, setNotesError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
    variant?: 'default' | 'destructive'
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await apiGetFraudReviewTransactions({
          page: 0,
          limit: pageSize,
          sortBy: 'createdAt',
          order: 'desc',
        })
        const content = res?.data?.content ?? []
        if (!cancelled) setRows(content)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load pending review transactions'
        if (!cancelled) {
          setError(msg)
          setRows([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [pageSize, refreshTrigger])

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((tx: any) => {
      const hay = [
        tx?.id,
        tx?.internalReference,
        tx?.fromDetails?.accountNumber,
        tx?.toDetails?.accountNumber,
        tx?.fromDetails?.accountName,
        tx?.toDetails?.accountName,
        tx?.description,
        getReviewReason(tx),
        ...getSignals(tx),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [rows, searchQuery])

  const openDecision = (tx: Transaction, d: FraudDecision) => {
    setSelectedTx(tx)
    setDecision(d)
    setNotes('')
    setNotesError('')
  }

  const validateNotes = (value: string) => {
    const trimmed = value.trim()
    if (trimmed.length < 10 || trimmed.length > 2000) return 'Notes must be between 10 and 2000 characters'
    return ''
  }

  const submitDecision = async () => {
    if (!selectedTx || !decision) return
    const status = String((selectedTx as any)?.status ?? '').toUpperCase()
    if (status !== 'PENDING_REVIEW') {
      toast({
        title: 'Invalid state',
        description: 'This action only works while the transaction is PENDING_REVIEW.',
        variant: 'destructive',
      })
      return
    }

    const err = validateNotes(notes)
    if (err) {
      setNotesError(err)
      return
    }

    const verb = decision === 'APPROVE' ? 'approve' : 'reject'
    const title = decision === 'APPROVE' ? 'Approve Fraud Review' : 'Reject Fraud Review'

    setConfirmDialog({
      open: true,
      title,
      description: `Are you sure you want to ${verb} this transaction? This will update its status and log an audit event.`,
      variant: decision === 'REJECT' ? 'destructive' : 'default',
      onConfirm: async () => {
        try {
          setSubmitting(true)
          if (decision === 'APPROVE') {
            await apiApproveFraudReview(selectedTx.id, notes.trim())
          } else {
            await apiRejectFraudReview(selectedTx.id, notes.trim())
          }

          toast({
            title: 'Success',
            description: decision === 'APPROVE' ? 'Fraud review approved. Transfer executed.' : 'Fraud review rejected. No funds moved.',
          })

          setSelectedTx(null)
          setDecision(null)
          setNotes('')
          setNotesError('')
          setRefreshTrigger((v) => v + 1)
        } catch (e) {
          toast({
            title: 'Error',
            description: e instanceof Error ? e.message : 'Failed to submit fraud review decision',
            variant: 'destructive',
          })
        } finally {
          setSubmitting(false)
          setConfirmDialog((prev) => ({ ...prev, open: false }))
        }
      },
    })
  }

  const columns: Column<Transaction>[] = [
    {
      key: 'createdAt',
      header: 'Created',
      accessor: (tx: any) => (
        <span className="text-sm text-muted-foreground">
          {tx?.createdAt ? format(parseISO(tx.createdAt), 'dd MMM yyyy, HH:mm') : '—'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'wallets',
      header: 'Wallets',
      accessor: (tx: any) => (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">From</div>
          <div className="text-sm">{getWalletLabel(tx?.fromDetails)}</div>
          <div className="text-xs text-muted-foreground pt-1">To</div>
          <div className="text-sm">{getWalletLabel(tx?.toDetails)}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (tx: any) => (
        <span className="font-medium">
          {Number(tx?.amount ?? 0).toLocaleString()} {tx?.currency ?? tx?.fromDetails?.currency ?? tx?.toDetails?.currency ?? 'RWF'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (tx: any) => <StatusBadge status={tx?.status} />,
    },
    {
      key: 'signals',
      header: 'Signals',
      accessor: (tx: any) => {
        const signals = getSignals(tx)
        if (signals.length === 0) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex flex-wrap gap-2">
            {signals.slice(0, 3).map((s) => (
              <Badge key={s} variant="outline" className="text-xs">
                {s}
              </Badge>
            ))}
            {signals.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{signals.length - 3}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      key: 'reviewReason',
      header: 'Review reason',
      accessor: (tx: any) => (
        <span className="text-sm text-muted-foreground" title={getReviewReason(tx)}>
          {getReviewReason(tx)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      accessor: (tx: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            disabled={String(tx?.status ?? '').toUpperCase() !== 'PENDING_REVIEW'}
            onClick={() => openDecision(tx, 'APPROVE')}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={String(tx?.status ?? '').toUpperCase() !== 'PENDING_REVIEW'}
            onClick={() => openDecision(tx, 'REJECT')}
          >
            <ShieldX className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-white dark:bg-black min-h-screen">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          Risk & Fraud Management
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Sorted by createdAt (newest first). Use pagination to navigate.
        </p>
      </div>

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Pending Fraud Reviews
              </CardTitle>
              <CardDescription>
                Transactions flagged for review before funds move ({filteredRows.length} found)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-56 bg-background border-slate-200 dark:border-slate-700"
                />
              </div>
              <SelectPageSize value={pageSize} onChange={setPageSize} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">Failed to load</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <p className="text-lg font-medium">No transactions pending review</p>
              <p className="text-sm">Flagged transactions will appear here</p>
            </div>
          ) : (
            <DataTable
              data={filteredRows}
              columns={columns}
              pagination={{ pageSize }}
              emptyMessage="No pending review transactions found"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTx && !!decision} onOpenChange={(open) => (!open ? (setSelectedTx(null), setDecision(null)) : null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {decision === 'APPROVE' ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  Approve Fraud Review
                </>
              ) : (
                <>
                  <ShieldX className="h-5 w-5 text-red-500" />
                  Reject Fraud Review
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTx ? `Transaction ID: ${selectedTx.id}` : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={(selectedTx as any)?.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-medium mt-1">
                    {Number((selectedTx as any)?.amount ?? 0).toLocaleString()} {(selectedTx as any)?.currency ?? 'RWF'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Review reason</p>
                  <p className="text-sm mt-1">{getReviewReason(selectedTx as any)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Notes (Required: 10–2000 characters)
                </label>
                <Textarea
                  placeholder="Enter decision notes..."
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value)
                    setNotesError('')
                  }}
                  className="bg-background border-slate-200 dark:border-slate-700 min-h-[120px]"
                />
                {notesError && <p className="text-sm text-red-500 mt-1">{notesError}</p>}
                <p className="text-xs text-muted-foreground mt-1">{notes.length} / 2000 characters</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => (setSelectedTx(null), setDecision(null))} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={submitDecision}
              disabled={submitting}
              className={decision === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={decision === 'REJECT' ? 'destructive' : 'default'}
            >
              {decision === 'APPROVE' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  )
}

function SelectPageSize({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">per page</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-background px-2 text-sm"
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
      </select>
    </div>
  )
}

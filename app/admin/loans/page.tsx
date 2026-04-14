'use client'

import { useState, useEffect } from 'react'
import {
  apiGetAdminLoans,
  apiGetAdminLoanById,
  apiApproveLoan,
  apiRejectLoan,
  apiGetAdminRepaymentHistory,
} from '@/lib/api/lending'
import type { LoanResponse, LoanStatus } from '@/lib/types/lending'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewDetailsDialog } from '@/components/admin/ViewDetailsDialog'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'

function getLoanStatusBadge(status: LoanStatus | string) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
    case 'APPROVED':
    case 'OFFERED':
      return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
    case 'DISBURSED':
    case 'ACTIVE':
      return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30'
    case 'PAID':
      return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
    case 'DEFAULTED':
      return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30'
    case 'CANCELLED':
    case 'EXPIRED':
      return 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/30'
    default:
      return 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/30'
  }
}

function formatCurrency(amount: number, currency: string = 'RWF'): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0
  const rounded = Math.round(safeAmount)
  const code = (currency || 'RWF').toLowerCase()
  return `${rounded}${code}`
}

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLoan, setSelectedLoan] = useState<LoanResponse | null>(null)
  const [selectedRepaymentHistory, setSelectedRepaymentHistory] = useState<{ id: string; amount: number; paidAt: string }[]>([])
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [approveNotes, setApproveNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const limit = 20

  const fetchLoans = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiGetAdminLoans({
        page,
        limit,
        sortBy: 'createdAt',
        order: 'DESC',
        status: filterStatus && filterStatus !== 'all' ? (filterStatus as LoanStatus) : undefined,
      })
      setLoans(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch (err) {
      console.error('Failed to fetch loans:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch loans')
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch loans',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [page, filterStatus])

  const handleViewLoan = async (loan: LoanResponse) => {
    try {
      const fullLoan = await apiGetAdminLoanById(loan.id)
      setSelectedLoan(fullLoan)
      try {
        const history = await apiGetAdminRepaymentHistory(loan.id)
        setSelectedRepaymentHistory(history)
      } catch {
        setSelectedRepaymentHistory([])
      }
      setIsDetailOpen(true)
    } catch (err) {
      setSelectedLoan(loan)
      setSelectedRepaymentHistory([])
      setIsDetailOpen(true)
    }
  }

  const handleQuickApprove = async (loan: LoanResponse) => {
    setActionLoading(loan.id)
    try {
      await apiApproveLoan(loan.id, {
        approvalNotes: undefined,
      })
      toast({
        title: 'Success',
        description: 'Loan approved successfully',
      })
      fetchLoans()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve loan',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleQuickReject = async (loan: LoanResponse) => {
    setActionLoading(loan.id)
    try {
      await apiRejectLoan(loan.id, {
        rejectionReason: undefined,
      })
      toast({
        title: 'Success',
        description: 'Loan rejected successfully',
      })
      fetchLoans()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject loan',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveClick = () => {
    setApproveNotes('')
    setApproveDialogOpen(true)
  }

  const handleApproveConfirm = async () => {
    if (!selectedLoan) return
    setActionLoading(selectedLoan.id)
    try {
      await apiApproveLoan(selectedLoan.id, {
        approvalNotes: approveNotes.trim() || undefined,
      })
      toast({
        title: 'Success',
        description: 'Loan approved successfully',
      })
      setApproveDialogOpen(false)
      setApproveNotes('')
      fetchLoans()
      setIsDetailOpen(false)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve loan',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectClick = () => {
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!selectedLoan) return
    setActionLoading(selectedLoan.id)
    try {
      await apiRejectLoan(selectedLoan.id, {
        rejectionReason: rejectReason.trim() || undefined,
      })
      toast({
        title: 'Success',
        description: 'Loan rejected successfully',
      })
      setRejectDialogOpen(false)
      setRejectReason('')
      fetchLoans()
      setIsDetailOpen(false)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject loan',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const canApproveReject = selectedLoan?.status === 'PENDING'

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 dark:bg-slate-900/50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Loan Approvals</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Review and approve or reject pending loan applications
          </p>
        </div>
        <Button onClick={fetchLoans} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50">
            <CardTitle className="text-sm text-slate-900 dark:text-white">Total (filtered)</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalElements}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50">
            <CardTitle className="text-sm text-slate-900 dark:text-white">Pending</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {filterStatus === 'PENDING' ? totalElements : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-200 dark:border-slate-900/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-white">Filters</CardTitle>
            <Select value={filterStatus || 'all'} onValueChange={(v) => { setFilterStatus(v === 'all' ? '' : v); setPage(0) }}>
              <SelectTrigger className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="OFFERED">Offered</SelectItem>
                <SelectItem value="DISBURSED">Disbursed</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="DEFAULTED">Defaulted</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full bg-slate-800" />
          ))}
        </div>
      ) : error ? (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      ) : loans.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No loans found"
          description="No loans match your filters. Try changing the status filter."
        />
      ) : (
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-200 dark:border-slate-900/50">
            <CardTitle className="text-slate-900 dark:text-white">
              Loans ({totalElements})
            </CardTitle>
          </div>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead className="text-slate-400">Reference</TableHead>
                  <TableHead className="text-slate-400">First Name</TableHead>
                  <TableHead className="text-slate-400">Last Name</TableHead>
                  <TableHead className="text-slate-400">Principal</TableHead>
                  <TableHead className="text-slate-400">Interest</TableHead>
                  <TableHead className="text-slate-400">Total Payable</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Created</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow
                    key={loan.id}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  >
                    <TableCell className="font-mono text-sm text-slate-900 dark:text-white">
                      {loan.reference || '—'}
                    </TableCell>
                    <TableCell className="text-slate-900 dark:text-white">
                      {loan.firstName || '—'}
                    </TableCell>
                    <TableCell className="text-slate-900 dark:text-white">
                      {loan.lastName || '—'}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      {formatCurrency(loan.principal, loan.currency || 'RWF')}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {loan.interestRate}% / {formatCurrency(loan.interestAmount, loan.currency || 'RWF')}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      {formatCurrency(loan.totalPayable, loan.currency || 'RWF')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getLoanStatusBadge(loan.status)}>{loan.status}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                      {format(parseISO(loan.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      {loan.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickApprove(loan)}
                            disabled={actionLoading === loan.id}
                          >
                            {actionLoading === loan.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleQuickReject(loan)}
                            disabled={actionLoading === loan.id}
                          >
                            {actionLoading === loan.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleViewLoan(loan)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedLoan && (
        <ViewDetailsDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          title="Loan Details"
          subtitle={selectedLoan.id}
          onCopySubtitle={() => {
            navigator.clipboard.writeText(selectedLoan.id)
            toast({ title: 'Copied', description: 'Loan ID copied to clipboard' })
          }}
          badge={<Badge className={getLoanStatusBadge(selectedLoan.status)}>{selectedLoan.status}</Badge>}
          maxWidth="4xl"
          sections={[
            {
              title: 'Loan',
              gridCols: 2,
              fields: [
                { label: 'Loan ID', value: <span className="font-mono text-sm">{selectedLoan.id}</span> },
                { label: 'Reference', value: <span className="font-mono text-sm">{selectedLoan.reference || '—'}</span> },
                { label: 'Borrower ID', value: <Link to={`/admin/users/${selectedLoan.userId}`} className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline">{selectedLoan.userId}</Link> },
                { label: 'Principal', value: <span className="font-bold">{formatCurrency(selectedLoan.principal, selectedLoan.currency || 'RWF')}</span> },
                { label: 'Interest Rate', value: <span>{selectedLoan.interestRate}%</span> },
                { label: 'Interest Amount', value: <span className="font-bold">{formatCurrency(selectedLoan.interestAmount, selectedLoan.currency || 'RWF')}</span> },
                { label: 'Total Payable', value: <span className="font-bold">{formatCurrency(selectedLoan.totalPayable, selectedLoan.currency || 'RWF')}</span> },
                { label: 'Term Days', value: <span>{selectedLoan.termDays}</span> },
                { label: 'Total Paid', value: <span className="text-green-600 dark:text-green-400">{selectedLoan.totalPaid != null ? formatCurrency(selectedLoan.totalPaid, selectedLoan.currency || 'RWF') : '—'}</span> },
                { label: 'Created', value: format(parseISO(selectedLoan.createdAt), 'PPpp') },
                { label: 'Disbursed', value: selectedLoan.disbursedAt ? format(parseISO(selectedLoan.disbursedAt), 'PPpp') : '—' },
                { label: 'Due Date', value: selectedLoan.dueDate ? format(parseISO(selectedLoan.dueDate), 'PP') : '—' },
                { label: 'Last Payment', value: selectedLoan.lastPaymentAt ? format(parseISO(selectedLoan.lastPaymentAt), 'PPpp') : '—' },
              ],
            },
            ...(selectedRepaymentHistory.length > 0
              ? [
                  {
                    title: 'Repayment History',
                    gridCols: 1,
                    children: (
                      <div className="space-y-2">
                        {selectedRepaymentHistory.map((r) => (
                          <div key={r.id} className="flex justify-between text-sm py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                            <span>{formatCurrency(r.amount)}</span>
                            <span className="text-slate-500">{format(parseISO(r.paidAt), 'PPpp')}</span>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
          actions={
            canApproveReject
              ? [
                  {
                    label: actionLoading === selectedLoan.id ? 'Approving...' : 'Approve',
                    onClick: handleApproveClick,
                    icon: actionLoading === selectedLoan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />,
                    disabled: actionLoading === selectedLoan.id,
                  },
                  {
                    label: actionLoading === selectedLoan.id ? 'Rejecting...' : 'Reject',
                    onClick: handleRejectClick,
                    variant: 'destructive',
                    icon: actionLoading === selectedLoan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />,
                    disabled: actionLoading === selectedLoan.id,
                  },
                ]
              : undefined
          }
        />
      )}

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-notes">Approval notes (optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add notes for audit trail..."
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveConfirm} disabled={actionLoading !== null}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection reason (optional)</Label>
              <Textarea
                id="reject-reason"
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={actionLoading !== null}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

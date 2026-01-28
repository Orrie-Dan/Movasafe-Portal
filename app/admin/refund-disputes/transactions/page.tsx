'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RefreshCw, Filter, Eye, RotateCcw, AlertCircle } from 'lucide-react'
import { apiGetAllTransactions, Transaction, apiStandardReversal, apiForceReversal } from '@/lib/api/transactions'
import { useAuth } from '@/lib/auth/hooks'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { toast } from '@/hooks/use-toast'

export default function TransactionDisputesPage() {
  const { user, hasPermission } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  // Filters
  const [dateRange, setDateRange] = useState<'all' | '7' | '30' | '90'>('30')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  // Dialog states
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [standardReversalOpen, setStandardReversalOpen] = useState(false)
  const [forceReversalOpen, setForceReversalOpen] = useState(false)
  const [reversalReason, setReversalReason] = useState('')
  const [reversalNotes, setReversalNotes] = useState('')
  const [reversalLoading, setReversalLoading] = useState(false)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US').format(amount)
  }

  const handleStandardReversal = async () => {
    if (!selectedTransaction || !reversalReason.trim()) {
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
      console.log('[handleStandardReversal] Sending payload:', payload)
      
      const response = await apiStandardReversal(selectedTransaction.internalReference || '', payload)

      if (response.status === 'success') {
        toast({
          title: 'Success',
          description: 'Transfer reversed successfully',
        })
        setStandardReversalOpen(false)
        setReversalReason('')
        setReversalNotes('')
        setSelectedTransaction(null)
        await fetchTransactions()
      }
    } catch (err) {
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
    if (!selectedTransaction || !reversalReason.trim()) {
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
      console.log('[handleForceReversal] Sending payload:', payload)
      
      const response = await apiForceReversal(selectedTransaction.internalReference || '', payload)

      if (response.status === 'success') {
        toast({
          title: 'Success',
          description: 'Transfer force-reversed with debt created',
        })
        setForceReversalOpen(false)
        setReversalReason('')
        setReversalNotes('')
        setSelectedTransaction(null)
        await fetchTransactions()
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to force reverse transaction',
        variant: 'destructive',
      })
    } finally {
      setReversalLoading(false)
    }
  }

  // Fetch transactions with filters
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = {
        page: page - 1,
        limit: 50,
        order: 'DESC',
        sortBy: 'createdAt',
        descriptions: ['WALLET_TRANSFER', 'WALLET_TRANSFER_REVERSAL_OUT', 'WALLET_TRANSFER_REVERSAL_IN'],
      }

      // Date range filter
      if (dateRange !== 'all') {
        const days = parseInt(dateRange)
        const startDate = startOfDay(subDays(new Date(), days))
        const endDate = endOfDay(new Date())
        filters.startDate = startDate.toISOString()
        filters.endDate = endDate.toISOString()
      }

      // Status filter
      if (statusFilter !== 'all') {
        filters.status = statusFilter
      }

      // Type filter
      if (typeFilter !== 'all') {
        filters.transactionType = typeFilter
      }

      // Search filter
      if (searchTerm.trim()) {
        filters.transactionReference = searchTerm.trim()
      }

      const response = await apiGetAllTransactions(filters)
      if (response.success && response.data?.content) {
        // Filter out ESCROW descriptions on client side as a safety measure
        const walletTransfers = response.data.content.filter(
          (t: Transaction) => 
            t.description === 'WALLET_TRANSFER' || 
            t.description === 'WALLET_TRANSFER_REVERSAL_OUT' || 
            t.description === 'WALLET_TRANSFER_REVERSAL_IN'
        )
        setTransactions(walletTransfers)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch transactions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [dateRange, statusFilter, typeFilter, searchTerm, page])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction Disputes</h1>
          <p className="text-gray-400 mt-1">Manage and review wallet transfer disputes</p>
        </div>
        <Button onClick={fetchTransactions} disabled={loading} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="dark:bg-black dark:border-slate-800">
        <CardHeader className="dark:border-b dark:border-slate-700">
          <CardTitle className="text-base flex items-center gap-2 dark:text-white">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-white">Date Range</label>
              <Select value={dateRange} onValueChange={(val) => {
                setDateRange(val as any)
                setPage(1)
              }}>
                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-white">Status</label>
              <Select value={statusFilter} onValueChange={(val) => {
                setStatusFilter(val)
                setPage(1)
              }}>
                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-white">Type</label>
              <Select value={typeFilter} onValueChange={(val) => {
                setTypeFilter(val)
                setPage(1)
              }}>
                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CASH_IN">Cash In</SelectItem>
                  <SelectItem value="CASH_OUT">Cash Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-white">Search</label>
              <Input
                placeholder="Reference, phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="dark:bg-black dark:border-slate-800">
        <CardHeader className="dark:border-b dark:border-slate-700">
          <CardTitle className="text-base dark:text-white">Transactions</CardTitle>
          <CardDescription className="dark:text-slate-400">{transactions.length} transactions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 dark:text-slate-400">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 dark:text-slate-400">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="dark:border-b dark:border-slate-700 dark:bg-slate-900/50">
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">Reference</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">User ID</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">Date</th>
                    <th className="text-right py-3 px-2 text-sm font-medium dark:text-slate-400">Amount</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">Type</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">Description</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">Status</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">From</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">To</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="dark:border-b dark:border-slate-700 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-2 font-mono text-sm dark:text-white">{transaction.internalReference}</td>
                      <td className="py-3 px-2 font-mono text-sm dark:text-white">{transaction.userId || '-'}</td>
                      <td className="py-3 px-2 dark:text-slate-300 text-sm">{format(new Date(transaction.createdAt || 0), 'MMM dd, HH:mm')}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold dark:text-white">{new Intl.NumberFormat('en-US').format(transaction.amount || 0)} RWF</td>
                      <td className="py-3 px-2 text-sm dark:text-slate-300">{transaction.transactionType}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-sm">{transaction.description}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          className={`text-sm ${
                            transaction.status === 'SUCCESSFUL'
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : transaction.status === 'PENDING'
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <div className="space-y-1">
                          <div className="dark:text-slate-400 text-sm">{transaction.fromDetails?.accountSource || '-'}</div>
                          <div className="font-mono text-sm dark:text-slate-500">{transaction.fromDetails?.accountNumber?.substring(0, 8) || '-'}...</div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <div className="space-y-1">
                          <div className="dark:text-slate-400 text-sm">{transaction.toDetails?.accountSource || '-'}</div>
                          <div className="font-mono text-sm dark:text-slate-500">{transaction.toDetails?.accountNumber?.substring(0, 8) || '-'}...</div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-blue-500/20 hover:text-blue-400"
                            onClick={() => {
                              setSelectedTransaction(transaction)
                              setDetailDialogOpen(true)
                            }}
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Standard Reversal Dialog */}
      {standardReversalOpen && selectedTransaction && (
        <Dialog open={standardReversalOpen} onOpenChange={setStandardReversalOpen}>
          <DialogContent className="bg-gray-950 border border-gray-800 text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle>Reverse Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                <p className="text-xs text-gray-400 uppercase">Transaction Reference</p>
                <p className="text-sm font-mono text-blue-400 break-all">{selectedTransaction.internalReference}</p>
              </div>
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                <p className="text-xs text-gray-400 uppercase">Amount</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(selectedTransaction.amount || 0)} RWF</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Reason for Reversal</label>
                <Input
                  placeholder="e.g., Duplicate transaction, User request..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Admin Notes (Optional)</label>
                <Input
                  placeholder="Additional notes..."
                  value={reversalNotes}
                  onChange={(e) => setReversalNotes(e.target.value)}
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={() => setStandardReversalOpen(false)}
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
      {forceReversalOpen && selectedTransaction && (
        <Dialog open={forceReversalOpen} onOpenChange={setForceReversalOpen}>
          <DialogContent className="bg-gray-950 border border-gray-800 text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle>Force Reverse Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-800 p-3 rounded">
                <p className="text-sm text-red-400">
                  <strong>Warning:</strong> This will create debt if the receiver has insufficient funds to cover the reversal.
                </p>
              </div>
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                <p className="text-xs text-gray-400 uppercase">Transaction Reference</p>
                <p className="text-sm font-mono text-blue-400 break-all">{selectedTransaction.internalReference}</p>
              </div>
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                <p className="text-xs text-gray-400 uppercase">Amount</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(selectedTransaction.amount || 0)} RWF</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Reason for Force Reversal</label>
                <Input
                  placeholder="e.g., Dispute resolution, Compliance..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Admin Notes (Optional)</label>
                <Input
                  placeholder="Additional notes..."
                  value={reversalNotes}
                  onChange={(e) => setReversalNotes(e.target.value)}
                  className="bg-gray-900 border-gray-800 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={() => setForceReversalOpen(false)}
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

      {/* Detail Dialog */}
      {detailDialogOpen && selectedTransaction && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-gray-700 pb-4">
              <DialogTitle className="text-2xl">Transaction Details</DialogTitle>
              <DialogDescription>Reference: {selectedTransaction?.internalReference}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-6">
              {/* Status and Key Info */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</p>
                    <Badge className="mt-2" variant={
                      selectedTransaction?.status === 'SUCCESSFUL'
                        ? 'default'
                        : selectedTransaction?.status === 'PENDING'
                        ? 'secondary'
                        : 'destructive'
                    }>
                      {selectedTransaction?.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</p>
                    <p className="text-2xl font-bold text-green-400 mt-2">{new Intl.NumberFormat('en-US').format(selectedTransaction?.amount || 0)} RWF</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</p>
                    <p className="text-lg font-semibold mt-2">{selectedTransaction?.transactionType}</p>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 border-b border-gray-700 pb-2">User Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Name</p>
                    <p className="text-sm mt-1 font-medium">{selectedTransaction?.userName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Phone Number</p>
                    <p className="text-sm mt-1 font-medium">{selectedTransaction?.userPhoneNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">National ID</p>
                    <p className="text-sm mt-1 font-mono">{selectedTransaction?.userNationalId || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Currency</p>
                    <p className="text-sm mt-1">{selectedTransaction?.currency || 'RWF'}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 border-b border-gray-700 pb-2">Transaction Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Reference</p>
                    <p className="text-sm mt-1 font-mono text-blue-400 break-all">{selectedTransaction?.internalReference}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Description</p>
                    <Badge variant="outline" className="mt-1">{selectedTransaction?.description}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Created Date</p>
                    <p className="text-sm mt-1">{format(new Date(selectedTransaction?.createdAt || 0), 'PPp')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Updated Date</p>
                    <p className="text-sm mt-1">{format(new Date(selectedTransaction?.updatedAt || 0), 'PPp')}</p>
                  </div>
                </div>
              </div>

              {/* From Account */}
              {selectedTransaction?.fromDetails && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 border-b border-gray-700 pb-2">From Account</h3>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Account Name</p>
                      <p className="text-sm mt-1 font-medium">{selectedTransaction.fromDetails.accountName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Account Source</p>
                      <p className="text-sm mt-1 font-medium">{selectedTransaction.fromDetails.accountSource || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 font-semibold uppercase">Account Number</p>
                      <p className="text-sm mt-1 font-mono text-gray-300">{selectedTransaction.fromDetails.accountNumber || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* To Account */}
              {selectedTransaction?.toDetails && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3 border-b border-gray-700 pb-2">To Account</h3>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Account Name</p>
                      <p className="text-sm mt-1 font-medium">{selectedTransaction.toDetails.accountName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Account Source</p>
                      <p className="text-sm mt-1 font-medium">{selectedTransaction.toDetails.accountSource || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 font-semibold uppercase">Account Number</p>
                      <p className="text-sm mt-1 font-mono text-gray-300">{selectedTransaction.toDetails.accountNumber || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 pt-4 flex justify-end gap-2">
              {selectedTransaction?.status === 'SUCCESSFUL' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDetailDialogOpen(false)
                      setStandardReversalOpen(true)
                    }}
                    className="hover:bg-amber-500/20 hover:text-amber-400"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reverse
                  </Button>
                  {hasPermission('FORCE_REVERSE_TRANSACTION') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetailDialogOpen(false)
                        setForceReversalOpen(true)
                      }}
                      className="hover:bg-red-500/20 hover:text-red-400"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Force Reverse
                    </Button>
                  )}
                </>
              )}
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

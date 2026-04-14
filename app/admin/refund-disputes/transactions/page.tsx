'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ViewDetailsDialog } from '@/components/admin/ViewDetailsDialog'
import { RefreshCw, Filter, Eye, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { apiGetAllTransactions, Transaction, apiStandardReversal, apiForceReversal, apiGetDisputedTransactions, apiResolveDispute } from '@/lib/api/transactions'
import { apiGetUsers } from '@/lib/api/users'
import { useAuth } from '@/lib/auth/hooks'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import type { User } from '@/lib/types/user'

export default function TransactionDisputesPage() {
  const { user, hasPermission } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<Map<string, User>>(new Map())
  const [loading, setLoading] = useState(false)
  const [resolvedTransactions, setResolvedTransactions] = useState<Transaction[]>([])
  const [resolvedLoading, setResolvedLoading] = useState(false)

  // Filters
  const [dateRange, setDateRange] = useState<'all' | '7' | '30' | '90'>('30')
  const [resolutionFilter, setResolutionFilter] = useState<string>('all')
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
  
  // Resolve dispute dialog state
  const [resolveDisputeOpen, setResolveDisputeOpen] = useState(false)
  const [resolveResolution, setResolveResolution] = useState<'UPHOLD' | 'COMPENSATE'>('UPHOLD')
  const [resolveReason, setResolveReason] = useState('')
  const [resolveLoading, setResolveLoading] = useState(false)
  const [showForceReverseAfterResolve, setShowForceReverseAfterResolve] = useState(false)

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

  // Handle resolve dispute
  const handleResolveDispute = async () => {
    if (!selectedTransaction) return

    if (!resolveReason.trim()) {
      toast({
        title: 'Error',
        description: 'Resolution notes are required',
        variant: 'destructive',
      })
      return
    }

    setResolveLoading(true)
    try {
      await apiResolveDispute(selectedTransaction.id, resolveResolution, resolveReason)
      
      toast({
        title: 'Success',
        description: `Dispute resolved with decision: ${resolveResolution}`,
      })

      // Refresh resolved table so newly resolved disputes appear immediately
      await loadResolved()

      // If COMPENSATE is selected, show force reverse dialog
      if (resolveResolution === 'COMPENSATE') {
        setResolveDisputeOpen(false)
        setShowForceReverseAfterResolve(true)
      } else {
        // UPHOLD - just close and refresh
        setResolveDisputeOpen(false)
        setDetailDialogOpen(false)
        setSelectedTransaction(null)
        setResolveResolution('UPHOLD')
        setResolveReason('')
        await fetchTransactions()
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to resolve dispute',
        variant: 'destructive',
      })
    } finally {
      setResolveLoading(false)
    }
  }

  // Fetch transactions with filters
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const disputedTransactions = await apiGetDisputedTransactions()
      
      // Client-side filtering
      let filtered = disputedTransactions

      // Date range filter
      if (dateRange !== 'all') {
        const days = parseInt(dateRange)
        const startDate = startOfDay(subDays(new Date(), days))
        filtered = filtered.filter(t => {
          const txDate = new Date(t.createdAt || 0)
          return txDate >= startDate
        })
      }

      // Resolution filter
      if (resolutionFilter !== 'all') {
        filtered = filtered.filter(t => (t as any).disputeResolution === resolutionFilter)
      }

      // Type filter
      if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.transactionType === typeFilter)
      }

      // Search filter (reference or phone)
      if (searchTerm.trim()) {
        const searchLower = searchTerm.trim().toLowerCase()
        filtered = filtered.filter(t => 
          (t.internalReference && t.internalReference.toLowerCase().includes(searchLower)) ||
          (t.userPhoneNumber && t.userPhoneNumber.toLowerCase().includes(searchLower))
        )
      }

      setTransactions(filtered)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch transactions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [dateRange, resolutionFilter, typeFilter, searchTerm, page])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiGetUsers({ limit: 1000 })
        const userMap = new Map<string, User>()
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach((user: User) => {
            userMap.set(user.id, user)
          })
        }
        setUsers(userMap)
      } catch (err) {
        console.error('Failed to load users:', err)
      }
    }

    fetchUsers()
  }, [])

  // Load resolved transaction disputes from /api/admin/transactions/all with status=RESOLVED_DISPUTE
  const loadResolved = useCallback(async () => {
    try {
      setResolvedLoading(true)
      const response = await apiGetAllTransactions({ status: 'RESOLVED_DISPUTE', limit: 100 })
      const content = response.success && response.data?.content ? response.data.content : []
      // Extra safety: only keep rows with status exactly RESOLVED_DISPUTE
      setResolvedTransactions((content || []).filter((tx) => tx.status === 'RESOLVED_DISPUTE'))
    } catch (err) {
      console.error('Failed to fetch resolved dispute transactions:', err)
    } finally {
      setResolvedLoading(false)
    }
  }, [])

  useEffect(() => {
    loadResolved()
  }, [loadResolved])

  const getUserNames = (userId: string) => {
    const user = users.get(userId)
    if (!user) {
      return { firstName: '-', lastName: '-' }
    }
    
    const fullName = user.fullName || ''
    const parts = fullName.split(' ')
    const firstName = parts[0] || '-'
    const lastName = parts.slice(1).join(' ') || '-'
    
    return { firstName, lastName }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction Disputes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and review wallet transfer disputes</p>
        </div>
        <Button onClick={fetchTransactions} disabled={loading} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b border-slate-200 dark:border-slate-900/50">
          <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date Range</label>
              <Select value={dateRange} onValueChange={(val) => {
                setDateRange(val as any)
                setPage(1)
              }}>
                <SelectTrigger className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dispute Resolution</label>
              <Select value={resolutionFilter} onValueChange={(val) => {
                setResolutionFilter(val)
                setPage(1)
              }}>
                <SelectTrigger className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectItem value="all">All Resolutions</SelectItem>
                  <SelectItem value="UPHOLD">Uphold</SelectItem>
                  <SelectItem value="COMPENSATE">Compensate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <Select value={typeFilter} onValueChange={(val) => {
                setTypeFilter(val)
                setPage(1)
              }}>
                <SelectTrigger className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CASH_IN">Cash In</SelectItem>
                  <SelectItem value="CASH_OUT">Cash Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Search</label>
              <Input
                placeholder="Reference, phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Transaction Disputes Table */}
      <Card className="dark:bg-black dark:border-slate-800">
        <CardHeader className="dark:border-b dark:border-slate-700">
          <CardTitle className="text-base dark:text-white">Open Transaction Disputes</CardTitle>
          <CardDescription className="dark:text-slate-400">
            {transactions.length} disputed transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/30">
            <h2 className="text-base font-semibold text-white">Open Transaction Disputes</h2>
            <p className="text-xs text-slate-400 mt-0.5">{transactions.length} disputed transactions</p>
          </div>
          {loading ? (
            <div className="text-center py-8 dark:text-slate-400">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 dark:text-slate-400">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="dark:border-b dark:border-slate-700 dark:bg-slate-900/50">
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">First Name</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">Last Name</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">Reference</th>
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
                      <td className="py-3 px-2 text-sm font-medium dark:text-white">{getUserNames(transaction.userId).firstName}</td>
                      <td className="py-3 px-2 text-sm font-medium dark:text-white">{getUserNames(transaction.userId).lastName}</td>
                      <td className="py-3 px-2 font-mono text-sm dark:text-white">{transaction.internalReference}</td>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-green-500/20 hover:text-green-400"
                            onClick={() => {
                              setSelectedTransaction(transaction)
                              setResolveDisputeOpen(true)
                            }}
                            title="Resolve dispute"
                          >
                            <CheckCircle2 className="w-4 h-4" />
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

      {/* Resolved Transaction Disputes Table */}
      <Card className="dark:bg-black dark:border-slate-800">
        <CardHeader className="dark:border-b dark:border-slate-700">
          <CardTitle className="text-base dark:text-white">Resolved Transaction Disputes</CardTitle>
          <CardDescription className="dark:text-slate-400">
            {resolvedTransactions.length} resolved transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/30">
            <h2 className="text-base font-semibold text-white">Resolved Transaction Disputes</h2>
            <p className="text-xs text-slate-400 mt-0.5">{resolvedTransactions.length} resolved transactions</p>
          </div>
          {resolvedLoading ? (
            <div className="text-center py-8 dark:text-slate-400">Loading resolved disputes...</div>
          ) : resolvedTransactions.length === 0 ? (
            <div className="text-center py-8 dark:text-slate-400">No resolved disputes found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="dark:border-b dark:border-slate-700 dark:bg-slate-900/50">
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">First Name</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">Last Name</th>
                    <th className="text-left py-3 px-2 text-sm font-medium dark:text-slate-400">Reference</th>
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
                  {resolvedTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="dark:border-b dark:border-slate-700 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-2 text-sm font-medium dark:text-white">
                        {getUserNames(transaction.userId).firstName}
                      </td>
                      <td className="py-3 px-2 text-sm font-medium dark:text-white">
                        {getUserNames(transaction.userId).lastName}
                      </td>
                      <td className="py-3 px-2 font-mono text-sm dark:text-white">
                        {transaction.internalReference}
                      </td>
                      <td className="py-3 px-2 dark:text-slate-300 text-sm">
                        {format(new Date(transaction.createdAt || 0), 'MMM dd, HH:mm')}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold dark:text-white">
                        {new Intl.NumberFormat('en-US').format(transaction.amount || 0)} RWF
                      </td>
                      <td className="py-3 px-2 text-sm dark:text-slate-300">
                        {transaction.transactionType}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-sm">
                          {transaction.description}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className="text-sm bg-green-500 text-white hover:bg-green-600">
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <div className="space-y-1">
                          <div className="dark:text-slate-400 text-sm">
                            {transaction.fromDetails?.accountSource || '-'}
                          </div>
                          <div className="font-mono text-sm dark:text-slate-500">
                            {transaction.fromDetails?.accountNumber?.substring(0, 8) || '-'}...
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <div className="space-y-1">
                          <div className="dark:text-slate-400 text-sm">
                            {transaction.toDetails?.accountSource || '-'}
                          </div>
                          <div className="font-mono text-sm dark:text-slate-500">
                            {transaction.toDetails?.accountNumber?.substring(0, 8) || '-'}...
                          </div>
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
          <DialogContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle>Reverse Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Transaction Reference</p>
                <p className="text-sm font-mono text-blue-400 break-all">{selectedTransaction.internalReference}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Amount</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(selectedTransaction.amount || 0)} RWF</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Reason for Reversal</label>
                <Input
                  placeholder="e.g., Duplicate transaction, User request..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Admin Notes (Optional)</label>
                <Input
                  placeholder="Additional notes..."
                  value={reversalNotes}
                  onChange={(e) => setReversalNotes(e.target.value)}
                  className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
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
          <DialogContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle>Force Reverse Transfer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-800 p-3 rounded">
                <p className="text-sm text-red-400">
                  <strong>Warning:</strong> This will create debt if the receiver has insufficient funds to cover the reversal.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Transaction Reference</p>
                <p className="text-sm font-mono text-blue-400 break-all">{selectedTransaction.internalReference}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">Amount</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(selectedTransaction.amount || 0)} RWF</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Reason for Force Reversal</label>
                <Input
                  placeholder="e.g., Dispute resolution, Compliance..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Admin Notes (Optional)</label>
                <Input
                  placeholder="Additional notes..."
                  value={reversalNotes}
                  onChange={(e) => setReversalNotes(e.target.value)}
                  className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
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

      {detailDialogOpen && selectedTransaction && (
        <ViewDetailsDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          title="Transaction Details"
          subtitle={selectedTransaction.internalReference}
          onCopySubtitle={() => {
            navigator.clipboard.writeText(selectedTransaction.internalReference || '')
            toast({ title: 'Copied', description: 'Reference copied to clipboard' })
          }}
          badge={
            <Badge
              variant={
                selectedTransaction.status === 'SUCCESSFUL'
                  ? 'default'
                  : selectedTransaction.status === 'PENDING'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {selectedTransaction.status}
            </Badge>
          }
          maxWidth="4xl"
          sections={[
            {
              title: 'Transaction',
              gridCols: 3,
              fields: [
                { label: 'Status', value: <Badge variant={selectedTransaction.status === 'SUCCESSFUL' ? 'default' : selectedTransaction.status === 'PENDING' ? 'secondary' : 'destructive'}>{selectedTransaction.status}</Badge> },
                { label: 'Amount', value: <span className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedTransaction.amount || 0)} RWF</span> },
                { label: 'Type', value: <span className="font-semibold">{selectedTransaction.transactionType}</span> },
              ],
            },
            {
              title: 'User Information',
              gridCols: 2,
              fields: [
                { label: 'Name', value: selectedTransaction.userName || '-' },
                { label: 'Phone Number', value: selectedTransaction.userPhoneNumber || '-' },
                { label: 'National ID', value: <span className="font-mono text-sm">{selectedTransaction.userNationalId || '-'}</span> },
                { label: 'Currency', value: selectedTransaction.currency || 'RWF' },
              ],
            },
            {
              title: 'Transaction Details',
              gridCols: 2,
              fields: [
                { label: 'Reference', value: <span className="font-mono text-sm text-blue-600 dark:text-blue-400 break-all">{selectedTransaction.internalReference}</span> },
                { label: 'Description', value: selectedTransaction.description ? <Badge variant="outline">{selectedTransaction.description}</Badge> : '-' },
                { label: 'Created Date', value: format(new Date(selectedTransaction.createdAt || 0), 'PPp') },
                { label: 'Updated Date', value: format(new Date(selectedTransaction.updatedAt || 0), 'PPp') },
              ],
            },
            ...(selectedTransaction.fromDetails
              ? [
                  {
                    title: 'From Account',
                    gridCols: 2,
                    fields: [
                      { label: 'Account Name', value: selectedTransaction.fromDetails.accountName || '-' },
                      { label: 'Account Source', value: selectedTransaction.fromDetails.accountSource || '-' },
                      { label: 'Account Number', value: <span className="font-mono text-sm col-span-2">{selectedTransaction.fromDetails.accountNumber || '-'}</span> },
                    ],
                  },
                ]
              : []),
            ...(selectedTransaction.toDetails
              ? [
                  {
                    title: 'To Account',
                    gridCols: 2,
                    fields: [
                      { label: 'Account Name', value: selectedTransaction.toDetails.accountName || '-' },
                      { label: 'Account Source', value: selectedTransaction.toDetails.accountSource || '-' },
                      { label: 'Account Number', value: <span className="font-mono text-sm col-span-2">{selectedTransaction.toDetails.accountNumber || '-'}</span> },
                    ],
                  },
                ]
              : []),
          ]}
          actions={
            (selectedTransaction.status === 'SUCCESSFUL' || selectedTransaction.status === 'DISPUTED')
              ? [
                  {
                    label: 'Reverse',
                    variant: 'outline',
                    icon: <RotateCcw className="w-4 h-4" />,
                    onClick: () => {
                      setDetailDialogOpen(false)
                      setStandardReversalOpen(true)
                    },
                  },
                  ...(hasPermission('FORCE_REVERSE_TRANSACTION')
                    ? [
                        {
                          label: 'Force Reverse',
                          variant: 'outline' as const,
                          icon: <AlertCircle className="w-4 h-4" />,
                          onClick: () => {
                            setDetailDialogOpen(false)
                            setForceReversalOpen(true)
                          },
                        },
                      ]
                    : []),
                ]
              : undefined
          }
        />
      )}

      {/* Resolve Dispute Dialog */}
      {selectedTransaction && (
        <Dialog open={resolveDisputeOpen} onOpenChange={setResolveDisputeOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Resolve Dispute</DialogTitle>
              <DialogDescription>
                Make a decision on this disputed transaction
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Transaction Details</p>
                <div className="bg-slate-900/50 p-3 rounded-lg space-y-1 text-sm">
                  <p><span className="text-slate-400">ID:</span> {selectedTransaction.id.substring(0, 12)}...</p>
                  <p><span className="text-slate-400">Amount:</span> {new Intl.NumberFormat('en-US').format(selectedTransaction.amount || 0)} RWF</p>
                  <p><span className="text-slate-400">Dispute Reason:</span> {(selectedTransaction as any).disputeReason || '-'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Resolution</Label>
                <Select value={resolveResolution} onValueChange={(value) => setResolveResolution(value as 'UPHOLD' | 'COMPENSATE')}>
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPHOLD">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        UPHOLD - Reject dispute, transaction stands
                      </span>
                    </SelectItem>
                    <SelectItem value="COMPENSATE">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        COMPENSATE - Accept dispute, compensation required
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400 mt-2">
                  {resolveResolution === 'UPHOLD' 
                    ? 'The dispute will be rejected. The original transaction will stand.'
                    : 'The dispute will be accepted. You will be prompted to perform a reversal or force reversal.'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Resolution Notes <span className="text-red-500">*</span></Label>
                <textarea
                  value={resolveReason}
                  onChange={(e) => setResolveReason(e.target.value)}
                  placeholder="Enter resolution notes explaining your decision..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  disabled={resolveLoading}
                />
                <p className="text-xs text-slate-400 mt-1">Required field</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setResolveDisputeOpen(false)} disabled={resolveLoading}>
                Cancel
              </Button>
              <Button onClick={handleResolveDispute} disabled={resolveLoading || !resolveReason.trim()} className="bg-blue-600 hover:bg-blue-700">
                {resolveLoading ? 'Processing...' : 'Resolve Dispute'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Force Reverse Dialog (shown after COMPENSATE resolution) */}
      {selectedTransaction && (
        <Dialog open={showForceReverseAfterResolve} onOpenChange={setShowForceReverseAfterResolve}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Compensation Required</DialogTitle>
              <DialogDescription>
                Dispute accepted. Now process the reversal to compensate the user.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg text-sm text-blue-200">
                <p className="font-medium mb-1">Next Step</p>
                <p>Use the Force Reverse option to automatically create a debt and compensate the user.</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg space-y-1 text-sm">
                <p><span className="text-slate-400">Amount to Refund:</span> {new Intl.NumberFormat('en-US').format(selectedTransaction.amount || 0)} RWF</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowForceReverseAfterResolve(false)
                setDetailDialogOpen(false)
              }}>
                Skip for Now
              </Button>
              <Button onClick={() => {
                setShowForceReverseAfterResolve(false)
                setResolveDisputeOpen(false)
                setForceReversalOpen(true)
                setReversalReason('Dispute compensation - Force reversal')
              }} className="bg-red-600 hover:bg-red-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                Force Reverse Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

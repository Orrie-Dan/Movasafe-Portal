'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { toast } from '@/hooks/use-toast'
import {
  Wallet,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Search,
  Activity,
  CreditCard,
  Shield,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { apiGetAllWallets } from '@/lib/api/wallets'
import { apiGetAllTransactions } from '@/lib/api/transactions'
import { apiGetAuditLogs } from '@/lib/api/audit'
import { apiGetEscrows } from '@/lib/api/escrows'
import type { Wallet as ApiWallet } from '@/lib/types/wallets'
import type { Transaction } from '@/lib/api/transactions'
import type { AuditLog } from '@/lib/types/audit'
import type { EscrowTransaction } from '@/lib/types/escrows'
import { format, subDays, subHours, parseISO } from 'date-fns'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type WalletStatus = 'active' | 'frozen' | 'suspended'
type TransactionType = 'deposit' | 'transfer' | 'escrow_hold' | 'escrow_release' | 'withdrawal'
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

interface WalletData {
  id: string
  userId: string
  userName: string
  currency: string
  availableBalance: number
  reservedBalance: number
  totalBalance: number
  status: WalletStatus
  lastActivity: string
  createdAt: string
}

interface WalletTransaction {
  id: string
  walletId: string
  type: string
  amount: number
  status: TransactionStatus
  description: string
  timestamp: string
  relatedTransactionId?: string
}

interface EscrowSummary {
  totalAmount: number
  activeEscrows: number
  pendingReleases: number
}

interface ActivityLog {
  id: string
  action: string
  walletId: string
  userId: string
  details: string
  timestamp: string
  performedBy: string
}

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

const generateMockWallets = (): WalletData[] => {
  const currencies = ['RWF', 'USD', 'EUR']
  const statuses: WalletStatus[] = ['active', 'active', 'active', 'frozen', 'suspended']
  const userNames = [
    'John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams', 'David Brown',
    'Emily Davis', 'Robert Miller', 'Lisa Anderson', 'James Wilson', 'Maria Garcia',
    'William Martinez', 'Jennifer Taylor', 'Richard Thomas', 'Patricia Jackson',
    'Charles White', 'Linda Harris', 'Joseph Martin', 'Barbara Thompson',
  ]

  return Array.from({ length: 25 }, (_, i) => {
    const currency = currencies[i % currencies.length]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const totalBalance = Math.floor(Math.random() * 5000000) + 10000
    const reservedBalance = Math.floor(totalBalance * (Math.random() * 0.3))
    const availableBalance = totalBalance - reservedBalance
    const createdDate = subDays(new Date(), Math.floor(Math.random() * 180))
    const lastActivity = subHours(new Date(), Math.floor(Math.random() * 48))

    return {
      id: `wallet_${String(i + 1).padStart(3, '0')}`,
      userId: `user_${String(i + 1).padStart(4, '0')}`,
      userName: userNames[i % userNames.length],
      currency,
      availableBalance,
      reservedBalance,
      totalBalance,
      status,
      lastActivity: lastActivity.toISOString(),
      createdAt: createdDate.toISOString(),
    }
  })
}

const generateMockTransactions = (walletId: string): WalletTransaction[] => {
  const types: TransactionType[] = ['deposit', 'transfer', 'escrow_hold', 'escrow_release', 'withdrawal']
  const statuses: TransactionStatus[] = ['completed', 'completed', 'completed', 'pending', 'failed']
  const descriptions = [
    'Deposit from bank transfer',
    'Payment to merchant',
    'Escrow hold for transaction',
    'Escrow release',
    'Withdrawal to bank account',
    'Refund processing',
    'Commission fee',
  ]

  return Array.from({ length: 10 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const amount = Math.floor(Math.random() * 500000) + 1000
    const timestamp = subHours(new Date(), i * 2)

    return {
      id: `txn_${walletId}_${String(i + 1).padStart(3, '0')}`,
      walletId,
      type,
      amount,
      status,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      timestamp: timestamp.toISOString(),
      relatedTransactionId: i > 0 ? `txn_${walletId}_${String(i).padStart(3, '0')}` : undefined,
    }
  })
}

const generateMockActivityLog = (): ActivityLog[] => {
  const actions = [
    'Wallet frozen',
    'Wallet unfrozen',
    'Wallet suspended',
    'Balance adjusted',
    'Escrow hold created',
    'Escrow release processed',
    'Transaction reversed',
  ]

  return Array.from({ length: 20 }, (_, i) => {
    const action = actions[Math.floor(Math.random() * actions.length)]
    const walletId = `wallet_${String(Math.floor(Math.random() * 25) + 1).padStart(3, '0')}`
    const userId = `user_${String(Math.floor(Math.random() * 25) + 1).padStart(4, '0')}`
    const timestamp = subHours(new Date(), i)

    return {
      id: `log_${String(i + 1).padStart(3, '0')}`,
      action,
      walletId,
      userId,
      details: `${action} for wallet ${walletId}`,
      timestamp: timestamp.toISOString(),
      performedBy: `admin_${String(Math.floor(Math.random() * 5) + 1).padStart(2, '0')}`,
    }
  })
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WalletsPage() {
  const [loading, setLoading] = useState(true)
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null)
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([])
  const [recentApiTransactions, setRecentApiTransactions] = useState<WalletTransaction[]>([])
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    variant: 'default' | 'destructive'
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'default',
    onConfirm: () => {},
  })

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currencyFilter, setCurrencyFilter] = useState<string>('all')
  const [balanceRangeFilter, setBalanceRangeFilter] = useState<string>('all')

  // Helper to normalize date strings from API (e.g. '2026-01-07 13:32:50')
  const normalizeDate = (value: string): string => {
    if (!value) return new Date().toISOString()
    try {
      if (value.includes('T')) {
        return new Date(value).toISOString()
      }
      return new Date(value.replace(' ', 'T') + 'Z').toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  // Map API wallet to UI WalletData shape
  const mapApiWalletToWalletData = (wallet: ApiWallet): WalletData => {
    const totalBalance = wallet.walletBalance ?? 0
    const reservedBalance = wallet.reservedBalance ?? 0
    const availableBalance = wallet.availableBalance ?? totalBalance - reservedBalance

    const status: WalletStatus = reservedBalance > 0 ? 'frozen' : 'active'

    return {
      id: wallet.id,
      userId: wallet.userId,
      userName: wallet.userId, // API does not include a separate user name
      currency: 'RWF',
      availableBalance,
      reservedBalance,
      totalBalance,
      status,
      lastActivity: normalizeDate(wallet.updatedAt),
      createdAt: normalizeDate(wallet.createdAt),
    }
  }

  // Initialize data from real API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // Load wallets
        const apiWallets = await apiGetAllWallets({ page: 0, limit: 100 })
        
        if (apiWallets && apiWallets.length > 0) {
          const mappedWallets = apiWallets.map(mapApiWalletToWalletData)
          setWallets(mappedWallets)
        } else {
          // Fallback to mock data if API returns empty
          console.warn('API returned no wallets, using mock data')
          setWallets(generateMockWallets())
        }

        // Load transactions
        try {
          const transactionsResponse = await apiGetAllTransactions({ limit: 10 })
          if (transactionsResponse?.data?.content) {
            const mappedTransactions = transactionsResponse.data.content.map((txn: Transaction) => ({
              id: txn.id,
              walletId: txn.userId,
              type: txn.transactionType === 'CASH_IN' ? 'deposit' : 'transfer',
              amount: txn.amount,
              status: (txn.status?.toLowerCase() || 'pending') as TransactionStatus,
              description: txn.description || 'Transaction',
              timestamp: txn.createdAt,
              relatedTransactionId: txn.internalReference,
            }))
            setRecentApiTransactions(mappedTransactions)
          }
        } catch (txnError) {
          console.warn('Failed to load transactions:', txnError)
          setRecentApiTransactions([])
        }

        // Load escrows
        try {
          const escrowsData = await apiGetEscrows({ limit: 100 })
          setEscrows(Array.isArray(escrowsData) ? escrowsData : [])
        } catch (escrowError) {
          console.warn('Failed to load escrows:', escrowError)
          setEscrows([])
        }

        // Load audit logs
        try {
          const auditResponse = await apiGetAuditLogs({ limit: 15, resource: 'wallet' })
          if (auditResponse?.data && Array.isArray(auditResponse.data)) {
            const mappedLogs: ActivityLog[] = auditResponse.data.map((log: AuditLog) => ({
              id: log.id,
              action: log.action,
              walletId: log.resourceId || '',
              userId: log.userId,
              details: log.action,
              timestamp: log.timestamp,
              performedBy: log.username || 'admin',
            }))
            setActivityLog(mappedLogs)
          }
        } catch (auditError) {
          console.warn('Failed to load audit logs:', auditError)
          // Fall back to empty array
          setActivityLog([])
        }
      } catch (error) {
        console.error('Failed to load wallets from API:', error)
        // Fallback to mock data on error
        setWallets(generateMockWallets())
        setActivityLog(generateMockActivityLog())
        
        toast({
          title: 'Using sample data',
          description: 'Could not load live data. Displaying sample wallets.',
          variant: 'default',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalWallets = wallets.length
    const totalAvailable = wallets.reduce((sum, w) => sum + w.availableBalance, 0)
    const totalReserved = wallets.reduce((sum, w) => sum + w.reservedBalance, 0)
    const frozenWallets = wallets.filter((w) => w.status === 'frozen').length

    return {
      totalWallets,
      totalAvailable,
      totalReserved,
      frozenWallets,
    }
  }, [wallets])

  // Calculate escrow summary from real API data
  const escrowSummary: EscrowSummary = useMemo(() => {
    const totalAmount = escrows.reduce((sum, e) => sum + (e.amount || 0), 0)

    // Count active accounts from wallets (active wallet status)
    const activeEscrows = wallets.filter((w) => w.status === 'active').length

    // Count escrows that are in a pending state (API status may be 'PENDING')
    const pendingReleases = escrows.filter((e) => {
      const status = (e.status || '').toString().toUpperCase()
      return status === 'PENDING'
    }).length

    return {
      totalAmount,
      activeEscrows,
      pendingReleases,
    }
  }, [escrows, wallets])

  // Filter wallets
  const filteredWallets = useMemo(() => {
    return wallets.filter((wallet) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesId = wallet.id.toLowerCase().includes(query)
        const matchesUserId = wallet.userId.toLowerCase().includes(query)
        const matchesUserName = wallet.userName.toLowerCase().includes(query)
        if (!matchesId && !matchesUserId && !matchesUserName) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== 'all' && wallet.status !== statusFilter) {
        return false
      }

      // Currency filter
      if (currencyFilter !== 'all' && wallet.currency !== currencyFilter) {
        return false
      }

      // Balance range filter
      if (balanceRangeFilter !== 'all') {
        const total = wallet.totalBalance
        if (balanceRangeFilter === 'low' && total >= 100000) return false
        if (balanceRangeFilter === 'medium' && (total < 100000 || total >= 1000000)) return false
        if (balanceRangeFilter === 'high' && total < 1000000) return false
      }

      return true
    })
  }, [wallets, searchQuery, statusFilter, currencyFilter, balanceRangeFilter])

  // Get recent transactions (from API)
  const recentTransactions = useMemo(() => {
    return recentApiTransactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  }, [recentApiTransactions])

  // Handle wallet selection - fetch transactions for the selected wallet
  const handleViewWallet = (wallet: WalletData) => {
    setSelectedWallet(wallet)
    // Use recent API transactions filtered by wallet ID
    const walletTxns = recentApiTransactions.filter((txn) => txn.walletId === wallet.userId)
    setWalletTransactions(walletTxns.length > 0 ? walletTxns : [])
  }

  // Handle freeze wallet
  const handleFreezeWallet = (wallet: WalletData) => {
    setConfirmDialog({
      open: true,
      title: 'Freeze Wallet',
      description: `Are you sure you want to freeze wallet ${wallet.id}? This will prevent all transactions.`,
      variant: 'destructive',
      onConfirm: () => {
        setWallets((prev) =>
          prev.map((w) => (w.id === wallet.id ? { ...w, status: 'frozen' as WalletStatus } : w))
        )
        setActivityLog((prev) => [
          {
            id: `log_${Date.now()}`,
            action: 'Wallet frozen',
            walletId: wallet.id,
            userId: wallet.userId,
            details: `Wallet ${wallet.id} frozen by admin`,
            timestamp: new Date().toISOString(),
            performedBy: 'current_admin',
          },
          ...prev,
        ])
        toast({
          title: 'Success',
          description: `Wallet ${wallet.id} has been frozen`,
        })
        setConfirmDialog({ ...confirmDialog, open: false })
        if (selectedWallet?.id === wallet.id) {
          setSelectedWallet({ ...wallet, status: 'frozen' })
        }
      },
    })
  }

  // Handle unfreeze wallet
  const handleUnfreezeWallet = (wallet: WalletData) => {
    setConfirmDialog({
      open: true,
      title: 'Unfreeze Wallet',
      description: `Are you sure you want to unfreeze wallet ${wallet.id}?`,
      variant: 'default',
      onConfirm: () => {
        setWallets((prev) =>
          prev.map((w) => (w.id === wallet.id ? { ...w, status: 'active' as WalletStatus } : w))
        )
        setActivityLog((prev) => [
          {
            id: `log_${Date.now()}`,
            action: 'Wallet unfrozen',
            walletId: wallet.id,
            userId: wallet.userId,
            details: `Wallet ${wallet.id} unfrozen by admin`,
            timestamp: new Date().toISOString(),
            performedBy: 'current_admin',
          },
          ...prev,
        ])
        toast({
          title: 'Success',
          description: `Wallet ${wallet.id} has been unfrozen`,
        })
        setConfirmDialog({ ...confirmDialog, open: false })
        if (selectedWallet?.id === wallet.id) {
          setSelectedWallet({ ...wallet, status: 'active' })
        }
      },
    })
  }

  // Handle suspend wallet
  const handleSuspendWallet = (wallet: WalletData) => {
    setConfirmDialog({
      open: true,
      title: 'Suspend Wallet',
      description: `Are you sure you want to suspend wallet ${wallet.id}? This will restrict all operations.`,
      variant: 'destructive',
      onConfirm: () => {
        setWallets((prev) =>
          prev.map((w) => (w.id === wallet.id ? { ...w, status: 'suspended' as WalletStatus } : w))
        )
        setActivityLog((prev) => [
          {
            id: `log_${Date.now()}`,
            action: 'Wallet suspended',
            walletId: wallet.id,
            userId: wallet.userId,
            details: `Wallet ${wallet.id} suspended by admin`,
            timestamp: new Date().toISOString(),
            performedBy: 'current_admin',
          },
          ...prev,
        ])
        toast({
          title: 'Success',
          description: `Wallet ${wallet.id} has been suspended`,
        })
        setConfirmDialog({ ...confirmDialog, open: false })
        if (selectedWallet?.id === wallet.id) {
          setSelectedWallet({ ...wallet, status: 'suspended' })
        }
      },
    })
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'RWF'): string => {
    return `${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} ${currency}`
  }

  // Table columns
  const walletColumns: Column<WalletData>[] = [
    {
      key: 'id',
      header: 'Wallet ID',
      accessor: (wallet) => (
        <span className="font-mono text-sm text-foreground">{wallet.id}</span>
      ),
    },
    {
      key: 'userName',
      header: 'User ID',
      accessor: (wallet) => (
        <div>
          <div className="font-mono text-sm text-foreground">{wallet.userId}</div>
        </div>
      ),
    },
    {
      key: 'currency',
      header: 'Currency',
      accessor: (wallet) => (
        <Badge variant="outline" className="text-foreground">
          {wallet.currency}
        </Badge>
      ),
    },
    {
      key: 'availableBalance',
      header: 'Available',
      accessor: (wallet) => (
        <span className="font-semibold text-green-400">
          {formatCurrency(wallet.availableBalance, wallet.currency)}
        </span>
      ),
    },
    {
      key: 'reservedBalance',
      header: 'Reserved',
      accessor: (wallet) => (
        <span className="text-yellow-400">
          {formatCurrency(wallet.reservedBalance, wallet.currency)}
        </span>
      ),
    },
    {
      key: 'totalBalance',
      header: 'Total',
      accessor: (wallet) => (
        <span className="font-semibold text-foreground">
          {formatCurrency(wallet.totalBalance, wallet.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (wallet) => {
        const statusColors = {
          active: 'bg-green-500/20 text-green-400 border-green-500/30',
          frozen: 'bg-red-500/20 text-red-400 border-red-500/30',
          suspended: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        }
        return (
          <Badge className={statusColors[wallet.status]}>
            {wallet.status === 'frozen' && <Lock className="h-3 w-3 mr-1" />}
            {wallet.status.charAt(0).toUpperCase() + wallet.status.slice(1)}
          </Badge>
        )
      },
    },
    {
      key: 'lastActivity',
      header: 'Last Activity',
      accessor: (wallet) => (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(wallet.lastActivity), 'MMM d, HH:mm')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (wallet) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewWallet(wallet)}
            className="h-8"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {wallet.status === 'frozen' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUnfreezeWallet(wallet)}
              className="h-8 text-green-400 hover:text-green-300"
            >
              <Unlock className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFreezeWallet(wallet)}
                className="h-8 text-red-400 hover:text-red-300"
              >
                <Lock className="h-4 w-4" />
              </Button>
              {wallet.status !== 'suspended' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuspendWallet(wallet)}
                  className="h-8 text-yellow-400 hover:text-yellow-300"
                >
                  <Shield className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-white dark:bg-black min-h-screen">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
          <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          Wallets
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Monitor wallet balances and reserved funds
        </p>
      </div>

      {/* Wallet Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Wallets</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.totalWallets}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Available</p>
                <div className="text-2xl font-bold text-green-400 mt-1">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    formatCurrency(metrics.totalAvailable)
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reserved</p>
                <div className="text-2xl font-bold text-yellow-400 mt-1">
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    formatCurrency(metrics.totalReserved)
                  )}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Frozen Wallets</p>
                <div className="text-2xl font-bold text-red-400 mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.frozenWallets}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Lock className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reserved Funds / Escrow Section */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Reserved Funds & Escrow Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive overview of funds held in escrow, active escrow transactions, and pending release operations
          </p>
        </div>
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Escrow Summary
            </CardTitle>
            <CardDescription>
              Overview of funds held in escrow and pending releases
            </CardDescription>
          </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Escrow Amount</p>
                <div className="text-2xl font-bold text-yellow-400">
                  {formatCurrency(escrowSummary.totalAmount)}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Active Escrows</p>
                <div className="text-2xl font-bold text-foreground">
                  {escrowSummary.activeEscrows}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Pending Releases</p>
                <div className="text-2xl font-bold text-orange-400">
                  {escrowSummary.pendingReleases}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Wallet List / Table */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Wallet Management & Registry
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete wallet registry with advanced filtering, sorting, and search capabilities for comprehensive wallet monitoring
          </p>
        </div>
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                Wallet Registry
              </CardTitle>
              <CardDescription>
                Complete list of all wallets with filtering, sorting, and search capabilities
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search wallets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="frozen">Frozen</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="RWF">RWF</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
              <Select value={balanceRangeFilter} onValueChange={setBalanceRangeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Balance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ranges</SelectItem>
                  <SelectItem value="low">Low (&lt;100K)</SelectItem>
                  <SelectItem value="medium">Medium (100K-1M)</SelectItem>
                  <SelectItem value="high">High (&gt;1M)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <DataTable
              data={filteredWallets}
              columns={walletColumns}
              pagination={{ pageSize: 20 }}
              emptyMessage="No wallets found"
            />
          )}
        </CardContent>
      </Card>
      </div>

      {/* Transaction Snapshot */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Transaction Activity & Monitoring
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time view of recent wallet transactions including deposits, transfers, escrow operations, and withdrawals across all wallets
          </p>
        </div>
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Recent Wallet Transactions
          </CardTitle>
          <CardDescription>
            Latest transactions across all wallets including deposits, transfers, and escrow operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((txn) => {
                const isPositive = txn.type === 'deposit' || txn.type === 'escrow_release'
                const statusColors = {
                  completed: 'text-green-400',
                  pending: 'text-yellow-400',
                  failed: 'text-red-400',
                  cancelled: 'text-gray-400',
                }

                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-4 border rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownRight className={`h-5 w-5 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
                        ) : (
                          <ArrowUpRight className={`h-5 w-5 ${isPositive ? 'text-green-400' : 'text-red-400'}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{txn.description}</span>
                          <Badge variant="outline" className="text-xs">
                            {txn.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground font-mono">{txn.id}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(txn.timestamp), 'MMM d, HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {isPositive ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </div>
                      <div className={`text-xs mt-1 ${statusColors[txn.status]}`}>
                        {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Audit & Activity Log */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            Audit Trail & Activity History
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete audit log of all wallet-related actions, status changes, and administrative operations for compliance and tracking
          </p>
        </div>
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Audit trail of all wallet-related actions and status changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="space-y-2">
              {activityLog.slice(0, 15).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{log.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.walletId}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {log.details} • By {log.performedBy}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(log.timestamp), 'MMM d, HH:mm')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Wallet Details Modal */}
      {selectedWallet && (
        <Dialog open={!!selectedWallet} onOpenChange={() => setSelectedWallet(null)}>
          <DialogContent className="max-w-4xl bg-white dark:bg-black border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-400" />
                Wallet Details - {selectedWallet.id}
              </DialogTitle>
              <DialogDescription>Complete wallet information and transaction history</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Wallet Owner Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">User Name</Label>
                  <div className="text-foreground font-medium">{selectedWallet.userName}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">User ID</Label>
                  <div className="text-foreground font-mono text-sm">{selectedWallet.userId}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Currency</Label>
                  <Badge variant="outline">{selectedWallet.currency}</Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge
                    className={
                      selectedWallet.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : selectedWallet.status === 'frozen'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }
                  >
                    {selectedWallet.status.charAt(0).toUpperCase() + selectedWallet.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Balance Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Balance Breakdown</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-black border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                      <div className="text-2xl font-bold text-green-400">
                        {formatCurrency(selectedWallet.availableBalance, selectedWallet.currency)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-black border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">Reserved Balance</p>
                      <div className="text-2xl font-bold text-yellow-400">
                        {formatCurrency(selectedWallet.reservedBalance, selectedWallet.currency)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-black border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(selectedWallet.totalBalance, selectedWallet.currency)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {walletTransactions.map((txn) => {
                    const isPositive = txn.type === 'deposit' || txn.type === 'escrow_release'
                    return (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between p-3 border rounded-lg border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          {isPositive ? (
                            <ArrowDownRight className="h-4 w-4 text-green-400" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-400" />
                          )}
                          <div>
                            <div className="font-medium text-foreground text-sm">{txn.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {txn.type.replace('_', ' ')} • {format(parseISO(txn.timestamp), 'MMM d, HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {isPositive ? '+' : '-'}
                            {formatCurrency(txn.amount, selectedWallet.currency)}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              txn.status === 'completed'
                                ? 'text-green-400'
                                : txn.status === 'pending'
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}
                          >
                            {txn.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                {selectedWallet.status === 'frozen' ? (
                  <Button onClick={() => handleUnfreezeWallet(selectedWallet)} className="bg-green-600 hover:bg-green-700">
                    <Unlock className="h-4 w-4 mr-2" />
                    Unfreeze Wallet
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => handleFreezeWallet(selectedWallet)}
                      variant="destructive"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Freeze Wallet
                    </Button>
                    {selectedWallet.status !== 'suspended' && (
                      <Button
                        onClick={() => handleSuspendWallet(selectedWallet)}
                        variant="outline"
                        className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Suspend Wallet
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Dialog */}
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

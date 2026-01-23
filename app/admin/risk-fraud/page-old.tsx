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
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { toast } from '@/hooks/use-toast'
import {
  Shield,
  AlertTriangle,
  Eye,
  Lock,
  Flag,
  TrendingUp,
  X,
  CheckCircle2,
  Clock,
  User,
  DollarSign,
  MapPin,
  FileText,
  Bell,
  Search,
  Ban,
} from 'lucide-react'
import { format, subDays, subHours, parseISO } from 'date-fns'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
type AlertStatus = 'New' | 'Investigating' | 'Resolved'
type NotificationType = 'fraud' | 'system' | 'activity'

interface FraudAlert {
  id: string
  alertType: string
  riskLevel: RiskLevel
  userId: string
  userName?: string
  amount: number
  reason: string
  timestamp: string
  status: AlertStatus
  transactionId?: string
  location?: string
}

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface RiskTransaction {
  transactionId: string
  user: string
  userId: string
  amount: number
  riskScore: number
  riskReason: string
  location: string
  status: string
  timestamp: string
}

interface UserRiskProfile {
  userId: string
  userName: string
  email: string
  riskScore: number
  kycStatus: 'pending' | 'verified' | 'rejected' | 'expired'
  walletFrozen: boolean
  recentTransactions: Array<{
    id: string
    amount: number
    timestamp: string
    status: string
  }>
  previousFlags: Array<{
    id: string
    reason: string
    timestamp: string
    resolved: boolean
  }>
}

interface AuditLogEntry {
  id: string
  actionType: string
  affectedUser?: string
  affectedAlert?: string
  timestamp: string
  details: string
}

interface RiskIndicators {
  highRiskTransactions: number
  flaggedUsers: number
  blockedWallets: number
  fraudAttempts: number
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateMockAlerts = (): FraudAlert[] => {
  const alertTypes = [
    'Suspicious Transaction Pattern',
    'Unusual Location Activity',
    'Rapid Multiple Transactions',
    'High-Value Transaction',
    'Account Takeover Attempt',
    'Identity Verification Failed',
    'Velocity Limit Exceeded',
  ]

  const reasons = [
    'Multiple transactions from different locations within short time',
    'Transaction amount exceeds user average by 500%',
    'Transaction from blacklisted IP address',
    'Failed authentication attempts followed by successful transaction',
    'Transaction pattern matches known fraud scheme',
    'User account accessed from suspicious device',
  ]

  const locations = ['Kigali, Rwanda', 'Nairobi, Kenya', 'Kampala, Uganda', 'Dar es Salaam, Tanzania']

  return Array.from({ length: 12 }, (_, i) => ({
    id: `alert_${i + 1}`,
    alertType: alertTypes[i % alertTypes.length],
    riskLevel: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)] as RiskLevel,
    userId: `user_${Math.floor(Math.random() * 50) + 1}`,
    userName: `User ${Math.floor(Math.random() * 50) + 1}`,
    amount: Math.floor(Math.random() * 5000000) + 100000,
    reason: reasons[Math.floor(Math.random() * reasons.length)],
    timestamp: subHours(new Date(), Math.floor(Math.random() * 48)).toISOString(),
    status: ['New', 'Investigating', 'Resolved'][Math.floor(Math.random() * 3)] as AlertStatus,
    transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`,
    location: locations[Math.floor(Math.random() * locations.length)],
  }))
}

const generateMockNotifications = (): Notification[] => {
  return [
    {
      id: 'notif_1',
      type: 'fraud',
      title: 'New Fraud Alert',
      message: 'Suspicious transaction pattern detected for user_23',
      timestamp: subHours(new Date(), 1).toISOString(),
      read: false,
      severity: 'high',
    },
    {
      id: 'notif_2',
      type: 'system',
      title: 'System Warning',
      message: 'High number of failed authentication attempts detected',
      timestamp: subHours(new Date(), 2).toISOString(),
      read: false,
      severity: 'medium',
    },
    {
      id: 'notif_3',
      type: 'activity',
      title: 'Unusual Activity',
      message: 'User_15 accessed account from new device',
      timestamp: subHours(new Date(), 3).toISOString(),
      read: true,
      severity: 'low',
    },
  ]
}

const generateMockTransactions = (): RiskTransaction[] => {
  const riskReasons = [
    'High velocity transactions',
    'Unusual location',
    'Large amount deviation',
    'Suspicious pattern',
    'Blacklisted IP',
  ]

  return Array.from({ length: 25 }, (_, i) => ({
    transactionId: `tx_${Math.random().toString(36).substr(2, 12)}`,
    user: `User ${i + 1}`,
    userId: `user_${i + 1}`,
    amount: Math.floor(Math.random() * 10000000) + 50000,
    riskScore: Math.floor(Math.random() * 100),
    riskReason: riskReasons[Math.floor(Math.random() * riskReasons.length)],
    location: ['Kigali', 'Nairobi', 'Kampala', 'Dar es Salaam'][Math.floor(Math.random() * 4)],
    status: ['pending', 'reviewed', 'blocked', 'approved'][Math.floor(Math.random() * 4)],
    timestamp: subHours(new Date(), Math.floor(Math.random() * 72)).toISOString(),
  }))
}

const generateMockUserProfile = (userId: string): UserRiskProfile => {
  return {
    userId,
    userName: `User ${userId.split('_')[1]}`,
    email: `user${userId.split('_')[1]}@example.com`,
    riskScore: Math.floor(Math.random() * 100),
    kycStatus: ['pending', 'verified', 'rejected', 'expired'][Math.floor(Math.random() * 4)] as any,
    walletFrozen: Math.random() > 0.7,
    recentTransactions: Array.from({ length: 5 }, (_, i) => ({
      id: `tx_${i + 1}`,
      amount: Math.floor(Math.random() * 500000) + 10000,
      timestamp: subHours(new Date(), i + 1).toISOString(),
      status: ['successful', 'pending', 'failed'][Math.floor(Math.random() * 3)],
    })),
    previousFlags: Array.from({ length: 2 }, (_, i) => ({
      id: `flag_${i + 1}`,
      reason: 'Suspicious activity detected',
      timestamp: subDays(new Date(), i + 5).toISOString(),
      resolved: i === 0,
    })),
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RiskFraudPage() {
  // State
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [transactions, setTransactions] = useState<RiskTransaction[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [riskIndicators, setRiskIndicators] = useState<RiskIndicators>({
    highRiskTransactions: 0,
    flaggedUsers: 0,
    blockedWallets: 0,
    fraudAttempts: 0,
  })

  // Modal states
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserRiskProfile | null>(null)
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

  // Filter states
  const [alertFilter, setAlertFilter] = useState<{ riskLevel: string; status: string }>({
    riskLevel: 'all',
    status: 'all',
  })
  const [transactionFilters, setTransactionFilters] = useState<{
    riskLevel: string
    minAmount: string
    maxAmount: string
    dateRange: string
  }>({
    riskLevel: 'all',
    minAmount: '',
    maxAmount: '',
    dateRange: 'all',
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setAlerts(generateMockAlerts())
      setNotifications(generateMockNotifications())
      setTransactions(generateMockTransactions())
      setRiskIndicators({
        highRiskTransactions: 47,
        flaggedUsers: 12,
        blockedWallets: 8,
        fraudAttempts: 23,
      })
      setLoading(false)
    }, 1000)
  }, [])

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly add new notifications
      if (Math.random() > 0.7) {
        const newNotification: Notification = {
          id: `notif_${Date.now()}`,
          type: ['fraud', 'system', 'activity'][Math.floor(Math.random() * 3)] as NotificationType,
          title: ['New Fraud Alert', 'System Warning', 'Unusual Activity'][Math.floor(Math.random() * 3)],
          message: `New ${['fraud alert', 'system warning', 'activity notice'][Math.floor(Math.random() * 3)]} detected`,
          timestamp: new Date().toISOString(),
          read: false,
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        }
        setNotifications((prev) => [newNotification, ...prev])
      }
    }, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // Add audit log entry
  const addAuditLog = (actionType: string, affectedUser?: string, affectedAlert?: string, details?: string) => {
    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      actionType,
      affectedUser,
      affectedAlert,
      timestamp: new Date().toISOString(),
      details: details || `${actionType} performed`,
    }
    setAuditLogs((prev) => [log, ...prev].slice(0, 100)) // Keep last 100 entries
  }

  // Alert actions
  const handleFreezeWallet = (alert: FraudAlert) => {
    setConfirmDialog({
      open: true,
      title: 'Freeze Wallet',
      description: `Are you sure you want to freeze the wallet for user ${alert.userName || alert.userId}?`,
      variant: 'destructive',
      onConfirm: () => {
        addAuditLog('Freeze Wallet', alert.userId, alert.id, `Wallet frozen for ${alert.userName || alert.userId}`)
        toast({
          title: 'Wallet Frozen',
          description: `Wallet for ${alert.userName || alert.userId} has been frozen`,
        })
        setConfirmDialog({ ...confirmDialog, open: false })
      },
    })
  }

  const handleFlagUser = (alert: FraudAlert) => {
    addAuditLog('Flag User', alert.userId, alert.id, `User ${alert.userName || alert.userId} flagged`)
    toast({
      title: 'User Flagged',
      description: `User ${alert.userName || alert.userId} has been flagged for review`,
    })
  }

  const handleEscalate = (alert: FraudAlert) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, status: 'Investigating' as AlertStatus } : a))
    )
    addAuditLog('Escalate Alert', alert.userId, alert.id, `Alert ${alert.id} escalated`)
    toast({
      title: 'Alert Escalated',
      description: 'Alert has been escalated for investigation',
    })
  }

  const handleMarkFalsePositive = (alert: FraudAlert) => {
    setConfirmDialog({
      open: true,
      title: 'Mark as False Positive',
      description: `Are you sure this alert is a false positive? This will remove it from the active alerts.`,
      onConfirm: () => {
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
        addAuditLog('Mark False Positive', alert.userId, alert.id, `Alert ${alert.id} marked as false positive`)
        toast({
          title: 'Alert Removed',
          description: 'Alert has been marked as false positive and removed',
        })
        setConfirmDialog({ ...confirmDialog, open: false })
      },
    })
  }

  const handleViewUserProfile = (userId: string) => {
    const profile = generateMockUserProfile(userId)
    setSelectedUser(profile)
  }

  const handleFreezeAccount = (userId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Freeze Account',
      description: `Are you sure you want to freeze the account for ${selectedUser?.userName}?`,
      variant: 'destructive',
      onConfirm: () => {
        if (selectedUser) {
          setSelectedUser({ ...selectedUser, walletFrozen: true })
          addAuditLog('Freeze Account', userId, undefined, `Account frozen for ${selectedUser.userName}`)
          toast({
            title: 'Account Frozen',
            description: `Account for ${selectedUser.userName} has been frozen`,
          })
        }
        setConfirmDialog({ ...confirmDialog, open: false })
      },
    })
  }

  const handleRequestKYC = (userId: string) => {
    if (selectedUser) {
      setSelectedUser({ ...selectedUser, kycStatus: 'pending' })
      addAuditLog('Request KYC', userId, undefined, `KYC requested for ${selectedUser.userName}`)
      toast({
        title: 'KYC Requested',
        description: `Additional KYC verification has been requested for ${selectedUser.userName}`,
      })
    }
  }

  // Filtered data
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (alertFilter.riskLevel !== 'all' && alert.riskLevel !== alertFilter.riskLevel) return false
      if (alertFilter.status !== 'all' && alert.status !== alertFilter.status) return false
      return true
    })
  }, [alerts, alertFilter])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (transactionFilters.riskLevel !== 'all') {
        const riskLevel = tx.riskScore >= 70 ? 'high' : tx.riskScore >= 40 ? 'medium' : 'low'
        if (transactionFilters.riskLevel !== riskLevel) return false
      }
      if (transactionFilters.minAmount && tx.amount < parseInt(transactionFilters.minAmount)) return false
      if (transactionFilters.maxAmount && tx.amount > parseInt(transactionFilters.maxAmount)) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !tx.transactionId.toLowerCase().includes(query) &&
          !tx.user.toLowerCase().includes(query) &&
          !tx.location.toLowerCase().includes(query)
        )
          return false
      }
      return true
    })
  }, [transactions, transactionFilters, searchQuery])

  // Chart data
  const fraudAttemptsData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      return {
        date: format(date, 'MMM d'),
        attempts: Math.floor(Math.random() * 20) + 5,
        blocked: Math.floor(Math.random() * 10) + 2,
      }
    })
  }, [])

  // Table columns
  const transactionColumns: Column<RiskTransaction>[] = [
    {
      key: 'transactionId',
      header: 'Transaction ID',
      accessor: (tx) => <span className="font-mono text-sm">{tx.transactionId.slice(0, 12)}...</span>,
      sortable: true,
    },
    {
      key: 'user',
      header: 'User',
      accessor: (tx) => (
        <button
          onClick={() => handleViewUserProfile(tx.userId)}
          className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
        >
          <User className="h-3 w-3" />
          {tx.user}
        </button>
      ),
      sortable: true,
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (tx) => (
        <span className="font-medium">{tx.amount.toLocaleString()} RWF</span>
      ),
      sortable: true,
    },
    {
      key: 'riskScore',
      header: 'Risk Score',
      accessor: (tx) => (
        <Badge
          className={
            tx.riskScore >= 70
              ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : tx.riskScore >= 40
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              : 'bg-green-500/20 text-green-400 border-green-500/30'
          }
        >
          {tx.riskScore}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'riskReason',
      header: 'Risk Reason',
      accessor: (tx) => <span className="text-sm text-muted-foreground">{tx.riskReason}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      accessor: (tx) => (
        <span className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3" />
          {tx.location}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (tx) => (
        <Badge
          variant={
            tx.status === 'blocked'
              ? 'destructive'
              : tx.status === 'approved'
              ? 'default'
              : 'secondary'
          }
        >
          {tx.status}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'timestamp',
      header: 'Date',
      accessor: (tx) => (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(tx.timestamp), 'MMM d, HH:mm')}
        </span>
      ),
      sortable: true,
    },
  ]

  const auditLogColumns: Column<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      accessor: (log) => (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(log.timestamp), 'MMM d, HH:mm:ss')}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actionType',
      header: 'Action',
      accessor: (log) => <span className="font-medium">{log.actionType}</span>,
      sortable: true,
    },
    {
      key: 'affectedUser',
      header: 'Affected User',
      accessor: (log) => log.affectedUser || <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'affectedAlert',
      header: 'Affected Alert',
      accessor: (log) => log.affectedAlert || <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'details',
      header: 'Details',
      accessor: (log) => <span className="text-sm text-muted-foreground">{log.details}</span>,
    },
  ]

  // Get risk level color
  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case 'Critical':
        return 'bg-red-600/20 text-red-400 border-red-600/30'
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case 'New':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'Investigating':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-black min-h-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          Risk & Fraud Management
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Monitor fraud alerts, risk indicators, and high-risk transactions
        </p>
      </div>

      {/* Risk Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High-Risk Transactions</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : riskIndicators.highRiskTransactions}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flagged Users</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : riskIndicators.flaggedUsers}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Flag className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked Wallets</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : riskIndicators.blockedWallets}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Ban className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fraud Attempts (24h)</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : riskIndicators.fraudAttempts}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Fraud Alerts */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Active Fraud Alerts
              </CardTitle>
              <CardDescription>Real-time fraud detection alerts requiring attention</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select
                value={alertFilter.riskLevel}
                onValueChange={(value) => setAlertFilter({ ...alertFilter, riskLevel: value })}
              >
                <SelectTrigger className="w-40 bg-background border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={alertFilter.status}
                onValueChange={(value) => setAlertFilter({ ...alertFilter, status: value })}
              >
                <SelectTrigger className="w-40 bg-background border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Investigating">Investigating</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <p className="text-lg font-medium">No active alerts</p>
              <p className="text-sm">All fraud alerts have been resolved</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-black hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getRiskLevelColor(alert.riskLevel)}>{alert.riskLevel}</Badge>
                        <Badge className={getStatusColor(alert.status)}>{alert.status}</Badge>
                        <span className="text-sm font-medium text-foreground">{alert.alertType}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.reason}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {alert.userName || alert.userId}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {alert.amount.toLocaleString()} RWF
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(alert.timestamp), 'MMM d, HH:mm')}
                        </span>
                        {alert.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {alert.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAlert(alert)}
                        className="h-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFreezeWallet(alert)}
                        className="h-8"
                        title="Freeze Wallet"
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFlagUser(alert)}
                        className="h-8"
                        title="Flag User"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEscalate(alert)}
                        className="h-8"
                        title="Escalate"
                        disabled={alert.status === 'Investigating'}
                      >
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkFalsePositive(alert)}
                        className="h-8 text-red-400 hover:text-red-300"
                        title="Mark as False Positive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert & Notification Center */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-400" />
            Alert & Notification Center
          </CardTitle>
          <CardDescription>Real-time fraud alerts and system notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`border rounded-lg p-3 flex items-start justify-between ${
                    notif.read
                      ? 'border-slate-200 dark:border-slate-800 bg-black'
                      : 'border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          notif.severity === 'critical' || notif.severity === 'high'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {notif.severity}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{notif.title}</span>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(notif.timestamp), 'MMM d, HH:mm')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === notif.id ? { ...n, read: !n.read } : n))
                      )
                    }}
                    className="h-8"
                  >
                    {notif.read ? 'Mark Unread' : 'Mark Read'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fraud Attempts Chart */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Fraud Attempts Over Time</CardTitle>
          <CardDescription>Last 7 days of fraud attempts and blocked transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <EnhancedLineChart
              data={fraudAttemptsData}
              dataKeys={[
                { key: 'attempts', name: 'Attempts', color: '#ef4444' },
                { key: 'blocked', name: 'Blocked', color: '#10b981' },
              ]}
              xAxisKey="date"
              height={300}
            />
          )}
        </CardContent>
      </Card>

      {/* Transaction Risk Analysis Table */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Transaction Risk Analysis</CardTitle>
              <CardDescription>High-risk transactions requiring review</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-48 bg-background border-slate-200 dark:border-slate-700"
                />
              </div>
              <Select
                value={transactionFilters.riskLevel}
                onValueChange={(value) =>
                  setTransactionFilters({ ...transactionFilters, riskLevel: value })
                }
              >
                <SelectTrigger className="w-32 bg-background border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="high">High (70+)</SelectItem>
                  <SelectItem value="medium">Medium (40-70)</SelectItem>
                  <SelectItem value="low">Low (&lt;40)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min Amount"
                  value={transactionFilters.minAmount}
                  onChange={(e) =>
                    setTransactionFilters({ ...transactionFilters, minAmount: e.target.value })
                  }
                  className="w-32 bg-background border-slate-200 dark:border-slate-700"
                />
                <Input
                  type="number"
                  placeholder="Max Amount"
                  value={transactionFilters.maxAmount}
                  onChange={(e) =>
                    setTransactionFilters({ ...transactionFilters, maxAmount: e.target.value })
                  }
                  className="w-32 bg-background border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <DataTable
              data={filteredTransactions}
              columns={transactionColumns}
              pagination={{ pageSize: 10 }}
              emptyMessage="No high-risk transactions found"
            />
          )}
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Audit Log
          </CardTitle>
          <CardDescription>Record of all actions performed on fraud alerts and user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p>No audit log entries yet</p>
              <p className="text-sm">Actions will be logged here as you interact with the system</p>
            </div>
          ) : (
            <DataTable
              data={auditLogs}
              columns={auditLogColumns}
              pagination={{ pageSize: 10 }}
              emptyMessage="No audit log entries"
            />
          )}
        </CardContent>
      </Card>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-2xl bg-black border-slate-200 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Alert Details
              </DialogTitle>
              <DialogDescription>Detailed information about the fraud alert</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Alert Type</p>
                  <p className="font-medium">{selectedAlert.alertType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <Badge className={getRiskLevelColor(selectedAlert.riskLevel)}>
                    {selectedAlert.riskLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedAlert.status)}>{selectedAlert.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{selectedAlert.amount.toLocaleString()} RWF</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedAlert.userName || selectedAlert.userId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-medium">
                    {format(parseISO(selectedAlert.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </p>
                </div>
                {selectedAlert.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedAlert.location}</p>
                  </div>
                )}
                {selectedAlert.transactionId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-sm">{selectedAlert.transactionId}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <p className="text-sm">{selectedAlert.reason}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  handleViewUserProfile(selectedAlert.userId)
                  setSelectedAlert(null)
                }}
              >
                View User Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* User Risk Profile Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-3xl bg-black border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-400" />
                User Risk Profile
              </DialogTitle>
              <DialogDescription>Comprehensive risk assessment for {selectedUser.userName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-medium">{selectedUser.userId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedUser.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <Badge
                    className={
                      selectedUser.riskScore >= 70
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : selectedUser.riskScore >= 40
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : 'bg-green-500/20 text-green-400 border-green-500/30'
                    }
                  >
                    {selectedUser.riskScore}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">KYC Status</p>
                  <Badge
                    variant={
                      selectedUser.kycStatus === 'verified'
                        ? 'default'
                        : selectedUser.kycStatus === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {selectedUser.kycStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Status</p>
                  <Badge variant={selectedUser.walletFrozen ? 'destructive' : 'default'}>
                    {selectedUser.walletFrozen ? 'Frozen' : 'Active'}
                  </Badge>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="font-medium mb-3">Recent Transactions</h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                          <th className="px-4 py-2 text-left">ID</th>
                          <th className="px-4 py-2 text-left">Amount</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.recentTransactions.map((tx) => (
                          <tr
                            key={tx.id}
                            className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                          >
                            <td className="px-4 py-2 font-mono text-xs">{tx.id}</td>
                            <td className="px-4 py-2">{tx.amount.toLocaleString()} RWF</td>
                            <td className="px-4 py-2">
                              <Badge variant={tx.status === 'successful' ? 'default' : 'secondary'}>
                                {tx.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {format(parseISO(tx.timestamp), 'MMM d, HH:mm')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Previous Flags */}
              <div>
                <h4 className="font-medium mb-3">Previous Flags</h4>
                <div className="space-y-2">
                  {selectedUser.previousFlags.map((flag) => (
                    <div
                      key={flag.id}
                      className="border rounded-lg p-3 bg-black"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{flag.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(flag.timestamp), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge variant={flag.resolved ? 'default' : 'destructive'}>
                          {flag.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="flex-wrap gap-2">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleFreezeAccount(selectedUser.userId)}
                disabled={selectedUser.walletFrozen}
              >
                {selectedUser.walletFrozen ? 'Account Frozen' : 'Freeze Account'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleRequestKYC(selectedUser.userId)}
              >
                Request Additional KYC
              </Button>
            </DialogFooter>
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

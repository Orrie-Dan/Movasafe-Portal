'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ViewDetailsDialog } from '@/components/admin/ViewDetailsDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw, Eye, AlertCircle, CheckCircle2, Loader2, DollarSign, Clock, BarChart3, PieChart, TrendingUp, TrendingDown, Scale, Filter, Calendar, Info, Table as TableIcon } from 'lucide-react'
import { format, parseISO, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import { apiGetAllEscrows, apiProcessRefund, apiResolveDispute } from '@/lib/api/escrows'
import { apiGetUsers } from '@/lib/api/users'
import type { EscrowTransaction } from '@/lib/types/escrows'
import type { User } from '@/lib/types/user'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { MetricCardEnhanced } from '@/components/dashboard/metrics/MetricCardEnhanced'
import { useAuth } from '@/lib/auth/hooks'
import { PERMISSIONS } from '@/lib/auth/permissions'

interface EscrowWithResolution extends EscrowTransaction {
  clientName?: string
  vendorName?: string
  disputeResolution?: string
  disputeResolvedBy?: string
  disputeResolvedAt?: string
  disputedAt?: string
  disputeResolutionNotes?: string | null
  resolutionAction?: 'RELEASE' | 'REFUND' | null
}

interface Filters {
  dateRange: { from: Date | null; to: Date | null }
  escrowStatus: 'all' | 'DISPUTED' | 'RELEASED' | 'REFUNDED' | 'ACTIVE'
  resolutionAction: 'all' | 'RELEASE' | 'REFUND'
  adminResolver: string
  searchTerm: string
}

// ============ KPI Card Component with Formula Documentation ============
function KPICard({ 
  title, 
  label, 
  value, 
  unit = '', 
  icon: Icon, 
  color = 'blue', 
  formula,
  dataFields,
  purpose 
}: { 
  title: string
  label: string
  value: string | number
  unit?: string
  icon: any
  color?: string
  formula?: string
  dataFields?: string
  purpose?: string
}) {
  const colorClasses: Record<string, string> = {
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-black',
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-black',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-black',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-black',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-black',
  }
  
  return (
    <Card className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
              {title}
              {formula && (
                <span title={`Formula: ${formula}\nData: ${dataFields}\nPurpose: ${purpose}`} aria-label="metric formula">
                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                </span>
              )}
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-500">{label}</p>
            {formula && (
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 font-mono">
                {formula}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
          {unit && <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

// ============ Main Page Component ============
export default function EscrowDisputesAnalyticsPage() {
  const { hasPermission } = useAuth()
  const hasRefundPermission = hasPermission(PERMISSIONS.REFUND_ESCROW)
  const hasResolvePermission = hasPermission(PERMISSIONS.RESOLVE_DISPUTE)

  const [escrows, setEscrows] = useState<EscrowWithResolution[]>([])
  const [users, setUsers] = useState<Map<string, User>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowWithResolution | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
  const [isResolveDisputeDialogOpen, setIsResolveDisputeDialogOpen] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [disputeAction, setDisputeAction] = useState<'RELEASE' | 'REFUND'>('RELEASE')
  const [disputeNotes, setDisputeNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    dateRange: { from: null, to: null },
    escrowStatus: 'all',
    resolutionAction: 'all',
    adminResolver: 'all',
    searchTerm: '',
  })

  useEffect(() => {
    fetchEscrows()
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiGetUsers({ limit: 1000 })
        const userMap = new Map<string, User>()
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach((user: User) => userMap.set(user.id, user))
        }
        setUsers(userMap)
      } catch (err) {
        console.error('Failed to load users for escrow names:', err)
      }
    }
    fetchUsers()
  }, [])

  const fetchEscrows = async () => {
    setLoading(true)
    try {
      // Get full escrow list from admin endpoint so that
      // analytics and tables can include ACTIVE, DISPUTED,
      // RELEASED and REFUNDED escrows.
      const allEscrows = await apiGetAllEscrows({ limit: 100 })
      setEscrows((allEscrows || []) as EscrowWithResolution[])
    } catch (error) {
      console.error('Fetch error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch escrows',
        variant: 'destructive',
      })
      setEscrows([])
    } finally {
      setLoading(false)
    }
  }

  // ============ Calculate Metrics with Formulas ============
  const metrics = useMemo(() => {
    // Filter by date range if set
    let filtered = escrows
    if (filters.dateRange.from && filters.dateRange.to) {
      filtered = escrows.filter(e => {
        const createdAt = new Date(e.createdAt)
        return isWithinInterval(createdAt, {
          start: startOfDay(filters.dateRange.from!),
          end: endOfDay(filters.dateRange.to!),
        })
      })
    }

    const disputed = filtered.filter(e => e.status === 'DISPUTED' || e.escrowStatus === 'DISPUTED')
    const resolved = filtered.filter(e =>
      e.status === 'RELEASED' ||
      e.status === 'REFUNDED' ||
      e.escrowStatus === 'RELEASED' ||
      e.escrowStatus === 'REFUNDED' ||
      e.resolutionAction === 'RELEASE' ||
      e.resolutionAction === 'REFUND'
    )
    const refunded = filtered.filter(e =>
      e.status === 'REFUNDED' ||
      e.escrowStatus === 'REFUNDED' ||
      e.resolutionAction === 'REFUND'
    )
    const released = filtered.filter(e =>
      e.status === 'RELEASED' ||
      e.escrowStatus === 'RELEASED' ||
      e.resolutionAction === 'RELEASE'
    )
    const active = filtered.filter(e => e.status === 'ACTIVE' || e.escrowStatus === 'ACTIVE')

    const clientWins = refunded.length
    const vendorWins = released.length
    const totalResolved = resolved.length

    // KPI Formulas based on resolution outcomes
    const clientWinRate = totalResolved > 0 ? ((clientWins / totalResolved) * 100).toFixed(1) : '0'
    const vendorWinRate = totalResolved > 0 ? ((vendorWins / totalResolved) * 100).toFixed(1) : '0'
    const fairnessIndex = (1 - Math.abs(Number(clientWinRate) - Number(vendorWinRate)) / 100).toFixed(2)

    // Resolution time calculation: AVG(disputeResolvedAt - disputedAt) for resolved disputes
    const resolutionTimes = resolved
      .filter(e => {
        const resolvedAt = e.disputeResolvedAt ? new Date(e.disputeResolvedAt) : null
        const disputedAt = e.disputedAt ? new Date(e.disputedAt) : (e.createdAt ? new Date(e.createdAt) : null)
        return resolvedAt && disputedAt
      })
      .map(e => {
        const disputedAt = e.disputedAt ? new Date(e.disputedAt).getTime() : new Date(e.createdAt).getTime()
        const resolvedTime = new Date(e.disputeResolvedAt!).getTime()
        return (resolvedTime - disputedAt) / (1000 * 60 * 60 * 24)
      })

    const avgResolutionTime =
      resolutionTimes.length > 0 ? (resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1) : '0'
    
    // Financial and lifecycle metrics derived directly from the API payload
    const now = new Date().getTime()

    // Total disputed amount (amount currently in DISPUTED status)
    const totalDisputedAmount = disputed.reduce((sum, e) => sum + (e.amount || e.escrowAmount || 0), 0)

    // Total value at risk (kept for backward compatibility, same definition as totalDisputedAmount)
    const totalValueAtRisk = totalDisputedAmount

    // Total commission at risk and average commission percentage on disputed escrows
    const totalCommissionAtRisk = disputed.reduce((sum, e) => sum + (e.commissionAmount || 0), 0)
    const commissionPercents = disputed
      .map(e => (typeof e.commissionPercentage === 'number' ? e.commissionPercentage : null))
      .filter((v): v is number => v !== null)
    const avgCommissionPct =
      commissionPercents.length > 0
        ? (commissionPercents.reduce((a, b) => a + b, 0) / commissionPercents.length).toFixed(1)
        : '0'

    // Average dispute age in days for currently disputed escrows
    const disputeAges = disputed
      .map(e => {
        const base = e.disputedAt ? new Date(e.disputedAt).getTime() : (e.createdAt ? new Date(e.createdAt).getTime() : null)
        if (!base) return null
        return (now - base) / (1000 * 60 * 60 * 24)
      })
      .filter((v): v is number => v !== null)
    const avgDisputeAgeDays =
      disputeAges.length > 0 ? (disputeAges.reduce((a, b) => a + b, 0) / disputeAges.length).toFixed(1) : '0'

    // Average contractual expiration window (expirationDays) from API
    const expirationDaysValues = disputed
      .map(e => (typeof e.expirationDays === 'number' ? e.expirationDays : null))
      .filter((v): v is number => v !== null)
    const avgExpirationDays =
      expirationDaysValues.length > 0
        ? (expirationDaysValues.reduce((a, b) => a + b, 0) / expirationDaysValues.length).toFixed(1)
        : '0'

    // Disputes approaching expiry within the next 7 days
    const disputesApproachingExpiry = disputed.filter(e => {
      if (e.isExpired) return false
      const effective = e.effectiveExpiresAt || e.expiresAt
      if (!effective) return false
      const expTime = new Date(effective).getTime()
      const diffDays = (expTime - now) / (1000 * 60 * 60 * 24)
      return diffDays >= 0 && diffDays <= 7
    }).length

    return {
      // Core counts
      pendingDisputes: disputed.length,
      totalResolved,
      activeEscrows: active.length,

      // Outcome metrics (still used by charts)
      clientWinRate,
      vendorWinRate,
      fairnessIndex,
      clientWins,
      vendorWins,
      avgResolutionTime,

      // Financial metrics
      totalDisputedAmount,
      totalValueAtRisk,
      totalCommissionAtRisk,
      avgCommissionPct,

      // Lifecycle metrics
      avgDisputeAgeDays,
      avgExpirationDays,
      disputesApproachingExpiry,

      // Base data for filtered views
      allEscrows: filtered,
    }
  }, [escrows, filters.dateRange])

  // ============ Chart Data - Using Real API Data ============
  const chartData = useMemo(() => {
    // Line Chart: Monthly Trends from real data
    const now = new Date()
    const monthlyData = []
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = subDays(now, i * 30)
      const monthEnd = subDays(now, (i - 1) * 30)
      const monthLabel = format(monthStart, 'MMM yyyy')
      
      // Count disputes created in this month
      const newDisputes = escrows.filter(e => {
        const created = new Date(e.createdAt)
        return created >= monthStart && created < monthEnd && e.status === 'DISPUTED'
      }).length
      
      // Count disputes resolved in this month
      const resolved = escrows.filter(e => {
        if (!e.disputeResolvedAt) return false
        const resolvedDate = new Date(e.disputeResolvedAt)
        return resolvedDate >= monthStart && resolvedDate < monthEnd
      }).length
      
      monthlyData.push({
        month: format(monthStart, 'MMM'),
        monthYear: monthLabel,
        'New Disputes': newDisputes,
        'Resolved Disputes': resolved,
      })
    }

    // Duration Distribution Data
    const resolved = escrows.filter(e => e.disputeResolvedAt && e.createdAt)
    const durationBuckets = {
      '1-3 days': 0,
      '4-7 days': 0,
      '8-14 days': 0,
      '15-30 days': 0,
      '30+ days': 0,
    }

    resolved.forEach(e => {
      const created = new Date(e.createdAt).getTime()
      const resolvedTime = new Date(e.disputeResolvedAt!).getTime()
      const days = (resolvedTime - created) / (1000 * 60 * 60 * 24)
      
      if (days <= 3) durationBuckets['1-3 days']++
      else if (days <= 7) durationBuckets['4-7 days']++
      else if (days <= 14) durationBuckets['8-14 days']++
      else if (days <= 30) durationBuckets['15-30 days']++
      else durationBuckets['30+ days']++
    })

    const durationData = Object.entries(durationBuckets).map(([duration, count]) => ({
      duration,
      count,
    }))

    return {
      trends: monthlyData,
      durations: durationData,
    }
  }, [escrows, metrics])

  // ============ Filtered Data ============
  const filteredEscrows = useMemo(() => {
    return metrics.allEscrows.filter(escrow => {
      // Escrow Status Filter
      if (filters.escrowStatus !== 'all') {
        const status = escrow.escrowStatus || escrow.status
        if (status !== filters.escrowStatus) return false
      }

      // Resolution Action Filter
      if (filters.resolutionAction !== 'all') {
        const action = escrow.resolutionAction
        if (action !== filters.resolutionAction) return false
      }

      // Admin Resolver Filter
      if (filters.adminResolver !== 'all') {
        if (escrow.disputeResolvedBy !== filters.adminResolver) return false
      }

      // Search Term Filter
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase()
        if (
          !escrow.id.toLowerCase().includes(term) &&
          !escrow.escrowId?.toLowerCase().includes(term) &&
          !escrow.clientId.toLowerCase().includes(term) &&
          !escrow.vendorId.toLowerCase().includes(term) &&
          !escrow.clientName?.toLowerCase().includes(term) &&
          !escrow.vendorName?.toLowerCase().includes(term)
        ) {
          return false
        }
      }
      return true
    })
  }, [metrics.allEscrows, filters])

  // Get unique admin resolvers for filter dropdown
  const adminResolvers = useMemo(() => {
    const resolvers = new Set<string>()
    escrows.forEach(e => {
      if (e.disputeResolvedBy) {
        resolvers.add(e.disputeResolvedBy)
      }
    })
    return Array.from(resolvers).sort()
  }, [escrows])

  const formatCurrency = (amount: number) => {
    return `${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} RWF`
  }

  // Client Name column: use API clientName, else resolve from users by clientId
  const getClientName = (escrow: EscrowWithResolution) => {
    const fromApi = escrow.clientName != null && String(escrow.clientName).trim() !== ''
    if (fromApi) return String(escrow.clientName).trim()
    const user = escrow.clientId ? users.get(escrow.clientId) : undefined
    if (user?.fullName?.trim()) return user.fullName.trim()
    if (escrow.clientId?.trim()) return escrow.clientId.substring(0, 16)
    return 'N/A'
  }

  // Vendor Name column: use API vendorName, else resolve from users by vendorId
  const getVendorName = (escrow: EscrowWithResolution) => {
    const fromApi = escrow.vendorName != null && String(escrow.vendorName).trim() !== ''
    if (fromApi) return String(escrow.vendorName).trim()
    const user = escrow.vendorId ? users.get(escrow.vendorId) : undefined
    if (user?.fullName?.trim()) return user.fullName.trim()
    if (escrow.vendorId?.trim()) return escrow.vendorId.substring(0, 16)
    return 'N/A'
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      ACTIVE: 'bg-blue-500',
      DISPUTED: 'bg-red-500',
      RELEASED: 'bg-green-500',
      REFUNDED: 'bg-orange-500',
    }
    return <Badge className={`${badges[status] || badges.ACTIVE} text-white`}>{status}</Badge>
  }

  const handleViewDetails = (escrow: EscrowWithResolution) => {
    setSelectedEscrow(escrow)
    setIsDetailDialogOpen(true)
  }

  const handleRefund = async () => {
    // Permission Check
    if (!hasRefundPermission) {
      toast({ title: 'Error', description: 'You do not have permission to refund escrows', variant: 'destructive' })
      return
    }

    // Status Check: Only ACTIVE escrows can be refunded
    const status = selectedEscrow?.escrowStatus || selectedEscrow?.status
    if (!selectedEscrow || status !== 'ACTIVE') {
      toast({ title: 'Error', description: 'Only ACTIVE escrows can be refunded. Current status: ' + status, variant: 'destructive' })
      return
    }

    setActionLoading(true)
    try {
      await apiProcessRefund(selectedEscrow.id)
      toast({ title: 'Success', description: 'Refund processed successfully', variant: 'default' })
      setIsRefundDialogOpen(false)
      setIsDetailDialogOpen(false)
      setRefundReason('')
      await fetchEscrows()
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to process refund', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolveDispute = async () => {
    // Permission Check
    if (!hasResolvePermission) {
      toast({ title: 'Error', description: 'You do not have permission to resolve disputes', variant: 'destructive' })
      return
    }

    // Status Check: Only DISPUTED escrows can be resolved
    const status = selectedEscrow?.escrowStatus || selectedEscrow?.status
    if (!selectedEscrow || status !== 'DISPUTED') {
      toast({ title: 'Error', description: 'Only DISPUTED escrows can be resolved. Current status: ' + status, variant: 'destructive' })
      return
    }

    // Notes Validation: 10-2000 characters required
    if (!disputeNotes.trim() || disputeNotes.length < 10 || disputeNotes.length > 2000) {
      toast({ title: 'Error', description: 'Resolution notes must be 10-2000 characters', variant: 'destructive' })
      return
    }

    setActionLoading(true)
    try {
      await apiResolveDispute(selectedEscrow.id, disputeAction, disputeNotes)
      toast({ title: 'Success', description: 'Dispute resolved successfully', variant: 'default' })
      setIsResolveDisputeDialogOpen(false)
      setIsDetailDialogOpen(false)
      setDisputeNotes('')
      setDisputeAction('RELEASE')
      await fetchEscrows()
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to resolve', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-black p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-black">
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Scale className="h-8 w-8 text-blue-600" />
                Escrow Disputes & Refunds
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comprehensive analytics and management for disputed escrow transactions
              </p>
            </div>
            <Button onClick={fetchEscrows} disabled={loading} variant="outline" className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-black">
          <CardHeader className="bg-white dark:bg-black border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
                  <Filter className="h-5 w-5 text-blue-500" />
                  Filters
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range Filter */}
              <div>
                <Label className="text-sm font-semibold mb-2 block text-gray-900 dark:text-white">Date Range</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={filters.dateRange.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, from: e.target.value ? new Date(e.target.value) : null }
                    }))}
                    className="flex-1"
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <Input
                    type="date"
                    value={filters.dateRange.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, to: e.target.value ? new Date(e.target.value) : null }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Escrow Status Filter */}
              <div>
                <Label className="text-sm font-semibold mb-2 block text-gray-900 dark:text-white">Escrow Status</Label>
                <Select
                  value={filters.escrowStatus}
                  onValueChange={(value: any) => setFilters(prev => ({ ...prev, escrowStatus: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="DISPUTED">DISPUTED</SelectItem>
                    <SelectItem value="RELEASED">RELEASED</SelectItem>
                    <SelectItem value="REFUNDED">REFUNDED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resolution Action Filter */}
              <div>
                <Label className="text-sm font-semibold mb-2 block text-gray-900 dark:text-white">Resolution Action</Label>
                <Select value={filters.resolutionAction} onValueChange={(value: any) => setFilters(prev => ({ ...prev, resolutionAction: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="RELEASE">RELEASE (Vendor Wins)</SelectItem>
                    <SelectItem value="REFUND">REFUND (Client Wins)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Resolver Filter */}
              <div>
                <Label className="text-sm font-semibold mb-2 block text-gray-900 dark:text-white">Admin Resolver</Label>
                <Select value={filters.adminResolver} onValueChange={(value: any) => setFilters(prev => ({ ...prev, adminResolver: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Admins</SelectItem>
                    {adminResolvers.map(admin => (
                      <SelectItem key={admin} value={admin}>{admin}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Term */}
              <div>
                <Label className="text-sm font-semibold mb-2 block text-gray-900 dark:text-white">Search</Label>
                <Input
                  placeholder="ID, client, vendor..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => setFilters({
                dateRange: { from: null, to: null },
                escrowStatus: 'all',
                resolutionAction: 'all',
                adminResolver: 'all',
                searchTerm: '',
              })} variant="outline" size="sm">
                Clear Filters
              </Button>
              <Button onClick={fetchEscrows} disabled={loading} variant="outline" size="sm" className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* Tables Section */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <TableIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Dispute Management Tables
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Actionable tables for managing pending disputes and reviewing resolved dispute history. 
                  Use these tables to prioritize work, take action on pending disputes, and audit past resolutions.
                </p>
              </div>
            </div>
          </div>

          {/* Table 1: Pending Disputes (Actionable) */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-black">
            <CardHeader className="bg-white dark:bg-black border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    Pending Disputes
                  </CardTitle>
                </div>
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  {filteredEscrows.filter(e => {
                    const status = e.escrowStatus || e.status
                    return status === 'DISPUTED'
                  }).length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Pending Disputes
              </h3>
              <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-black border-b">
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Internal reference</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Client Name</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Vendor Name</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Escrow Amount</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Created At</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Disputed At</TableHead>
                        <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Days Pending</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {filteredEscrows.filter(e => {
                      const status = e.escrowStatus || e.status
                      return status === 'DISPUTED'
                    }).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center">
                            <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">No Pending Disputes</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All disputes have been resolved. Great job maintaining a clean dispute queue!</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEscrows.filter(e => {
                        const status = e.escrowStatus || e.status
                        return status === 'DISPUTED'
                      }).map(escrow => {
                        const disputedDate = escrow.disputedAt ? new Date(escrow.disputedAt) : (escrow.createdAt ? new Date(escrow.createdAt) : new Date())
                        const daysPending = Math.floor((Date.now() - disputedDate.getTime()) / (1000 * 60 * 60 * 24))
                        return (
                          <TableRow key={escrow.id} className="hover:bg-gray-50 dark:hover:bg-black/60 border-b border-gray-100 dark:border-gray-800">
                            <TableCell className="font-mono text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={escrow.internalReference || escrow.id}>{escrow.internalReference || escrow.id}</TableCell>
                            <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={getClientName(escrow)}>{getClientName(escrow)}</TableCell>
                            <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={getVendorName(escrow)}>{getVendorName(escrow)}</TableCell>
                            <TableCell className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(escrow.escrowAmount || escrow.amount)}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300 whitespace-nowrap">{escrow.createdAt ? format(parseISO(escrow.createdAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300 whitespace-nowrap">{escrow.disputedAt ? format(parseISO(escrow.disputedAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                            <TableCell>
                              <Badge className={daysPending > 7 ? 'bg-red-600' : daysPending > 3 ? 'bg-yellow-600' : 'bg-green-600'}>
                                {daysPending} days
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetails(escrow)} className="hover:bg-gray-100 dark:hover:bg-black">
                                <Eye className="h-4 w-4" />
                                <span className="ml-2 text-xs">View</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Table 2: Resolved Disputes (Audit-Focused, Read-Only) */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-black">
            <CardHeader className="bg-white dark:bg-black border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    Resolved Disputes
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-sm px-3 py-1 border-green-500 text-green-700 dark:text-green-400">
                  {filteredEscrows.filter(e => {
                    const status = e.escrowStatus || e.status
                    const action = e.resolutionAction
                    return (
                      status === 'RELEASED' ||
                      status === 'REFUNDED' ||
                      action === 'RELEASE' ||
                      action === 'REFUND'
                    )
                  }).length} Resolved
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Resolved Disputes
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-black border-b">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Internal reference</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Client Name</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Vendor Name</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Escrow Amount</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Escrow Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">commissionPercentage</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">commissionAmount</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">vendorAmount</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">serviceDescription</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Resolved At</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">disputeResolvedBy</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEscrows.filter(e => {
                      const status = e.escrowStatus || e.status
                      const action = e.resolutionAction
                      return (
                        status === 'RELEASED' ||
                        status === 'REFUNDED' ||
                        action === 'RELEASE' ||
                        action === 'REFUND'
                      )
                    }).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center">
                            <CheckCircle2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">No Resolved Disputes</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No disputes have been resolved yet. Resolved disputes will appear here for audit purposes.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEscrows.filter(e => {
                        const status = e.escrowStatus || e.status
                        const action = e.resolutionAction
                        return (
                          status === 'RELEASED' ||
                          status === 'REFUNDED' ||
                          action === 'RELEASE' ||
                          action === 'REFUND'
                        )
                      }).map(escrow => (
                        <TableRow key={escrow.id} className="hover:bg-gray-50 dark:hover:bg-black/60 border-b border-gray-100 dark:border-gray-800">
                          <TableCell className="font-mono text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={escrow.internalReference || escrow.id}>{escrow.internalReference || escrow.id}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={getClientName(escrow)}>{getClientName(escrow)}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={getVendorName(escrow)}>{getVendorName(escrow)}</TableCell>
                          <TableCell className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(escrow.escrowAmount || escrow.amount)}</TableCell>
                          <TableCell>{getStatusBadge(escrow.escrowStatus || escrow.status)}</TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">{escrow.commissionPercentage != null ? `${escrow.commissionPercentage}%` : 'N/A'}</TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300 whitespace-nowrap">{escrow.commissionAmount != null ? formatCurrency(escrow.commissionAmount) : 'N/A'}</TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300 whitespace-nowrap">{escrow.vendorAmount != null ? formatCurrency(escrow.vendorAmount) : 'N/A'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={escrow.serviceDescription ?? ''}>{escrow.serviceDescription ?? 'N/A'}</TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {escrow.disputeResolvedAt ? format(parseISO(escrow.disputeResolvedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={escrow.disputeResolvedBy ?? 'System'}>{escrow.disputeResolvedBy ?? 'System'}</TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetails(escrow)} className="hover:bg-gray-100 dark:hover:bg-black">
                              <Eye className="h-4 w-4" />
                              <span className="ml-2 text-xs">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {selectedEscrow && (
        <ViewDetailsDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          title="Escrow Transaction Details"
          subtitle={
            (selectedEscrow.escrowStatus || selectedEscrow.status) === 'DISPUTED' ? (
              <span className="flex items-center gap-2 mt-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">Pending Resolution</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 mt-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">Resolved</span>
              </span>
            )
          }
          badge={getStatusBadge(selectedEscrow.escrowStatus || selectedEscrow.status)}
          maxWidth="3xl"
          sections={[
            {
              title: 'Transaction',
              gridCols: 2,
              fields: [
                { label: 'Internal reference', value: <span className="font-mono text-sm bg-slate-100 dark:bg-black p-2 rounded block">{selectedEscrow.internalReference ?? selectedEscrow.id}</span> },
                { label: 'Current Status', value: getStatusBadge(selectedEscrow.status) },
                { label: 'Dispute Amount', value: <span className="text-xl font-bold">{formatCurrency(selectedEscrow.amount)}</span> },
                { label: 'Created Date', value: format(parseISO(selectedEscrow.createdAt), 'MMMM dd, yyyy HH:mm') },
              ],
            },
            {
              title: 'Parties',
              gridCols: 2,
              fields: [
                { label: 'Client', value: getClientName(selectedEscrow) },
                { label: 'Vendor', value: getVendorName(selectedEscrow) },
              ],
            },
            ...((selectedEscrow.disputeResolvedAt || selectedEscrow.status === 'RELEASED' || selectedEscrow.status === 'REFUNDED')
              ? [
                  {
                    title: 'Resolution Information',
                    children: (
                      <div className="space-y-4 bg-green-50 dark:bg-black border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Resolved By</p>
                            <p className="text-slate-900 dark:text-white">{selectedEscrow.disputeResolvedBy || 'System Administrator'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Resolution Date</p>
                            <p className="text-slate-900 dark:text-white">
                              {selectedEscrow.disputeResolvedAt ? format(parseISO(selectedEscrow.disputeResolvedAt), 'MMMM dd, yyyy HH:mm') : 'N/A'}
                            </p>
                          </div>
                        </div>
                        {selectedEscrow.disputeResolution && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Resolution Notes</p>
                            <p className="text-sm p-3 bg-white dark:bg-black rounded border border-green-200 dark:border-green-700 text-slate-900 dark:text-white">
                              {selectedEscrow.disputeResolution}
                            </p>
                          </div>
                        )}
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
          actions={[
            ...((selectedEscrow.escrowStatus || selectedEscrow.status) === 'ACTIVE' && hasRefundPermission
              ? [{ label: 'Process Direct Refund', onClick: () => setIsRefundDialogOpen(true), variant: 'destructive' as const, icon: <DollarSign className="h-4 w-4" /> }]
              : []),
            ...((selectedEscrow.escrowStatus || selectedEscrow.status) === 'DISPUTED' && hasResolvePermission
              ? [{ label: 'Resolve Dispute', onClick: () => setIsResolveDisputeDialogOpen(true), icon: <Scale className="h-4 w-4" /> }]
              : []),
          ]}
        />
      )}

      {/* Direct Refund Dialog - POST /api/admin/escrows/refund/{id} */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Process Direct Refund</DialogTitle>
            <DialogDescription>
              Refund {selectedEscrow ? getClientName(selectedEscrow) : 'client'} with {formatCurrency(selectedEscrow?.amount || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Endpoint:</span> POST /api/admin/escrows/refund/{selectedEscrow?.id?.substring(0, 12)}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
                This endpoint processes direct refunds to clients for ACTIVE escrow transactions without dispute intervention.
              </p>
            </div>
            <Textarea 
              placeholder="Reason for refund (optional)" 
              value={refundReason} 
              onChange={(e) => setRefundReason(e.target.value)} 
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsRefundDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button 
              onClick={handleRefund} 
              disabled={actionLoading}
              variant="destructive"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Resolution Dialog - POST /api/admin/escrows/resolve-dispute/{id} */}
      <Dialog open={isResolveDisputeDialogOpen} onOpenChange={setIsResolveDisputeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Resolve Dispute</DialogTitle>
            <DialogDescription>
              Adjudicate dispute for {selectedEscrow ? getClientName(selectedEscrow) : 'client'} vs {selectedEscrow ? getVendorName(selectedEscrow) : 'vendor'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <span className="font-semibold">Endpoint:</span> POST /api/admin/escrows/resolve-dispute/{selectedEscrow?.id?.substring(0, 12)}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-2">
                This endpoint adjudicates disputed escrows with comprehensive audit trail and automatic notifications to both parties.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">Resolution Decision *</label>
              <Select value={disputeAction} onValueChange={(value: any) => setDisputeAction(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select ACTION" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RELEASE">RELEASE</SelectItem>
                  <SelectItem value="REFUND">REFUND</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
                Resolution Notes & Justification *
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 block mt-1">
                  Explain your decision for audit trail (10-2000 characters required)
                </span>
              </label>
              <Textarea 
                placeholder="Provide detailed resolution rationale including evidence reviewed and decision justification..." 
                value={disputeNotes} 
                onChange={(e) => setDisputeNotes(e.target.value)} 
                className="min-h-[140px] font-mono text-sm"
              />
              <div className="flex justify-between mt-2">
                <span className={`text-xs font-medium ${disputeNotes.length < 10 ? 'text-red-600' : disputeNotes.length > 2000 ? 'text-red-600' : 'text-green-600'}`}>
                  {disputeNotes.length} / 2000 characters
                </span>
                {disputeNotes.length >= 10 && disputeNotes.length <= 2000 && (
                  <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Valid
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsResolveDisputeDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button 
              onClick={handleResolveDispute} 
              disabled={actionLoading || !disputeNotes.trim() || disputeNotes.length < 10 || disputeNotes.length > 2000}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {disputeAction === 'RELEASE' ? 'Release to Vendor' : 'Refund to Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

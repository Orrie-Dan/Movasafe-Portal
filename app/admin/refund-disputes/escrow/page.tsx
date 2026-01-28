'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw, Eye, AlertCircle, CheckCircle2, Loader2, DollarSign, Clock, User, BarChart3, PieChart, TrendingUp, TrendingDown, Scale, Filter, Calendar, Info, Table as TableIcon } from 'lucide-react'
import { format, parseISO, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import { apiGetDisputedEscrows, apiProcessRefund, apiResolveDispute } from '@/lib/api/escrows'
import type { EscrowTransaction } from '@/lib/types/escrows'
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
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950',
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

  const fetchEscrows = async () => {
    setLoading(true)
    try {
      // Get disputed escrows from the dedicated API endpoint
      const disputedEscrows = await apiGetDisputedEscrows()
      
      // Also fetch resolved escrows to show in analytics
      // We'll filter them from the disputed endpoint or add a status filter
      setEscrows((disputedEscrows || []) as EscrowWithResolution[])
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
    const resolved = filtered.filter(e => e.status === 'RELEASED' || e.status === 'REFUNDED' || e.escrowStatus === 'RELEASED' || e.escrowStatus === 'REFUNDED')
    const refunded = filtered.filter(e => e.status === 'REFUNDED' || e.escrowStatus === 'REFUNDED' || e.resolutionAction === 'REFUND')
    const released = filtered.filter(e => e.status === 'RELEASED' || e.escrowStatus === 'RELEASED' || e.resolutionAction === 'RELEASE')
    const active = filtered.filter(e => e.status === 'ACTIVE' || e.escrowStatus === 'ACTIVE')

    const clientWins = refunded.length
    const vendorWins = released.length
    const totalResolved = resolved.length

    // KPI Formulas
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
    
    // Value at Risk: SUM(escrowAmount) WHERE escrowStatus = DISPUTED
    const totalValueAtRisk = disputed.reduce((sum, e) => sum + (e.escrowAmount || e.amount), 0)

    return {
      pendingDisputes: disputed.length,
      totalResolved,
      clientWinRate,
      vendorWinRate,
      avgResolutionTime,
      fairnessIndex,
      totalValueAtRisk,
      clientWins,
      vendorWins,
      activeEscrows: active.length,
      allEscrows: filtered,
    }
  }, [escrows, filters.dateRange])

  // ============ Chart Data - Using Real API Data ============
  const chartData = useMemo(() => {
    // Pie Chart: Outcome Distribution
    const outcomeData = [
      { name: 'Vendor Wins (Released)', value: metrics.vendorWins, fill: '#10b981' },
      { name: 'Client Wins (Refunded)', value: metrics.clientWins, fill: '#f97316' },
    ]

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
      outcomes: outcomeData,
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
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M RWF`
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K RWF`
    return `${amount.toFixed(2)} RWF`
  }

  const getClientName = (escrow: EscrowWithResolution) => {
    if (escrow.clientName && escrow.clientName.trim()) return escrow.clientName.trim()
    if (escrow.clientId && escrow.clientId.trim()) return escrow.clientId.substring(0, 16)
    return 'N/A'
  }

  const getVendorName = (escrow: EscrowWithResolution) => {
    if (escrow.vendorName && escrow.vendorName.trim()) return escrow.vendorName.trim()
    if (escrow.vendorId && escrow.vendorId.trim()) return escrow.vendorId.substring(0, 16)
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
      <div className="flex-1 flex flex-col p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
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
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Filters & Search
                </CardTitle>
                <CardDescription className="mt-1">Refine your view by date range, status, resolution action, and admin resolver</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Date Range Filter */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Date Range</Label>
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
                  <span className="text-gray-500">to</span>
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
                <Label className="text-sm font-semibold mb-2 block">Escrow Status</Label>
                <Select value={filters.escrowStatus} onValueChange={(value: any) => setFilters(prev => ({ ...prev, escrowStatus: value }))}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label className="text-sm font-semibold mb-2 block">Resolution Action</Label>
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
                <Label className="text-sm font-semibold mb-2 block">Admin Resolver</Label>
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
                <Label className="text-sm font-semibold mb-2 block">Search</Label>
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

        {/* KPI Section - Row 1: Core Dispute Metrics */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Core Dispute Resolution Metrics
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Essential performance indicators tracking dispute volume, resolution rates, and processing efficiency. 
                  These metrics help monitor operational health and identify areas requiring attention.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCardEnhanced
              title="Pending Disputes"
              value={metrics.pendingDisputes}
              icon={AlertCircle}
              variant="warning"
              format="number"
              tooltip={(
                <div className="text-xs">
                  <div className="font-medium">Tracks active disputes</div>
                  <div className="text-gray-500">Count of escrows currently in DISPUTED status requiring admin action.</div>
                </div>
              )}
            />
            <MetricCardEnhanced
              title="Total Resolved"
              value={metrics.totalResolved}
              icon={CheckCircle2}
              variant="success"
              format="number"
              tooltip={(
                <div className="text-xs">
                  <div className="font-medium">Resolved disputes</div>
                  <div className="text-gray-500">Total disputes adjudicated during the current dataset.</div>
                </div>
              )}
            />
            <MetricCardEnhanced
              title="Client Win Rate"
              value={Number(metrics.clientWinRate)}
              icon={User}
              variant="default"
              format="percentage"
              tooltip={(
                <div className="text-xs">
                  <div className="font-medium">Client victory rate</div>
                  <div className="text-gray-500">Percentage of resolved disputes that resulted in refunds to clients.</div>
                </div>
              )}
            />
            <MetricCardEnhanced
              title="Vendor Win Rate"
              value={Number(metrics.vendorWinRate)}
              icon={User}
              variant="default"
              format="percentage"
              tooltip={(
                <div className="text-xs">
                  <div className="font-medium">Vendor victory rate</div>
                  <div className="text-gray-500">Percentage of resolved disputes that resulted in release of funds to vendors.</div>
                </div>
              )}
            />
            <MetricCardEnhanced
              title="Avg Resolution Time"
              value={Number(metrics.avgResolutionTime)}
              icon={Clock}
              variant="default"
              format="number"
              tooltip={(
                <div className="text-xs">
                  <div className="font-medium">Average resolution time</div>
                  <div className="text-gray-500">Average number of days between dispute filing and resolution.</div>
                </div>
              )}
            />
          </div>
        </div>

        {/* KPI Section - Row 2: Financial & Fairness Metrics */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Financial & Fairness Metrics
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Financial risk assessment and fairness analysis of dispute resolutions. 
                  Tracks total value at risk, resolution outcomes distribution, and ensures balanced adjudication between clients and vendors.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCardEnhanced
              title="Value at Risk"
              value={metrics.totalValueAtRisk}
              icon={DollarSign}
              variant="negative"
              format="currency"
              currency="RWF"
              tooltip={(
                <div className="text-xs">
                  <div className="font-medium">Financial exposure</div>
                  <div className="text-gray-500">Sum of amounts currently held in disputed escrows.</div>
                </div>
              )}
            />
            <MetricCardEnhanced
              title="Fairness Index"
              value={Number(metrics.fairnessIndex)}
              icon={Scale}
              variant="default"
              format="number"
              tooltip={(
                <div className="text-xs">
                  <div className="font-medium">Fairness index</div>
                  <div className="text-gray-500">1.0 indicates perfectly balanced outcomes between clients and vendors.</div>
                </div>
              )}
            />
            <MetricCardEnhanced
              title="Client Wins"
              value={metrics.clientWins}
              icon={CheckCircle2}
              variant="default"
              format="number"
              tooltip={(
                <div className="text-xs">
                  <div className="font-medium">Client wins</div>
                  <div className="text-gray-500">Total disputes resolved in favor of clients (refunds issued).</div>
                </div>
              )}
            />
            <MetricCardEnhanced
              title="Vendor Wins"
              value={metrics.vendorWins}
              icon={CheckCircle2}
              variant="success"
              format="number"
              tooltip={(
                <div className="text-xs">
                  <div className="font-medium">Vendor wins</div>
                  <div className="text-gray-500">Total disputes resolved in favor of vendors (funds released).</div>
                </div>
              )}
            />
          </div>
        </div>

        {/* Charts Section */}
        {(chartData.outcomes.some(o => o.value > 0) || chartData.trends.some(item => (item['New Disputes'] || 0) > 0 || (item['Resolved Disputes'] || 0) > 0) || chartData.durations.some(d => d.count > 0)) && (
          <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <PieChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Dispute Analytics & Visualizations
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Comprehensive visual analysis of dispute patterns, resolution trends, and time-to-resolution metrics. 
                  These charts provide insights into dispute volume, outcome distribution, and processing efficiency over time.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart: Resolution Outcomes */}
            {chartData.outcomes.some(o => o.value > 0) && (
              <Card className="border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
                      <PieChart className="h-6 w-6 text-blue-600" />
                      Resolution Outcomes Distribution
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Distribution of dispute resolutions: Client Wins (REFUND) vs Vendor Wins (RELEASE)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {chartData.outcomes.some(o => o.value > 0) ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie 
                            data={chartData.outcomes} 
                            cx="50%" 
                            cy="50%" 
                            labelLine={false} 
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                            outerRadius={100} 
                            fill="#8884d8" 
                            dataKey="value"
                          >
                            {chartData.outcomes.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => [`${value} disputes`, 'Count']}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              padding: '8px 12px'
                            }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(value) => value}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Breakdown</h4>
                      <div className="space-y-2">
                        {chartData.outcomes.map((item) => {
                          const total = chartData.outcomes.reduce((sum, o) => sum + o.value, 0)
                          const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
                          return (
                            <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                              <div className="flex items-center gap-2">
                                <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: item.fill }}></span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <PieChart className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-medium">No resolution data available</p>
                    <p className="text-xs mt-1">Resolve disputes to see outcome distribution</p>
                  </div>
                )}
              </CardContent>
              </Card>
            )}

            {/* Line Chart: Resolution Trends */}
            {chartData.trends.some(item => (item['New Disputes'] || 0) > 0 || (item['Resolved Disputes'] || 0) > 0) && (
              <Card className="border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                      Resolution Trends Over Time
                    </CardTitle>
                    <CardDescription className="mt-1">
                      12-month trend analysis of new disputes filed vs disputes resolved
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={chartData.trends} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        label={{ value: 'Month', position: 'insideBottom', offset: -5, fill: '#6b7280', style: { fontSize: '12px' } }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        label={{ value: 'Number of Disputes', angle: -90, position: 'insideLeft', fill: '#6b7280', style: { fontSize: '12px' } }}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`${value} disputes`, '']}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="New Disputes" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7 }}
                        name="New Disputes"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Resolved Disputes" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7 }}
                        name="Resolved Disputes"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Monthly Summary</h4>
                    <div className="max-h-[180px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 dark:bg-gray-800">
                            <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-300">Month</TableHead>
                            <TableHead className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300">New Disputes</TableHead>
                            <TableHead className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Resolved</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {chartData.trends.map((item) => (
                            <TableRow key={item.month} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <TableCell className="text-sm font-medium text-gray-900 dark:text-white">{item.monthYear}</TableCell>
                              <TableCell className="text-right text-sm font-semibold text-red-600 dark:text-red-400">{item['New Disputes']}</TableCell>
                              <TableCell className="text-right text-sm font-semibold text-green-600 dark:text-green-400">{item['Resolved Disputes']}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>
            )}
          </div>

          {/* Bar Chart: Resolution Duration Distribution */}
          {chartData.durations.some(d => d.count > 0) && (
            <Card className="border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                    Resolution Time Distribution
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Analysis of dispute resolution timeframes: How long disputes take from filing to resolution
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {chartData.durations.some(d => d.count > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.durations} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                        <XAxis 
                          dataKey="duration"
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          label={{ value: 'Resolution Timeframe', position: 'insideBottom', offset: -5, fill: '#6b7280', style: { fontSize: '12px' } }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          label={{ value: 'Number of Disputes', angle: -90, position: 'insideLeft', fill: '#6b7280', style: { fontSize: '12px' } }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value} disputes`, 'Count']}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="#8b5cf6" 
                          radius={[8, 8, 0, 0]}
                          name="Disputes"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Timeframe Breakdown</h4>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 dark:bg-gray-800">
                            <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-300">Duration Range</TableHead>
                            <TableHead className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Disputes</TableHead>
                            <TableHead className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Percentage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {chartData.durations.map((item) => {
                            const total = chartData.durations.reduce((sum, d) => sum + d.count, 0)
                            const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0'
                            return (
                              <TableRow key={item.duration} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <TableCell className="text-sm font-medium text-gray-900 dark:text-white">{item.duration}</TableCell>
                                <TableCell className="text-right text-sm font-semibold text-gray-900 dark:text-white">{item.count}</TableCell>
                                <TableCell className="text-right text-sm text-gray-600 dark:text-gray-400">{percentage}%</TableCell>
                              </TableRow>
                            )
                          })}
                          <TableRow className="bg-gray-50 dark:bg-gray-800 font-semibold">
                            <TableCell className="text-sm text-gray-900 dark:text-white">Total</TableCell>
                            <TableCell className="text-right text-sm text-gray-900 dark:text-white">{chartData.durations.reduce((sum, d) => sum + d.count, 0)}</TableCell>
                            <TableCell className="text-right text-sm text-gray-900 dark:text-white">100%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <Clock className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-medium">No resolution time data available</p>
                    <p className="text-xs mt-1">Resolve disputes to see time distribution analysis</p>
                  </div>
                )}
              </div>
            </CardContent>
            </Card>
          )}
          </div>
        )}

        {/* Tables Section */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
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
          <Card className="border border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    Pending Disputes Requiring Action
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <strong>Data Source:</strong> escrows WHERE escrowStatus = 'DISPUTED' | 
                    <strong> Purpose:</strong> Actionable list of disputes requiring immediate admin resolution | 
                    <strong> Admin Decision:</strong> Prioritize disputes by age (Days Pending) and amount (Escrow Amount) for efficient resolution workflow
                  </CardDescription>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800 border-b">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Escrow ID</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Client ID</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Vendor ID</TableHead>
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
                          <TableRow key={escrow.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                            <TableCell className="font-mono text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={escrow.id}>{escrow.id.substring(0, 12)}...</TableCell>
                            <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={escrow.clientId}>{escrow.clientId.substring(0, 16)}...</TableCell>
                            <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={escrow.vendorId}>{escrow.vendorId.substring(0, 16)}...</TableCell>
                            <TableCell className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(escrow.escrowAmount || escrow.amount)}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300 whitespace-nowrap">{escrow.createdAt ? format(parseISO(escrow.createdAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                            <TableCell className="text-gray-700 dark:text-gray-300 whitespace-nowrap">{escrow.disputedAt ? format(parseISO(escrow.disputedAt), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                            <TableCell>
                              <Badge className={daysPending > 7 ? 'bg-red-600' : daysPending > 3 ? 'bg-yellow-600' : 'bg-green-600'}>
                                {daysPending} days
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetails(escrow)} className="hover:bg-gray-100 dark:hover:bg-gray-800">
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
          <Card className="border border-gray-200 dark:border-gray-800 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    Resolved Disputes - Audit Trail & History
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <strong>Data Source:</strong> escrows WHERE escrowStatus IN ('RELEASED', 'REFUNDED') | 
                    <strong> Purpose:</strong> Immutable audit trail of all resolved disputes with complete resolution details | 
                    <strong> Admin Decision:</strong> Review resolution patterns, admin performance metrics, and ensure compliance with dispute resolution policies
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-sm px-3 py-1 border-green-500 text-green-700 dark:text-green-400">
                  {filteredEscrows.filter(e => {
                    const status = e.escrowStatus || e.status
                    return status === 'RELEASED' || status === 'REFUNDED'
                  }).length} Resolved
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800 border-b">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Escrow ID</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Client ID</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Vendor ID</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Escrow Amount</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Escrow Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Resolution Action</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Resolved At</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Resolved By</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEscrows.filter(e => {
                      const status = e.escrowStatus || e.status
                      return status === 'RELEASED' || status === 'REFUNDED'
                    }).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
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
                        return status === 'RELEASED' || status === 'REFUNDED'
                      }).map(escrow => (
                        <TableRow key={escrow.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                          <TableCell className="font-mono text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={escrow.id}>{escrow.id.substring(0, 12)}...</TableCell>
                          <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={escrow.clientId}>{escrow.clientId.substring(0, 16)}...</TableCell>
                          <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={escrow.vendorId}>{escrow.vendorId.substring(0, 16)}...</TableCell>
                          <TableCell className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(escrow.escrowAmount || escrow.amount)}</TableCell>
                          <TableCell>{getStatusBadge(escrow.escrowStatus || escrow.status)}</TableCell>
                          <TableCell>
                            {escrow.resolutionAction ? (
                              <Badge className={escrow.resolutionAction === 'RELEASE' ? 'bg-green-500' : 'bg-orange-500'}>
                                {escrow.resolutionAction}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {escrow.disputeResolvedAt ? format(parseISO(escrow.disputeResolvedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white max-w-xs truncate" title={escrow.disputeResolvedBy || 'System'}>{escrow.disputeResolvedBy || 'System'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(escrow)} className="hover:bg-gray-100 dark:hover:bg-gray-800">
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

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Escrow Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedEscrow?.status === 'DISPUTED' ? (
                <span className="flex items-center gap-2 mt-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 font-medium">Pending Resolution</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Resolved</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedEscrow && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transaction ID</label>
                  <p className="text-sm font-mono mt-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-900 p-2 rounded">{selectedEscrow.id}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current Status</label>
                  <div className="mt-2">{getStatusBadge(selectedEscrow.status)}</div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dispute Amount</label>
                  <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{formatCurrency(selectedEscrow.amount)}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created Date</label>
                  <p className="text-sm mt-2 text-gray-900 dark:text-white">{format(parseISO(selectedEscrow.createdAt), 'MMMM dd, yyyy HH:mm')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Client</label>
                  <p className="text-sm mt-2 text-gray-900 dark:text-white break-words">{getClientName(selectedEscrow)}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vendor</label>
                  <p className="text-sm mt-2 text-gray-900 dark:text-white break-words">{getVendorName(selectedEscrow)}</p>
                </div>
              </div>

              {(selectedEscrow.disputeResolvedAt || selectedEscrow.status === 'RELEASED' || selectedEscrow.status === 'REFUNDED') && (
                <div className="space-y-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Resolution Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Resolved By</label>
                      <p className="text-sm mt-1 text-gray-900 dark:text-white">{selectedEscrow.disputeResolvedBy || 'System Administrator'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Resolution Date</label>
                      <p className="text-sm mt-1 text-gray-900 dark:text-white">
                        {selectedEscrow.disputeResolvedAt ? format(parseISO(selectedEscrow.disputeResolvedAt), 'MMMM dd, yyyy HH:mm') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {selectedEscrow.disputeResolution && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Resolution Notes</label>
                      <p className="text-sm mt-2 p-3 bg-white dark:bg-gray-900 rounded border border-green-200 dark:border-green-700 text-gray-900 dark:text-white">
                        {selectedEscrow.disputeResolution}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Admin Action Rules: Show Refund button only if escrowStatus = ACTIVE AND admin has REFUND_ESCROW permission */}
                {(() => {
                  const status = selectedEscrow.escrowStatus || selectedEscrow.status
                  if (status === 'ACTIVE' && hasRefundPermission) {
                    return (
                      <Button 
                        onClick={() => setIsRefundDialogOpen(true)} 
                        variant="destructive"
                        className="flex-1"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Process Direct Refund
                      </Button>
                    )
                  }
                  return null
                })()}
                
                {/* Admin Action Rules: Show Resolve Dispute button only if escrowStatus = DISPUTED AND admin has RESOLVE_DISPUTE permission */}
                {(() => {
                  const status = selectedEscrow.escrowStatus || selectedEscrow.status
                  if (status === 'DISPUTED' && hasResolvePermission) {
                    return (
                      <Button 
                        onClick={() => setIsResolveDisputeDialogOpen(true)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Scale className="h-4 w-4 mr-2" />
                        Resolve Dispute
                      </Button>
                    )
                  }
                  return null
                })()}
                
                <Button onClick={() => setIsDetailDialogOpen(false)} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RELEASE">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Release to Vendor (Vendor Wins)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="REFUND">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span>Refund to Client (Client Wins)</span>
                    </div>
                  </SelectItem>
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

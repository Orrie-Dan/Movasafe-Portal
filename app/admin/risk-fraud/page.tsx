'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChart } from '@/components/dashboard/charts/pie-chart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { toast } from '@/hooks/use-toast'
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Store,
  User,
  FileText,
  Search,
} from 'lucide-react'
import { format, parseISO, subDays, startOfDay } from 'date-fns'
import {
  apiGetEscrowsByStatus,
  apiResolveDispute,
  apiProcessRefund,
  apiGetEscrowAuditLog,
} from '@/lib/api/escrows'
import type { EscrowTransaction } from '@/lib/types/escrows'

// ============================================================================
// TYPES
// ============================================================================

interface AuditLogEntry {
  escrowId: string
  resolution: string
  notes: string
  resolvedBy: string
  resolvedAt: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RefundDisputesPage() {
  // State
  const [loading, setLoading] = useState(true)
  const [disputedEscrows, setDisputedEscrows] = useState<EscrowTransaction[]>([])
  const [refundedEscrows, setRefundedEscrows] = useState<EscrowTransaction[]>([])
  const [activeEscrows, setActiveEscrows] = useState<EscrowTransaction[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Modal states
  const [selectedDispute, setSelectedDispute] = useState<EscrowTransaction | null>(null)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolutionAction, setResolutionAction] = useState<'RELEASE' | 'REFUND'>('RELEASE')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [notesError, setNotesError] = useState('')

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
  const [searchQuery, setSearchQuery] = useState('')

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [disputed, refunded, active, logs] = await Promise.all([
          apiGetEscrowsByStatus('DISPUTED').catch((err) => {
            console.error('Error fetching disputed:', err)
            return []
          }),
          apiGetEscrowsByStatus('REFUNDED').catch((err) => {
            console.error('Error fetching refunded:', err)
            return []
          }),
          apiGetEscrowsByStatus('ACTIVE').catch((err) => {
            console.error('Error fetching active:', err)
            return []
          }),
          apiGetEscrowAuditLog().catch((err) => {
            console.error('Error fetching audit log:', err)
            return []
          }),
        ])

        console.log('[Refund & Disputes] Data loaded:', {
          disputed: disputed?.length || 0,
          refunded: refunded?.length || 0,
          active: active?.length || 0,
          logs: logs?.length || 0,
        })

        setDisputedEscrows(disputed || [])
        setRefundedEscrows(refunded || [])
        setActiveEscrows(active || [])
        setAuditLog(logs || [])
      } catch (error) {
        console.error('Failed to load data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load refund and dispute data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [refreshTrigger])

  // KPI calculations
  const kpis = useMemo(() => {
    const vendorWins = auditLog.filter((log) => log.resolution === 'RELEASE').length
    const clientWins = auditLog.filter((log) => log.resolution === 'REFUND').length

    return {
      activeDisputes: disputedEscrows.length,
      refundsProcessed: refundedEscrows.length,
      vendorWins,
      clientWins,
    }
  }, [disputedEscrows, refundedEscrows, auditLog])

  // Filtered disputes
  const filteredDisputes = useMemo(() => {
    if (!searchQuery) return disputedEscrows
    return disputedEscrows.filter((escrow) => {
      const query = searchQuery.toLowerCase()
      return (
        escrow.id.toLowerCase().includes(query) ||
        escrow.clientId.toLowerCase().includes(query) ||
        escrow.vendorId.toLowerCase().includes(query)
      )
    })
  }, [disputedEscrows, searchQuery])

  // Dispute Resolution Outcome Chart Data
  const disputeResolutionChartData = useMemo(() => {
    return [
      { name: 'Vendor Wins (RELEASE)', value: Math.max(kpis.vendorWins, 0) },
      { name: 'Client Wins (REFUND)', value: Math.max(kpis.clientWins, 0) },
      { name: 'Pending', value: Math.max(kpis.activeDisputes, 0) },
    ]
  }, [kpis])

  // Refunds vs Disputes Volume Chart Data
  const refundsVsDisputesChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      return startOfDay(date)
    })

    return last7Days.map((date) => {
      const dateStr = format(date, 'MMM d')
      const dateFormatted = format(date, 'yyyy-MM-dd')

      const refundsOnDay = refundedEscrows.filter((escrow) => {
        if (!escrow.refundedAt) return false
        return format(startOfDay(parseISO(escrow.refundedAt)), 'yyyy-MM-dd') === dateFormatted
      }).length

      const disputesOnDay = disputedEscrows.filter((escrow) => {
        return format(startOfDay(parseISO(escrow.createdAt)), 'yyyy-MM-dd') === dateFormatted
      }).length

      const resolvedOnDay = auditLog.filter((log) => {
        return format(startOfDay(parseISO(log.resolvedAt)), 'yyyy-MM-dd') === dateFormatted
      }).length

      return {
        date: dateStr,
        'Direct Refunds': refundsOnDay,
        'Disputes Filed': disputesOnDay,
        'Disputes Resolved': resolvedOnDay,
      }
    })
  }, [refundedEscrows, disputedEscrows, auditLog])

  // Handle resolve dispute
  const handleResolveDispute = async () => {
    if (!selectedDispute) return

    if (resolutionNotes.length < 10 || resolutionNotes.length > 2000) {
      setNotesError('Notes must be between 10 and 2000 characters')
      return
    }

    setConfirmDialog({
      open: true,
      title: 'Resolve Dispute',
      description: `Are you sure you want to resolve this dispute with action "${resolutionAction}"?`,
      onConfirm: async () => {
        try {
          await apiResolveDispute(selectedDispute.id, resolutionAction, resolutionNotes)
          toast({
            title: 'Success',
            description: `Dispute resolved with action: ${resolutionAction}`,
          })

          setResolveDialogOpen(false)
          setSelectedDispute(null)
          setResolutionAction('RELEASE')
          setResolutionNotes('')
          setNotesError('')

          setRefreshTrigger((prev) => prev + 1)
        } catch (error) {
          console.error('Failed to resolve dispute:', error)
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to resolve dispute',
            variant: 'destructive',
          })
        }
        setConfirmDialog({ ...confirmDialog, open: false })
      },
    })
  }

  // Table columns for disputed escrows
  const disputedEscrowsColumns: Column<EscrowTransaction>[] = [
    {
      key: 'id',
      header: 'Escrow ID',
      accessor: (escrow) => <span className="font-mono text-sm">{escrow.id.slice(0, 12)}...</span>,
      sortable: true,
    },
    {
      key: 'clientId',
      header: 'Client',
      accessor: (escrow) => (
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {escrow.clientId}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'vendorId',
      header: 'Vendor',
      accessor: (escrow) => <span>{escrow.vendorId}</span>,
      sortable: true,
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (escrow) => <span className="font-medium">{escrow.amount.toLocaleString()} RWF</span>,
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: () => <Badge variant="secondary">DISPUTED</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Dispute Date',
      accessor: (escrow) => (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(escrow.createdAt), 'MMM d, HH:mm')}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'daysOpen',
      header: 'Days Open',
      accessor: (escrow) => {
        const days = Math.floor(
          (new Date().getTime() - parseISO(escrow.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        return <span className="text-sm text-muted-foreground">{days} days</span>
      },
    },
    {
      key: 'actions',
      header: 'Action',
      accessor: (escrow) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedDispute(escrow)
            setResolveDialogOpen(true)
          }}
        >
          Resolve
        </Button>
      ),
    },
  ]

  // Table columns for refund history
  const refundHistoryColumns: Column<EscrowTransaction>[] = [
    {
      key: 'id',
      header: 'Escrow ID',
      accessor: (escrow) => <span className="font-mono text-sm">{escrow.id.slice(0, 12)}...</span>,
      sortable: true,
    },
    {
      key: 'clientId',
      header: 'Refunded To',
      accessor: (escrow) => <span>{escrow.clientId}</span>,
      sortable: true,
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (escrow) => <span className="font-medium">{escrow.amount.toLocaleString()} RWF</span>,
      sortable: true,
    },
    {
      key: 'refundedAt',
      header: 'Refunded At',
      accessor: (escrow) => (
        <span className="text-sm text-muted-foreground">
          {escrow.refundedAt ? format(parseISO(escrow.refundedAt), 'MMM d, HH:mm') : '—'}
        </span>
      ),
      sortable: true,
    },
  ]

  // Table columns for audit log
  const auditLogColumns: Column<AuditLogEntry>[] = [
    {
      key: 'escrowId',
      header: 'Escrow ID',
      accessor: (log) => <span className="font-mono text-sm">{log.escrowId.slice(0, 12)}...</span>,
      sortable: true,
    },
    {
      key: 'resolution',
      header: 'Resolution',
      accessor: (log) => (
        <Badge variant={log.resolution === 'RELEASE' ? 'default' : 'destructive'}>
          {log.resolution}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'notes',
      header: 'Notes',
      accessor: (log) => (
        <span className="text-sm text-muted-foreground truncate max-w-xs" title={log.notes}>
          {log.notes}
        </span>
      ),
    },
    {
      key: 'resolvedAt',
      header: 'Resolved At',
      accessor: (log) => (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(log.resolvedAt), 'MMM d, HH:mm:ss')}
        </span>
      ),
      sortable: true,
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-white dark:bg-black min-h-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
          <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          Refund & Disputes
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage disputed escrows, process refunds, and view dispute resolution history
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Disputes */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Disputes</p>
                <div className="text-3xl font-bold text-yellow-400 mt-2">
                  {loading ? <Skeleton className="h-10 w-20" /> : kpis.activeDisputes}
                </div>
              </div>
              <div className="h-14 w-14 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refunds Processed */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Refunds Processed</p>
                <div className="text-3xl font-bold text-green-400 mt-2">
                  {loading ? <Skeleton className="h-10 w-20" /> : kpis.refundsProcessed}
                </div>
              </div>
              <div className="h-14 w-14 rounded-full bg-green-500/20 flex items-center justify-center">
                <RotateCcw className="h-7 w-7 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Wins */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendor Wins</p>
                <div className="text-3xl font-bold text-blue-400 mt-2">
                  {loading ? <Skeleton className="h-10 w-20" /> : kpis.vendorWins}
                </div>
              </div>
              <div className="h-14 w-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Store className="h-7 w-7 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Wins */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Client Wins</p>
                <div className="text-3xl font-bold text-red-400 mt-2">
                  {loading ? <Skeleton className="h-10 w-20" /> : kpis.clientWins}
                </div>
              </div>
              <div className="h-14 w-14 rounded-full bg-red-500/20 flex items-center justify-center">
                <User className="h-7 w-7 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dispute Resolution Outcome Chart */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Dispute Resolution Outcome</CardTitle>
            <CardDescription>Distribution of dispute decisions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : disputeResolutionChartData.every((item) => item.value === 0) ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No resolution data available
              </div>
            ) : (
              <PieChart
                data={disputeResolutionChartData}
                height={300}
                colors={['#3b82f6', '#ef4444', '#f59e0b']}
                showLegend={true}
                outerRadius={80}
              />
            )}
          </CardContent>
        </Card>

        {/* Refunds vs Disputes Volume Chart */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Refunds vs Disputes Volume</CardTitle>
            <CardDescription>Activity over last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : refundsVsDisputesChartData.every(
              (item) =>
                item['Direct Refunds'] === 0 &&
                item['Disputes Filed'] === 0 &&
                item['Disputes Resolved'] === 0
            ) ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No volume data available
              </div>
            ) : (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={refundsVsDisputesChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Direct Refunds" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Disputes Filed" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Disputes Resolved" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disputed Escrows Table */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                Disputed Escrows
              </CardTitle>
              <CardDescription>Active disputes requiring resolution ({filteredDisputes.length} found)</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search escrows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-48 bg-background border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              {filteredDisputes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400" />
                  <p className="text-lg font-medium">No active disputes</p>
                  <p className="text-sm">All disputes have been resolved</p>
                </div>
              ) : (
                <DataTable
                  data={filteredDisputes}
                  columns={disputedEscrowsColumns}
                  pagination={{ pageSize: 10 }}
                  emptyMessage="No disputed escrows found"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Refund History Table */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-green-400" />
            Refund History
          </CardTitle>
          <CardDescription>Record of all processed refunds ({refundedEscrows.length} found)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              {refundedEscrows.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No refunds yet</p>
                  <p className="text-sm">Refunded escrows will appear here</p>
                </div>
              ) : (
                <DataTable
                  data={refundedEscrows}
                  columns={refundHistoryColumns}
                  pagination={{ pageSize: 10 }}
                  emptyMessage="No refunded escrows"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dispute Resolution Audit Log */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Dispute Resolution Audit Log
          </CardTitle>
          <CardDescription>Immutable record of all dispute resolutions ({auditLog.length} found)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              {auditLog.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p>No audit log entries yet</p>
                  <p className="text-sm">Dispute resolutions will be logged here</p>
                </div>
              ) : (
                <DataTable
                  data={auditLog}
                  columns={auditLogColumns}
                  pagination={{ pageSize: 10 }}
                  emptyMessage="No audit log entries"
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dispute Modal */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-black border-slate-200 dark:border-slate-800\">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Resolve Dispute
            </DialogTitle>
            <DialogDescription>
              {selectedDispute ? `Escrow ID: ${selectedDispute.id}` : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedDispute.clientId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{selectedDispute.vendorId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{selectedDispute.amount.toLocaleString()} RWF</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(parseISO(selectedDispute.createdAt), 'MMM d, HH:mm')}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Resolution Action
                </label>
                <Select value={resolutionAction} onValueChange={(value: any) => setResolutionAction(value)}>
                  <SelectTrigger className="bg-background border-slate-200 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RELEASE">RELEASE (Vendor Wins)</SelectItem>
                    <SelectItem value="REFUND">REFUND (Client Wins)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Resolution Notes (Required: 10–2000 characters)
                </label>
                <Textarea
                  placeholder="Enter detailed notes about the resolution..."
                  value={resolutionNotes}
                  onChange={(e) => {
                    setResolutionNotes(e.target.value)
                    setNotesError('')
                  }}
                  className="bg-background border-slate-200 dark:border-slate-700 min-h-[120px]"
                />
                {notesError && <p className="text-sm text-red-400 mt-1">{notesError}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {resolutionNotes.length} / 2000 characters
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveDispute} className="bg-blue-600 hover:bg-blue-700">
              Resolve Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

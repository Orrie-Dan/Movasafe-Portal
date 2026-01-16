'use client'

import { useState, useEffect } from 'react'
import { apiGetEscrows, apiGetEscrowById, apiApproveEscrow, apiReleaseEscrow, apiRefundEscrow, type EscrowTransaction, EscrowStatus } from '@/lib/api'
import { AdminSidebar } from '@/components/admin-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RefreshCw, Eye, Shield, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from '@/hooks/use-toast'

function getEscrowStatusBadge(status: EscrowStatus | string) {
  switch (status) {
    case EscrowStatus.ACTIVE:
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case EscrowStatus.RELEASED:
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    case EscrowStatus.REFUNDED:
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }
}

function formatCurrency(amount: number, currency: string = 'RWF'): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M ${currency}`
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K ${currency}`
  return `${amount.toFixed(2)} ${currency}`
}

export default function EscrowsPage() {
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowTransaction | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    released: 0,
    refunded: 0,
    totalAmount: 0,
    totalCommission: 0,
  })

  useEffect(() => {
    fetchEscrows()
  }, [filterStatus])

  const fetchEscrows = async () => {
    setLoading(true)
    setError(null)
    try {
      const filters: any = {}
      if (filterStatus && filterStatus !== 'all') {
        filters.status = filterStatus
      }
      const response = await apiGetEscrows(filters)
      setEscrows(response)

      const active = response.filter(e => e.status === EscrowStatus.ACTIVE).length
      const released = response.filter(e => e.status === EscrowStatus.RELEASED).length
      const refunded = response.filter(e => e.status === EscrowStatus.REFUNDED).length
      const totalAmount = response.reduce((sum, e) => sum + e.amount, 0)
      const totalCommission = response.reduce((sum, e) => sum + e.commissionAmount, 0)

      setStats({
        total: response.length,
        active,
        released,
        refunded,
        totalAmount,
        totalCommission,
      })
    } catch (error) {
      console.error('Failed to fetch escrows:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch escrows')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch escrows',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewEscrow = async (escrow: EscrowTransaction) => {
    try {
      const fullEscrow = await apiGetEscrowById(escrow.id)
      setSelectedEscrow(fullEscrow)
      setIsDetailOpen(true)
    } catch (error) {
      setSelectedEscrow(escrow)
      setIsDetailOpen(true)
    }
  }

  const handleRelease = async (escrowId: string) => {
    setActionLoading(escrowId)
    try {
      await apiReleaseEscrow(escrowId)
      toast({
        title: 'Success',
        description: 'Escrow released successfully',
      })
      fetchEscrows()
      setIsDetailOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to release escrow',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefund = async (escrowId: string) => {
    setActionLoading(escrowId)
    try {
      await apiRefundEscrow(escrowId)
      toast({
        title: 'Success',
        description: 'Escrow refunded successfully',
      })
      fetchEscrows()
      setIsDetailOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to refund escrow',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Escrow Payments</h1>
              <p className="text-slate-400 mt-1">Manage escrow transactions and approvals</p>
            </div>
            <Button onClick={fetchEscrows} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="z-10 relative">Total Escrows</CardTitle>
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="z-10 relative">Active</CardTitle>
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{stats.active}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="z-10 relative">Total Amount</CardTitle>
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalAmount)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="z-10 relative">Total Commission</CardTitle>
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{formatCurrency(stats.totalCommission)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
            <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <div className="flex items-center justify-between relative z-10">
                <CardTitle className="relative z-10">Filters</CardTitle>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={EscrowStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={EscrowStatus.RELEASED}>Released</SelectItem>
                    <SelectItem value={EscrowStatus.REFUNDED}>Refunded</SelectItem>
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
          ) : escrows.length === 0 ? (
            <EmptyState icon={Shield} title="No escrows found" description="No escrow transactions match your filters" />
          ) : (
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
              <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle className="relative z-10">Escrows ({escrows.length})</CardTitle>
              </div>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700">
                      <TableHead className="text-slate-400">Client</TableHead>
                      <TableHead className="text-slate-400">Vendor</TableHead>
                      <TableHead className="text-slate-400">Amount</TableHead>
                      <TableHead className="text-slate-400">Commission</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Approvals</TableHead>
                      <TableHead className="text-slate-400">Date</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {escrows.map((escrow) => (
                      <TableRow key={escrow.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="font-mono text-sm">{escrow.clientId.slice(0, 8)}...</TableCell>
                        <TableCell className="font-mono text-sm">{escrow.vendorId.slice(0, 8)}...</TableCell>
                        <TableCell className="font-medium">{formatCurrency(escrow.amount)}</TableCell>
                        <TableCell className="text-blue-400">{formatCurrency(escrow.commissionAmount)}</TableCell>
                        <TableCell>
                          <Badge className={getEscrowStatusBadge(escrow.status)}>
                            {escrow.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {escrow.clientApproved && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                            {escrow.vendorApproved && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {format(parseISO(escrow.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewEscrow(escrow)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white">
          {selectedEscrow && (
            <>
              <DialogHeader>
                <DialogTitle>Escrow Details</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Escrow ID: {selectedEscrow.id}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Client ID</label>
                    <div className="text-sm font-mono mt-1">{selectedEscrow.clientId}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Vendor ID</label>
                    <div className="text-sm font-mono mt-1">{selectedEscrow.vendorId}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Amount</label>
                    <div className="text-lg font-bold mt-1">{formatCurrency(selectedEscrow.amount)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Commission</label>
                    <div className="text-lg font-bold text-blue-400 mt-1">
                      {formatCurrency(selectedEscrow.commissionAmount)} ({selectedEscrow.commissionPercentage}%)
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Vendor Amount</label>
                    <div className="text-lg font-bold mt-1">{formatCurrency(selectedEscrow.vendorAmount)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Status</label>
                    <div className="mt-1">
                      <Badge className={getEscrowStatusBadge(selectedEscrow.status)}>
                        {selectedEscrow.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {selectedEscrow.status === EscrowStatus.ACTIVE && (
                  <div className="flex gap-2 pt-4 border-t border-slate-700">
                    <Button
                      onClick={() => handleRelease(selectedEscrow.id)}
                      disabled={actionLoading === selectedEscrow.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === selectedEscrow.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Release Escrow
                    </Button>
                    <Button
                      onClick={() => handleRefund(selectedEscrow.id)}
                      disabled={actionLoading === selectedEscrow.id}
                      variant="destructive"
                    >
                      {actionLoading === selectedEscrow.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Refund Escrow
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}




'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FraudSignalsBadges } from '@/fraud/components/FraudSignalsBadges'
import { apiGetFraudReviewRecent, apiGetFraudReviewStats } from '@/fraud/services/fraudReviewApi'
import { useFraudReviewQueue } from '@/fraud/hooks/useFraudReviewQueue'
import type { FraudReviewStats, FraudTransaction } from '@/fraud/types'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, RefreshCw } from 'lucide-react'

function currencyFrom(tx: FraudTransaction): string {
  return tx.currency || tx.toDetails?.currency || tx.fromDetails?.currency || 'RWF'
}

function formatAmount(amount?: number | null, currency: string = 'RWF'): string {
  const n = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${currency}`
}

function statCard(label: string, value: number, tone: 'warn' | 'ok' | 'bad' | 'neutral' = 'neutral') {
  const toneClass =
    tone === 'warn'
      ? 'border-yellow-500/20 bg-yellow-500/5'
      : tone === 'ok'
      ? 'border-green-500/20 bg-green-500/5'
      : tone === 'bad'
      ? 'border-red-500/20 bg-red-500/5'
      : 'border-slate-200 dark:border-slate-800'
  const valueClass =
    tone === 'warn' ? 'text-yellow-500' : tone === 'ok' ? 'text-green-500' : tone === 'bad' ? 'text-red-500' : 'text-foreground'

  return (
    <Card className={cn('bg-white dark:bg-black', toneClass)}>
      <CardContent className="p-5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn('mt-1 text-2xl font-bold', valueClass)}>{value.toLocaleString('en-US')}</div>
      </CardContent>
    </Card>
  )
}

export default function FraudManagementPage() {
  const navigate = useNavigate()

  const [stats, setStats] = useState<FraudReviewStats | null>(null)
  const [recent, setRecent] = useState<FraudTransaction[]>([])
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  const {
    tab,
    setTab,
    pending,
    history,
    loading,
    error,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    historyFilters,
    setHistoryFilters,
    refetch,
  } = useFraudReviewQueue()

  const loadOverview = async () => {
    setOverviewLoading(true)
    setOverviewError(null)
    try {
      const [s, r] = await Promise.all([apiGetFraudReviewStats(), apiGetFraudReviewRecent(5)])

      setStats(s)

      // Backend might return either an array or a paginated object; normalize to array
      const normalizedRecent: FraudTransaction[] = Array.isArray(r)
        ? r
        : Array.isArray((r as any)?.content)
        ? (r as any).content
        : []

      setRecent(normalizedRecent)
    } catch (e) {
      setOverviewError(e instanceof Error ? e.message : 'Failed to load fraud overview')
      setStats(null)
      setRecent([])
    } finally {
      setOverviewLoading(false)
    }
  }

  useEffect(() => {
    loadOverview()
  }, [])

  const queueRows = tab === 'pending' ? pending : history

  const tableEmpty = useMemo(() => {
    if (loading) return false
    if (error) return false
    return queueRows.length === 0
  }, [loading, error, queueRows.length])

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-white dark:bg-black min-h-screen">
      <PageHeader
        title="Fraud Management"
        description="Review suspicious wallet transfers before funds movement"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span>Transfers in</span>
          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">PENDING_REVIEW</Badge>
          <span>require an explicit admin decision.</span>
        </div>
        <Button variant="outline" onClick={() => { loadOverview(); refetch() }}>
          <RefreshCw className={cn('h-4 w-4 mr-2', (overviewLoading || loading) && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {overviewLoading ? (
          <>
            <Skeleton className="h-[86px] w-full" />
            <Skeleton className="h-[86px] w-full" />
            <Skeleton className="h-[86px] w-full" />
            <Skeleton className="h-[86px] w-full" />
          </>
        ) : (
          <>
            {statCard('Pending reviews', stats?.pendingReviewsCount ?? 0, 'warn')}
            {statCard('Approved', stats?.approvedCount ?? 0, 'ok')}
            {statCard('Rejected', stats?.rejectedCount ?? 0, 'bad')}
            {statCard('Total reviewed', stats?.totalReviewed ?? 0, 'neutral')}
          </>
        )}
      </div>

      {/* Recent suspicious transfers */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent suspicious transfers</CardTitle>
        </CardHeader>
        <CardContent>
          {overviewError ? (
            <div className="text-sm text-red-500">{overviewError}</div>
          ) : overviewLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent suspicious transfers.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Wallets</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      onClick={() => navigate(`/admin/fraud-management/${tx.id}`)}
                    >
                      <TableCell className="text-sm">
                        {tx.createdAt ? format(parseISO(tx.createdAt), 'dd MMM yyyy, HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-0.5">
                          <div className="font-mono text-xs text-muted-foreground">{tx.fromDetails?.accountNumber || '—'}</div>
                          <div className="font-mono text-xs text-muted-foreground">{tx.toDetails?.accountNumber || '—'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatAmount(tx.amount, currencyFrom(tx))}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <FraudSignalsBadges fraudSignals={tx.fraudSignals} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Fraud review queue</CardTitle>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
                <TabsTrigger value="history">Fraud History</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsContent value="pending">
              <div className="text-sm text-muted-foreground mb-2">
                Sorted by <span className="font-medium">createdAt</span> (newest first). Use pagination to navigate.
              </div>
            </TabsContent>
            <TabsContent value="history">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-1">
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <Select
                    value={historyFilters.status}
                    onValueChange={(v) => setHistoryFilters((p) => ({ ...p, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="SUCCESSFUL">SUCCESSFUL</SelectItem>
                      <SelectItem value="FRAUD_REJECTED">FRAUD_REJECTED</SelectItem>
                      <SelectItem value="PENDING_REVIEW">PENDING_REVIEW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-1">
                  <div className="text-xs text-muted-foreground mb-1">Signal</div>
                  <Select
                    value={historyFilters.signalType}
                    onValueChange={(v) => setHistoryFilters((p) => ({ ...p, signalType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Signal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="HIGH_VALUE">HIGH_VALUE</SelectItem>
                      <SelectItem value="HIGH_FREQUENCY_WINDOW">HIGH_FREQUENCY_WINDOW</SelectItem>
                      <SelectItem value="LARGE_BALANCE_DROP">LARGE_BALANCE_DROP</SelectItem>
                      <SelectItem value="POST_AUTH_ANOMALY">POST_AUTH_ANOMALY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-1">
                  <div className="text-xs text-muted-foreground mb-1">Start date (ISO)</div>
                  <Input
                    value={historyFilters.startDate}
                    onChange={(e) => setHistoryFilters((p) => ({ ...p, startDate: e.target.value }))}
                    placeholder="2026-03-01T00:00:00Z"
                  />
                </div>

                <div className="md:col-span-1">
                  <div className="text-xs text-muted-foreground mb-1">End date (ISO)</div>
                  <Input
                    value={historyFilters.endDate}
                    onChange={(e) => setHistoryFilters((p) => ({ ...p, endDate: e.target.value }))}
                    placeholder="2026-03-13T23:59:59Z"
                  />
                </div>

                <div className="md:col-span-1 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Min</div>
                    <Input
                      value={historyFilters.minAmount}
                      onChange={(e) => setHistoryFilters((p) => ({ ...p, minAmount: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Max</div>
                    <Input
                      value={historyFilters.maxAmount}
                      onChange={(e) => setHistoryFilters((p) => ({ ...p, maxAmount: e.target.value }))}
                      placeholder="1000000"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : tableEmpty ? (
            <EmptyState
              icon={AlertTriangle}
              title={tab === 'pending' ? 'No pending reviews' : 'No history results'}
              description={tab === 'pending' ? 'Your fraud review queue is empty.' : 'Try adjusting filters.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Wallets</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Signals</TableHead>
                    <TableHead>Review reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueRows.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      onClick={() => navigate(`/admin/fraud-management/${tx.id}`)}
                    >
                      <TableCell className="text-sm">
                        {tx.createdAt ? format(parseISO(tx.createdAt), 'dd MMM yyyy, HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-0.5">
                          <div className="font-mono text-xs text-muted-foreground">{tx.fromDetails?.accountNumber || '—'}</div>
                          <div className="font-mono text-xs text-muted-foreground">{tx.toDetails?.accountNumber || '—'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatAmount(tx.amount, currencyFrom(tx))}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', tx.status === 'SUCCESSFUL'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : tx.status === 'FRAUD_REJECTED'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20')}
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <FraudSignalsBadges fraudSignals={tx.fraudSignals} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[320px]">
                        <div className="truncate">{tx.fraudReviewReason || '—'}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))}>
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(Math.min(totalPages, page + 1))}>
                Next
              </Button>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / page</SelectItem>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


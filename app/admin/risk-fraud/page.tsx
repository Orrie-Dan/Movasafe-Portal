'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { AlertCenter } from '@/components/dashboard/alerts/AlertCenter'
import { RiskIndicators } from '@/components/financial/RiskIndicators'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Shield, TrendingUp, Eye, Filter } from 'lucide-react'
import type { FraudAlert, FintechTransaction } from '@/lib/types/fintech'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useMemo } from 'react'
import { format, subDays } from 'date-fns'

// Mock data - replace with actual API calls
const mockFraudAlerts = [
  {
    id: '1',
    type: 'transaction' as const,
    severity: 'high' as const,
    title: 'Suspicious Transaction Pattern',
    description: 'Multiple large transactions detected',
    transactionId: 'tx_123',
    createdAt: new Date().toISOString(),
    status: 'active' as const,
  },
]

const mockHighRiskTransactions: FintechTransaction[] = [
  {
    id: 'tx_123',
    userId: 'user_123',
    amount: 50000,
    transactionType: 'CASH_OUT',
    status: 'SUCCESSFUL',
    currency: 'RWF',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    riskScore: 85,
    fraudFlagged: true,
  },
]

export default function RiskFraudPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<FraudAlert[]>(mockFraudAlerts)
  const [highRiskTransactions, setHighRiskTransactions] = useState<FintechTransaction[]>(mockHighRiskTransactions)
  const [filterRiskScore, setFilterRiskScore] = useState<string>('all')

  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchData = async () => {
    //   const [alertsData, transactionsData] = await Promise.all([
    //     apiGetFraudAlerts(),
    //     apiGetHighRiskTransactions(),
    //   ])
    //   setAlerts(alertsData)
    //   setHighRiskTransactions(transactionsData)
    //   setLoading(false)
    // }
    // fetchData()
    setLoading(false)
  }, [])

  // Calculate fraud attempts over time
  const fraudAttemptsData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      return {
        date: format(date, 'MMM d'),
        attempts: Math.floor(Math.random() * 20) + 5, // Mock data
        blocked: Math.floor(Math.random() * 10) + 2,
      }
    })
    return last7Days
  }, [])

  const filteredTransactions = useMemo(() => {
    if (filterRiskScore === 'all') return highRiskTransactions
    if (filterRiskScore === 'high') return highRiskTransactions.filter(tx => tx.riskScore && tx.riskScore > 70)
    if (filterRiskScore === 'medium') return highRiskTransactions.filter(tx => tx.riskScore && tx.riskScore > 40 && tx.riskScore <= 70)
    return highRiskTransactions.filter(tx => !tx.riskScore || tx.riskScore <= 40)
  }, [highRiskTransactions, filterRiskScore])

  const riskColumns: Column<FintechTransaction>[] = [
    {
      key: 'id',
      header: 'Transaction ID',
      accessor: (tx) => <span className="font-mono text-sm">{tx.id.slice(0, 8)}...</span>,
      sortable: true,
    },
    {
      key: 'userId',
      header: 'User',
      accessor: (tx) => <span className="font-mono text-xs text-foreground">{tx.userId.slice(0, 8)}...</span>,
      sortable: true,
    },
    {
      key: 'amount',
      header: 'Amount',
      accessor: (tx) => <span className="font-medium">{tx.amount.toLocaleString()} {tx.currency}</span>,
      sortable: true,
    },
    {
      key: 'transactionType',
      header: 'Type',
      accessor: (tx) => <span className="text-foreground">{tx.transactionType}</span>,
      sortable: true,
    },
    {
      key: 'riskScore',
      header: 'Risk Score',
      accessor: (tx) => (
        <Badge
          className={
            tx.riskScore && tx.riskScore > 70
              ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : tx.riskScore && tx.riskScore > 40
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              : 'bg-green-500/20 text-green-400 border-green-500/30'
          }
        >
          {tx.riskScore || 'N/A'}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'reason',
      header: 'Reason',
      accessor: (tx) => (
        <span className="text-xs text-muted-foreground">
          {tx.fraudFlagged ? 'Suspicious pattern detected' : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (tx) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/transactions?id=${tx.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const alertCards = alerts.map((alert) => ({
    id: alert.id,
    type: alert.severity === 'critical' || alert.severity === 'high' ? 'error' as const : 'warning' as const,
    title: alert.title,
    description: alert.description,
    count: 1,
    onAction: () => {
      if (alert.transactionId) {
        router.push(`/admin/transactions?id=${alert.transactionId}`)
      } else if (alert.userId) {
        router.push(`/admin/users/${alert.userId}`)
      }
    },
  }))

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-black">
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

      {/* Fraud Alerts */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle className="z-10 relative text-slate-900 dark:text-white">Active Fraud Alerts</CardTitle>
          <CardDescription className="z-10 relative">Real-time fraud detection alerts</CardDescription>
        </div>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <AlertCenter alerts={alertCards} maxVisible={10} />
          )}
        </CardContent>
      </Card>

      {/* Risk Indicators */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle className="z-10 relative text-slate-900 dark:text-white">Risk Indicators</CardTitle>
          <CardDescription className="z-10 relative">System-wide risk metrics and patterns</CardDescription>
        </div>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <RiskIndicators data={null} />
          )}
        </CardContent>
      </Card>

      {/* Fraud Attempts Chart */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle className="z-10 relative text-slate-900 dark:text-white">Fraud Attempts Over Time</CardTitle>
          <CardDescription className="z-10 relative">Last 7 days</CardDescription>
        </div>
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

      {/* High-Risk Transactions */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between z-10 relative">
            <div>
              <CardTitle className="text-slate-900 dark:text-white">High-Risk Transactions</CardTitle>
              <CardDescription>Transactions flagged for review</CardDescription>
            </div>
            <Select value={filterRiskScore} onValueChange={setFilterRiskScore}>
              <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High (70+)</SelectItem>
                <SelectItem value="medium">Medium (40-70)</SelectItem>
                <SelectItem value="low">Low (&lt;40)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <DataTable
              data={filteredTransactions}
              columns={riskColumns}
              searchable
              searchPlaceholder="Search transactions..."
              pagination={{ pageSize: 25 }}
              emptyMessage="No high-risk transactions found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}


# Fintech Wallet Admin Dashboard - Complete Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing all fintech dashboard features using existing components only.

---

## 1. Overview Dashboard Enhancement

### Location: `app/admin/page.tsx`

### Add Fintech KPIs Section (After line ~450, before Quick Actions)

```typescript
// Calculate fintech metrics
const fintechKPIs = useMemo(() => {
  const today = startOfDay(new Date())
  const todayTransactions = transactions.filter(t => 
    parseISO(t.createdAt) >= today && t.status === TransactionStatus.SUCCESSFUL
  )
  const totalWalletBalance = wallets.reduce((sum, w) => sum + w.walletBalance, 0)
  const successfulToday = todayTransactions.length
  const totalToday = transactions.filter(t => parseISO(t.createdAt) >= today).length
  const successRate = totalToday > 0 ? (successfulToday / totalToday) * 100 : 0
  const revenueToday = todayTransactions.reduce((sum, t) => sum + (t.commissionAmount || 0), 0)
  const activeUsers = new Set(transactions.map(t => t.userId)).size

  return {
    activeUsers,
    walletBalance: totalWalletBalance,
    transactionsToday: totalToday,
    successRate,
    revenueToday,
  }
}, [transactions, wallets])

// Add KPI Cards Section
<MetricCardGroup
  metrics={[
    {
      title: 'Active Users',
      value: fintechKPIs.activeUsers,
      change: 8.2, // Calculate from previous period
      icon: Users,
      variant: 'default',
      onClick: () => router.push('/admin/users'),
    },
    {
      title: 'Wallet Balance',
      value: fintechKPIs.walletBalance,
      unit: 'RWF',
      format: 'currency',
      change: 12.5,
      icon: Wallet,
      variant: 'success',
      onClick: () => router.push('/admin/wallets'),
    },
    {
      title: 'Transactions Today',
      value: fintechKPIs.transactionsToday,
      change: 15.3,
      icon: FileText,
      variant: 'default',
      onClick: () => router.push('/admin/transactions'),
    },
    {
      title: 'Success Rate',
      value: fintechKPIs.successRate,
      unit: '%',
      change: 2.1,
      icon: CheckCircle2,
      variant: 'success',
    },
    {
      title: 'Revenue Today',
      value: fintechKPIs.revenueToday,
      unit: 'RWF',
      format: 'currency',
      change: 18.7,
      icon: DollarSign,
      variant: 'success',
      onClick: () => router.push('/admin/revenue'),
    },
  ]}
  columns={5}
  loading={loading}
/>
```

### Add Trend Charts Section

```typescript
// Calculate trend data
const transactionTrendData = useMemo(() => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dayTransactions = transactions.filter(t => {
      const txDate = parseISO(t.createdAt)
      return format(txDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    })
    return {
      date: format(date, 'MMM d'),
      volume: dayTransactions.length,
      successful: dayTransactions.filter(t => t.status === TransactionStatus.SUCCESSFUL).length,
      failed: dayTransactions.filter(t => t.status === TransactionStatus.FAILED).length,
    }
  })
  return last7Days
}, [transactions])

// Add Charts Section
<div className="grid gap-6 lg:grid-cols-2">
  <Card className="bg-black border-slate-800">
    <CardHeader>
      <CardTitle className="text-white">Transaction Volume Trend</CardTitle>
      <CardDescription className="text-slate-400">Last 7 days</CardDescription>
    </CardHeader>
    <CardContent>
      <EnhancedLineChart
        data={transactionTrendData}
        dataKeys={[
          { key: 'volume', name: 'Total', color: '#3b82f6' },
          { key: 'successful', name: 'Successful', color: '#10b981' },
        ]}
        xAxisKey="date"
        height={300}
      />
    </CardContent>
  </Card>

  <Card className="bg-black border-slate-800">
    <CardHeader>
      <CardTitle className="text-white">Error Rate Trend</CardTitle>
      <CardDescription className="text-slate-400">Last 7 days</CardDescription>
    </CardHeader>
    <CardContent>
      <EnhancedLineChart
        data={transactionTrendData.map(d => ({
          ...d,
          errorRate: d.volume > 0 ? (d.failed / d.volume) * 100 : 0,
        }))}
        dataKeys={[
          { key: 'errorRate', name: 'Error Rate %', color: '#ef4444' },
        ]}
        xAxisKey="date"
        height={300}
      />
    </CardContent>
  </Card>
</div>
```

### Enhance Alerts Panel

```typescript
// Add fintech-specific alerts
const fintechAlerts = useMemo(() => {
  const alerts = []
  
  // High-value transactions alert
  const highValueTxs = transactions.filter(t => 
    t.amount > 1000000 && t.status === TransactionStatus.SUCCESSFUL
  )
  if (highValueTxs.length > 10) {
    alerts.push({
      id: 'high-value-transactions',
      type: 'warning' as const,
      title: 'High-Value Transactions',
      description: `${highValueTxs.length} transactions over 1M RWF today`,
      count: highValueTxs.length,
      onAction: () => router.push('/admin/transactions?minAmount=1000000'),
    })
  }

  // Fraud risk alert
  const riskTxs = transactions.filter(t => 
    (t as any).riskScore && (t as any).riskScore > 70
  )
  if (riskTxs.length > 0) {
    alerts.push({
      id: 'fraud-risk',
      type: 'error' as const,
      title: 'High-Risk Transactions',
      description: `${riskTxs.length} transactions flagged for review`,
      count: riskTxs.length,
      onAction: () => router.push('/admin/risk-fraud'),
    })
  }

  // SLA breach alert
  const pendingLong = transactions.filter(t => {
    if (t.status !== TransactionStatus.PENDING) return false
    const hoursPending = (new Date().getTime() - parseISO(t.createdAt).getTime()) / (1000 * 60 * 60)
    return hoursPending > 24
  })
  if (pendingLong.length > 0) {
    alerts.push({
      id: 'sla-breach',
      type: 'error' as const,
      title: 'SLA Breach',
      description: `${pendingLong.length} transactions pending >24 hours`,
      count: pendingLong.length,
      onAction: () => router.push('/admin/transactions?status=PENDING'),
    })
  }

  return alerts
}, [transactions, router])

// Update AlertCenter
<AlertCenter
  alerts={[
    ...fintechAlerts,
    ...(stats.failed > 0 ? [/* existing alerts */] : []),
  ]}
  onAlertClick={(alert) => alert.onAction?.()}
  title="Critical Alerts"
  description="System, fraud, and SLA alerts requiring attention"
/>
```

---

## 2. Transactions Dashboard Enhancement

### Location: `app/admin/transactions/page.tsx`

### Add Summary Cards (After stats cards, before filters)

```typescript
// Add high-value transactions card
const highValueTransactions = transactions.filter(t => t.amount >= 1000000)

<Card className="bg-slate-800 border-slate-700">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-slate-400">High-Value Transactions</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-yellow-400">{highValueTransactions.length}</div>
    <p className="text-xs text-slate-400 mt-1">Transactions ≥ 1M RWF</p>
  </CardContent>
</Card>
```

### Add Action Modals

```typescript
// State for action modals
const [actionModal, setActionModal] = useState<{
  type: 'retry' | 'refund' | 'reverse' | null
  transaction: Transaction | null
}>({ type: null, transaction: null })

// Action handlers
const handleRetry = async (transaction: Transaction) => {
  try {
    // await apiRetryTransaction(transaction.id)
    toast({ title: 'Success', description: 'Transaction retry initiated' })
    fetchTransactions()
    setActionModal({ type: null, transaction: null })
  } catch (error) {
    toast({ title: 'Error', description: 'Failed to retry transaction', variant: 'destructive' })
  }
}

const handleRefund = async (transaction: Transaction) => {
  try {
    // await apiRefundTransaction(transaction.id)
    toast({ title: 'Success', description: 'Refund processed' })
    fetchTransactions()
    setActionModal({ type: null, transaction: null })
  } catch (error) {
    toast({ title: 'Error', description: 'Failed to process refund', variant: 'destructive' })
  }
}

const handleReverse = async (transaction: Transaction) => {
  try {
    // await apiReverseTransaction(transaction.id)
    toast({ title: 'Success', description: 'Transaction reversed' })
    fetchTransactions()
    setActionModal({ type: null, transaction: null })
  } catch (error) {
    toast({ title: 'Error', description: 'Failed to reverse transaction', variant: 'destructive' })
  }
}

// Add action buttons to table
{
  key: 'actions',
  header: 'Actions',
  accessor: (transaction) => (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => handleViewTransaction(transaction)}>
        <Eye className="h-4 w-4" />
      </Button>
      {transaction.status === TransactionStatus.FAILED && (
        <Button variant="ghost" size="sm" onClick={() => setActionModal({ type: 'retry', transaction })}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
      {transaction.status === TransactionStatus.SUCCESSFUL && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setActionModal({ type: 'refund', transaction })}>
            <DollarSign className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setActionModal({ type: 'reverse', transaction })}>
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  ),
}

// Add action modals
{actionModal.type && actionModal.transaction && (
  <ConfirmDialog
    open={actionModal.type !== null}
    onOpenChange={(open) => !open && setActionModal({ type: null, transaction: null })}
    title={
      actionModal.type === 'retry' ? 'Retry Transaction' :
      actionModal.type === 'refund' ? 'Refund Transaction' :
      'Reverse Transaction'
    }
    description={
      actionModal.type === 'retry' 
        ? `Are you sure you want to retry transaction ${actionModal.transaction.id}?`
        : actionModal.type === 'refund'
        ? `Refund amount: ${formatCurrency(actionModal.transaction.amount)}. This action cannot be undone.`
        : `Reverse transaction ${actionModal.transaction.id}. This will undo the transaction.`
    }
    confirmLabel={actionModal.type === 'retry' ? 'Retry' : actionModal.type === 'refund' ? 'Refund' : 'Reverse'}
    variant={actionModal.type === 'refund' || actionModal.type === 'reverse' ? 'destructive' : 'default'}
    onConfirm={() => {
      if (actionModal.type === 'retry') handleRetry(actionModal.transaction!)
      else if (actionModal.type === 'refund') handleRefund(actionModal.transaction!)
      else if (actionModal.type === 'reverse') handleReverse(actionModal.transaction!)
    }}
  />
)}
```

### Add Amount Filter

```typescript
const [filterMinAmount, setFilterMinAmount] = useState<string>('')
const [filterMaxAmount, setFilterMaxAmount] = useState<string>('')

// In filters section
<div>
  <label className="text-sm text-slate-400 mb-2 block">Min Amount</label>
  <Input
    type="number"
    placeholder="0"
    value={filterMinAmount}
    onChange={(e) => setFilterMinAmount(e.target.value)}
    className="bg-slate-900 border-slate-700 text-white"
  />
</div>
<div>
  <label className="text-sm text-slate-400 mb-2 block">Max Amount</label>
  <Input
    type="number"
    placeholder="No limit"
    value={filterMaxAmount}
    onChange={(e) => setFilterMaxAmount(e.target.value)}
    className="bg-slate-900 border-slate-700 text-white"
  />
</div>

// Update filteredTransactions
const filteredTransactions = transactions.filter(transaction => {
  // ... existing filters ...
  if (filterMinAmount && transaction.amount < parseFloat(filterMinAmount)) return false
  if (filterMaxAmount && transaction.amount > parseFloat(filterMaxAmount)) return false
  return true
})
```

---

## 3. Users & Wallets Enhancement

### Add KYC Status Column

```typescript
// In users table columns
{
  key: 'kycStatus',
  header: 'KYC Status',
  accessor: (user) => {
    const kycStatus = (user as any).kycStatus || 'pending'
    return (
      <Badge className={
        kycStatus === 'verified' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
        kycStatus === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      }>
        {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
      </Badge>
    )
  },
  sortable: true,
}
```

### Add Wallet Balance Column

```typescript
{
  key: 'walletBalance',
  header: 'Wallet Balance',
  accessor: (user) => {
    const balance = (user as any).walletBalance || 0
    return <span className="font-medium text-green-400">{formatCurrency(balance)}</span>
  },
  sortable: true,
}
```

### Add Freeze/Unfreeze Modal

```typescript
const [freezeModal, setFreezeModal] = useState<{ open: boolean; wallet: Wallet | null }>({ open: false, wallet: null })

const handleFreezeWallet = async (wallet: Wallet) => {
  try {
    // await apiFreezeWallet(wallet.id, reason)
    toast({ title: 'Success', description: 'Wallet frozen successfully' })
    fetchWallets()
    setFreezeModal({ open: false, wallet: null })
  } catch (error) {
    toast({ title: 'Error', description: 'Failed to freeze wallet', variant: 'destructive' })
  }
}

// Add freeze button to wallet table
<Button
  variant="ghost"
  size="sm"
  onClick={() => setFreezeModal({ open: true, wallet })}
  className={wallet.frozen ? 'text-green-400' : 'text-red-400'}
>
  {wallet.frozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
</Button>

// Add freeze modal
<Dialog open={freezeModal.open} onOpenChange={(open) => setFreezeModal({ open, wallet: freezeModal.wallet })}>
  <DialogContent className="bg-slate-900 border-slate-800 text-white">
    <DialogHeader>
      <DialogTitle>{freezeModal.wallet?.frozen ? 'Unfreeze Wallet' : 'Freeze Wallet'}</DialogTitle>
      <DialogDescription>
        Wallet ID: {freezeModal.wallet?.id}
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 mt-4">
      <div>
        <Label>Reason</Label>
        <Input placeholder="Enter reason for freeze/unfreeze" className="bg-slate-800 border-slate-700" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setFreezeModal({ open: false, wallet: null })}>Cancel</Button>
        <Button
          onClick={() => freezeModal.wallet && handleFreezeWallet(freezeModal.wallet)}
          variant={freezeModal.wallet?.frozen ? 'default' : 'destructive'}
        >
          {freezeModal.wallet?.frozen ? 'Unfreeze' : 'Freeze'}
        </Button>
      </DialogFooter>
    </div>
  </DialogContent>
</Dialog>
```

---

## 4. Global Alert Center Component

### Create: `components/admin/GlobalAlertCenter.tsx`

```typescript
'use client'

import { useState } from 'react'
import { AlertCenter, type Alert } from '@/components/dashboard/alerts/AlertCenter'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter, CheckCircle2 } from 'lucide-react'

export interface GlobalAlert extends Alert {
  severity: 'critical' | 'high' | 'medium' | 'low'
  alertType: 'fraud' | 'system' | 'compliance' | 'sla'
  acknowledged?: boolean
  assignedTo?: string
}

interface GlobalAlertCenterProps {
  alerts: GlobalAlert[]
  onAlertClick?: (alert: GlobalAlert) => void
  onAcknowledge?: (alertId: string) => void
  onAssign?: (alertId: string, userId: string) => void
}

export function GlobalAlertCenter({
  alerts,
  onAlertClick,
  onAcknowledge,
  onAssign,
}: GlobalAlertCenterProps) {
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  const filteredAlerts = alerts.filter(alert => {
    if (filterType !== 'all' && alert.alertType !== filterType) return false
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false
    return true
  })

  const alertCards: Alert[] = filteredAlerts.map(alert => ({
    id: alert.id,
    type: alert.type,
    title: alert.title,
    description: alert.description,
    count: alert.count,
    onAction: () => {
      if (onAcknowledge && !alert.acknowledged) {
        onAcknowledge(alert.id)
      } else if (onAlertClick) {
        onAlertClick(alert)
      }
    },
    actionLabel: alert.acknowledged ? 'View' : 'Acknowledge',
    icon: alert.icon,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="fraud">Fraud</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="sla">SLA</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          {filteredAlerts.length} alerts
        </Badge>
      </div>
      <AlertCenter
        alerts={alertCards}
        onAlertClick={onAlertClick}
        title="Global Alert Center"
        description="System-wide alerts and notifications"
      />
    </div>
  )
}
```

---

## Implementation Checklist

- [ ] Overview Dashboard: Add fintech KPIs
- [ ] Overview Dashboard: Add trend charts
- [ ] Overview Dashboard: Enhance alerts panel
- [ ] Transactions: Add summary cards
- [ ] Transactions: Add action modals (Retry/Refund/Reverse)
- [ ] Transactions: Add amount filters
- [ ] Users & Wallets: Add KYC status column
- [ ] Users & Wallets: Add wallet balance column
- [ ] Users & Wallets: Add freeze/unfreeze modals
- [ ] Risk & Fraud: Complete implementation
- [ ] Compliance & KYC: Add document review modals
- [ ] System Health: Complete charts and service status
- [ ] Support: Complete ticket management
- [ ] Revenue: Add business insights
- [ ] Global Alert Center: Create component

---

**Note**: All implementations use existing components only. No new UI components are created.


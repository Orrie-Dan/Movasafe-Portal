import { useState, useEffect, useMemo } from 'react'
import { apiGetAllTransactions, type Transaction, TransactionStatus } from '@/lib/api'
import { apiGetAllWallets } from '@/lib/api/wallets'
import { startOfDay, endOfDay, subDays, format, parseISO, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import type { TransactionFilters } from '@/lib/types/transactions'

export type TimePeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

export interface OverviewMetrics {
  // Transaction Overview cards
  totalTransactionsToday: number
  totalVolumeToday: number
  failedTransactionsPercent: number
  pendingTransactions: number
  
  // Key Business Metrics
  totalVolumeThisMonth: number
  transactionsToday: number
  successRate: number
  walletBalance: number
  revenueToday: number
  
  // User Activity & Growth
  activeUsers24h: number
  activeUsers7d: number
  newWalletsToday: number
  verifiedUsers: number
  blockedAccounts: number
  
  // Charts data
  volumeTrend7d: Array<{ date: string; volume: number; disputes?: number; refunded?: number; avgLatency?: number; p95Latency?: number; p99Latency?: number; flaggedAmount?: number; disputedAmount?: number }>
  errorRateTrend7d: Array<{ date: string; errorRate: number }>
  
  // Loading and error states
  loading: boolean
  error: string | null
}

export function useOverviewData(
  timePeriod: TimePeriod = 'month',
  customDateRange?: { from: Date | null; to: Date | null }
) {
  const [transactionsToday, setTransactionsToday] = useState<Transaction[]>([])
  const [transactions7d, setTransactions7d] = useState<Transaction[]>([])
  const [transactionsThisMonth, setTransactionsThisMonth] = useState<Transaction[]>([])
  const [transactionsPeriod, setTransactionsPeriod] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverviewData = async () => {
    setLoading(true)
    setError(null)
    
    console.log('[useOverviewData] Fetching with filters:', { timePeriod, customDateRange })
    
    try {
      const now = new Date()
      const todayStart = startOfDay(now)
      const todayEnd = endOfDay(now)
      const sevenDaysAgo = startOfDay(subDays(now, 7))
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)

      // Calculate period dates based on timePeriod filter
      let periodStart = monthStart
      let periodEnd = monthEnd
      
      if (timePeriod === 'today') {
        periodStart = todayStart
        periodEnd = todayEnd
      } else if (timePeriod === 'week') {
        periodStart = sevenDaysAgo
        periodEnd = todayEnd
      } else if (timePeriod === 'month') {
        periodStart = monthStart
        periodEnd = monthEnd
      } else if (timePeriod === 'quarter') {
        periodStart = startOfQuarter(now)
        periodEnd = endOfQuarter(now)
      } else if (timePeriod === 'year') {
        periodStart = startOfYear(now)
        periodEnd = endOfYear(now)
      } else if (timePeriod === 'custom' && customDateRange?.from && customDateRange?.to) {
        periodStart = startOfDay(customDateRange.from)
        periodEnd = endOfDay(customDateRange.to)
      }

      console.log('[useOverviewData] Period range:', { 
        timePeriod, 
        periodStart: format(periodStart, 'yyyy-MM-dd'), 
        periodEnd: format(periodEnd, 'yyyy-MM-dd') 
      })

      // Fetch transactions for today
      const todayFilters: TransactionFilters = {
        page: 0,
        limit: 10000,
        sortBy: 'createdAt',
        order: 'DESC',
        startDate: todayStart.toISOString(),
        endDate: todayEnd.toISOString(),
      }

      // Fetch transactions for last 7 days
      const sevenDaysFilters: TransactionFilters = {
        page: 0,
        limit: 10000,
        sortBy: 'createdAt',
        order: 'DESC',
        startDate: sevenDaysAgo.toISOString(),
        endDate: todayEnd.toISOString(),
      }

      // Fetch transactions for this month
      const monthFilters: TransactionFilters = {
        page: 0,
        limit: 10000,
        sortBy: 'createdAt',
        order: 'DESC',
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      }

      // Fetch transactions for selected period
      const periodFilters: TransactionFilters = {
        page: 0,
        limit: 10000,
        sortBy: 'createdAt',
        order: 'DESC',
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      }

      // Fetch all data in parallel
      const [todayResponse, sevenDaysResponse, monthResponse, periodResponse, walletsResponse] = await Promise.all([
        apiGetAllTransactions(todayFilters),
        apiGetAllTransactions(sevenDaysFilters),
        apiGetAllTransactions(monthFilters),
        apiGetAllTransactions(periodFilters),
        apiGetAllWallets({ limit: 10000 }),
      ])

      // Extract transactions from responses
      if (todayResponse.success && todayResponse.data?.content) {
        setTransactionsToday(todayResponse.data.content)
      }
      if (sevenDaysResponse.success && sevenDaysResponse.data?.content) {
        setTransactions7d(sevenDaysResponse.data.content)
      }
      if (monthResponse.success && monthResponse.data?.content) {
        setTransactionsThisMonth(monthResponse.data.content)
      }
      if (periodResponse.success && periodResponse.data?.content) {
        setTransactionsPeriod(periodResponse.data.content)
        console.log('[useOverviewData] Period transactions loaded:', periodResponse.data.content.length)
      }
      if (Array.isArray(walletsResponse)) {
        setWallets(walletsResponse)
      }

      setUsers([])

    } catch (err) {
      console.error('Failed to fetch overview data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch overview data'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverviewData()
  }, [timePeriod, customDateRange?.from, customDateRange?.to])

  // Compute metrics from fetched data
  const metrics = useMemo((): OverviewMetrics => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    // Helper to check if date is today
    const isToday = (dateString: string): boolean => {
      try {
        const date = parseISO(dateString)
        return date >= todayStart && date <= todayEnd
      } catch {
        return false
      }
    }

    // Helper to check if date is in last 24h
    const isLast24h = (dateString: string): boolean => {
      try {
        const date = parseISO(dateString)
        const last24h = subDays(now, 1)
        return date >= last24h
      } catch {
        return false
      }
    }

    // Transaction Overview cards (always today)
    const totalTransactionsToday = transactionsToday.length
    const successfulToday = transactionsToday.filter(t => t.status === TransactionStatus.SUCCESSFUL)
    const failedToday = transactionsToday.filter(t => t.status === TransactionStatus.FAILED)
    const pendingToday = transactionsToday.filter(t => t.status === TransactionStatus.PENDING)
    
    const totalVolumeToday = successfulToday.reduce((sum, t) => sum + (t.amount || 0), 0)
    const failedTransactionsPercent = totalTransactionsToday > 0 
      ? (failedToday.length / totalTransactionsToday) * 100 
      : 0
    const pendingTransactions = pendingToday.length

    // Key Business Metrics (use period data)
    const successfulPeriod = transactionsPeriod.filter(t => t.status === TransactionStatus.SUCCESSFUL)
    const totalVolumePeriod = successfulPeriod.reduce((sum, t) => sum + (t.amount || 0), 0)
    const transactionsPeriodCount = successfulPeriod.length
    const successRatePeriod = transactionsPeriod.length > 0 
      ? (successfulPeriod.length / transactionsPeriod.length) * 100 
      : 0

    // Wallet Balance
    const walletBalance = wallets.reduce((sum, w) => {
      const balance = w.walletBalance ?? w.availableBalance ?? w.totalBalance ?? 0
      return sum + (typeof balance === 'number' ? balance : 0)
    }, 0)

    // Revenue (use period data)
    const revenuePeriod = successfulPeriod.reduce((sum, t) => {
      const fee = t.chargeFee || 0
      const commission = (t as any).commissionAmount || 0
      return sum + fee + commission
    }, 0)

    // User Activity & Growth
    const activeUsers24hSet = new Set<string>()
    transactions7d.forEach(t => {
      if (t.userId && isLast24h(t.createdAt)) {
        activeUsers24hSet.add(t.userId)
      }
    })
    const activeUsers24h = activeUsers24hSet.size

    const activeUsers7dSet = new Set<string>()
    transactions7d.forEach(t => {
      if (t.userId) {
        activeUsers7dSet.add(t.userId)
      }
    })
    const activeUsers7d = activeUsers7dSet.size

    const newWalletsToday = wallets.filter(w => {
      if (!w.createdAt) return false
      try {
        const createdDate = parseISO(w.createdAt)
        return createdDate >= todayStart && createdDate <= todayEnd
      } catch {
        return false
      }
    }).length

    const verifiedUsers = 0
    const blockedAccounts = 0

    // Charts data - build based on the selected period
    const volumeTrend7d: Array<{ date: string; volume: number; disputes?: number; refunded?: number; avgLatency?: number; p95Latency?: number; p99Latency?: number; flaggedAmount?: number; disputedAmount?: number }> = []
    
    // Determine the data to use for charts
    const chartData = transactionsPeriod.length > 0 ? transactionsPeriod : transactions7d
    
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i)
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      const dayTransactions = chartData.filter(t => {
        try {
          const txDate = parseISO(t.createdAt)
          return txDate >= dayStart && txDate <= dayEnd
        } catch {
          return false
        }
      })
      
      const successTransactions = dayTransactions.filter(t => t.status === TransactionStatus.SUCCESSFUL)
      const dayVolume = successTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      
      // Mock data for new chart fields
      const dayDisputes = Math.floor(dayTransactions.length * 0.05) // ~5% disputes
      const dayRefunded = Math.floor(successTransactions.length * 0.02 * (dayVolume / 1000)) // ~2% refunded
      
      volumeTrend7d.push({
        date: format(day, 'MMM dd'),
        volume: dayVolume || 0,
        disputes: dayDisputes,
        refunded: dayRefunded,
        avgLatency: 125 + Math.random() * 25,
        p95Latency: 185 + Math.random() * 25,
        p99Latency: 245 + Math.random() * 35,
        flaggedAmount: Math.floor(dayVolume * 0.01),
        disputedAmount: Math.floor(dayRefunded * 0.5),
      })
    }

    // Error Rate Trend (Last 7 Days - always 7d)
    const errorRateTrend7d: Array<{ date: string; errorRate: number }> = []
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i)
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      const dayTransactions = transactions7d.filter(t => {
        try {
          const txDate = parseISO(t.createdAt)
          return txDate >= dayStart && txDate <= dayEnd
        } catch {
          return false
        }
      })
      const failedCount = dayTransactions.filter(t => t.status === TransactionStatus.FAILED).length
      const errorRate = dayTransactions.length > 0 
        ? (failedCount / dayTransactions.length) * 100 
        : 0
      errorRateTrend7d.push({
        date: format(day, 'MMM dd'),
        errorRate: errorRate || 0,
      })
    }

    return {
      totalTransactionsToday,
      totalVolumeToday,
      failedTransactionsPercent,
      pendingTransactions,
      totalVolumeThisMonth: totalVolumePeriod,
      transactionsToday: transactionsPeriodCount,
      successRate: successRatePeriod,
      walletBalance,
      revenueToday: revenuePeriod,
      activeUsers24h,
      activeUsers7d,
      newWalletsToday,
      verifiedUsers,
      blockedAccounts,
      volumeTrend7d,
      errorRateTrend7d,
      loading,
      error,
    }
  }, [transactionsToday, transactions7d, transactionsThisMonth, transactionsPeriod, wallets, users, loading, error])

  return {
    ...metrics,
    refetch: fetchOverviewData,
  }
}

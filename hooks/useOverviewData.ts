import { useState, useEffect, useMemo } from 'react'
import { apiGetAllTransactions, type Transaction, TransactionStatus } from '@/lib/api'
import { apiGetDisputedTransactions } from '@/lib/api/transactions'
import { apiGetAllWallets } from '@/lib/api/wallets'
import { apiGetUsers } from '@/lib/api/users'
import { startOfDay, endOfDay, subDays, format, parseISO, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, subMonths } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import type { TransactionFilters } from '@/lib/types/transactions'

export type TimePeriod = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

export interface OverviewMetrics {
  // Transaction Overview cards
  totalTransactionsToday: number
  totalVolumeToday: number
  failedTransactionsPercent: number
  pendingTransactions: number
  totalTransactionsSelectedPeriod: number
  failedTransactionsPercentSelectedPeriod: number
  pendingTransactionsSelectedPeriod: number
  
  // Key Business Metrics (selected period)
  totalVolumeSelectedPeriod: number
  successfulTransactionsSelectedPeriod: number
  successRate: number
  walletBalance: number
  revenueSelectedPeriod: number
  transactionsChangePercent: number | null
  volumeChangePercent: number | null
  successRateChangePercent: number | null
  newWalletsTodayChangePercent: number | null
  // Backward-compatible aliases (deprecated)
  totalVolumeThisMonth?: number
  transactionsToday?: number
  revenueToday?: number
  
  // User Activity & Growth
  activeUsers24h: number
  activeUsers7d: number
  newWalletsToday: number
totalUsers: number
  verifiedUsers: number
  blockedAccounts: number
  
  // Charts data
  volumeTrend7d: Array<{
    date: string
    volume: number
    transactionCount: number
    disputeCount: number
    disputeRate: number
    avgTicketSize: number
    disputes?: number
    refunded?: number
    flaggedAmount?: number
    disputedAmount?: number
  }>
  errorRateTrend7d: Array<{ date: string; errorRate: number }>
  chartPeriodLabel: string
  disputesDataWarning?: string | null
  
  // Loading and error states
  loading: boolean
  error: string | null
}

export function useOverviewData(
  timePeriod: TimePeriod = 'today',
  customDateRange?: { from: Date | null; to: Date | null }
) {
  const [transactionsToday, setTransactionsToday] = useState<Transaction[]>([])
  const [transactions7d, setTransactions7d] = useState<Transaction[]>([])
  const [transactionsThisMonth, setTransactionsThisMonth] = useState<Transaction[]>([])
  const [transactionsPeriod, setTransactionsPeriod] = useState<Transaction[]>([])
  const [transactionsPreviousPeriod, setTransactionsPreviousPeriod] = useState<Transaction[]>([])
  const [disputedTransactions, setDisputedTransactions] = useState<Transaction[]>([])
  const [chartPeriodLabel, setChartPeriodLabel] = useState<string>('All time')
  const [disputesDataWarning, setDisputesDataWarning] = useState<string | null>(null)
  const [wallets, setWallets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filterTransactionsByRange = (
    transactions: Transaction[],
    rangeStart: Date,
    rangeEnd: Date
  ): Transaction[] => {
    return transactions.filter((tx) => {
      try {
        const txDate = parseISO(tx.createdAt)
        return txDate >= rangeStart && txDate <= rangeEnd
      } catch {
        return false
      }
    })
  }

  const fetchOverviewData = async () => {
    setLoading(true)
    setError(null)
    setDisputesDataWarning(null)
    
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
        setChartPeriodLabel('Today')
      } else if (timePeriod === 'week') {
        periodStart = sevenDaysAgo
        periodEnd = todayEnd
        setChartPeriodLabel('Last 7 days')
      } else if (timePeriod === 'month') {
        periodStart = monthStart
        periodEnd = monthEnd
        setChartPeriodLabel('This month')
      } else if (timePeriod === 'quarter') {
        periodStart = startOfQuarter(now)
        periodEnd = endOfQuarter(now)
        setChartPeriodLabel('This quarter')
      } else if (timePeriod === 'year') {
        periodStart = startOfYear(now)
        periodEnd = endOfYear(now)
        setChartPeriodLabel('This year')
      } else if (timePeriod === 'custom' && customDateRange?.from && customDateRange?.to) {
        periodStart = startOfDay(customDateRange.from)
        periodEnd = endOfDay(customDateRange.to)
        setChartPeriodLabel(`${format(customDateRange.from, 'MMM d, yyyy')} - ${format(customDateRange.to, 'MMM d, yyyy')}`)
      } else if (timePeriod === 'all') {
        setChartPeriodLabel('All time')
      }
      const periodDurationMs = Math.max(1, periodEnd.getTime() - periodStart.getTime() + 1)
      const previousPeriodEnd = new Date(periodStart.getTime() - 1)
      const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodDurationMs + 1)

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
      }
      if (timePeriod !== 'all') {
        periodFilters.startDate = periodStart.toISOString()
        periodFilters.endDate = periodEnd.toISOString()
      }
      const previousPeriodFilters: TransactionFilters | null =
        timePeriod === 'all'
          ? null
          : {
              page: 0,
              limit: 10000,
              sortBy: 'createdAt',
              order: 'DESC',
              startDate: previousPeriodStart.toISOString(),
              endDate: previousPeriodEnd.toISOString(),
            }

      // Fetch all data in parallel
      const [todayResponse, sevenDaysResponse, monthResponse, periodResponse, previousPeriodResponse, disputedResponse, walletsResponse, usersResponse] = await Promise.all([
        apiGetAllTransactions(todayFilters),
        apiGetAllTransactions(sevenDaysFilters),
        apiGetAllTransactions(monthFilters),
        apiGetAllTransactions(periodFilters),
        previousPeriodFilters ? apiGetAllTransactions(previousPeriodFilters) : Promise.resolve(null),
        apiGetDisputedTransactions().catch((disputesError) => {
          console.warn('[useOverviewData] Failed to fetch disputed transactions:', disputesError)
          setDisputesDataWarning('Unable to load disputed transactions. Showing zero disputes for this view.')
          return null
        }),
        apiGetAllWallets({ limit: 10000 }),
        apiGetUsers({ page: 0, limit: 1000 }),
      ])

      // Extract transactions from responses.
      // We also apply client-side date filtering as a safety net because some
      // backends may ignore startDate/endDate query params.
      if (todayResponse.success && todayResponse.data?.content) {
        setTransactionsToday(filterTransactionsByRange(todayResponse.data.content, todayStart, todayEnd))
      }
      if (sevenDaysResponse.success && sevenDaysResponse.data?.content) {
        setTransactions7d(filterTransactionsByRange(sevenDaysResponse.data.content, sevenDaysAgo, todayEnd))
      }
      if (monthResponse.success && monthResponse.data?.content) {
        setTransactionsThisMonth(filterTransactionsByRange(monthResponse.data.content, monthStart, monthEnd))
      }
      if (periodResponse.success && periodResponse.data?.content) {
        const periodTransactions =
          timePeriod === 'all'
            ? periodResponse.data.content
            : filterTransactionsByRange(periodResponse.data.content, periodStart, periodEnd)
        setTransactionsPeriod(periodTransactions)
        console.log('[useOverviewData] Period transactions loaded:', periodTransactions.length)
      }
      if (previousPeriodResponse?.success && previousPeriodResponse.data?.content) {
        setTransactionsPreviousPeriod(
          filterTransactionsByRange(previousPeriodResponse.data.content, previousPeriodStart, previousPeriodEnd)
        )
      } else {
        setTransactionsPreviousPeriod([])
      }
      if (Array.isArray(disputedResponse)) {
        const disputedInSelectedRange =
          timePeriod === 'all'
            ? disputedResponse
            : filterTransactionsByRange(disputedResponse as Transaction[], periodStart, periodEnd)
        setDisputedTransactions(disputedInSelectedRange)
      } else {
        setDisputedTransactions([])
      }
      if (Array.isArray(walletsResponse)) {
        setWallets(walletsResponse)
      }

      setUsers(usersResponse?.data || [])

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
    if (timePeriod === 'custom' && (!customDateRange?.from || !customDateRange?.to)) {
      return
    }
    fetchOverviewData()
  }, [timePeriod, customDateRange?.from, customDateRange?.to])

  // Compute metrics from fetched data
  const metrics = useMemo((): OverviewMetrics => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const selectedPeriodStart = (() => {
      if (timePeriod === 'today') return todayStart
      if (timePeriod === 'week') return startOfDay(subDays(now, 7))
      if (timePeriod === 'month') return startOfMonth(now)
      if (timePeriod === 'quarter') return startOfQuarter(now)
      if (timePeriod === 'year') return startOfYear(now)
      if (timePeriod === 'custom' && customDateRange?.from) return startOfDay(customDateRange.from)
      return startOfMonth(now)
    })()
    const selectedPeriodEnd = (() => {
      if (timePeriod === 'today') return todayEnd
      if (timePeriod === 'week') return todayEnd
      if (timePeriod === 'month') return endOfMonth(now)
      if (timePeriod === 'quarter') return endOfQuarter(now)
      if (timePeriod === 'year') return endOfYear(now)
      if (timePeriod === 'custom' && customDateRange?.to) return endOfDay(customDateRange.to)
      return endOfMonth(now)
    })()

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
    const failedPeriod = transactionsPeriod.filter(t => t.status === TransactionStatus.FAILED)
    const pendingPeriod = transactionsPeriod.filter(t => t.status === TransactionStatus.PENDING)
    const totalTransactionsSelectedPeriod = transactionsPeriod.length
    const totalVolumePeriod = successfulPeriod.reduce((sum, t) => sum + (t.amount || 0), 0)
    const transactionsPeriodCount = successfulPeriod.length
    const successRatePeriod = transactionsPeriod.length > 0 
      ? (successfulPeriod.length / transactionsPeriod.length) * 100 
      : 0
    const failedTransactionsPercentSelectedPeriod = totalTransactionsSelectedPeriod > 0
      ? (failedPeriod.length / totalTransactionsSelectedPeriod) * 100
      : 0
    const pendingTransactionsSelectedPeriod = pendingPeriod.length

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
    const successfulPreviousPeriod = transactionsPreviousPeriod.filter(t => t.status === TransactionStatus.SUCCESSFUL)
    const revenuePreviousPeriod = successfulPreviousPeriod.reduce((sum, t) => {
      const fee = t.chargeFee || 0
      const commission = (t as any).commissionAmount || 0
      return sum + fee + commission
    }, 0)
    const successRatePreviousPeriod = transactionsPreviousPeriod.length > 0
      ? (successfulPreviousPeriod.length / transactionsPreviousPeriod.length) * 100
      : 0

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
    const yesterdayStart = startOfDay(subDays(now, 1))
    const yesterdayEnd = endOfDay(subDays(now, 1))
    const newWalletsYesterday = wallets.filter(w => {
      if (!w.createdAt) return false
      try {
        const createdDate = parseISO(w.createdAt)
        return createdDate >= yesterdayStart && createdDate <= yesterdayEnd
      } catch {
        return false
      }
    }).length
    const percentChange = (current: number, previous: number): number | null => {
      if (previous === 0) {
        if (current === 0) return 0
        return null
      }
      return ((current - previous) / previous) * 100
    }
    const transactionsChangePercent = percentChange(transactionsPeriod.length, transactionsPreviousPeriod.length)
    const previousVolumePeriod = successfulPreviousPeriod.reduce((sum, t) => sum + (t.amount || 0), 0)
    const volumeChangePercent = percentChange(totalVolumePeriod, previousVolumePeriod)
    const successRateChangePercent =
      transactionsPreviousPeriod.length === 0 ? null : successRatePeriod - successRatePreviousPeriod
    const newWalletsTodayChangePercent = percentChange(newWalletsToday, newWalletsYesterday)


    const totalUsers = users.length
    const verifiedUsers = users.filter((u: any) => u?.kycVerified === true).length
    const blockedAccounts = 0

    // Charts data - build based on the selected period
    const volumeTrend7d: Array<{
      date: string
      volume: number
      transactionCount: number
      disputeCount: number
      disputeRate: number
      avgTicketSize: number
      disputes?: number
      refunded?: number
      flaggedAmount?: number
      disputedAmount?: number
    }> = []
    const chartData = transactionsPeriod
    const chartUsesMonthlyBuckets = timePeriod === 'all' || timePeriod === 'year'
    const chartDates = chartUsesMonthlyBuckets
      ? eachMonthOfInterval({
          start: timePeriod === 'all' ? startOfMonth(subMonths(now, 11)) : startOfMonth(selectedPeriodStart),
          end: endOfMonth(timePeriod === 'all' ? now : selectedPeriodEnd),
        })
      : eachDayOfInterval({
          start: startOfDay(selectedPeriodStart),
          end: endOfDay(selectedPeriodEnd),
        })

    chartDates.forEach((bucketStart) => {
      const bucketEnd = chartUsesMonthlyBuckets ? endOfMonth(bucketStart) : endOfDay(bucketStart)
      const bucketTransactions = chartData.filter(t => {
        try {
          const txDate = parseISO(t.createdAt)
          return txDate >= bucketStart && txDate <= bucketEnd
        } catch {
          return false
        }
      })
      const successTransactions = bucketTransactions.filter(t => t.status === TransactionStatus.SUCCESSFUL)
      const bucketVolume = successTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      const disputedInBucket = disputedTransactions.filter((t) => {
        try {
          const txDate = parseISO(t.createdAt)
          return txDate >= bucketStart && txDate <= bucketEnd
        } catch {
          return false
        }
      })
      const bucketDisputeCount = disputedInBucket.length
      const bucketTransactionCount = bucketTransactions.length
      const bucketDisputeRate = bucketTransactionCount > 0 ? (bucketDisputeCount / bucketTransactionCount) * 100 : 0
      const bucketAvgTicketSize = bucketTransactionCount > 0 ? bucketVolume / bucketTransactionCount : 0
      const bucketRefunded = bucketTransactions
        .filter((t) => ['REFUND', 'ESCROW_REFUND'].includes(String(t.description || '').toUpperCase()))
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      const bucketDisputedAmount = disputedInBucket.reduce((sum, t) => sum + (t.amount || 0), 0)

      volumeTrend7d.push({
        date: format(bucketStart, chartUsesMonthlyBuckets ? 'MMM yyyy' : 'MMM dd'),
        volume: bucketVolume || 0,
        transactionCount: bucketTransactionCount,
        disputeCount: bucketDisputeCount,
        disputeRate: bucketDisputeRate,
        avgTicketSize: bucketAvgTicketSize,
        disputes: bucketDisputeCount,
        refunded: bucketRefunded,
        flaggedAmount: bucketDisputedAmount,
        disputedAmount: bucketDisputedAmount,
      })
    })

    // Error Rate Trend follows same buckets as selected filter
    const errorRateTrend7d: Array<{ date: string; errorRate: number }> = []
    chartDates.forEach((bucketStart) => {
      const bucketEnd = chartUsesMonthlyBuckets ? endOfMonth(bucketStart) : endOfDay(bucketStart)
      const bucketTransactions = chartData.filter(t => {
        try {
          const txDate = parseISO(t.createdAt)
          return txDate >= bucketStart && txDate <= bucketEnd
        } catch {
          return false
        }
      })
      const failedCount = bucketTransactions.filter(t => t.status === TransactionStatus.FAILED).length
      const errorRate = bucketTransactions.length > 0 
        ? (failedCount / bucketTransactions.length) * 100 
        : 0
      errorRateTrend7d.push({
        date: format(bucketStart, chartUsesMonthlyBuckets ? 'MMM yyyy' : 'MMM dd'),
        errorRate: errorRate || 0,
      })
    })

    return {
      totalTransactionsToday,
      totalVolumeToday,
      failedTransactionsPercent,
      pendingTransactions,
      totalTransactionsSelectedPeriod,
      failedTransactionsPercentSelectedPeriod,
      pendingTransactionsSelectedPeriod,
      totalVolumeSelectedPeriod: totalVolumePeriod,
      successfulTransactionsSelectedPeriod: transactionsPeriodCount,
      successRate: successRatePeriod,
      walletBalance,
      revenueSelectedPeriod: revenuePeriod,
      transactionsChangePercent,
      volumeChangePercent,
      successRateChangePercent,
      newWalletsTodayChangePercent,
      activeUsers24h,
      activeUsers7d,
      newWalletsToday,
      totalUsers,
      verifiedUsers,
      blockedAccounts,
      volumeTrend7d,
      errorRateTrend7d,
      chartPeriodLabel,
      disputesDataWarning,
      loading,
      error,
      // Backward-compatible aliases for existing consumers.
      totalVolumeThisMonth: totalVolumePeriod,
      transactionsToday: transactionsPeriodCount,
      revenueToday: revenuePeriod,
    }
  }, [timePeriod, customDateRange?.from, customDateRange?.to, transactionsToday, transactions7d, transactionsThisMonth, transactionsPeriod, transactionsPreviousPeriod, disputedTransactions, chartPeriodLabel, disputesDataWarning, wallets, users, loading, error])

  return {
    ...metrics,
    refetch: fetchOverviewData,
  }
}

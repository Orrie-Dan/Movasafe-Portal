import { useState, useEffect, useMemo } from 'react'
import { apiGetAllTransactions, type Transaction, TransactionStatus } from '@/lib/api'
import { apiGetAllWallets } from '@/lib/api/wallets'
import { startOfDay, endOfDay, subDays, format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import type { TransactionFilters } from '@/lib/types/transactions'

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
  volumeTrend7d: Array<{ date: string; volume: number }>
  errorRateTrend7d: Array<{ date: string; errorRate: number }>
  
  // Loading and error states
  loading: boolean
  error: string | null
}

export function useOverviewData() {
  const [transactionsToday, setTransactionsToday] = useState<Transaction[]>([])
  const [transactions7d, setTransactions7d] = useState<Transaction[]>([])
  const [transactionsThisMonth, setTransactionsThisMonth] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverviewData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const now = new Date()
      const todayStart = startOfDay(now)
      const todayEnd = endOfDay(now)
      const sevenDaysAgo = startOfDay(subDays(now, 7))
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)

      // Fetch transactions for today
      const todayFilters: TransactionFilters = {
        page: 0,
        limit: 10000, // Get all transactions for today
        sortBy: 'createdAt',
        order: 'DESC',
        startDate: todayStart.toISOString(),
        endDate: todayEnd.toISOString(),
      }

      // Fetch transactions for last 7 days
      const sevenDaysFilters: TransactionFilters = {
        page: 0,
        limit: 10000, // Get all transactions for last 7 days
        sortBy: 'createdAt',
        order: 'DESC',
        startDate: sevenDaysAgo.toISOString(),
        endDate: todayEnd.toISOString(),
      }

      // Fetch transactions for this month
      const monthFilters: TransactionFilters = {
        page: 0,
        limit: 10000, // Get all transactions for this month
        sortBy: 'createdAt',
        order: 'DESC',
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      }

      // Fetch all data in parallel
      const [todayResponse, sevenDaysResponse, monthResponse, walletsResponse] = await Promise.all([
        apiGetAllTransactions(todayFilters),
        apiGetAllTransactions(sevenDaysFilters),
        apiGetAllTransactions(monthFilters),
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
      if (Array.isArray(walletsResponse)) {
        setWallets(walletsResponse)
      }

      // TODO: Fetch users data when users API is available
      // For now, we'll compute what we can from transactions and wallets
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
  }, [])

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

    // Transaction Overview cards
    const totalTransactionsToday = transactionsToday.length
    const successfulToday = transactionsToday.filter(t => t.status === TransactionStatus.SUCCESSFUL)
    const failedToday = transactionsToday.filter(t => t.status === TransactionStatus.FAILED)
    const pendingToday = transactionsToday.filter(t => t.status === TransactionStatus.PENDING)
    
    const totalVolumeToday = successfulToday.reduce((sum, t) => sum + (t.amount || 0), 0)
    const failedTransactionsPercent = totalTransactionsToday > 0 
      ? (failedToday.length / totalTransactionsToday) * 100 
      : 0
    const pendingTransactions = pendingToday.length

    // Key Business Metrics
    const successfulThisMonth = transactionsThisMonth.filter(t => t.status === TransactionStatus.SUCCESSFUL)
    const totalVolumeThisMonth = successfulThisMonth.reduce((sum, t) => sum + (t.amount || 0), 0)
    const transactionsTodayCount = successfulToday.length
    const successRate = totalTransactionsToday > 0 
      ? (successfulToday.length / totalTransactionsToday) * 100 
      : 0

    // Wallet Balance - sum of all wallet balances
    const walletBalance = wallets.reduce((sum, w) => {
      const balance = w.balance || w.availableBalance || w.totalBalance || 0
      return sum + (typeof balance === 'number' ? balance : 0)
    }, 0)

    // Revenue Today - sum of fees/commissions from successful transactions
    const revenueToday = successfulToday.reduce((sum, t) => {
      const fee = t.chargeFee || 0
      // Also check for commission fields if they exist
      const commission = (t as any).commissionAmount || 0
      return sum + fee + commission
    }, 0)

    // User Activity & Growth
    // Active Users (last 24h) - unique userIds
    const activeUsers24hSet = new Set<string>()
    transactions7d.forEach(t => {
      if (t.userId && isLast24h(t.createdAt)) {
        activeUsers24hSet.add(t.userId)
      }
    })
    const activeUsers24h = activeUsers24hSet.size

    // Active Users (last 7d) - unique userIds
    const activeUsers7dSet = new Set<string>()
    transactions7d.forEach(t => {
      if (t.userId) {
        activeUsers7dSet.add(t.userId)
      }
    })
    const activeUsers7d = activeUsers7dSet.size

    // New Wallets Today - wallets created today
    const newWalletsToday = wallets.filter(w => {
      if (!w.createdAt) return false
      try {
        const createdDate = parseISO(w.createdAt)
        return createdDate >= todayStart && createdDate <= todayEnd
      } catch {
        return false
      }
    }).length

    // Verified Users - TODO: Need users API to get this
    const verifiedUsers = 0 // Placeholder until users API is available

    // Blocked Accounts - TODO: Need users API to get this
    const blockedAccounts = 0 // Placeholder until users API is available

    // Charts data
    // Transaction Volume Trend (Last 7 Days)
    const volumeTrend7d: Array<{ date: string; volume: number }> = []
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i)
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      const dayTransactions = transactions7d.filter(t => {
        try {
          const txDate = parseISO(t.createdAt)
          return txDate >= dayStart && txDate <= dayEnd && t.status === TransactionStatus.SUCCESSFUL
        } catch {
          return false
        }
      })
      const dayVolume = dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
      volumeTrend7d.push({
        date: format(day, 'MMM dd'),
        volume: dayVolume || 0,
      })
    }

    // Error Rate Trend (Last 7 Days)
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
      totalVolumeThisMonth,
      transactionsToday: transactionsTodayCount,
      successRate,
      walletBalance,
      revenueToday,
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
  }, [transactionsToday, transactions7d, transactionsThisMonth, wallets, users, loading, error])

  return {
    ...metrics,
    refetch: fetchOverviewData,
  }
}

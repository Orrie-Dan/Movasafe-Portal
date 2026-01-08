import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { apiMe, apiGetAllTransactions, apiGetAllWallets, TransactionType, TransactionStatus, type Transaction, type Wallet } from '@/lib/api'
import { format, parseISO, startOfDay, endOfDay, subDays } from 'date-fns'

export interface AnalyticsFilters {
  dateRange: '7d' | '30d' | 'custom'
  customStartDate?: string
  customEndDate?: string
  transactionType: 'all' | TransactionType
  status: 'all' | TransactionStatus
  userSegment: 'all' | 'verified' | 'unverified'
}

const DEFAULT_FILTERS: AnalyticsFilters = {
  dateRange: '30d',
  transactionType: 'all',
  status: 'all',
  userSegment: 'all',
}

export function useAnalytics(initialFilters?: Partial<AnalyticsFilters>) {
  const router = useRouter()
  const [authError, setAuthError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [filters, setFilters] = useState<AnalyticsFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate = endOfDay(now)

    if (filters.dateRange === '7d') {
      startDate = startOfDay(subDays(now, 7))
    } else if (filters.dateRange === '30d') {
      startDate = startOfDay(subDays(now, 30))
    } else if (filters.dateRange === 'custom' && filters.customStartDate && filters.customEndDate) {
      startDate = startOfDay(parseISO(filters.customStartDate))
      endDate = endOfDay(parseISO(filters.customEndDate))
    } else {
      startDate = startOfDay(subDays(now, 30))
    }

    return { startDate, endDate }
  }

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()

      const transactionFilters: any = {
        limit: 10000,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      }

      if (filters.transactionType !== 'all') {
        transactionFilters.transactionType = filters.transactionType
      }

      if (filters.status !== 'all') {
        transactionFilters.status = filters.status
      }

      const [transactionsData, walletsData] = await Promise.all([
        apiGetAllTransactions(transactionFilters),
        apiGetAllWallets({ limit: 10000 }),
      ])

      setTransactions(transactionsData)
      setWallets(walletsData)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiMe()
        setAuthError(false)
        fetchAnalyticsData()
      } catch (error: any) {
        setAuthError(true)
        setTimeout(() => router.replace('/login'), 2000)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!authError) {
      fetchAnalyticsData()
    }
  }, [filters])

  // Filter transactions based on user segment (verified/unverified)
  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    if (filters.userSegment !== 'all') {
      // Note: This is a simplified check. In a real app, you'd need to join with user data
      // For now, we'll filter based on available data
      // You may need to fetch user data separately to check kycVerified status
      filtered = filtered // Placeholder - would filter by user verification status
    }

    return filtered
  }, [transactions, filters.userSegment])

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  return {
    // Data
    transactions,
    filteredTransactions,
    wallets,
    loading,
    authError,
    // Filters
    filters,
    setFilters,
    resetFilters,
    getDateRange,
    // Actions
    refetch: fetchAnalyticsData,
  }
}


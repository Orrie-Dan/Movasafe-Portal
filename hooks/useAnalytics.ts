import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { apiGetAllTransactions, TransactionType, TransactionStatus, type Transaction } from '@/lib/api'
import { apiGetAllWallets } from '@/lib/api/wallets'
import type { Wallet } from '@/lib/types/wallets'
import type { TransactionFilters } from '@/lib/types/transactions'
import { parseISO, startOfDay, endOfDay, subDays } from 'date-fns'

export interface AnalyticsFilters {
  dateRange: '7d' | '30d' | 'custom'
  customStartDate?: string
  customEndDate?: string
  transactionType: 'all' | TransactionType
  status: 'all' | TransactionStatus
}

const DEFAULT_FILTERS: AnalyticsFilters = {
  dateRange: '30d',
  transactionType: 'all',
  status: 'all',
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

      // Build filters using the same shape as the Transactions page (pagination + ISO dates)
      const transactionFilters: TransactionFilters = {
        page: 0,
        limit: 10000,
        sortBy: 'createdAt',
        order: 'DESC',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
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

      // apiGetAllTransactions returns a paginated response wrapper
      if (transactionsData.success && transactionsData.data?.content) {
        setTransactions(transactionsData.data.content)
      } else {
        setTransactions([])
      }
      setWallets(walletsData)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Authentication check removed - allow access without login
  useEffect(() => {
    setAuthError(false)
    fetchAnalyticsData()
  }, [])

  useEffect(() => {
    fetchAnalyticsData()
  }, [filters])

  // Currently, all analytics are computed from the full transactions set
  const filteredTransactions = useMemo(() => transactions, [transactions])

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


import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGetAllTransactions, TransactionType, TransactionStatus, type Transaction } from '@/lib/api'
import { apiGetAllWallets } from '@/lib/api/wallets'
import type { Wallet } from '@/lib/types/wallets'
import type { TransactionFilters } from '@/lib/types/transactions'
import { parseISO } from 'date-fns'
import { getPeriodRange, filterByDateRange } from '@/lib/utils/period'

export interface AnalyticsFilters {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  customStartDate?: string
  customEndDate?: string
  transactionType: 'all' | TransactionType
  status: 'all' | TransactionStatus
  minAmount?: string
  maxAmount?: string
}

const DEFAULT_FILTERS: AnalyticsFilters = {
  dateRange: 'today',
  transactionType: 'all',
  status: 'all',
  minAmount: '',
  maxAmount: '',
}

export function useAnalytics(initialFilters?: Partial<AnalyticsFilters>) {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [filters, setFilters] = useState<AnalyticsFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })

  const getDateRange = () => {
    const normalized = getPeriodRange({
      period:
        filters.dateRange === 'today'
          ? 'today'
          : filters.dateRange === 'week'
          ? 'week'
          : filters.dateRange === 'month'
          ? 'month'
          : filters.dateRange === 'quarter'
          ? 'quarter'
          : filters.dateRange === 'year'
          ? 'year'
          : filters.dateRange === 'all'
          ? 'all'
          : 'custom',
      customFrom: filters.customStartDate ? parseISO(filters.customStartDate) : null,
      customTo: filters.customEndDate ? parseISO(filters.customEndDate) : null,
    })
    return { startDate: normalized.start, endDate: normalized.end }
  }

  const parseAmount = (value?: string) => {
    if (!value) return undefined
    const n = Number(value.replace(/,/g, ''))
    return Number.isFinite(n) && n >= 0 ? n : undefined
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
      }
      if (filters.dateRange !== 'all') {
        transactionFilters.startDate = startDate.toISOString()
        transactionFilters.endDate = endDate.toISOString()
      }

      if (filters.transactionType !== 'all') {
        transactionFilters.transactionType = filters.transactionType
      }

      if (filters.status !== 'all') {
        transactionFilters.status = filters.status
      }

      const minAmount = parseAmount(filters.minAmount)
      const maxAmount = parseAmount(filters.maxAmount)
      if (minAmount !== undefined) {
        transactionFilters.minAmount = minAmount
      }
      if (maxAmount !== undefined) {
        transactionFilters.maxAmount = maxAmount
      }

      const [transactionsData, walletsData] = await Promise.all([
        apiGetAllTransactions(transactionFilters),
        apiGetAllWallets({ limit: 10000 }),
      ])

      // apiGetAllTransactions returns a paginated response wrapper
      if (transactionsData.success && transactionsData.data?.content) {
        const apiRows = transactionsData.data.content
        const safeRows =
          filters.dateRange === 'all'
            ? apiRows
            : filterByDateRange(
                apiRows,
                (tx) => {
                  try {
                    return parseISO(tx.createdAt)
                  } catch {
                    return null
                  }
                },
                { start: startDate, end: endDate, label: 'Selected range' }
              )
        setTransactions(safeRows)
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


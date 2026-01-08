import { useState, useEffect, useMemo } from 'react'
import { apiGetAllTransactions, type Transaction, TransactionType, TransactionStatus } from '@/lib/api'
import { format, startOfDay, endOfDay, subDays, parseISO } from 'date-fns'
import { toast } from '@/hooks/use-toast'

export interface TransactionUIFilters {
  transactionId: string
  userId: string
  walletId: string
  dateRange: 'today' | '7d' | '30d' | 'custom' | 'all'
  customStartDate: string
  customEndDate: string
  status: 'all' | TransactionStatus
  transactionType: 'all' | TransactionType
  minAmount: string
  maxAmount: string
}

const DEFAULT_FILTERS: TransactionUIFilters = {
  transactionId: '',
  userId: '',
  walletId: '',
  dateRange: '7d',
  customStartDate: '',
  customEndDate: '',
  status: 'all',
  transactionType: 'all',
  minAmount: '',
  maxAmount: '',
}

export interface SortingState {
  column: string | null
  direction: 'asc' | 'desc'
}

export interface PaginationState {
  page: number
  pageSize: number
}

export function useTransactions(initialFilters?: Partial<TransactionUIFilters>) {
  const [filters, setFilters] = useState<TransactionUIFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>({
    column: 'createdAt',
    direction: 'desc',
  })
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 50,
  })

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date | undefined
    let endDate = endOfDay(now)

    if (filters.dateRange === 'today') {
      startDate = startOfDay(now)
    } else if (filters.dateRange === '7d') {
      startDate = startOfDay(subDays(now, 7))
    } else if (filters.dateRange === '30d') {
      startDate = startOfDay(subDays(now, 30))
    } else if (filters.dateRange === 'custom' && filters.customStartDate && filters.customEndDate) {
      startDate = startOfDay(parseISO(filters.customStartDate))
      endDate = endOfDay(parseISO(filters.customEndDate))
    }

    return { startDate, endDate }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const { startDate, endDate } = getDateRange()
      const apiFilters: any = {
        limit: 10000,
      }

      if (filters.userId) {
        apiFilters.userId = filters.userId
      }

      if (filters.transactionType !== 'all') {
        apiFilters.transactionType = filters.transactionType
      }

      if (filters.status !== 'all') {
        apiFilters.status = filters.status
      }

      if (startDate && endDate) {
        apiFilters.startDate = format(startDate, 'yyyy-MM-dd')
        apiFilters.endDate = format(endDate, 'yyyy-MM-dd')
      }

      const response = await apiGetAllTransactions(apiFilters)
      setTransactions(response)
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions'
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
    fetchTransactions()
  }, [filters.userId, filters.transactionType, filters.status, filters.dateRange, filters.customStartDate, filters.customEndDate])

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    if (filters.transactionId) {
      filtered = filtered.filter((t) =>
        t.id.toLowerCase().includes(filters.transactionId.toLowerCase())
      )
    }

    if (filters.walletId && !filters.userId) {
      filtered = filtered.filter((t) =>
        t.userId.toLowerCase().includes(filters.walletId.toLowerCase())
      )
    }

    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount)
      if (!isNaN(min)) {
        filtered = filtered.filter((t) => t.amount >= min)
      }
    }

    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount)
      if (!isNaN(max)) {
        filtered = filtered.filter((t) => t.amount <= max)
      }
    }

    return filtered
  }, [transactions, filters])

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    if (!sorting.column) return filteredTransactions

    return [...filteredTransactions].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sorting.column) {
        case 'id':
          aValue = a.id
          bValue = b.id
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'transactionType':
          aValue = a.transactionType
          bValue = b.transactionType
          break
        case 'userId':
          aValue = a.userId
          bValue = b.userId
          break
        default:
          return 0
      }

      if (aValue < bValue) return sorting.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sorting.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredTransactions, sorting])

  // Paginate transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.pageSize
    return sortedTransactions.slice(startIndex, startIndex + pagination.pageSize)
  }, [sortedTransactions, pagination])

  const totalPages = Math.ceil(sortedTransactions.length / pagination.pageSize)

  const handleSort = (column: string) => {
    if (sorting.column === column) {
      setSorting({
        column,
        direction: sorting.direction === 'asc' ? 'desc' : 'asc',
      })
    } else {
      setSorting({ column, direction: 'desc' })
    }
  }

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  return {
    // Data
    transactions,
    filteredTransactions,
    sortedTransactions,
    paginatedTransactions,
    loading,
    error,
    // Filters
    filters,
    setFilters,
    resetFilters,
    // Sorting
    sorting,
    handleSort,
    // Pagination
    pagination,
    setPagination,
    totalPages,
    // Actions
    refetch: fetchTransactions,
  }
}


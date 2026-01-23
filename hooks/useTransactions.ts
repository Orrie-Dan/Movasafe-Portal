import { useState, useEffect, useMemo } from 'react'
import { apiGetAllTransactions, type Transaction, TransactionType, TransactionStatus } from '@/lib/api'
import { format, startOfDay, endOfDay, subDays, parseISO } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import type { TransactionFilters } from '@/lib/types/transactions'

export interface TransactionUIFilters {
  // Search filters
  transactionId: string
  transactionReference: string
  // User filters
  userId: string
  userName: string
  userPhoneNumber: string
  userNationalId: string
  walletId: string
  // Date filters
  dateRange: 'today' | '7d' | '30d' | 'custom' | 'all'
  customStartDate: string
  customEndDate: string
  // Transaction filters
  status: 'all' | TransactionStatus
  transactionType: 'all' | TransactionType
  description: string
  descriptions: string[] // Multi-select array
  // Amount filters
  minAmount: string
  maxAmount: string
}

const DEFAULT_FILTERS: TransactionUIFilters = {
  transactionId: '',
  transactionReference: '',
  userId: '',
  userName: '',
  userPhoneNumber: '',
  userNationalId: '',
  walletId: '',
  dateRange: '7d',
  customStartDate: '',
  customEndDate: '',
  status: 'all',
  transactionType: 'all',
  description: '',
  descriptions: [],
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
  const [totalElements, setTotalElements] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>({
    column: 'createdAt',
    direction: 'desc',
  })
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20, // Default limit per API
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
      
      // Build API filters from UI filters with defaults
      const apiFilters: TransactionFilters = {
        page: pagination.page - 1, // API uses 0-based indexing, default: 0
        limit: pagination.pageSize, // Default: 100
        sortBy: sorting.column || 'createdAt', // Default: createdAt
        order: (sorting.direction.toUpperCase() as 'ASC' | 'DESC') || 'DESC', // Default: DESC
      }

      // User filters - only add if not empty (trim whitespace)
      if (filters.userName?.trim()) {
        apiFilters.userName = filters.userName.trim()
      }
      if (filters.userPhoneNumber?.trim()) {
        apiFilters.userPhoneNumber = filters.userPhoneNumber.trim()
      }
      if (filters.userNationalId?.trim()) {
        apiFilters.userNationalId = filters.userNationalId.trim()
      }
      if (filters.userId?.trim()) {
        apiFilters.userId = filters.userId.trim()
      }

      // Transaction filters
      if (filters.transactionType && filters.transactionType !== 'all') {
        apiFilters.transactionType = filters.transactionType
      }
      if (filters.status && filters.status !== 'all') {
        apiFilters.status = filters.status
      }
      if (filters.description?.trim()) {
        apiFilters.description = filters.description.trim()
      }
      if (filters.descriptions && filters.descriptions.length > 0) {
        apiFilters.descriptions = filters.descriptions
      }
      
      // Map Transaction ID filter to transactionReference API param
      // Priority: transactionReference > transactionId
      if (filters.transactionReference?.trim()) {
        apiFilters.transactionReference = filters.transactionReference.trim()
      } else if (filters.transactionId?.trim()) {
        apiFilters.transactionReference = filters.transactionId.trim()
      }

      // Amount filters - only add if valid number
      if (filters.minAmount?.trim()) {
        const min = parseFloat(filters.minAmount.trim())
        if (!isNaN(min) && min >= 0) {
          apiFilters.minAmount = min
        }
      }
      if (filters.maxAmount?.trim()) {
        const max = parseFloat(filters.maxAmount.trim())
        if (!isNaN(max) && max >= 0) {
          apiFilters.maxAmount = max
        }
      }

      // Date filters - apply based on dateRange setting
      // If dateRange is 'all', don't send date filters
      // If dateRange is 'custom', use customStartDate and customEndDate
      // Otherwise use the calculated startDate and endDate
      if (filters.dateRange === 'custom') {
        // Use custom dates if both are provided
        if (filters.customStartDate && filters.customEndDate) {
          try {
            const customStart = parseISO(filters.customStartDate)
            const customEnd = parseISO(filters.customEndDate)
            apiFilters.startDate = startOfDay(customStart).toISOString()
            apiFilters.endDate = endOfDay(customEnd).toISOString()
          } catch (error) {
            console.error('Invalid custom date format:', error)
          }
        }
      } else if (filters.dateRange !== 'all' && startDate && endDate) {
        // Use calculated date range (today, 7d, 30d)
        apiFilters.startDate = startDate.toISOString()
        apiFilters.endDate = endDate.toISOString()
      }

      // Log filters being sent to API (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('[Transactions Filters] API filters being sent:', apiFilters)
      }

      const response = await apiGetAllTransactions(apiFilters)
      
      // Extract transactions from paginated response
      if (response.success && response.data?.content) {
        setTransactions(response.data.content)
        // Update total elements if available from API
        if (response.data.totalElements !== undefined) {
          setTotalElements(response.data.totalElements)
        } else {
          setTotalElements(response.data.content.length)
        }
      } else {
        setTransactions([])
        setTotalElements(0)
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
      
      // Categorize errors for better UI feedback
      let errorMessage = 'Failed to fetch transactions'
      let errorTitle = 'Error'
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // Categorize error types
        if (err.message.includes('Network error') || err.message.includes('Failed to reach')) {
          errorTitle = 'Server Unreachable'
          errorMessage = `Cannot connect to the transaction server. ${err.message}`
        } else if (err.message.includes('Unauthorized') || err.message.includes('No authentication token')) {
          errorTitle = 'Unauthorized'
          errorMessage = 'Your session has expired. Please sign in again.'
        } else if (err.message.includes('Bad request') || err.message.includes('Request failed with status')) {
          errorTitle = 'Bad Request'
          errorMessage = err.message
        } else {
          errorTitle = 'Error'
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      })
      setTransactions([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  // Memoize fetchTransactions to prevent unnecessary re-renders
  // Only recreate when dependencies actually change
  useEffect(() => {
    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // String filters - use JSON.stringify to detect array changes
    JSON.stringify(filters.descriptions),
    // Primitive filters
    filters.userId,
    filters.userName,
    filters.userPhoneNumber,
    filters.userNationalId,
    filters.transactionId,
    filters.transactionReference,
    filters.transactionType,
    filters.status,
    filters.description,
    filters.minAmount,
    filters.maxAmount,
    filters.dateRange,
    filters.customStartDate,
    filters.customEndDate,
    filters.walletId, // Client-side filter
    pagination.page,
    pagination.pageSize,
    sorting.column,
    sorting.direction,
  ])

    // Client-side filtering only for wallet ID (not supported by API)
    // Transaction ID is now handled via API transactionReference param
    const filteredTransactions = useMemo(() => {
      let filtered = transactions

      // Wallet ID search (client-side only - API doesn't support this filter)
      if (filters.walletId) {
        filtered = filtered.filter((t) =>
          t.fromDetails?.accountNumber?.toLowerCase().includes(filters.walletId.toLowerCase()) ||
          t.toDetails?.accountNumber?.toLowerCase().includes(filters.walletId.toLowerCase())
        )
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

  // Since API handles pagination, we use transactions directly
  // But we still need to handle client-side filtering
  const paginatedTransactions = useMemo(() => {
    // If we have client-side filters applied, paginate the filtered results
    if (filters.walletId) {
      const startIndex = (pagination.page - 1) * pagination.pageSize
      return sortedTransactions.slice(startIndex, startIndex + pagination.pageSize)
    }
    // Otherwise, API already paginated, just sort
    return sortedTransactions
  }, [sortedTransactions, pagination, filters.walletId])

  // Calculate total pages based on filtered results
  const totalPages = useMemo(() => {
    if (filters.walletId) {
      // Client-side filtering for wallet ID
      return Math.ceil(sortedTransactions.length / pagination.pageSize)
    }
    // Use API totalElements for server-side pagination
    return Math.ceil(totalElements / pagination.pageSize) || 1
  }, [sortedTransactions.length, pagination, filters.walletId, totalElements])

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


import { useState, useEffect, useMemo } from 'react'
import { apiGetAllTransactions, type Transaction, TransactionType, TransactionStatus } from '@/lib/api'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import type { TransactionFilters } from '@/lib/types/transactions'
import { getPeriodRange, filterByDateRange } from '@/lib/utils/period'

export interface TransactionUIFilters {
  // Search fields
  firstName: string
  lastName: string
  transactionReference: string
  userId: string
  userPhoneNumber: string
  // Date filters
  dateRange: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
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
  firstName: '',
  lastName: '',
  transactionReference: '',
  userId: '',
  userPhoneNumber: '',
  dateRange: 'today',
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
    pageSize: 10, // Default limit per API
  })
  const [debouncedSearchFields, setDebouncedSearchFields] = useState({
    firstName: '',
    lastName: '',
    transactionReference: '',
    userPhoneNumber: '',
  })

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearchFields({
        firstName: filters.firstName.trim(),
        lastName: filters.lastName.trim(),
        transactionReference: filters.transactionReference.trim(),
        userPhoneNumber: filters.userPhoneNumber.trim(),
      })
    }, 300)
    return () => clearTimeout(t)
  }, [
    filters.firstName,
    filters.lastName,
    filters.transactionReference,
    filters.userPhoneNumber,
  ])

  const getDateRange = () => {
    const period = getPeriodRange({
      period: filters.dateRange,
      customFrom: filters.customStartDate ? parseISO(filters.customStartDate) : null,
      customTo: filters.customEndDate ? parseISO(filters.customEndDate) : null,
    })
    return { startDate: period.start, endDate: period.end }
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
      const needsWideFetch =
        !!debouncedSearchFields.firstName ||
        !!debouncedSearchFields.lastName ||
        !!debouncedSearchFields.transactionReference ||
        !!debouncedSearchFields.userPhoneNumber
      if (needsWideFetch) {
        apiFilters.page = 0
        apiFilters.limit = 10000
      }

      // User filters - only add if not empty (trim whitespace)
      if (filters.userPhoneNumber?.trim()) {
        apiFilters.userPhoneNumber = filters.userPhoneNumber.trim()
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
      
      // Transaction reference filter (API-first)
      if (filters.transactionReference?.trim()) {
        apiFilters.transactionReference = filters.transactionReference.trim()
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

      // Date filters - for all time we intentionally do not send dates.
      if (filters.dateRange !== 'all' && startDate && endDate) {
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
        const apiRows = response.data.content
        // Apply a client-side date fallback when backend ignores date params.
        const dateSafeRows =
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
        setTransactions(dateSafeRows)
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
    debouncedSearchFields.firstName,
    debouncedSearchFields.lastName,
    debouncedSearchFields.transactionReference,
    debouncedSearchFields.userPhoneNumber,
    filters.userId,
    filters.firstName,
    filters.lastName,
    filters.userPhoneNumber,
    filters.transactionReference,
    filters.transactionType,
    filters.status,
    filters.description,
    filters.minAmount,
    filters.maxAmount,
    filters.dateRange,
    filters.customStartDate,
    filters.customEndDate,
    pagination.page,
    pagination.pageSize,
    sorting.column,
    sorting.direction,
  ])

    // Client-side filtering fallback for respective search boxes.
    const filteredTransactions = useMemo(() => {
      let filtered = transactions

      if (debouncedSearchFields.firstName) {
        const q = debouncedSearchFields.firstName.toLowerCase()
        filtered = filtered.filter((t) => {
          const parts = (t.userName || '').trim().split(/\s+/)
          const first = (parts[0] || '').toLowerCase()
          return first.includes(q)
        })
      }

      if (debouncedSearchFields.lastName) {
        const q = debouncedSearchFields.lastName.toLowerCase()
        filtered = filtered.filter((t) => {
          const parts = (t.userName || '').trim().split(/\s+/)
          const last = parts.slice(1).join(' ').toLowerCase()
          return last.includes(q)
        })
      }

      if (debouncedSearchFields.userPhoneNumber) {
        const q = debouncedSearchFields.userPhoneNumber.toLowerCase()
        filtered = filtered.filter((t) => (t.userPhoneNumber || '').toLowerCase().includes(q))
      }

      const txRefSearch = debouncedSearchFields.transactionReference.toLowerCase()
      if (txRefSearch) {
        filtered = filtered.filter((t) =>
          t.internalReference?.toLowerCase().includes(txRefSearch) ||
          t.id?.toLowerCase().includes(txRefSearch)
        )
      }

      return filtered
    }, [transactions, debouncedSearchFields])

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
    const hasClientSideSearch =
      !!debouncedSearchFields.firstName ||
      !!debouncedSearchFields.lastName ||
      !!debouncedSearchFields.transactionReference ||
      !!debouncedSearchFields.userPhoneNumber
    if (hasClientSideSearch) {
      const startIndex = (pagination.page - 1) * pagination.pageSize
      return sortedTransactions.slice(startIndex, startIndex + pagination.pageSize)
    }
    // Otherwise, API already paginated, just sort
    return sortedTransactions
  }, [sortedTransactions, pagination, debouncedSearchFields])

  // Calculate total pages based on filtered results
  const totalPages = useMemo(() => {
    const hasClientSideSearch =
      !!debouncedSearchFields.firstName ||
      !!debouncedSearchFields.lastName ||
      !!debouncedSearchFields.transactionReference ||
      !!debouncedSearchFields.userPhoneNumber
    if (hasClientSideSearch) {
      // Client-side pagination for active search fields
      return Math.ceil(sortedTransactions.length / pagination.pageSize)
    }
    // Use API totalElements for server-side pagination
    return Math.ceil(totalElements / pagination.pageSize) || 1
  }, [sortedTransactions.length, pagination, debouncedSearchFields, totalElements])

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


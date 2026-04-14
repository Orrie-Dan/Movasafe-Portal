import { useEffect, useMemo, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { apiGetFraudReviewHistory, apiGetFraudReviewQueue } from '@/fraud/services/fraudReviewApi'
import type { FraudReviewListResponse, FraudTransaction } from '@/fraud/types'

export type FraudTab = 'pending' | 'history'

export interface FraudHistoryFilters {
  status: string
  startDate: string
  endDate: string
  minAmount: string
  maxAmount: string
  signalType: string
}

const DEFAULT_HISTORY_FILTERS: FraudHistoryFilters = {
  status: 'all',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  signalType: 'all',
}

export function useFraudReviewQueue() {
  const [tab, setTab] = useState<FraudTab>('pending')

  const [pending, setPending] = useState<FraudTransaction[]>([])
  const [history, setHistory] = useState<FraudTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  const [historyFilters, setHistoryFilters] = useState<FraudHistoryFilters>(DEFAULT_HISTORY_FILTERS)
  const debouncedHistoryFilters = useDebounce(historyFilters, 350)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalElements / pageSize)), [totalElements, pageSize])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      let resp: FraudReviewListResponse
      if (tab === 'pending') {
        resp = await apiGetFraudReviewQueue({
          page: page - 1,
          limit: pageSize,
          sortBy: 'createdAt',
          order: 'DESC',
        })
        setPending(resp.content || [])
      } else {
        const minAmount = debouncedHistoryFilters.minAmount.trim() ? Number(debouncedHistoryFilters.minAmount) : undefined
        const maxAmount = debouncedHistoryFilters.maxAmount.trim() ? Number(debouncedHistoryFilters.maxAmount) : undefined
        resp = await apiGetFraudReviewHistory({
          page: page - 1,
          limit: pageSize,
          status: debouncedHistoryFilters.status !== 'all' ? debouncedHistoryFilters.status : undefined,
          startDate: debouncedHistoryFilters.startDate || undefined,
          endDate: debouncedHistoryFilters.endDate || undefined,
          minAmount: typeof minAmount === 'number' && !Number.isNaN(minAmount) ? minAmount : undefined,
          maxAmount: typeof maxAmount === 'number' && !Number.isNaN(maxAmount) ? maxAmount : undefined,
          signalType: debouncedHistoryFilters.signalType !== 'all' ? debouncedHistoryFilters.signalType : undefined,
        })
        setHistory(resp.content || [])
      }

      setTotalElements(resp.totalElements ?? (resp.content?.length || 0))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load fraud review data')
      if (tab === 'pending') setPending([])
      else setHistory([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, pageSize, debouncedHistoryFilters.status, debouncedHistoryFilters.startDate, debouncedHistoryFilters.endDate, debouncedHistoryFilters.minAmount, debouncedHistoryFilters.maxAmount, debouncedHistoryFilters.signalType])

  useEffect(() => {
    setPage(1)
  }, [tab])

  return {
    tab,
    setTab,

    pending,
    history,
    loading,
    error,

    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalElements,

    historyFilters,
    setHistoryFilters,

    refetch: fetchData,
  }
}


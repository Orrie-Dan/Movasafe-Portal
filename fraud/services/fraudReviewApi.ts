import { API_CONFIG } from '@/lib/config/api'
import { getToken } from '@/lib/auth'
import type { FraudReviewListResponse, FraudReviewStats, FraudTransaction } from '@/fraud/types'

type ApiEnvelope<T> = { success: boolean; message?: string | null; data: T }

function getAdminUserId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user_data')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed?.id === 'string' && parsed.id.trim() ? parsed.id : null
  } catch {
    return null
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getToken()
  if (!token) throw new Error('No authentication token found')

  const userId = getAdminUserId()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  if (userId) headers['X-User-Id'] = userId
  return headers
}

async function parseEnvelope<T>(resp: Response): Promise<T> {
  const text = await resp.text()
  if (!resp.ok) {
    let message = `Request failed with status ${resp.status}`
    try {
      const parsed = JSON.parse(text)
      message = parsed.message || parsed.error || message
    } catch {
      if (text) message = text
    }
    // Handle 401/403 by redirecting to login (matches existing patterns)
    if (resp.status === 401 || resp.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        window.location.href = '/login'
      }
    }
    throw new Error(message)
  }

  if (!text) return undefined as unknown as T

  const parsed: ApiEnvelope<T> | T = JSON.parse(text)
  if (typeof parsed === 'object' && parsed && 'data' in parsed) {
    return (parsed as ApiEnvelope<T>).data
  }
  return parsed as T
}

const BASE = API_CONFIG.TRANSACTION.baseUrl

export async function apiGetFraudReviewStats(): Promise<FraudReviewStats> {
  const resp = await fetch(`${BASE}/api/transactions/fraud-review/stats`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseEnvelope<FraudReviewStats>(resp)
}

export async function apiGetFraudReviewRecent(limit: number = 5): Promise<FraudTransaction[]> {
  const resp = await fetch(`${BASE}/api/transactions/fraud-review?limit=${encodeURIComponent(String(limit))}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseEnvelope<FraudTransaction[]>(resp)
}

export async function apiGetFraudReviewQueue(params: {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'ASC' | 'DESC'
}): Promise<FraudReviewListResponse> {
  const qs = new URLSearchParams()
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.sortBy) qs.set('sortBy', params.sortBy)
  if (params.order) qs.set('order', params.order)

  const resp = await fetch(`${BASE}/api/transactions/fraud-review${qs.toString() ? `?${qs.toString()}` : ''}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseEnvelope<FraudReviewListResponse>(resp)
}

export async function apiGetFraudReviewHistory(params: {
  page?: number
  limit?: number
  status?: string
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  signalType?: string
}): Promise<FraudReviewListResponse> {
  const qs = new URLSearchParams()
  if (params.page !== undefined) qs.set('page', String(params.page))
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.status) qs.set('status', params.status)
  if (params.startDate) qs.set('startDate', params.startDate)
  if (params.endDate) qs.set('endDate', params.endDate)
  if (params.minAmount !== undefined) qs.set('minAmount', String(params.minAmount))
  if (params.maxAmount !== undefined) qs.set('maxAmount', String(params.maxAmount))
  if (params.signalType) qs.set('signalType', params.signalType)

  const resp = await fetch(`${BASE}/api/transactions/fraud-review/history${qs.toString() ? `?${qs.toString()}` : ''}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseEnvelope<FraudReviewListResponse>(resp)
}

export async function apiGetFraudTransactionById(transactionId: string): Promise<FraudTransaction> {
  const resp = await fetch(`${BASE}/api/transactions/${encodeURIComponent(transactionId)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseEnvelope<FraudTransaction>(resp)
}

export async function apiApproveFraudTransfer(transactionId: string, notes?: string): Promise<FraudTransaction> {
  const payload = { fraudReviewNotes: (notes ?? '').trim() || undefined }
  const resp = await fetch(`${BASE}/api/transactions/fraud-review/${encodeURIComponent(transactionId)}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return parseEnvelope<FraudTransaction>(resp)
}

export async function apiRejectFraudTransfer(transactionId: string, notes: string): Promise<FraudTransaction> {
  const payload = { fraudReviewNotes: String(notes ?? '').trim() }
  const resp = await fetch(`${BASE}/api/transactions/fraud-review/${encodeURIComponent(transactionId)}/reject`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return parseEnvelope<FraudTransaction>(resp)
}


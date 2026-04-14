import { API_CONFIG } from '@/lib/config/api'
import { getToken } from '@/lib/auth'

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
  if (typeof parsed === 'object' && parsed && 'data' in parsed) return (parsed as ApiEnvelope<T>).data
  return parsed as T
}

const BASE = API_CONFIG.TRANSACTION.baseUrl

export type FraudConfigEffective = Record<string, any>

export async function apiGetFraudConfigEffective(): Promise<FraudConfigEffective> {
  const resp = await fetch(`${BASE}/admin/fraud-config/effective`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseEnvelope<FraudConfigEffective>(resp)
}

export async function apiUpdateFraudConfig(key: string, value: any): Promise<FraudConfigEffective> {
  const resp = await fetch(`${BASE}/admin/fraud-config/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ value }),
  })
  return parseEnvelope<FraudConfigEffective>(resp)
}

export async function apiEvictCache(): Promise<{ message?: string } | void> {
  const resp = await fetch(`${BASE}/cache/evict`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  return parseEnvelope<{ message?: string } | void>(resp)
}


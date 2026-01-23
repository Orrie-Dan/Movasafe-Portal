// Analytics API functions

import { getToken } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    // @ts-expect-error - HeadersInit doesn't support bracket notation for Authorization header
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export interface DashboardMetrics {
  activeUsers: {
    daily: number
    weekly: number
    monthly: number
    change: number
  }
  newUsers: {
    count: number
    change: number
  }
  transactions: {
    count: number
    volume: number
    change: number
  }
  systemHealth: {
    uptime: number
    availability: number
    apiResponseTime: number
    errorRate: number
  }
  notifications: {
    sent: number
    delivered: number
    deliveryRate: number
  }
}

export async function apiGetDashboardMetrics(params?: {
  startDate?: string
  endDate?: string
}): Promise<DashboardMetrics> {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }
  const queryString = queryParams.toString()
  return apiRequest<DashboardMetrics>(`/admin/analytics/dashboard${queryString ? `?${queryString}` : ''}`)
}

export interface UserActivityStats {
  logins: number
  activeUsers: number
  newRegistrations: number
  byHour: Array<{ hour: number; count: number }>
  byDay: Array<{ day: string; count: number }>
}

export async function apiGetUserActivityStats(params?: {
  startDate?: string
  endDate?: string
}): Promise<UserActivityStats> {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }
  const queryString = queryParams.toString()
  return apiRequest<UserActivityStats>(`/admin/analytics/user-activity${queryString ? `?${queryString}` : ''}`)
}

export interface TransactionStats {
  total: number
  volume: number
  average: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  trends: Array<{ date: string; count: number; volume: number }>
}

export async function apiGetTransactionStats(params?: {
  startDate?: string
  endDate?: string
}): Promise<TransactionStats> {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }
  const queryString = queryParams.toString()
  return apiRequest<TransactionStats>(`/admin/analytics/transactions${queryString ? `?${queryString}` : ''}`)
}

export interface SystemHealthMetrics {
  uptime: number
  availability: number
  apiResponseTime: {
    p50: number
    p95: number
    p99: number
  }
  errorRate: number
  errorCount: number
  requestCount: number
}

export async function apiGetSystemHealth(): Promise<SystemHealthMetrics> {
  return apiRequest<SystemHealthMetrics>('/admin/analytics/system-health')
}


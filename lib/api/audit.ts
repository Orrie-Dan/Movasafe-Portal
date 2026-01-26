// Audit log API functions

import { getToken } from './auth'
import type {
  AuditLog,
  AuditLogFilters,
  AuditLogListResponse,
  AuditLogStats,
  ComplianceReport,
} from '@/lib/types/audit'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
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

export async function apiGetAuditLogs(params?: AuditLogFilters): Promise<AuditLogListResponse> {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })
  }
  const queryString = queryParams.toString()
  return apiRequest<AuditLogListResponse>(`/admin/audit${queryString ? `?${queryString}` : ''}`)
}

export async function apiGetAuditLog(logId: string): Promise<{ log: AuditLog }> {
  return apiRequest<{ log: AuditLog }>(`/admin/audit/${logId}`)
}

export async function apiGetAuditStats(params?: { startDate?: string; endDate?: string }): Promise<AuditLogStats> {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }
  const queryString = queryParams.toString()
  return apiRequest<AuditLogStats>(`/admin/audit/stats${queryString ? `?${queryString}` : ''}`)
}

export async function apiExportAuditLogs(params?: AuditLogFilters): Promise<Blob> {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })
  }
  const queryString = queryParams.toString()
  
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/admin/audit/export${queryString ? `?${queryString}` : ''}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.blob()
}

export async function apiGenerateComplianceReport(
  type: 'gdpr' | 'audit' | 'security' | 'data_retention',
  params: { startDate: string; endDate: string }
): Promise<ComplianceReport> {
  return apiRequest<ComplianceReport>('/admin/audit/compliance-report', {
    method: 'POST',
    body: JSON.stringify({ type, ...params }),
  })
}


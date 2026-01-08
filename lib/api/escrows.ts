// Escrow API functions

import { API_CONFIG } from '@/lib/config/api'
import type { EscrowTransaction, CreateEscrowDTO, EscrowResponse, EscrowFilters } from '@/lib/types/escrows'

const ESCROW_BASE = API_CONFIG.ESCROW.baseUrl

// Helper function to get auth token
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// API request helper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${ESCROW_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const responseText = await response.text()
    let errorMessage = `Request failed with status ${response.status}`
    
    try {
      const errorData = JSON.parse(responseText)
      if (errorData.data && typeof errorData.data === 'object') {
        const errorFields = Object.keys(errorData.data)
        if (errorFields.length > 0) {
          errorMessage = errorFields.map(field => 
            `${field}: ${errorData.data[field]}`
          ).join(', ')
        } else {
          errorMessage = errorData.message || errorData.data?.message || errorMessage
        }
      } else {
        errorMessage = errorData.message || errorData.error || errorMessage
      }
    } catch {
      errorMessage = responseText || errorMessage
    }
    
    throw new Error(errorMessage)
  }

  const data = await response.json()
  if (data.data !== undefined) {
    return data.data as T
  }
  return data as T
}

/**
 * Create escrow
 */
export async function apiCreateEscrow(data: CreateEscrowDTO): Promise<EscrowResponse> {
  return apiRequest<EscrowResponse>(API_CONFIG.ESCROW.endpoints.create, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Get escrows (user's escrows or all for admin)
 */
export async function apiGetEscrows(filters?: EscrowFilters): Promise<EscrowTransaction[]> {
  const queryParams = new URLSearchParams()
  
  if (filters?.clientId) queryParams.append('clientId', filters.clientId)
  if (filters?.vendorId) queryParams.append('vendorId', filters.vendorId)
  if (filters?.status) queryParams.append('status', filters.status)
  if (filters?.startDate) queryParams.append('startDate', filters.startDate)
  if (filters?.endDate) queryParams.append('endDate', filters.endDate)
  if (filters?.limit) queryParams.append('limit', filters.limit.toString())
  if (filters?.offset) queryParams.append('offset', filters.offset.toString())

  const queryString = queryParams.toString()
  const endpoint = `${API_CONFIG.ESCROW.endpoints.list}${queryString ? `?${queryString}` : ''}`
  
  return apiRequest<EscrowTransaction[]>(endpoint, {
    method: 'GET',
  })
}

/**
 * Get escrow by ID
 */
export async function apiGetEscrowById(escrowId: string): Promise<EscrowTransaction> {
  return apiRequest<EscrowTransaction>(`${API_CONFIG.ESCROW.endpoints.byId}/${escrowId}`, {
    method: 'GET',
  })
}

/**
 * Approve escrow
 */
export async function apiApproveEscrow(escrowId: string): Promise<EscrowResponse> {
  return apiRequest<EscrowResponse>(`${API_CONFIG.ESCROW.endpoints.approve}/${escrowId}`, {
    method: 'POST',
  })
}

/**
 * Release escrow (admin only)
 */
export async function apiReleaseEscrow(escrowId: string): Promise<EscrowResponse> {
  return apiRequest<EscrowResponse>(`${API_CONFIG.ESCROW.endpoints.release}/${escrowId}`, {
    method: 'POST',
  })
}

/**
 * Refund escrow (admin only)
 */
export async function apiRefundEscrow(escrowId: string): Promise<EscrowResponse> {
  return apiRequest<EscrowResponse>(`${API_CONFIG.ESCROW.endpoints.refund}/${escrowId}`, {
    method: 'POST',
  })
}







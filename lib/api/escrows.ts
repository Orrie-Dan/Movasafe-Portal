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
    // @ts-expect-error - HeadersInit doesn't support bracket notation for Authorization header
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
 * Response is paginated with structure: { content: [...], pageable: {...}, totalPages: X, ... }
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
  
  const raw = await apiRequest<any>(endpoint, {
    method: 'GET',
  })

  // Handle paginated response structure: { content: [...], pageable: {...}, ... }
  if (raw?.content && Array.isArray(raw.content)) {
    return raw.content as EscrowTransaction[]
  }

  // Handle flat array response
  if (Array.isArray(raw)) {
    return raw as EscrowTransaction[]
  }

  return []
}

/**
 * Get all escrows (admin endpoint)
 */
export async function apiGetAllEscrows(filters?: EscrowFilters): Promise<EscrowTransaction[]> {
  const queryParams = new URLSearchParams()
  
  if (filters?.clientId) queryParams.append('clientId', filters.clientId)
  if (filters?.vendorId) queryParams.append('vendorId', filters.vendorId)
  if (filters?.status) queryParams.append('status', filters.status)
  if (filters?.startDate) queryParams.append('startDate', filters.startDate)
  if (filters?.endDate) queryParams.append('endDate', filters.endDate)
  if (filters?.limit) queryParams.append('limit', filters.limit.toString())
  if (filters?.offset) queryParams.append('offset', filters.offset.toString())

  const queryString = queryParams.toString()
  const endpoint = `${API_CONFIG.ESCROW.endpoints.allEscrows}${queryString ? `?${queryString}` : ''}`
  
  const raw = await apiRequest<any>(endpoint, {
    method: 'GET',
  })

  // Handle paginated response structure: { content: [...], pageable: {...}, ... }
  if (raw?.content && Array.isArray(raw.content)) {
    return raw.content as EscrowTransaction[]
  }

  // Handle flat array response
  if (Array.isArray(raw)) {
    return raw as EscrowTransaction[]
  }

  return []
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

/**
 * Admin: Get all escrows by status (DISPUTED, REFUNDED, ACTIVE)
 */
export async function apiGetEscrowsByStatus(status: 'DISPUTED' | 'REFUNDED' | 'ACTIVE'): Promise<EscrowTransaction[]> {
  const queryParams = new URLSearchParams()
  queryParams.append('status', status)
  
  const queryString = queryParams.toString()
  const endpoint = `/api/admin/escrows${queryString ? `?${queryString}` : ''}`
  
  const raw = await apiRequest<any>(endpoint, {
    method: 'GET',
  })

  // Handle paginated response structure: { content: [...], pageable: {...}, ... }
  if (raw?.content && Array.isArray(raw.content)) {
    return raw.content as EscrowTransaction[]
  }

  // Handle flat array response
  if (Array.isArray(raw)) {
    return raw as EscrowTransaction[]
  }

  return []
}

/**
 * Admin: Resolve a dispute
 * Action can be 'RELEASE' (vendor wins) or 'REFUND' (client wins)
 */
export async function apiResolveDispute(
  escrowId: string,
  action: 'RELEASE' | 'REFUND',
  notes: string
): Promise<EscrowResponse> {
  return apiRequest<EscrowResponse>(`/api/admin/escrows/resolve-dispute/${escrowId}`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      notes,
    }),
  })
}

/**
 * Admin: Process direct refund
 */
export async function apiProcessRefund(escrowId: string): Promise<EscrowResponse> {
  return apiRequest<EscrowResponse>(`/api/admin/escrows/refund/${escrowId}`, {
    method: 'POST',
  })
}

/**
 * Admin: Get audit log for refund and dispute resolutions
 */
export async function apiGetEscrowAuditLog(): Promise<any[]> {
  const raw = await apiRequest<any>('/api/admin/escrows/audit-log', {
    method: 'GET',
  })

  if (Array.isArray(raw)) {
    return raw
  }

  if (raw?.content && Array.isArray(raw.content)) {
    return raw.content
  }

  return []
}

/**
 * Admin: Get all disputed escrows
 * Endpoint: GET /api/admin/escrows/disputed
 */
export async function apiGetDisputedEscrows(): Promise<EscrowTransaction[]> {
  const raw = await apiRequest<any>('/api/admin/escrows/disputed', {
    method: 'GET',
  })

  // Handle paginated response structure: { content: [...], pageable: {...}, ... }
  if (raw?.content && Array.isArray(raw.content)) {
    return raw.content as EscrowTransaction[]
  }

  // Handle flat array response
  if (Array.isArray(raw)) {
    return raw as EscrowTransaction[]
  }

  return []
}







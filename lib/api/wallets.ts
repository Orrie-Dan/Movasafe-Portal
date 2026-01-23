// Wallet API functions

import { API_CONFIG } from '@/lib/config/api'
import type { Wallet, CreateWalletAccountDTO, WalletResponse, WalletFilters } from '@/lib/types/wallets'

const BASE_URL = API_CONFIG.TRANSACTION.baseUrl

// Helper function to get auth token
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// API request helper with error handling - direct calls to backend
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Make direct call to backend
  const url = `${BASE_URL}${endpoint}`
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Wallets API] Request:', { url, method: options.method || 'GET' })
  }

  const response = await fetch(url, {
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
 * Get wallet by ID
 */
export async function apiGetWallet(walletId: string): Promise<Wallet> {
  return apiRequest<Wallet>(`${API_CONFIG.TRANSACTION.endpoints.walletById}/${walletId}`, {
    method: 'GET',
  })
}

/**
 * Get wallet by user ID
 */
export async function apiGetUserWallet(userId: string): Promise<Wallet> {
  return apiRequest<Wallet>(`${API_CONFIG.TRANSACTION.endpoints.walletByUser}/${userId}`, {
    method: 'GET',
  })
}

/**
 * Get all wallets (admin only)
 * Uses /api/transactions/wallets/all endpoint
 * Response is paginated with structure: { content: [...], pageable: {...}, totalPages: X, ... }
 */
export async function apiGetAllWallets(filters?: WalletFilters): Promise<Wallet[]> {
  const queryParams = new URLSearchParams()
  
  if (filters?.userId) queryParams.append('userId', filters.userId)
  if (filters?.minBalance) queryParams.append('minBalance', filters.minBalance.toString())
  if (filters?.maxBalance) queryParams.append('maxBalance', filters.maxBalance.toString())
  if (filters?.page !== undefined) queryParams.append('page', filters.page.toString())
  if (filters?.limit) queryParams.append('limit', filters.limit.toString())
  if (filters?.offset) queryParams.append('offset', filters.offset.toString())

  const queryString = queryParams.toString()
  const endpoint = `${API_CONFIG.TRANSACTION.endpoints.allWallets}${queryString ? `?${queryString}` : ''}`
  
  const raw = await apiRequest<any>(endpoint, {
    method: 'GET',
  })

  // Handle paginated response structure: { content: [...], pageable: {...}, ... }
  if (raw?.content && Array.isArray(raw.content)) {
    return raw.content as Wallet[]
  }

  // Handle flat array response
  if (Array.isArray(raw)) {
    return raw as Wallet[]
  }

  // Handle nested data.content structure
  if (raw?.data?.content && Array.isArray(raw.data.content)) {
    return raw.data.content as Wallet[]
  }

  // Handle nested data array
  if (Array.isArray(raw?.data)) {
    return raw.data as Wallet[]
  }

  return []
}

/**
 * Create wallet account
 */
export async function apiCreateWalletAccount(data: CreateWalletAccountDTO): Promise<WalletResponse> {
  return apiRequest<WalletResponse>(API_CONFIG.TRANSACTION.endpoints.createWalletAccount, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

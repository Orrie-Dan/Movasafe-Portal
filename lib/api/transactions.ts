// Transaction API functions

import { API_CONFIG } from '@/lib/config/api'
import type { Transaction, TransactionFilters, CreateTransferDTO, CreateEscrowPaymentDTO, TransactionResponse } from '@/lib/types/transactions'

const TRANSACTION_BASE = API_CONFIG.TRANSACTION.baseUrl

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

  const response = await fetch(`${TRANSACTION_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const responseText = await response.text()
    let errorMessage = `Request failed with status ${response.status}`
    
    try {
      const errorData = JSON.parse(responseText)
      // Handle ApiResponse format
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
  // Handle ApiResponse format
  if (data.data !== undefined) {
    return data.data as T
  }
  return data as T
}

/**
 * Get all transactions (admin only)
 */
export async function apiGetAllTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
  const queryParams = new URLSearchParams()
  
  if (filters?.userId) queryParams.append('userId', filters.userId)
  if (filters?.transactionType) queryParams.append('transactionType', filters.transactionType)
  if (filters?.status) queryParams.append('status', filters.status)
  if (filters?.description) queryParams.append('description', filters.description)
  if (filters?.startDate) queryParams.append('startDate', filters.startDate)
  if (filters?.endDate) queryParams.append('endDate', filters.endDate)
  if (filters?.limit) queryParams.append('limit', filters.limit.toString())
  if (filters?.offset) queryParams.append('offset', filters.offset.toString())

  const queryString = queryParams.toString()
  const endpoint = `${API_CONFIG.TRANSACTION.endpoints.allTransactions}${queryString ? `?${queryString}` : ''}`
  
  return apiRequest<Transaction[]>(endpoint, {
    method: 'GET',
  })
}

/**
 * Get transactions by user ID
 */
export async function apiGetUserTransactions(userId: string, filters?: Omit<TransactionFilters, 'userId'>): Promise<Transaction[]> {
  const queryParams = new URLSearchParams()
  
  if (filters?.transactionType) queryParams.append('transactionType', filters.transactionType)
  if (filters?.status) queryParams.append('status', filters.status)
  if (filters?.description) queryParams.append('description', filters.description)
  if (filters?.startDate) queryParams.append('startDate', filters.startDate)
  if (filters?.endDate) queryParams.append('endDate', filters.endDate)
  if (filters?.limit) queryParams.append('limit', filters.limit.toString())
  if (filters?.offset) queryParams.append('offset', filters.offset.toString())

  const queryString = queryParams.toString()
  const endpoint = `${API_CONFIG.TRANSACTION.endpoints.transactionByUser}/${userId}${queryString ? `?${queryString}` : ''}`
  
  return apiRequest<Transaction[]>(endpoint, {
    method: 'GET',
  })
}

/**
 * Get transaction by ID
 */
export async function apiGetTransactionById(transactionId: string): Promise<Transaction> {
  return apiRequest<Transaction>(`${API_CONFIG.TRANSACTION.endpoints.transactionById}/${transactionId}`, {
    method: 'GET',
  })
}

/**
 * Create wallet-to-wallet transfer
 */
export async function apiCreateTransfer(data: CreateTransferDTO): Promise<TransactionResponse> {
  return apiRequest<TransactionResponse>(API_CONFIG.TRANSACTION.endpoints.transfer, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Create escrow payment to vendor
 */
export async function apiCreateEscrowPayment(data: CreateEscrowPaymentDTO): Promise<TransactionResponse> {
  return apiRequest<TransactionResponse>(API_CONFIG.TRANSACTION.endpoints.escrowPayVendor, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}







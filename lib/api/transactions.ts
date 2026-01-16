// Transaction API functions

import { TRANSACTION_BASE } from '@/lib/api/config'
import { API_CONFIG } from '@/lib/config/api'
import { getToken } from '@/lib/auth' // Use centralized auth token retrieval
import type { TransactionFilters, CreateTransferDTO, CreateEscrowPaymentDTO, TransactionResponse } from '@/lib/types/transactions'

// Transaction type matching API response
export interface Transaction {
  id: string
  userId: string
  userName?: string | null
  userPhoneNumber?: string | null
  userNationalId?: string | null
  amount: number
  transactionType: 'CASH_IN' | 'CASH_OUT'
  status: string
  description: string
  internalReference: string
  createdAt: string
  updatedAt: string
  currency?: string // Currency code (e.g., 'RWF') - can be derived from toDetails or fromDetails
  fromDetails?: {
    accountName?: string | null
    accountSource?: string | null
    accountNumber?: string | null
    currency?: string | null
  } | null
  toDetails?: {
    accountName?: string | null
    accountSource?: string | null
    accountNumber?: string | null
    currency?: string | null
  } | null
}

// Paginated transaction response type
export interface PaginatedTransactionResponse {
  success: boolean
  message: string | null
  data: {
    content: Transaction[]
    totalElements?: number
    totalPages?: number
    size?: number
    number?: number
  }
}

// API request helper with error handling
// Note: Uses getToken() from @/lib/auth for centralized token management
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  // Merge any existing headers from options
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value
      })
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value
      })
    } else {
      Object.assign(headers, options.headers)
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }


  try {
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Transactions API] apiRequest:', {
        url: endpoint,
        endpoint,
        hasToken: !!token,
        method: options.method || 'GET',
        usingProxy: false,
      })
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    })

    if (!response.ok) {
      // Handle 401/403 - redirect to login
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          window.location.href = '/login'
        }
        throw new Error('Unauthorized. Please sign in again.')
      }

      const responseText = await response.text()
      let errorMessage = `Bad request: Request failed with status ${response.status}`
      
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
  } catch (error) {
    // Handle network-level failures (ERR_NAME_NOT_RESOLVED, CORS, etc.)
    if (error instanceof TypeError && (
      error.message.includes('fetch') || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('ERR_NAME_NOT_RESOLVED')
    )) {
      const networkError = new Error(
        `Network error: Failed to reach proxy endpoint. ` +
        `This may indicate the server is down, blocked by CORS, or the URL is incorrect. ` +
        `Requested URL: ${endpoint}`
      )
      console.error('[Transactions API] Network error:', {
        url: endpoint,
        endpoint,
        error: error.message,
        errorType: 'NetworkError',
        usingProxy: true,
      })
      throw networkError
    }
    // Re-throw other errors (including our custom errors like "Unauthorized")
    throw error
  }
}

/**
 * Get all transactions (admin only)
 * Uses GET /api/transactions/all with comprehensive query parameters
 */
export async function apiGetAllTransactions(filters?: TransactionFilters): Promise<PaginatedTransactionResponse> {
  const queryParams = new URLSearchParams()
  
  // Pagination
  if (filters?.page !== undefined) queryParams.append('page', filters.page.toString())
  if (filters?.limit !== undefined) queryParams.append('limit', filters.limit.toString())
  
  // Sorting
  if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy)
  if (filters?.order) queryParams.append('order', filters.order)
  
  // User filters
  if (filters?.userName) queryParams.append('userName', filters.userName)
  if (filters?.userPhoneNumber) queryParams.append('userPhoneNumber', filters.userPhoneNumber)
  if (filters?.userNationalId) queryParams.append('userNationalId', filters.userNationalId)
  
  // Transaction filters
  if (filters?.transactionType) queryParams.append('transactionType', filters.transactionType)
  if (filters?.description) queryParams.append('description', filters.description)
  if (filters?.descriptions && filters.descriptions.length > 0) {
    filters.descriptions.forEach(desc => queryParams.append('descriptions', desc))
  }
  if (filters?.status) queryParams.append('status', filters.status)
  if (filters?.transactionReference) queryParams.append('transactionReference', filters.transactionReference)
  
  // Amount filters
  if (filters?.minAmount !== undefined) queryParams.append('minAmount', filters.minAmount.toString())
  if (filters?.maxAmount !== undefined) queryParams.append('maxAmount', filters.maxAmount.toString())
  
  // Date filters
  // if (filters?.startDate) queryParams.append('startDate', filters.startDate)
  // if (filters?.endDate) queryParams.append('endDate', filters.endDate)
  
  // Legacy support
  if (filters?.userId) queryParams.append('userId', filters.userId)
  if (filters?.offset !== undefined) queryParams.append('offset', filters.offset.toString())

  const params = queryParams
  // Use Next.js API proxy route to avoid mixed-content issues (HTTPS frontend -> HTTP backend)
  const url = `${API_CONFIG.TRANSACTION.baseUrl}${API_CONFIG.TRANSACTION.endpoints.allTransactions}?${params.toString()}`
  
  const token = getToken()
  if (!token) {
    // Redirect to login if no token
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('No authentication token found')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  try {
    // Log the final URL and token presence for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Transactions API] Request details:', {
        url,
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
        usingProxy: true,
      })
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      // Handle 401/403 - redirect to login
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          // Clear token and redirect
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          window.location.href = '/login'
        }
        throw new Error('Unauthorized. Please sign in again.')
      }

      const responseText = await response.text()
      let errorMessage = `Bad request: Request failed with status ${response.status}`
      
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage = responseText || errorMessage
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    // Ensure user fields are properly mapped from API response
    // The API returns userName, userPhoneNumber, userNationalId directly in each transaction
    if (data?.data?.content && Array.isArray(data.data.content)) {
      // Log first transaction to verify fields are present (development only)
      if (process.env.NODE_ENV === 'development' && data.data.content.length > 0) {
        const firstTx = data.data.content[0]
        console.log('[Transactions API] Sample transaction fields:', {
          hasUserName: 'userName' in firstTx,
          hasUserPhoneNumber: 'userPhoneNumber' in firstTx,
          hasUserNationalId: 'userNationalId' in firstTx,
          userName: firstTx.userName,
          userPhoneNumber: firstTx.userPhoneNumber,
          userNationalId: firstTx.userNationalId,
        })
      }
    }
    
    return data as PaginatedTransactionResponse
  } catch (error) {
    // Handle network-level failures (ERR_NAME_NOT_RESOLVED, CORS, etc.)
    if (error instanceof TypeError && (
      error.message.includes('fetch') || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('ERR_NAME_NOT_RESOLVED') ||
      error.message.includes('Network request failed')
    )) {
      // Provide more detailed error information
      const isCorsError = error.message.includes('CORS') || error.message.includes('Access-Control')
      const isHttpsError = error.message.includes('Mixed Content') || error.message.includes('HTTPS')
      const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : 'server-side'
      
      let errorMessage = `Network error: Failed to reach ${TRANSACTION_BASE}. `
      
      if (isCorsError) {
        errorMessage += `CORS error detected. Ensure the backend CORS configuration allows requests from ${frontendOrigin}. `
      } else if (isHttpsError) {
        errorMessage += `Mixed content error. The app is served over HTTPS but trying to call HTTP. Consider using HTTPS for the backend or proxying through Next.js API routes. `
      } else {
        errorMessage += `This may indicate: (1) The server is down or unreachable, (2) CORS is blocking the request, (3) The URL is incorrect, or (4) Network connectivity issues. `
      }
      
      errorMessage += `Requested URL: ${url}`
      
      const networkError = new Error(errorMessage)
      console.error('[Transactions API] Network error:', {
        url,
        baseUrl: TRANSACTION_BASE,
        error: error.message,
        errorType: 'NetworkError',
        isCorsError,
        isHttpsError,
        frontendOrigin,
      })
      throw networkError
    }
    // Re-throw other errors (including our custom errors like "Unauthorized")
    throw error
  }
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







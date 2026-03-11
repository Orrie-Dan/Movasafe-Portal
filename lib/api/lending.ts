// Lending (Loan) Service API functions

import { getToken } from './auth'
import { API_CONFIG } from '@/lib/config/api'
import type {
  LoanResponse,
  RepaymentHistoryItem,
  SpringPage,
  AdminLoanListParams,
  ApproveLoanRequest,
  RejectLoanRequest,
} from '@/lib/types/lending'

const LENDING_BASE = API_CONFIG.LENDING.baseUrl

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
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${LENDING_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const responseText = await response.text()
    let errorMessage = `Request failed with status ${response.status}`
    try {
      const errorData = JSON.parse(responseText)
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      errorMessage = responseText || errorMessage
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return data as T
}

/**
 * Admin: List all loans (paginated)
 */
export async function apiGetAdminLoans(
  params?: AdminLoanListParams
): Promise<SpringPage<LoanResponse>> {
  const searchParams = new URLSearchParams()
  if (params?.page !== undefined) searchParams.append('page', String(params.page))
  if (params?.limit !== undefined) searchParams.append('size', String(params.limit))
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy)
  if (params?.order) searchParams.append('order', params.order)
  if (params?.status) searchParams.append('status', params.status)
  if (params?.userId) searchParams.append('userId', params.userId)

  const query = searchParams.toString()
  const endpoint = `${API_CONFIG.LENDING.endpoints.adminLoans}${query ? `?${query}` : ''}`

  return apiRequest<SpringPage<LoanResponse>>(endpoint, { method: 'GET' })
}

/**
 * Admin: Get loan by ID
 */
export async function apiGetAdminLoanById(loanId: string): Promise<LoanResponse> {
  return apiRequest<LoanResponse>(
    `${API_CONFIG.LENDING.endpoints.adminLoanById}/${loanId}`,
    { method: 'GET' }
  )
}

/**
 * Admin: Approve loan
 */
export async function apiApproveLoan(
  loanId: string,
  body?: ApproveLoanRequest
): Promise<LoanResponse> {
  return apiRequest<LoanResponse>(
    `${API_CONFIG.LENDING.endpoints.adminLoanApprove}/${loanId}/approve`,
    {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }
  )
}

/**
 * Admin: Reject loan
 */
export async function apiRejectLoan(
  loanId: string,
  body?: RejectLoanRequest
): Promise<LoanResponse> {
  return apiRequest<LoanResponse>(
    `${API_CONFIG.LENDING.endpoints.adminLoanReject}/${loanId}/reject`,
    {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }
  )
}

/**
 * Admin: Get repayment history for a loan
 */
export async function apiGetAdminRepaymentHistory(
  loanId: string
): Promise<RepaymentHistoryItem[]> {
  return apiRequest<RepaymentHistoryItem[]>(
    `${API_CONFIG.LENDING.endpoints.adminRepaymentHistory}/${loanId}/repayment-history`,
    { method: 'GET' }
  )
}

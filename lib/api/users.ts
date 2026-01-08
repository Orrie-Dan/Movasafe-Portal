// User management API functions

import { getToken } from './auth'
import { API_CONFIG } from '@/lib/config/api'
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserListParams,
  UserListResponse,
  UserActivityTimeline,
  BulkUserOperation,
  UserImportResult,
} from '@/lib/types/user'
import type { UpdateUserRoleDTO, ChangeCurrentPasswordDTO, ResetPasswordDTO, ForgotPasswordDTO } from '@/lib/types/auth'

const AUTH_BASE = API_CONFIG.AUTH.baseUrl
const endpoints = API_CONFIG.AUTH.endpoints.users

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${AUTH_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // Get the actual error response
    const responseText = await response.text()
    let errorData: any
    try {
      errorData = JSON.parse(responseText)
    } catch {
      errorData = { message: responseText || `HTTP error! status: ${response.status}` }
    }
    
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    
    // Extract error message from ApiResponse format: { success: false, message: "...", data: {...} }
    const errorMessage = errorData.message || 
                        errorData.error || 
                        (errorData.data && typeof errorData.data === 'object' 
                          ? Object.values(errorData.data).join(', ')
                          : errorData.data) ||
                        `HTTP error! status: ${response.status}`
    
    throw new Error(errorMessage)
  }

  return response.json()
}

export async function apiGetUsers(params?: UserListParams): Promise<UserListResponse> {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })
  }
  const queryString = queryParams.toString()
  const response = await apiRequest<any>(`${endpoints.all}${queryString ? `?${queryString}` : ''}`)
  
  // Adjust based on your ApiResponse structure
  return {
    data: response.data || response || [],
    pagination: {
      page: params?.page || 1,
      limit: params?.limit || 25,
      total: response.total || response.data?.length || 0,
      totalPages: Math.ceil((response.total || response.data?.length || 0) / (params?.limit || 25)),
    }
  }
}

export async function apiGetUser(userId: string): Promise<{ user: User }> {
  const response = await apiRequest<any>(`${endpoints.byId}/${userId}`)
  return {
    user: response.data || response
  }
}

export async function apiCreateUser(data: CreateUserRequest): Promise<{ user: User }> {
  // Note: Your API might not have a direct create user endpoint in the auth service
  // You might need to use the register endpoint or a different service
  // Adjust this based on your actual API
  const response = await apiRequest<any>(endpoints.all, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return {
    user: response.data || response
  }
}

export async function apiUpdateUser(userId: string, data: UpdateUserRequest): Promise<{ user: User }> {
  const response = await apiRequest<any>(`${endpoints.update}/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return {
    user: response.data || response
  }
}

export async function apiDeleteUser(phoneNumber: string): Promise<{ success: boolean }> {
  // Note: Your API uses phoneNumber for delete, not userId
  await apiRequest(`${endpoints.delete}/${phoneNumber}`, {
    method: 'DELETE',
  })
  return { success: true }
}

export async function apiSuspendUser(userId: string, reason?: string): Promise<{ success: boolean }> {
  // Note: Your API might not have a suspend endpoint - adjust based on your actual API
  // This might need to be done via update user with status field
  const response = await apiRequest<any>(`${endpoints.update}/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'suspended', reason }),
  })
  return { success: true }
}

export async function apiActivateUser(userId: string): Promise<{ success: boolean }> {
  // Note: Your API might not have an activate endpoint - adjust based on your actual API
  // This might need to be done via update user with status field
  const response = await apiRequest<any>(`${endpoints.update}/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'active' }),
  })
  return { success: true }
}

export async function apiResetUserPassword(phoneNumber: string, otp: string, newPassword: string): Promise<{ success: boolean; temporaryPassword?: string }> {
  const response = await apiRequest<any>(endpoints.resetPassword, {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, otp, newPassword }),
  })
  return { 
    success: true,
    temporaryPassword: response.data?.temporaryPassword
  }
}

// Additional user management functions based on your Swagger

export async function apiGetUserByPhone(phoneNumber: string): Promise<{ user: User }> {
  const response = await apiRequest<any>(`${endpoints.byPhone}/${phoneNumber}`)
  return {
    user: response.data || response
  }
}

export async function apiGetTotalUsers(): Promise<{ count: number }> {
  const response = await apiRequest<any>(endpoints.totalUsers)
  return {
    count: response.data?.total || response.total || 0
  }
}

export async function apiGetPortalClients(params?: any): Promise<UserListResponse> {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })
  }
  const queryString = queryParams.toString()
  const response = await apiRequest<any>(`${endpoints.portalClients}${queryString ? `?${queryString}` : ''}`)
  
  return {
    data: response.data || response || [],
    pagination: {
      page: 1,
      limit: 100,
      total: response.data?.length || 0,
      totalPages: 1,
    }
  }
}

export async function apiChangePassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean }> {
  await apiRequest(endpoints.changePassword, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return { success: true }
}

export async function apiChangeCurrentPassword(data: ChangeCurrentPasswordDTO): Promise<{ success: boolean }> {
  await apiRequest(endpoints.changeCurrentPassword, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return { success: true }
}

export async function apiForgotPassword(data: ForgotPasswordDTO): Promise<{ success: boolean }> {
  await apiRequest(endpoints.forgotPassword, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return { success: true }
}

export async function apiUpdateUserRole(userId: string, data: UpdateUserRoleDTO): Promise<{ success: boolean }> {
  await apiRequest(`${endpoints.updateUserRole}/${userId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return { success: true }
}

export async function apiGetUserApiKeys(userId: string): Promise<any> {
  return apiRequest(`${endpoints.getApiKeys}/${userId}/api-keys`)
}

export async function apiCreateUserApiKey(phoneNumber: string): Promise<any> {
  return apiRequest(`${endpoints.createApiKey}/${phoneNumber}`, {
    method: 'POST',
  })
}

export async function apiCheckUserExists(phoneNumber: string): Promise<{ exists: boolean }> {
  const response = await apiRequest<any>(`${endpoints.checkExists}/${phoneNumber}`)
  return {
    exists: response.data || response.exists || false
  }
}

export async function apiGetUserActivity(userId: string, params?: { limit?: number; offset?: number }): Promise<UserActivityTimeline> {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }
  const queryString = queryParams.toString()
  return apiRequest<UserActivityTimeline>(`/admin/users/${userId}/activity${queryString ? `?${queryString}` : ''}`)
}

export async function apiBulkUserOperation(operation: BulkUserOperation): Promise<{ success: boolean; affected: number }> {
  return apiRequest<{ success: boolean; affected: number }>('/admin/users/bulk', {
    method: 'POST',
    body: JSON.stringify(operation),
  })
}

export async function apiImportUsers(file: File): Promise<UserImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  
  const token = getToken()
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/admin/users/import`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export async function apiExportUsers(params?: UserListParams): Promise<Blob> {
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
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/admin/users/export${queryString ? `?${queryString}` : ''}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.blob()
}


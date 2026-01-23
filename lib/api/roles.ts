// Role and permission API functions

import { getToken } from './auth'
import { API_CONFIG } from '@/lib/config/api'
import type {
  Role,
  Permission,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleListParams,
  RoleListResponse,
  PermissionListResponse,
  AssignRoleRequest,
  RemoveRoleRequest,
} from '@/lib/types/user'
import type { RolePermissionDTO } from '@/lib/types/auth'

const AUTH_BASE = API_CONFIG.AUTH.baseUrl
const endpoints = API_CONFIG.AUTH.endpoints.roles

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

export async function apiGetRoles(params?: RoleListParams): Promise<RoleListResponse> {
  const response = await apiRequest<any>(endpoints.all)
  
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

export async function apiGetRole(roleId: string): Promise<{ role: Role }> {
  const response = await apiRequest<any>(`${endpoints.byId}/${roleId}`)
  return {
    role: response.data || response
  }
}

export async function apiCreateRole(data: CreateRoleRequest): Promise<{ role: Role }> {
  const response = await apiRequest<any>(endpoints.addNew, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return {
    role: response.data || response
  }
}

export async function apiUpdateRole(roleId: string, data: UpdateRoleRequest): Promise<{ role: Role }> {
  const response = await apiRequest<any>(`${endpoints.update}/${roleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return {
    role: response.data || response
  }
}

export async function apiDeleteRole(roleId: string): Promise<{ success: boolean }> {
  await apiRequest(`${endpoints.delete}/${roleId}`, {
    method: 'DELETE',
  })
  return { success: true }
}

export async function apiGetPermissions(): Promise<PermissionListResponse> {
  const response = await apiRequest<any>(API_CONFIG.AUTH.endpoints.permissions.all)
  return {
    data: response.data || response || [],
    categories: [] // Extract categories from response if available
  }
}

// Add Permissions to Role - Based on your Swagger: POST /api/auth/roles/add-permissions
export async function apiAddPermissionsToRole(data: RolePermissionDTO): Promise<{ success: boolean }> {
  await apiRequest(endpoints.addPermissions, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return { success: true }
}

// Remove Permissions from Role - Based on your Swagger: POST /api/auth/roles/remove-permissions
export async function apiRemovePermissionsFromRole(data: RolePermissionDTO): Promise<{ success: boolean }> {
  await apiRequest(endpoints.removePermissions, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return { success: true }
}

export async function apiAssignRoleToUser(data: AssignRoleRequest): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/admin/users/assign-role', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiRemoveRoleFromUser(data: RemoveRoleRequest): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/admin/users/remove-role', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}


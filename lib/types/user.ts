// User and role management types

import type { User, Role, Permission } from './auth'
export type { User, Role, Permission } from './auth'


export interface CreateUserRequest {
  email: string
  username?: string
  fullName: string
  password: string
  roleIds: string[]
  status?: 'active' | 'suspended' | 'inactive'
  emailVerified?: boolean
  profile?: Partial<User['profile']>
}

export interface UpdateUserRequest {
  email?: string
  username?: string
  fullName?: string
  roleIds?: string[]
  status?: 'active' | 'suspended' | 'locked' | 'inactive'
  profile?: Partial<User['profile']>
}

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  role?: string
  sort?: string
  order?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
}

export interface UserListResponse {
  data: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UserActivity {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  timestamp: string
}

export interface UserActivityTimeline {
  activities: UserActivity[]
  total: number
}

export interface BulkUserOperation {
  userIds: string[]
  operation: 'activate' | 'suspend' | 'delete' | 'assignRole' | 'removeRole'
  roleId?: string
}

export interface UserImportResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    email: string
    error: string
  }>
}

export interface CreateRoleRequest {
  name: string
  displayName: string
  description?: string
  permissionIds: string[]
  isSystem?: boolean
}

export interface UpdateRoleRequest {
  displayName?: string
  description?: string
  permissionIds?: string[]
}

export interface RoleListParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface RoleListResponse {
  data: Role[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PermissionListResponse {
  data: Permission[]
  categories: string[]
}

export interface AssignRoleRequest {
  userId: string
  roleIds: string[]
}

export interface RemoveRoleRequest {
  userId: string
  roleId: string
}


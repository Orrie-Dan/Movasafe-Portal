// Admin-only authentication functions
// This file handles ADMIN role validation and token management

import { API_CONFIG } from '@/lib/config/api'
import { getToken as getStoredToken, setToken as storeToken, removeToken as clearToken } from '@/lib/api/auth'

// TypeScript interfaces for authentication
export interface LoginRequest {
  emailOrPhoneNumber: string
  password: string
  mfaCode?: string
}

export interface Role {
  name: 'ADMIN' | 'USER' | string
  id?: string
  displayName?: string
  description?: string
  permissions?: string[]
  isSystem?: boolean
  createdAt?: string
  updatedAt?: string
}

const PRIVILEGED_PORTAL_ROLES = ['TRUST_ADMIN', 'SUPPORT_AGENT', 'PLATFORM_ADMIN'] as const

function normalizeRoleName(roleName?: string | null): string {
  return String(roleName || '').trim().toUpperCase()
}

function resolvePortalRoleName(rawRoleName?: string | null): 'TRUST_ADMIN' | 'SUPPORT_AGENT' | 'PLATFORM_ADMIN' | '' {
  const normalized = normalizeRoleName(rawRoleName)
  if (normalized.includes('TRUST_ADMIN')) return 'TRUST_ADMIN'
  if (normalized.includes('SUPPORT_AGENT')) return 'SUPPORT_AGENT'
  if (normalized.includes('PLATFORM_ADMIN')) return 'PLATFORM_ADMIN'
  return ''
}

function resolvePortalRole(roles: Role[]): string {
  const normalized = roles.map((r) => resolvePortalRoleName(r.name)).filter(Boolean)
  if (normalized.includes('TRUST_ADMIN')) return 'TRUST_ADMIN'
  if (normalized.includes('SUPPORT_AGENT')) return 'SUPPORT_AGENT'
  if (normalized.includes('PLATFORM_ADMIN')) return 'PLATFORM_ADMIN'
  return ''
}

export interface LoginResponse {
  jwtToken: string
  roles: Role[]
  user?: {
    id: string
    email?: string
    phoneNumber?: string
    fullName?: string
    username?: string
  }
}

const AUTH_BASE = API_CONFIG.AUTH.baseUrl
const SIGNIN_ENDPOINT = API_CONFIG.AUTH.endpoints.signin
const FORGOT_PASSWORD_ENDPOINT = API_CONFIG.AUTH.endpoints.users.forgotPassword

/**
 * Admin-only login function
 * Validates that the user has ADMIN role before allowing login
 * 
 * @param credentials - Login credentials (email/phone and password)
 * @returns Promise<LoginResponse> - JWT token and user roles
 * @throws Error if login fails or user is not an admin
 */
export async function adminLogin(credentials: LoginRequest): Promise<LoginResponse> {
  const loginData = {
    emailOrPhoneNumber: credentials.emailOrPhoneNumber.trim(),
    password: credentials.password,
    mfaCode: credentials.mfaCode?.trim() || undefined,
  }

  // Make login request
  const response = await fetch(`${AUTH_BASE}${SIGNIN_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(loginData),
  })

  // Handle different HTTP status codes
  if (!response.ok) {
    const responseText = await response.text()
    let errorData: { message?: string; error?: string; data?: unknown }
    
    try {
      errorData = JSON.parse(responseText)
    } catch {
      errorData = { message: responseText || `HTTP error! status: ${response.status}` }
    }

    // Handle specific error codes
    if (response.status === 401) {
      throw new Error('Invalid credentials. Please check your email/phone and password.')
    }

    if (response.status === 403) {
      throw new Error('Access denied. Admin privileges required.')
    }

    if (response.status === 500) {
      throw new Error('Server error. Please try again later.')
    }

    // Extract error message from response
    const errorMessage = 
      errorData.message || 
      errorData.error || 
      (errorData.data && typeof errorData.data === 'object' 
        ? Object.values(errorData.data).join(', ')
        : String(errorData.data)) ||
      `Login failed. Status: ${response.status}`

    throw new Error(errorMessage)
  }

  // Parse successful response
  const responseData = await response.json()
  
  // Extract token from response (check both direct and nested data structure)
  const token = responseData.jwtToken || responseData.data?.jwtToken
  
  if (!token) {
    throw new Error('Login successful but no token received from server')
  }

  // Extract roles from response
  const roles: Role[] = responseData.roles || responseData.data?.roles || []
  
  // Portal access is restricted to privileged roles.
  const hasAdminRole = roles.some((role) =>
    PRIVILEGED_PORTAL_ROLES.includes(
      resolvePortalRoleName(role.name) as (typeof PRIVILEGED_PORTAL_ROLES)[number]
    )
  )

  if (!hasAdminRole) {
    // Do NOT store token if user is not an admin
    throw new Error('Access denied. Admin privileges required.')
  }

  const primaryRoleName = resolvePortalRole(roles)

  // Store token only if user is an admin
  storeToken(token)

  // Store user data in localStorage for context
  if (typeof window !== 'undefined') {
    const userData = responseData.data || responseData
    localStorage.setItem('user_data', JSON.stringify({
      id: userData.userId || userData.id || '',
      email: userData.email || credentials.emailOrPhoneNumber,
      phoneNumber: userData.phoneNumber || credentials.emailOrPhoneNumber,
      fullName: userData.fullName || userData.name || '',
      username: userData.username,
      role: primaryRoleName || 'TRUST_ADMIN',
      roles: roles,
      status: 'active',
      emailVerified: true,
      mfaEnabled: userData.mfaEnabled || false,
      createdAt: userData.createdAt || '',
      updatedAt: userData.updatedAt || '',
    }))
  }

  return {
    jwtToken: token,
    roles: roles,
    user: {
      id: responseData.data?.userId || responseData.data?.id || '',
      email: responseData.data?.email || credentials.emailOrPhoneNumber,
      phoneNumber: responseData.data?.phoneNumber || credentials.emailOrPhoneNumber,
      fullName: responseData.data?.fullName || responseData.data?.name || '',
      username: responseData.data?.username,
    },
  }
}

/**
 * Get stored authentication token
 */
export function getToken(): string | null {
  return getStoredToken()
}

/**
 * Remove authentication token and user data
 */
export function logout(): void {
  clearToken()
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_data')
  }
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  return getToken() !== null
}

/**
 * Check if current user has ADMIN role
 * Note: This checks localStorage, not the server
 * For server-side validation, verify the JWT token
 */
export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const userData = localStorage.getItem('user_data')
    if (!userData) return false
    
    const user = JSON.parse(userData)
    const primaryRole = resolvePortalRoleName(user.role)
    if (PRIVILEGED_PORTAL_ROLES.includes(primaryRole as (typeof PRIVILEGED_PORTAL_ROLES)[number])) {
      return true
    }
    return (
      user.roles &&
      Array.isArray(user.roles) &&
      user.roles.some((r: Role) =>
        PRIVILEGED_PORTAL_ROLES.includes(
          resolvePortalRoleName(r.name) as (typeof PRIVILEGED_PORTAL_ROLES)[number]
        )
      )
    )
  } catch {
    return false
  }
}

/**
 * Request forgot password OTP/link
 * Uses: POST /api/auth/users/forgot-password
 */
export async function adminForgotPassword(emailOrPhoneNumber: string): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${AUTH_BASE}${FORGOT_PASSWORD_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ emailOrPhoneNumber: emailOrPhoneNumber.trim() }),
  })

  const responseText = await response.text()
  let parsed: any = null
  try {
    parsed = responseText ? JSON.parse(responseText) : null
  } catch {
    parsed = null
  }

  if (!response.ok || parsed?.success === false) {
    const message =
      parsed?.message ||
      parsed?.error ||
      (typeof parsed?.data === 'string' ? parsed.data : null) ||
      responseText ||
      'Failed to process forgot password request'
    throw new Error(message)
  }

  return {
    success: true,
    message: parsed?.message || 'Password reset request submitted successfully.',
  }
}

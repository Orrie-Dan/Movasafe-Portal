// Authentication API functions

import { API_CONFIG } from '@/lib/config/api'
import type { LoginCredentials, LoginResponse, AuthSession, User, MfaSetup, MfaVerification, PasswordResetRequest, PasswordReset, PasswordChange, LoginDTO, RegisterUserDTO, ResendOtpDTO } from '@/lib/types/auth'

const AUTH_BASE = API_CONFIG.AUTH.baseUrl

// Helper function to get auth token
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// Helper function to set auth token
function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token)
  }
}

// Helper function to remove auth token
function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
  }
}

// API request helper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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
      removeToken()
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

export async function apiLogin(credentials: LoginCredentials): Promise<LoginResponse> {
  // API expects emailOrPhoneNumber field (accepts both email and phone number)
  const loginData: LoginDTO = {
    emailOrPhoneNumber: credentials.email.trim(),
    password: credentials.password,
  }
  
  // Make direct fetch call for login (not using apiRequest since we don't have token yet)
  const response = await fetch(`${AUTH_BASE}${API_CONFIG.AUTH.endpoints.signin}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(loginData),
  })

  if (!response.ok) {
    const responseText = await response.text()
    let errorData: any
    try {
      errorData = JSON.parse(responseText)
    } catch {
      errorData = { message: responseText || `HTTP error! status: ${response.status}` }
    }
    
    const errorMessage = errorData.message || 
                        errorData.error || 
                        (errorData.data && typeof errorData.data === 'object' 
                          ? Object.values(errorData.data).join(', ')
                          : errorData.data) ||
                        `HTTP error! status: ${response.status}`
    
    throw new Error(errorMessage)
  }

  const responseData = await response.json()
  
  // Token is in data.jwtToken based on your actual response
  const token = responseData.data?.jwtToken
  
  if (!token) {
    throw new Error('Login successful but no token received from server')
  }
  
  // Store the token
  setToken(token)
  
  // Map the user data from your actual response structure
  const userData = responseData.data
  const primaryRole = userData.roles?.[0] || { name: 'USER' }
  
  return {
    success: true,
    token: token,
    user: {
      id: userData.userId || '',
      email: credentials.email,
      fullName: userData.fullName || userData.name || '',
      username: userData.username,
      role: primaryRole.name?.toLowerCase() || 'user',
      roles: userData.roles || [],
      permissions: userData.authorities || userData.permissions || [],
      status: userData.accountStatus?.toLowerCase() || 'active',
      emailVerified: true, // Assuming verified if login succeeded
      mfaEnabled: userData.mfaEnabled || false,
      lastLogin: new Date().toISOString(),
      createdAt: userData.createdAt || '',
      updatedAt: userData.updatedAt || '',
    }
  }
}

export async function apiLogout(): Promise<void> {
  try {
    // If your API has a logout endpoint, uncomment and update the path
    // await apiRequest('/api/auth/logout', { method: 'POST' })
  } finally {
    removeToken()
  }
}

// Register - Based on your Swagger: POST /api/auth/open/register
export async function apiRegister(data: RegisterUserDTO): Promise<any> {
  return apiRequest(API_CONFIG.AUTH.endpoints.register, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Resend OTP - Based on your Swagger: POST /api/auth/open/resend-activation-otp
export async function apiResendOtp(data: ResendOtpDTO): Promise<any> {
  return apiRequest(API_CONFIG.AUTH.endpoints.resendOtp, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Account Status - Based on your Swagger: GET /api/auth/open/account-status/{phoneNumber}
export async function apiGetAccountStatus(phoneNumber: string): Promise<any> {
  return apiRequest(`${API_CONFIG.AUTH.endpoints.accountStatus}/${phoneNumber}`)
}

export async function apiMe(): Promise<{ user: User }> {
  const token = getToken()
  
  if (!token) {
    throw new Error('No authentication token found')
  }
  
  // Add timeout (10 seconds) to prevent hanging on slow/unresponsive endpoints
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  
  try {
    const response = await fetch(`${AUTH_BASE}${API_CONFIG.AUTH.endpoints.currentUser}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const responseText = await response.text()
      let errorData: any
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText }
      }
      
      if (response.status === 401) {
        removeToken()
        throw new Error('Invalid or expired token')
      }
      
      if (response.status === 504) {
        throw new Error('Server timeout. Please try again later.')
      }
      
      const errorMessage = errorData.message || 
                          errorData.error || 
                          `HTTP error! status: ${response.status}`
      
      throw new Error(errorMessage)
    }
    
    const responseData = await response.json()
    
    // Adjust based on your actual response structure
    const userData = responseData.data || responseData
    const primaryRole = userData.roles?.[0] || { name: 'USER' }
    
    return {
      user: {
        id: userData.userId || userData.id || '',
        email: userData.email || userData.phoneNumber || '',
        fullName: userData.fullName || userData.name || '',
        username: userData.username,
        role: primaryRole.name?.toLowerCase() || 'user',
        roles: userData.roles || [],
        permissions: userData.authorities || userData.permissions || [],
        status: (userData.accountStatus || userData.status || 'active').toLowerCase(),
        emailVerified: userData.emailVerified || true,
        mfaEnabled: userData.mfaEnabled || false,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt || '',
        updatedAt: userData.updatedAt || '',
      }
    }
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. The server took too long to respond.')
    }
    throw error
  }
}

export async function apiRefreshToken(): Promise<{ token: string; refreshToken?: string }> {
  const response = await apiRequest<{ token: string; refreshToken?: string }>('/auth/refresh', {
    method: 'POST',
  })
  
  if (response.token) {
    setToken(response.token)
  }
  
  return response
}

export async function apiSetupMfa(): Promise<MfaSetup> {
  return apiRequest<MfaSetup>('/auth/mfa/setup', {
    method: 'POST',
  })
}

export async function apiVerifyMfa(verification: MfaVerification): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify(verification),
  })
}

export async function apiDisableMfa(): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/auth/mfa/disable', {
    method: 'POST',
  })
}

export async function apiRequestPasswordReset(request: PasswordResetRequest): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/auth/password/reset-request', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function apiResetPassword(reset: PasswordReset): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify(reset),
  })
}

export async function apiChangePassword(change: PasswordChange): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/auth/password/change', {
    method: 'POST',
    body: JSON.stringify(change),
  })
}

// Export token management functions for use in other modules
export { getToken, setToken, removeToken }


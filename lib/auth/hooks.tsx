'use client'

import { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiMe } from '@/lib/api/auth'
import type { User } from './types'
import { hasPermission, hasAnyPermission, hasAllPermissions, type Permission } from './permissions'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      // Check if token exists first
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setUser(null)
          setLoading(false)
          return
        }
        
        // Try to load user from localStorage first (stored during login)
        const storedUserData = localStorage.getItem('user_data')
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData)
            setUser(userData)
            // Still try to refresh from API in background, but don't block
            apiMe().then((response) => {
              setUser(response.user)
              localStorage.setItem('user_data', JSON.stringify(response.user))
            }).catch((error) => {
              console.warn('apiMe failed, using stored user data:', error.message)
            })
            setLoading(false)
            return
          } catch (e) {
            // Invalid stored data, continue to API call
          }
        }
      }
      
      // Try to load user from API
      try {
        const response = await apiMe()
        setUser(response.user)
        // Store for future use
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_data', JSON.stringify(response.user))
        }
      } catch (meError: any) {
        // If apiMe fails (timeout, etc), use stored data if available
        console.warn('apiMe failed, trying stored user data:', meError.message)
        if (typeof window !== 'undefined') {
          const storedUserData = localStorage.getItem('user_data')
          if (storedUserData) {
            try {
              const userData = JSON.parse(storedUserData)
              setUser(userData)
            } catch (e) {
              setUser(null)
            }
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    await loadUser()
  }

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      setUser(null)
      router.push('/login')
    }
  }

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false
    const userPermissions = user.permissions || []
    return hasPermission(userPermissions, permission)
  }

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false
    const userPermissions = user.permissions || []
    return hasAnyPermission(userPermissions, permissions)
  }

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false
    const userPermissions = user.permissions || []
    return hasAllPermissions(userPermissions, permissions)
  }

  // Check if user is authenticated - true if user exists OR token exists
  // This allows access even if apiMe() times out but token is present
  const isAuthenticated = useMemo(() => {
    if (user) return true
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('auth_token')
    }
    return false
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        hasPermission: checkPermission,
        hasAnyPermission: checkAnyPermission,
        hasAllPermissions: checkAllPermissions,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function usePermissions() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()
  return { hasPermission, hasAnyPermission, hasAllPermissions }
}







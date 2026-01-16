'use client'

import { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from './types'
import { hasPermission, hasAnyPermission, hasAllPermissions, type Permission } from './permissions'
import { getToken, logout as authLogout, isAdmin } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdminUser: boolean
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
      if (typeof window !== 'undefined') {
        const token = getToken()
        
        // Check if token exists
        if (!token) {
          setUser(null)
          setLoading(false)
          return
        }

        // Load user data from localStorage
        const storedUserData = localStorage.getItem('user_data')
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData)
            
            // Verify user is an admin
            const adminCheck = isAdmin()
            if (!adminCheck) {
              // User is not an admin, clear everything and redirect
              authLogout()
              setUser(null)
              setLoading(false)
              router.push('/login')
              return
            }
            
            setUser(userData)
          } catch (e) {
            // Invalid stored data, clear and redirect
            authLogout()
            setUser(null)
          }
        } else {
          // No user data but token exists - might be stale, clear it
          authLogout()
          setUser(null)
        }
      }
    } catch (error) {
      authLogout()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    await loadUser()
  }

  const logout = async () => {
    authLogout()
    setUser(null)
    router.push('/login')
  }

  // Check permissions based on user role
  const checkPermission = (permission: Permission): boolean => {
    if (!user || !isAdmin()) return false
    // For now, admin has all permissions
    // Can be extended to check specific permissions from user.roles
    return true
  }

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!user || !isAdmin()) return false
    return true
  }

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (!user || !isAdmin()) return false
    return true
  }

  // Check authentication status
  const isAuthenticated = useMemo(() => {
    const token = getToken()
    const adminCheck = isAdmin()
    return token !== null && adminCheck && user !== null
  }, [user])

  // Check if user is admin
  const isAdminUser = useMemo(() => {
    return isAdmin() && user !== null
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdminUser,
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







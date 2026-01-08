'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './hooks'
import type { Permission } from './permissions'

/**
 * Hook to protect a route based on authentication
 */
export function useRequireAuth() {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  return { user, loading, isAuthenticated }
}

/**
 * Hook to protect a route based on permission
 */
export function useRequirePermission(permission: Permission) {
  const { user, loading, isAuthenticated, hasPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (!hasPermission(permission)) {
        router.push('/admin') // Redirect to dashboard if no permission
      }
    }
  }, [loading, isAuthenticated, hasPermission, permission, router])

  return { user, loading, hasPermission: hasPermission(permission) }
}

/**
 * Hook to protect a route based on any of the specified permissions
 */
export function useRequireAnyPermission(permissions: Permission[]) {
  const { user, loading, isAuthenticated, hasAnyPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (!hasAnyPermission(permissions)) {
        router.push('/admin')
      }
    }
  }, [loading, isAuthenticated, hasAnyPermission, permissions, router])

  return { user, loading, hasPermission: hasAnyPermission(permissions) }
}

/**
 * Hook to protect a route based on role
 */
export function useRequireRole(role: string) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (user?.role !== role) {
        router.push('/admin')
      }
    }
  }, [loading, isAuthenticated, user, role, router])

  return { user, loading, hasRole: user?.role === role }
}


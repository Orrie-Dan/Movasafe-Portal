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
  // Authentication check removed - allow access without login

  return { user, loading, isAuthenticated: true }
}

/**
 * Hook to protect a route based on permission
 */
export function useRequirePermission(permission: Permission) {
  const { user, loading, isAuthenticated, hasPermission } = useAuth()
  // Authentication check removed - allow access without login

  return { user, loading, hasPermission: true }
}

/**
 * Hook to protect a route based on any of the specified permissions
 */
export function useRequireAnyPermission(permissions: Permission[]) {
  const { user, loading, isAuthenticated, hasAnyPermission } = useAuth()
  // Authentication check removed - allow access without login

  return { user, loading, hasPermission: true }
}

/**
 * Hook to protect a route based on role
 */
export function useRequireRole(role: string) {
  const { user, loading, isAuthenticated } = useAuth()
  // Authentication check removed - allow access without login

  return { user, loading, hasRole: true }
}


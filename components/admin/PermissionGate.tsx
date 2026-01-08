'use client'

import { usePermissions } from '@/lib/auth/hooks'
import type { Permission } from '@/lib/auth/permissions'
import { ReactNode } from 'react'

interface PermissionGateProps {
  permission: Permission | Permission[]
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean
}

export function PermissionGate({ 
  permission, 
  children, 
  fallback = null,
  requireAll = false 
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
  
  const permissions = Array.isArray(permission) ? permission : [permission]
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions)
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}


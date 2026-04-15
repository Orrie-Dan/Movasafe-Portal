'use client'

import { AuthProvider } from '@/lib/auth/hooks'
import { AdminSidebar } from '@/components/admin-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { RiskKpiStrip } from '@/components/admin/RiskKpiStrip'
import { useAuth } from '@/lib/auth/hooks'
import { useState, useEffect } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useRiskOverview } from '@/hooks/useRiskOverview'
import { canAccessPathByRole, getDefaultPathByRole } from '@/utils/roleMenuConfig'

function AdminLayoutContent() {
  const { user, loading, isAuthenticated, isAdminUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })
  const { openCriticalAlerts } = useRiskOverview()
  const shouldShowRiskKpiStrip = location.pathname !== '/admin/trust/user-management'
  const roles = Array.isArray((user as any)?.roles) ? (user as any).roles : []
  const normalizedRoles = roles.map((r: any) => String(r?.name || '').toUpperCase())
  const containsRole = (name: 'TRUST_ADMIN' | 'SUPPORT_AGENT' | 'PLATFORM_ADMIN') =>
    normalizedRoles.some((roleName) => roleName.includes(name)) ||
    String(user?.role || '').toUpperCase().includes(name)
  const effectiveRole = containsRole('TRUST_ADMIN')
    ? 'TRUST_ADMIN'
    : containsRole('SUPPORT_AGENT')
      ? 'SUPPORT_AGENT'
      : containsRole('PLATFORM_ADMIN')
        ? 'PLATFORM_ADMIN'
        : String(user?.role || '').toUpperCase()

  // Route protection: Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !isAdminUser) {
        navigate('/login')
        return
      }
      if (!canAccessPathByRole(effectiveRole, location.pathname)) {
        navigate(getDefaultPathByRole(effectiveRole), { replace: true })
      }
    }
  }, [loading, isAuthenticated, isAdminUser, navigate, effectiveRole, location.pathname])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Don't render admin content if not authenticated or not admin
  if (!isAuthenticated || !isAdminUser) {
    return null
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black text-slate-900 dark:text-white">
      <AdminSidebar
        variant="admin"
        userName={user?.fullName || 'User'}
        userRole={effectiveRole}
        collapsed={sidebarCollapsed}
        onCollapseChange={(collapsed) => {
          setSidebarCollapsed(collapsed)
          if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarCollapsed', String(collapsed))
          }
        }}
        criticalAlertsCount={openCriticalAlerts}
      />
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader
          userName={user?.fullName || 'User'}
          userRole={user?.role || 'Admin'}
        />
        {shouldShowRiskKpiStrip ? <RiskKpiStrip /> : null}
        <Outlet />
      </div>
    </div>
  )
}

export default function AdminLayout() {
  return (
    <AuthProvider>
      <AdminLayoutContent />
    </AuthProvider>
  )
}

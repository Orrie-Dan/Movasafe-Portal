'use client'

import { AuthProvider } from '@/lib/auth/hooks'
import { AdminSidebar } from '@/components/admin-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { useAuth } from '@/lib/auth/hooks'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, isAdminUser } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })

  // Route protection: Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !isAdminUser) {
        router.push('/login')
      }
    }
  }, [loading, isAuthenticated, isAdminUser, router])

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
        userRole={user?.role || 'admin'}
        collapsed={sidebarCollapsed}
        onCollapseChange={(collapsed) => {
          setSidebarCollapsed(collapsed)
          if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarCollapsed', String(collapsed))
          }
        }}
      />
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader
          userName={user?.fullName || 'User'}
          userRole={user?.role || 'Admin'}
        />
        {children}
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  )
}

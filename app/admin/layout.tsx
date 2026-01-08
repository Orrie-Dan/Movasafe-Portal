'use client'

import { AuthProvider } from '@/lib/auth/hooks'
import { AdminSidebar } from '@/components/admin-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { useAuth } from '@/lib/auth/hooks'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })

  useEffect(() => {
    // Check for token directly if AuthProvider hasn't loaded user yet
    if (!loading) {
      if (!isAuthenticated) {
        // Double-check if token exists (AuthProvider might not have loaded yet)
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token')
          if (!token) {
            router.push('/login')
          }
          // If token exists but user is null, wait a bit for AuthProvider to load
          // This handles the case where apiMe() is still loading
        } else {
          router.push('/login')
        }
      }
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-900 dark:text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
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


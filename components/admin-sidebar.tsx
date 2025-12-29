'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  HelpCircle,
  Trash2,
  Truck,
  MapPin,
  Recycle,
  ChevronRight,
  ChevronLeft,
  X,
  Menu,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AdminSidebarProps {
  variant?: 'admin' | 'officer'
  userName?: string
  userRole?: string
  collapsed?: boolean
  onCollapseChange?: (collapsed: boolean) => void
}

export function AdminSidebar({ variant = 'admin', userName = 'User', userRole = 'admin', collapsed: externalCollapsed, onCollapseChange }: AdminSidebarProps) {
  const pathname = usePathname()
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })
  
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed
  
  const toggleCollapse = () => {
    const newCollapsed = !collapsed
    if (onCollapseChange) {
      onCollapseChange(newCollapsed)
    } else {
      setInternalCollapsed(newCollapsed)
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarCollapsed', String(newCollapsed))
      }
    }
  }
  
  useEffect(() => {
    if (typeof window !== 'undefined' && externalCollapsed === undefined) {
      localStorage.setItem('sidebarCollapsed', String(internalCollapsed))
    }
  }, [internalCollapsed, externalCollapsed])

  const overviewSection = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, badge: null },
    { href: '/admin/financial', label: 'Financial', icon: DollarSign, badge: null },
    { href: '/admin/clients', label: 'Clients', icon: Users, badge: null },
    { href: '/admin/reports', label: 'Collections', icon: FileText, badge: null },
  ]

  const operationsSection = [
    { href: '/admin/waste-collections', label: 'Waste Collections', icon: Trash2, badge: null },
    { href: '/admin/officers', label: 'Fleet Management', icon: Truck, badge: null },
    { href: '/admin/zones-routes', label: 'Zones & Routes', icon: MapPin, badge: null },
  ]

  const sustainabilitySection = [
    { href: '/admin/recycling', label: 'Recycling', icon: Recycle, badge: null },
    { href: '/admin/waste-types', label: 'Waste Types', icon: FileText, badge: null },
  ]

  const officerItems = [
    { href: '/officer', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/officer/reports', label: 'My Collections', icon: FileText },
    { href: '/officer/settings', label: 'Settings', icon: Settings },
  ]

  const renderNavItem = (item: { href: string; label: string; icon: any; badge?: number | null }) => {
    const Icon = item.icon
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
    
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg transition-colors group relative",
          collapsed ? "px-3 py-2.5 justify-center" : "px-4 py-2.5",
          isActive
            ? "bg-blue-600 text-white"
            : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
        )}
      >
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">{item.label}</span>}
        </div>
        {!collapsed && item.badge !== null && item.badge !== undefined && (
          <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0.5">{item.badge}</Badge>
        )}
        {!collapsed && !isActive && <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
            {item.label}
          </div>
        )}
      </Link>
    )
  }

  return (
    <div className={cn(
      "bg-black border-r border-slate-900 flex flex-col h-screen transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Section */}
      <div className={cn("border-b border-slate-900 flex items-center justify-between", collapsed ? "p-4" : "p-6")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-white flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-slate-900" />
            </div>
            <h2 className="text-lg font-bold text-white">WMS</h2>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded bg-white flex items-center justify-center mx-auto">
            <Trash2 className="h-5 w-5 text-slate-900" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* OVERVIEW Section */}
        <div>
          {!collapsed && (
            <div className="px-4 mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OVERVIEW</h3>
            </div>
          )}
          <div className="space-y-1">
            {overviewSection.map(renderNavItem)}
          </div>
        </div>

        {/* OPERATIONS Section */}
        <div>
          {!collapsed && (
            <div className="px-4 mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OPERATIONS</h3>
            </div>
          )}
          <div className="space-y-1">
            {operationsSection.map(renderNavItem)}
          </div>
        </div>

        {/* SUSTAINABILITY Section */}
        <div>
          {!collapsed && (
            <div className="px-4 mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SUSTAINABILITY</h3>
            </div>
          )}
          <div className="space-y-1">
            {sustainabilitySection.map(renderNavItem)}
          </div>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className={cn("border-t border-slate-900 space-y-1", collapsed ? "p-2" : "p-4")}>
        <Link
          href="/admin/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center rounded-lg transition-colors",
            collapsed ? "px-3 py-2.5 justify-center" : "px-4 py-2.5 gap-3",
            pathname === '/admin/settings'
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
          )}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Settings</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
              Settings
            </div>
          )}
        </Link>
        <Link
          href="#"
          title={collapsed ? "Help" : undefined}
          className={cn(
            "flex items-center rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors relative",
            collapsed ? "px-3 py-2.5 justify-center" : "px-4 py-2.5 gap-3"
          )}
        >
          <HelpCircle className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Help</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
              Help
            </div>
          )}
        </Link>
        {/* Issues Button */}
        <Button
          variant="destructive"
          className={cn(
            "w-full h-auto bg-red-600 hover:bg-red-700 text-white",
            collapsed ? "px-3 py-2.5 justify-center" : "justify-start gap-3 px-4 py-2.5"
          )}
          title={collapsed ? "6 Issues" : undefined}
        >
          <X className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">6 Issues</span>}
        </Button>
      </div>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Menu,
  Bell,
  Database,
  Wallet,
  Store,
  CheckCircle2,
  AlertTriangle,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

interface AdminSidebarProps {
  variant?: 'admin'
  userName?: string
  userRole?: string
  collapsed?: boolean
  onCollapseChange?: (collapsed: boolean) => void
}

export function AdminSidebar({ variant = 'admin', userName = 'User', userRole = 'admin', collapsed: externalCollapsed, onCollapseChange }: AdminSidebarProps) {
  const { pathname } = useLocation()
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })
  
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  
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
  
  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }
  
  useEffect(() => {
    if (typeof window !== 'undefined' && externalCollapsed === undefined) {
      localStorage.setItem('sidebarCollapsed', String(internalCollapsed))
    }
  }, [internalCollapsed, externalCollapsed])

  const overviewSection = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, badge: null },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, badge: null },
  ]

  const operationsSection = [
    { href: '/admin/transactions', label: 'Transactions', icon: FileText, badge: null },
    { href: '/admin/users', label: 'Users', icon: Users, badge: null },
    { href: '/admin/wallets', label: 'Wallets', icon: Wallet, badge: null },
  ]

  const riskComplianceSection = [
    { href: '/admin/compliance-kyc', label: 'Compliance & KYC', icon: CheckCircle2, badge: null },
  ]

  const refundDisputesSection = [
    { href: '/admin/refund-disputes/escrow', label: 'Escrow Disputes', icon: AlertTriangle, badge: null },
    { href: '/admin/refund-disputes/transactions', label: 'Transactions Disputes', icon: AlertTriangle, badge: null },
  ]

  const adminPortalSection = [
    { href: '/admin/settings', label: 'System Settings', icon: Settings, badge: null },
  ]


  const renderNavItem = (item: { href: string; label: string; icon: any; badge?: number | null }) => {
    const Icon = item.icon
    // Special handling for /admin to only match exactly, not sub-routes
    let isActive: boolean
    if (item.href === '/admin') {
      isActive = pathname === '/admin' || pathname === '/admin/'
    } else {
      isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
    }
    
    return (
      <Link
        key={item.href}
        to={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg transition-colors group relative",
          collapsed ? "px-3 py-2.5 justify-center" : "px-4 py-2.5",
          isActive
            ? "bg-blue-600 text-white"
            : "text-black dark:text-white hover:bg-slate-800/50 hover:text-white"
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

  const renderCollapsibleMenu = (menuId: string, label: string, icon: any, items: any[]) => {
    const Icon = icon
    // Determine if any child route matches the current pathname
    const isChildActive = items.some(item => pathname === item.href || pathname?.startsWith(item.href + '/'))
    // The menu button should be expanded when explicitly toggled or when a child is active
    const isExpanded = expandedMenus.includes(menuId) || isChildActive
    // Only mark the parent button as "active" when the menu's own route is selected directly
    const menuHref = `/admin/${menuId}`
    const isButtonActive = pathname === menuHref || pathname === `${menuHref}/`

    return (
      <div>
        <button
          key={`${menuId}-button`}
          onClick={() => toggleMenu(menuId)}
          title={collapsed ? label : undefined}
          className={cn(
            "w-full flex items-center justify-between gap-3 rounded-lg transition-colors group relative",
            collapsed ? "px-3 py-2.5 justify-center" : "px-4 py-2.5",
            isButtonActive
              ? "bg-blue-600 text-white"
              : "text-black dark:text-white hover:bg-slate-800/50 hover:text-white"
          )}
        >
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">{label}</span>}
          </div>
          {!collapsed && (
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isExpanded ? "rotate-180" : ""
            )} />
          )}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
              {label}
            </div>
          )}
        </button>
        {!collapsed && isExpanded && (
          <div key={`${menuId}-items`} className="mt-1 space-y-1 pl-4">
            {items.map(item => renderNavItem(item))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-white dark:bg-black border-r border-slate-200 dark:border-slate-900 flex flex-col h-screen transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Section */}
      <div className={cn("border-b border-slate-200 dark:border-slate-900 flex items-center justify-between", collapsed ? "p-4" : "p-6")}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-slate-900 dark:bg-white flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white dark:text-slate-900" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Movasafe</h2>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded bg-slate-900 dark:bg-white flex items-center justify-center mx-auto">
            <Wallet className="h-5 w-5 text-white dark:text-slate-900" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 h-8 w-8"
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
              <h3 className="text-xs font-semibold text-black dark:text-white uppercase tracking-wider">OVERVIEW</h3>
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
              <h3 className="text-xs font-semibold text-black dark:text-white uppercase tracking-wider">OPERATIONS</h3>
            </div>
          )}
          <div className="space-y-1">
            {operationsSection.map(renderNavItem)}
          </div>
        </div>

        {/* RISK & COMPLIANCE Section */}
        <div>
          {!collapsed && (
            <div className="px-4 mb-3">
              <h3 className="text-xs font-semibold text-black dark:text-white uppercase tracking-wider">RISK & COMPLIANCE</h3>
            </div>
          )}
          <div className="space-y-1">
            {!collapsed ? renderCollapsibleMenu('refund-disputes', 'Refund & Disputes', AlertTriangle, refundDisputesSection) : null}
            {riskComplianceSection.map(renderNavItem)}
          </div>
        </div>

        {/* ADMIN PORTAL Section */}
        <div>
          {!collapsed && (
            <div className="px-4 mb-3">
              <h3 className="text-xs font-semibold text-black dark:text-white uppercase tracking-wider">ADMIN & SECURITY</h3>
            </div>
          )}
          <div className="space-y-1">
            {adminPortalSection.map(renderNavItem)}
          </div>
        </div>

      </nav>

      {/* Bottom Section - flex-shrink-0 keeps it visible at bottom */}
      <div className={cn(
        "flex-shrink-0 border-t border-slate-200 dark:border-slate-800 space-y-0.5",
        collapsed ? "p-2" : "p-4"
      )}>
        {/* Theme Toggle */}
        <div className={cn(
          "flex items-center rounded-lg transition-colors min-h-[2.5rem]",
          collapsed ? "px-3 py-2.5 justify-center" : "px-4 py-2.5"
        )}>
          {collapsed ? (
            <ThemeToggle
              variant="ghost"
              size="icon"
              className="text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-foreground"
            />
          ) : (
            <div className="flex items-center gap-3 w-full">
              <ThemeToggle
                variant="ghost"
                size="default"
                className="flex-1 justify-start text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-foreground"
              />
              <span className="text-sm text-foreground">Theme</span>
            </div>
          )}
        </div>
        <Link
          to="#"
          title={collapsed ? "Help" : undefined}
          className={cn(
            "flex items-center rounded-lg transition-colors min-h-[2.5rem] relative",
            collapsed ? "px-3 py-2.5 justify-center" : "px-4 py-2.5 gap-3",
            "text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-foreground"
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
      </div>
    </div>
  )
}


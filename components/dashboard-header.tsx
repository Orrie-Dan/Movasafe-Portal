'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Bell, Settings, ChevronDown, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { useDebounce } from '@/hooks/useDebounce'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth/hooks'

interface DashboardHeaderProps {
  userName?: string
  userRole?: string
  onMenuClick?: () => void
}

export function DashboardHeader({ 
  userName = 'Admin User', 
  userRole = 'Administrator',
  onMenuClick 
}: DashboardHeaderProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState(3)
  const [openDropdown, setOpenDropdown] = useState<'notifications' | 'user' | null>(null)
  
  const debouncedSearch = useDebounce(searchQuery, 300)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on route change
  useEffect(() => {
    setOpenDropdown(null)
  }, [pathname])

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Only one dropdown open at a time
  const handleDropdownToggle = (dropdown: 'notifications' | 'user') => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown)
  }

  // Outside click handlers
  useOutsideClick(notificationsRef, () => {
    if (openDropdown === 'notifications') {
      setOpenDropdown(null)
    }
  })

  useOutsideClick(userDropdownRef, () => {
    if (openDropdown === 'user') {
      setOpenDropdown(null)
    }
  })

  // Handle search
  useEffect(() => {
    if (debouncedSearch) {
      console.log('Searching for:', debouncedSearch)
      // Here you can add actual search logic or navigation
    }
  }, [debouncedSearch])

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      console.log('Search submitted:', searchQuery)
      // Navigate to search results or perform search
      // router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleSettingsClick = () => {
    router.push('/admin/settings')
    setOpenDropdown(null)
  }

  const handleProfileClick = () => {
    router.push('/admin/users/me')
    setOpenDropdown(null)
  }

  const handleLogout = async () => {
    setOpenDropdown(null)
    await logout()
  }

  const mockNotifications = [
    { id: 1, message: 'New transaction received', time: '2m ago', read: false },
    { id: 2, message: 'User verification pending', time: '15m ago', read: false },
    { id: 3, message: 'System update available', time: '1h ago', read: true },
  ]

  const unreadNotifications = mockNotifications.filter(n => !n.read).length

  return (
    <div className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-black px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section - Menu, Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="text-slate-900 dark:text-white">Admin Portal</span>
          </div>
        </div>

        {/* Right Section - Icons and User */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle variant="ghost" size="icon" />

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 relative"
              onClick={() => handleDropdownToggle('notifications')}
              aria-label="Notifications"
              aria-expanded={openDropdown === 'notifications'}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-500 text-white text-xs border-2 border-white dark:border-slate-900">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
            
            {openDropdown === 'notifications' && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setOpenDropdown(null)}
                    aria-label="Close notifications"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {mockNotifications.length > 0 ? (
                    mockNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors",
                          !notification.read && "bg-blue-50 dark:bg-blue-900/20"
                        )}
                        onClick={() => {
                          console.log('Notification clicked:', notification.id)
                          setOpenDropdown(null)
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            console.log('Notification clicked:', notification.id)
                            setOpenDropdown(null)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-slate-900 dark:text-white">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 ml-2 mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No notifications
                    </div>
                  )}
                </div>
                {mockNotifications.length > 0 && (
                  <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        console.log('View all notifications')
                        router.push('/admin/notifications')
                        setOpenDropdown(null)
                      }}
                    >
                      View all notifications
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={handleSettingsClick}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Profile */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => handleDropdownToggle('user')}
              className="flex items-center gap-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50"
              aria-label="User menu"
              aria-expanded={openDropdown === 'user'}
            >
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-slate-900 dark:text-white">{userName}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{userRole}</div>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 hidden md:block text-slate-900 dark:text-white transition-transform",
                openDropdown === 'user' && "rotate-180"
              )} />
            </button>
            
            {openDropdown === 'user' && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-50">
                <div className="p-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-2 py-1.5 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    role="menuitem"
                    tabIndex={0}
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleSettingsClick}
                    className="w-full text-left px-2 py-1.5 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    role="menuitem"
                    tabIndex={0}
                  >
                    Settings
                  </button>
                  <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-2 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    role="menuitem"
                    tabIndex={0}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

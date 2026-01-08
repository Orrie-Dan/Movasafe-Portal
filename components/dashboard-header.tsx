'use client'

import { useState } from 'react'
import { Search, Bell, Settings, ChevronDown, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'

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
  const [notifications] = useState(3) // Mock notification count

  return (
    <div className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-black px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section - Menu, Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-white hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">Admin Portal</span>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-4 sm:mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search reports, officers, organizations..."
              className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:border-slate-300 dark:focus:border-slate-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  // Handle search
                  console.log('Searching for:', e.currentTarget.value)
                }
              }}
            />
          </div>
        </div>

        {/* Right Section - Icons and User */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle variant="ghost" size="icon" />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800 relative">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-blue-500 text-white text-xs border-2 border-slate-900">
                {notifications}
              </Badge>
            )}
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-slate-900 dark:text-white">{userName}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{userRole}</div>
              </div>
              <ChevronDown className="h-4 w-4 hidden md:block text-slate-900 dark:text-white" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <DropdownMenuItem className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
              <DropdownMenuItem className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}


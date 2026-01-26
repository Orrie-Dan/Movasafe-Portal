'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X } from 'lucide-react'

export interface FilterBarProps {
  children?: React.ReactNode
  searchValue?: string
  onSearchChange?: (value: string) => void
  onClearAll?: () => void
  searchPlaceholder?: string
  className?: string
}

export function FilterBar({
  children,
  searchValue = '',
  onSearchChange,
  onClearAll,
  searchPlaceholder = 'Search...',
  className,
}: FilterBarProps) {
  const hasFilters = searchValue || (children && React.Children.count(children) > 0)

  return (
    <Card className={`bg-slate-800/30 border border-slate-700 ${className}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          {onSearchChange && (
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
              />
            </div>
          )}
          {children}
          {hasFilters && onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


'use client'

import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)}>
      <Link
        to="/admin"
        className="text-slate-400 hover:text-white transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-slate-600" />
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href!}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              index === items.length - 1 ? 'text-white' : 'text-slate-400'
            )}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}


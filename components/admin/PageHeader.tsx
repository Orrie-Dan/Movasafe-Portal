'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
    permission?: string
  }
  backButton?: {
    label: string
    href: string
  }
  children?: ReactNode
}

export function PageHeader({ 
  title, 
  description, 
  action,
  backButton,
  children 
}: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          {backButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(backButton.href)}
              className="text-slate-400 hover:text-white mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backButton.label}
            </Button>
          )}
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && (
            <p className="text-sm text-slate-400">{description}</p>
          )}
        </div>
        {action && (
          <Button
            onClick={action.onClick}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {action.icon || <Plus className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        )}
      </div>
      {children}
    </div>
  )
}


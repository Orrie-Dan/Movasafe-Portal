'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ThemeToggle({ className, variant = 'ghost', size = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        'relative transition-all duration-300',
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className={cn(
        'h-4 w-4 rotate-0 scale-100 transition-all duration-300',
        theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
      )} />
      <Moon className={cn(
        'absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300',
        theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}





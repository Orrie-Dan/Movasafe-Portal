'use client'

import { Button, ButtonProps } from '@/components/ui/button'
import { PermissionGate } from './PermissionGate'
import type { Permission } from '@/lib/auth/permissions'
import { ReactNode } from 'react'

interface ActionButtonProps extends ButtonProps {
  permission: Permission | Permission[]
  requireAll?: boolean
  children: ReactNode
}

export function ActionButton({ 
  permission, 
  requireAll = false,
  children,
  ...buttonProps 
}: ActionButtonProps) {
  return (
    <PermissionGate permission={permission} requireAll={requireAll}>
      <Button {...buttonProps}>{children}</Button>
    </PermissionGate>
  )
}


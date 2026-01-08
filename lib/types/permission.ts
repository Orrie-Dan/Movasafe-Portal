// Permission types

export interface Permission {
  id: string
  name: string
  displayName: string
  description?: string
  resource: string
  action: string
  category: string
}

export interface PermissionCategory {
  name: string
  displayName: string
  permissions: Permission[]
}

export interface PermissionCheck {
  permission: string
  resource?: string
  resourceId?: string
}

export interface PermissionMatrix {
  roleId: string
  permissions: Record<string, boolean>
}


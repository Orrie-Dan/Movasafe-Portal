'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ActionButton } from '@/components/admin/ActionButton'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiGetRoles, apiDeleteRole } from '@/lib/api/roles'
import { PERMISSIONS } from '@/lib/auth/permissions'
import type { Role } from '@/lib/types/auth'
import { Plus, Edit, Trash2, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; role: Role | null }>({
    open: false,
    role: null,
  })

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await apiGetRoles()
      setRoles(response.data)
    } catch (error) {
      console.error('Failed to load roles:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load roles',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.role) return

    try {
      await apiDeleteRole(deleteDialog.role.id)
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      })
      loadRoles()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete role',
        variant: 'destructive',
      })
    }
  }

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Name',
      accessor: (role) => (
        <div>
          <div className="font-medium text-foreground">{role.displayName}</div>
          <div className="text-sm text-muted-foreground">{role.name}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'description',
      header: 'Description',
      accessor: (role) => (
        <span className="text-foreground">{role.description || '-'}</span>
      ),
    },
    {
      key: 'permissions',
      header: 'Permissions',
      accessor: (role) => (
        <div className="flex flex-wrap gap-1">
          {role.permissions.slice(0, 3).map((perm, idx) => (
            <Badge key={idx} className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
              {perm.name || perm}
            </Badge>
          ))}
          {role.permissions.length > 3 && (
            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
              +{role.permissions.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'isSystem',
      header: 'Type',
      accessor: (role) => (
        <span className="text-muted-foreground text-sm">
          {role.isSystem ? 'System' : 'Custom'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      accessor: (role) => (
        <span className="text-muted-foreground">
          {format(new Date(role.createdAt), 'MMM d, yyyy')}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (role) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/admin/roles/${role.id}`)
            }}
            className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {!role.isSystem && (
            <ActionButton
              permission={PERMISSIONS.DELETE_ROLE}
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteDialog({ open: true, role })
              }}
              className="h-8 w-8 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </ActionButton>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-black">
      <PageHeader
        title="Roles & Permissions"
        description="Manage user roles and their permissions"
        action={{
          label: 'Create Role',
          onClick: () => router.push('/admin/roles/create'),
          icon: <Plus className="h-4 w-4 mr-2" />,
        }}
      />

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <DataTable
            data={roles}
            columns={columns}
            searchable
            searchPlaceholder="Search roles..."
            pagination={{ pageSize: 25 }}
            onRowClick={(role) => router.push(`/admin/roles/${role.id}`)}
            emptyMessage="No roles found"
            loading={loading}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, role: deleteDialog.role })}
        title="Delete Role"
        description={`Are you sure you want to delete ${deleteDialog.role?.displayName}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}


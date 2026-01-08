'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiCreateRole, apiGetPermissions } from '@/lib/api/roles'
import type { CreateRoleRequest } from '@/lib/types/user'
import type { Permission } from '@/lib/types/permission'
import { toast } from '@/hooks/use-toast'

export default function CreateRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    displayName: '',
    description: '',
    permissionIds: [],
  })

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      const response = await apiGetPermissions()
      setPermissions(response.data)
    } catch (error) {
      console.error('Failed to load permissions:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiCreateRole(formData)
      toast({
        title: 'Success',
        description: 'Role created successfully',
      })
      router.push('/admin/roles')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create role',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (permissionId: string) => {
    setFormData({
      ...formData,
      permissionIds: formData.permissionIds.includes(permissionId)
        ? formData.permissionIds.filter((id) => id !== permissionId)
        : [...formData.permissionIds, permissionId],
    })
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-black">
      <PageHeader
        title="Create Role"
        description="Create a new role with specific permissions"
        backButton={{
          label: 'Back to Roles',
          href: '/admin/roles',
        }}
      />

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle className="z-10 relative text-slate-900 dark:text-white">Role Information</CardTitle>
        </div>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g., content_manager"
                />
                <p className="text-xs text-slate-400">Lowercase, underscores only</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="e.g., Content Manager"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-4 bg-slate-900 rounded-lg">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      id={permission.id}
                      checked={formData.permissionIds.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      className="rounded border-slate-700"
                    />
                    <label
                      htmlFor={permission.id}
                      className="text-sm text-white cursor-pointer flex-1"
                    >
                      {permission.displayName}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                {formData.permissionIds.length} permission(s) selected
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/roles')}
                className="border-slate-700 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Creating...' : 'Create Role'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


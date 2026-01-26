'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiGetUser, apiUpdateUser, apiSetUserPassword } from '@/lib/api/users'
import { apiGetRoles } from '@/lib/api/roles'
import type { UpdateUserRequest } from '@/lib/types/user'
import type { Role } from '@/lib/types/auth'
import { toast } from '@/hooks/use-toast'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { format } from 'date-fns'

export default function UserDetailClient() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [formData, setFormData] = useState<UpdateUserRequest>({
    email: '',
    fullName: '',
    roleIds: [],
    status: 'active',
  })

  useEffect(() => {
    if (userId) {
      loadUser()
      loadRoles()
    }
  }, [userId])

  const loadUser = async () => {
    try {
      setLoading(true)
      const response = await apiGetUser(userId)
      setUser(response.user)
      setFormData({
        email: response.user.email,
        fullName: response.user.fullName,
        roleIds: response.user.roles?.map((r: Role) => r.id) || [],
        status: response.user.status,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load user',
        variant: 'destructive',
      })
      router.push('/admin/users')
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await apiGetRoles()
      setRoles(response.data)
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await apiUpdateUser(userId, formData)
      toast({
        title: 'Success',
        description: 'User updated successfully',
      })
      loadUser()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      const response = await apiSetUserPassword(userId)
      toast({
        title: 'Success',
        description: response.temporaryPassword
          ? `Password reset. Temporary password: ${response.temporaryPassword}`
          : 'Password reset email sent',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset password',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-900/50">
      <PageHeader
        title="Edit User"
        description={`Manage user: ${user.email}`}
        backButton={{
          label: 'Back to Users',
          href: '/admin/users',
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black border-slate-800">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: string) =>
                        setFormData({ ...formData, status: value as 'active' | 'suspended' | 'locked' | 'inactive' })
                      }
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="locked">Locked</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roles">Roles</Label>
                    <Select
                      value=""
                      onValueChange={(roleId) => {
                        if (!formData.roleIds?.includes(roleId)) {
                          setFormData({
                            ...formData,
                            roleIds: [...(formData.roleIds || []), roleId],
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.roleIds && formData.roleIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.roleIds.map((roleId) => {
                          const role = roles.find((r) => r.id === roleId)
                          return (
                            <div
                              key={roleId}
                              className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded text-sm"
                            >
                              <span className="text-white">{role?.displayName}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    roleIds: formData.roleIds?.filter((id) => id !== roleId) || [],
                                  })
                                }}
                                className="text-slate-400 hover:text-white"
                              >
                                ×
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/users')}
                    className="border-slate-700 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-black border-slate-800">
            <CardHeader>
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-400">Status</Label>
                <div className="mt-1">
                  <StatusBadge status={user.status} />
                </div>
              </div>
              <div>
                <Label className="text-slate-400">Email Verified</Label>
                <div className="mt-1 text-white">
                  {user.emailVerified ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <Label className="text-slate-400">MFA Enabled</Label>
                <div className="mt-1 text-white">
                  {user.mfaEnabled ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <Label className="text-slate-400">Last Login</Label>
                <div className="mt-1 text-white">
                  {user.lastLogin ? format(new Date(user.lastLogin), 'PPp') : 'Never'}
                </div>
              </div>
              <div>
                <Label className="text-slate-400">Created</Label>
                <div className="mt-1 text-white">
                  {format(new Date(user.createdAt), 'PPp')}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-slate-800">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                onClick={handleResetPassword}
                className="w-full border-slate-700 text-white"
              >
                Reset Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

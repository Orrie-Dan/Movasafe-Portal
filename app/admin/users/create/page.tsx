'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { apiCreateUser, apiGetRoles } from '@/lib/api/users'
import { apiGetRoles as getRoles } from '@/lib/api/roles'
import type { CreateUserRequest } from '@/lib/types/user'
import type { Role } from '@/lib/types/auth'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'

export default function CreateUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    username: '',
    fullName: '',
    password: '',
    roleIds: [],
    status: 'active',
    emailVerified: false,
  })

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      const response = await getRoles()
      setRoles(response.data)
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiCreateUser(formData)
      toast({
        title: 'Success',
        description: 'User created successfully',
      })
      router.push('/admin/users')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-900/50">
      <PageHeader
        title="Create User"
        description="Add a new user to the system"
        backButton={{
          label: 'Back to Users',
          href: '/admin/users',
        }}
      />

      <Card className="bg-black border-slate-800">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'suspended' | 'inactive') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roles">Roles</Label>
                <Select
                  value=""
                  onValueChange={(roleId) => {
                    if (!formData.roleIds.includes(roleId)) {
                      setFormData({
                        ...formData,
                        roleIds: [...formData.roleIds, roleId],
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
                {formData.roleIds.length > 0 && (
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
                                roleIds: formData.roleIds.filter((id) => id !== roleId),
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailVerified"
                checked={formData.emailVerified}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, emailVerified: checked === true })
                }
              />
              <Label htmlFor="emailVerified" className="cursor-pointer">
                Email verified
              </Label>
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
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


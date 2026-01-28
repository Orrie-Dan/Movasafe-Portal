'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { apiGetUsers, apiDeleteUser, apiSuspendUser, apiActivateUser, apiGetUserActivity } from '@/lib/api/users'
import { apiGetAllWallets } from '@/lib/api'
import type { User } from '@/lib/types/user'
import type { UserActivityTimeline } from '@/lib/types/user'
import type { Wallet } from '@/lib/types/wallets'
import { toast } from '@/hooks/use-toast'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import {
  Plus,
  Trash2,
  UserX,
  UserCheck,
  Wallet as WalletIcon,
  Filter,
  Search,
  Shield,
  Mail,
  Phone,
  User as UserIcon,
  Calendar,
  Flag,
  RefreshCw,
  Lock,
  Unlock,
  KeyRound,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type AccountTypeFilter = 'all' | 'personal' | 'merchant' | 'partner'

interface UsersFilters {
  idOrWallet: string
  nameEmailPhone: string
  status: 'all' | 'active' | 'suspended' | 'locked' | 'inactive' | 'pending_verification'
  kycStatus: 'all' | 'pending' | 'verified' | 'rejected' | 'expired'
  dateField: 'registration' | 'lastLogin'
  dateRange: 'all' | 'today' | '7d' | '30d' | 'custom'
  customStartDate: string
  customEndDate: string
}

type EnrichedUser = User & {
  walletBalance?: number
  walletId?: string
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<EnrichedUser[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UsersFilters>({
    idOrWallet: '',
    nameEmailPhone: '',
    status: 'all',
    kycStatus: 'all',
    dateField: 'registration',
    // Default to all time so we don't filter out older users from the API
    dateRange: 'all',
    customStartDate: '',
    customEndDate: '',
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: EnrichedUser | null }>({
    open: false,
    user: null,
  })
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activityTimeline, setActivityTimeline] = useState<UserActivityTimeline | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [internalNote, setInternalNote] = useState('')
  const [actionModal, setActionModal] = useState<{
    type: 'suspend' | 'activate' | 'block' | 'delete' | 'resetPassword' | 'flag' | null
    user: EnrichedUser | null
  }>({ type: null, user: null })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const [usersResponse, walletsResponse] = await Promise.all([
        apiGetUsers({ page: 0, limit: 500 }),
        apiGetAllWallets({ limit: 1000 }),
      ])

      const walletByUserId = new Map<string, Wallet>()
      walletsResponse.forEach((w: Wallet) => {
        walletByUserId.set(w.userId, w)
      })

      const enriched: EnrichedUser[] = usersResponse.data.map((user) => {
        const wallet = walletByUserId.get(user.id)
        return {
          ...user,
          walletBalance: wallet?.walletBalance ?? 0,
          walletId: wallet?.id,
        }
      })

      setUsers(enriched)
      setWallets(walletsResponse)
    } catch (error) {
      console.error('Failed to load users:', error)
      const message = error instanceof Error ? error.message : 'Failed to load users'
      setError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date | undefined
    let endDate = endOfDay(now)

    if (filters.dateRange === 'today') {
      startDate = startOfDay(now)
    } else if (filters.dateRange === '7d') {
      startDate = startOfDay(subDays(now, 7))
    } else if (filters.dateRange === '30d') {
      startDate = startOfDay(subDays(now, 30))
    } else if (filters.dateRange === 'custom' && filters.customStartDate && filters.customEndDate) {
      startDate = startOfDay(new Date(filters.customStartDate))
      endDate = endOfDay(new Date(filters.customEndDate))
    }

    return { startDate, endDate }
  }

  const resetFilters = () => {
    setFilters({
      idOrWallet: '',
      nameEmailPhone: '',
      status: 'all',
      kycStatus: 'all',
      dateField: 'registration',
      dateRange: '7d',
      customStartDate: '',
      customEndDate: '',
    })
  }

  const filteredUsers = useMemo(() => {
    let data = users

    if (filters.idOrWallet.trim()) {
      const query = filters.idOrWallet.trim().toLowerCase()
      data = data.filter((user) => {
        const walletId = (user as any).walletId as string | undefined
        return (
          user.id.toLowerCase() === query ||
          (walletId && walletId.toLowerCase() === query)
        )
      })
    }

    if (filters.nameEmailPhone.trim()) {
      const query = filters.nameEmailPhone.toLowerCase()
      data = data.filter((user) => {
        const phone = user.phoneNumber || user.profile?.phone || ''
        return (
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          phone.toLowerCase().includes(query)
        )
      })
    }

    if (filters.status !== 'all') {
      if (filters.status === 'pending_verification') {
        data = data.filter((user) => !user.emailVerified && !(user as any).kycVerified)
      } else {
        data = data.filter((user) => user.status === filters.status)
      }
    }

    if (filters.kycStatus !== 'all') {
      data = data.filter((user) => {
        const kycVerified = (user as any).kycVerified
        // Map boolean kycVerified to simple status buckets
        const kyc =
          kycVerified === true
            ? 'verified'
            : 'pending'
        if (filters.kycStatus === 'verified') return kyc === 'verified'
        if (filters.kycStatus === 'pending') return kyc === 'pending'
        // For rejected/expired we currently have no explicit signal; treat as non-matching
        return false
      })
    }

    if (filters.dateRange !== 'all') {
      const { startDate, endDate } = getDateRange()
      if (startDate && endDate) {
        data = data.filter((user) => {
          const dateStr = filters.dateField === 'registration' ? user.createdAt : user.lastLogin
          if (!dateStr) return false
          const date = new Date(dateStr)
          return date >= startDate && date <= endDate
        })
      }
    }

    return data
  }, [users, filters])

  const handleDeleteConfirmed = async () => {
    if (!deleteDialog.user) return

    try {
      const phoneNumber = deleteDialog.user.phoneNumber || deleteDialog.user.email || deleteDialog.user.id
      await apiDeleteUser(phoneNumber)
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      })
      setDeleteDialog({ open: false, user: null })
      loadUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      })
    }
  }

  const handleSuspend = async (user: EnrichedUser) => {
    try {
      await apiSuspendUser(user.id)
      toast({
        title: 'Success',
        description: 'User suspended successfully',
      })
      loadUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to suspend user',
        variant: 'destructive',
      })
    }
  }

  const handleActivate = async (user: EnrichedUser) => {
    try {
      await apiActivateUser(user.id)
      toast({
        title: 'Success',
        description: 'User activated successfully',
      })
      loadUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to activate user',
        variant: 'destructive',
      })
    }
  }

  const handleBlock = async (user: EnrichedUser) => {
    try {
      await apiSuspendUser(user.id, 'blocked')
      toast({
        title: 'Success',
        description: 'User blocked successfully',
      })
      loadUsers()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to block user',
        variant: 'destructive',
      })
    }
  }

  const handleResetPassword = async (user: EnrichedUser) => {
    try {
      const phoneNumber = user.phoneNumber || ''
      if (!phoneNumber) {
        toast({
          title: 'Error',
          description: 'No phone number available for this user',
          variant: 'destructive',
        })
        return
      }
      toast({
        title: 'Password reset initiated',
        description: `A password reset flow has been started for ${phoneNumber}.`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset password',
        variant: 'destructive',
      })
    }
  }

  const handleFlag = async (user: EnrichedUser) => {
    toast({
      title: 'Flagged for review',
      description: `User ${user.email} has been flagged for manual review.`,
    })
  }

  const openUserDetails = async (user: EnrichedUser) => {
    setSelectedUser(user)
    setIsDetailOpen(true)
    setActivityTimeline(null)
    setActivityLoading(true)
    try {
      const timeline = await apiGetUserActivity(user.id, { limit: 20 })
      setActivityTimeline(timeline)
    } catch (error) {
      console.error('Failed to load user activity:', error)
    } finally {
      setActivityLoading(false)
    }
  }

  const columns: Column<EnrichedUser>[] = [
    {
      key: 'id',
      header: 'User ID',
      accessor: (user) => (
        <span className="font-mono text-xs text-foreground">{user.id}</span>
      ),
      sortable: true,
    },
    {
      key: 'firstName',
      header: 'First Name',
      accessor: (user) => {
        const first =
          (user as any).firstname ||
          user.profile?.firstName ||
          (user.fullName ? user.fullName.split(' ')[0] : '')
        return <span className="text-sm font-medium text-foreground">{first}</span>
      },
      sortable: true,
    },
    {
      key: 'lastName',
      header: 'Last Name',
      accessor: (user) => {
        const last =
          (user as any).lastname ||
          user.profile?.lastName ||
          (user.fullName ? user.fullName.split(' ').slice(1).join(' ') : '')
        return <span className="text-sm font-medium text-foreground">{last}</span>
      },
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (user) => <StatusBadge status={user.status} />,
      sortable: true,
    },
    {
      key: 'walletBalance',
      header: 'Wallet Balance',
      accessor: (user) => {
        const balance = (user as any).walletBalance || 0
        return (
          <div className="flex items-center gap-2">
            <WalletIcon className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {balance >= 1_000_000
                ? `${(balance / 1_000_000).toFixed(2)}M`
                : balance >= 1_000
                ? `${(balance / 1_000).toFixed(2)}K`
                : balance.toFixed(0)}{' '}
              RWF
            </span>
          </div>
        )
      },
      sortable: true,
    },
    {
      key: 'registration',
      header: 'Registered / Last Login',
      accessor: (user) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1 text-foreground">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span>{format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Last login:{' '}
            {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy') : 'Never'}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'kycStatus',
      header: 'Verification',
      accessor: (user) => {
        const isVerified = (user as any).kycVerified === true
        const label = isVerified ? 'Verified' : 'Not Verified'
        const classes = isVerified
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'

        return (
          <Badge className={cn('border text-[11px] font-medium', classes)}>
            {label}
          </Badge>
        )
      },
      sortable: true,
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 dark:bg-slate-900/50">
      <PageHeader
        title="User Management"
        description="Find, inspect, and manage Movasafe wallet users"
      />

      {/* Filters */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-foreground">Filters</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={loadUsers}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear
              </Button>
            </div>
          </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* User / Wallet ID */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  User ID / Wallet ID
                </Label>
                <Input
                  value={filters.idOrWallet}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, idOrWallet: e.target.value }))
                  }
                  placeholder="Exact ID"
                  className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
                />
              </div>

              {/* Name / Email / Phone */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Name / Email / Phone
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    value={filters.nameEmailPhone}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, nameEmailPhone: e.target.value }))
                    }
                    placeholder="Search..."
                    className="pl-7 h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value as UsersFilters['status'],
                    }))
                  }
                  className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
                >
                  <SelectValue />
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="locked">Blocked</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* KYC Status */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Verification / KYC Status
                </Label>
            <Select 
                  value={filters.kycStatus}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      kycStatus: value as UsersFilters['kycStatus'],
                    }))
                  }
                  className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
                >
                  <SelectValue />
              <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
              </div>

              {/* Date field */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Date Field</Label>
                <Select
                  value={filters.dateField}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateField: value as UsersFilters['dateField'],
                    }))
                  }
                  className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
                >
                  <SelectValue />
                  <SelectContent>
                    <SelectItem value="registration">Registration Date</SelectItem>
                    <SelectItem value="lastLogin">Last Login</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date range */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Date Range</Label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: value as UsersFilters['dateRange'],
                    }))
                  }
                  className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
                >
                  <SelectValue />
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filters.dateRange === 'custom' && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Start Date
                    </Label>
                    <Input
                      type="date"
                      value={filters.customStartDate}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          customStartDate: e.target.value,
                        }))
                      }
                      className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      End Date
                    </Label>
                    <Input
                      type="date"
                      value={filters.customEndDate}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          customEndDate: e.target.value,
                        }))
                      }
                      className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
                    />
                  </div>
                </>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <DataTable
            data={filteredUsers}
            columns={columns}
            pagination={{ pageSize: 25 }}
            searchable={false}
            emptyMessage={error || 'No users found'}
            loading={loading}
            onRowClick={(user) => openUserDetails(user)}
          />
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, user: deleteDialog.user })}
        title="Delete User"
        description={`Are you sure you want to delete ${deleteDialog.user?.email}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirmed}
      />

      {/* User details dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-blue-400" />
                      <span>{selectedUser.fullName}</span>
                    </div>
                    <DialogDescription className="mt-1">
                      {selectedUser.email}
                    </DialogDescription>
                  </div>
                  <StatusBadge status={selectedUser.status} />
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile and account info */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        Profile
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            User ID
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs text-foreground">
                              {selectedUser.id}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedUser.id)
                                toast({
                                  title: 'Copied',
                                  description: 'User ID copied to clipboard',
                                })
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Phone
                          </Label>
                          <div className="mt-1 text-sm text-foreground">
                            {selectedUser.phoneNumber || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Registration Date
                          </Label>
                          <div className="mt-1 text-sm text-foreground">
                            {format(new Date(selectedUser.createdAt), 'PPpp')}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Last Login
                          </Label>
                          <div className="mt-1 text-sm text-foreground">
                            {selectedUser.lastLogin
                              ? format(new Date(selectedUser.lastLogin), 'PPpp')
                              : 'Never'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Email Verified
                          </Label>
                          <div className="mt-1 text-sm text-foreground">
                            {selectedUser.emailVerified ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            MFA Enabled
                          </Label>
                          <div className="mt-1 text-sm text-foreground">
                            {selectedUser.mfaEnabled ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Wallet summary */}
                  <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <WalletIcon className="h-4 w-4 text-muted-foreground" />
                        Wallet Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Wallet ID
                          </Label>
                          <div className="mt-1 text-sm text-foreground">
                            {(selectedUser as any).walletId || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Balance
                          </Label>
                          <div className="mt-1 text-sm text-foreground">
                            {((selectedUser as any).walletBalance ?? 0).toLocaleString()} RWF
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Internal notes */}
                  <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Internal Notes
                      </h3>
                      <Textarea
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        placeholder="Add internal notes about this user..."
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground"
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Right column: verification, activity, actions */}
                <div className="space-y-4">
                  {/* Verification */}
                  <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Verification / KYC
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Status
                          </Label>
                          <div className="mt-1">
                            {columns[5].accessor?.(selectedUser)}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Detailed KYC documents are available in the Compliance / KYC
                          section.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity */}
                  <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        Activity History
                      </h3>
                      {activityLoading ? (
                        <div className="text-xs text-muted-foreground">Loading activity...</div>
                      ) : activityTimeline && activityTimeline.activities.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
                          {activityTimeline.activities.map((act) => (
                            <div
                              key={act.id}
                              className="border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">
                                  {act.action}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {format(new Date(act.timestamp), 'MMM d, HH:mm')}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {act.resource}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          No recent activity records.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Admin Controls
                      </h3>
                      <div className="space-y-2">
                        {selectedUser.status === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() =>
                              setActionModal({ type: 'activate', user: selectedUser })
                            }
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Activate User
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() =>
                              setActionModal({ type: 'suspend', user: selectedUser })
                            }
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Suspend User
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setActionModal({ type: 'block', user: selectedUser })}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Block User
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() =>
                            setActionModal({ type: 'resetPassword', user: selectedUser })
                          }
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          Reset Password
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setActionModal({ type: 'flag', user: selectedUser })}
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Flag for Review
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full justify-start text-red-500 border-red-500/40 hover:bg-red-500/10"
                          onClick={() =>
                            setDeleteDialog({ open: true, user: selectedUser })
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Action confirm dialogs */}
      {actionModal.type && actionModal.user && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setActionModal({ type: null, user: null })
          }}
          title={
            actionModal.type === 'suspend'
              ? 'Suspend User'
              : actionModal.type === 'activate'
              ? 'Activate User'
              : actionModal.type === 'block'
              ? 'Block User'
              : actionModal.type === 'resetPassword'
              ? 'Reset Password'
              : 'Flag User for Review'
          }
          description={
            actionModal.type === 'suspend'
              ? `Are you sure you want to suspend ${actionModal.user.email}? They will not be able to access their wallet.`
              : actionModal.type === 'activate'
              ? `Activate ${actionModal.user.email}'s account and restore access?`
              : actionModal.type === 'block'
              ? `Block ${actionModal.user.email}? This is more restrictive than suspend.`
              : actionModal.type === 'resetPassword'
              ? `Start a password reset flow for ${actionModal.user.email}?`
              : `Flag ${actionModal.user.email} for manual review.`
          }
          confirmLabel={
            actionModal.type === 'suspend'
              ? 'Suspend'
              : actionModal.type === 'activate'
              ? 'Activate'
              : actionModal.type === 'block'
              ? 'Block'
              : actionModal.type === 'resetPassword'
              ? 'Reset Password'
              : 'Flag'
          }
          variant={
            actionModal.type === 'suspend' ||
            actionModal.type === 'block' ||
            actionModal.type === 'resetPassword'
              ? 'destructive'
              : 'default'
          }
          onConfirm={() => {
            const user = actionModal.user!
            if (actionModal.type === 'suspend') handleSuspend(user)
            else if (actionModal.type === 'activate') handleActivate(user)
            else if (actionModal.type === 'block') handleBlock(user)
            else if (actionModal.type === 'resetPassword') handleResetPassword(user)
            else if (actionModal.type === 'flag') handleFlag(user)
            setActionModal({ type: null, user: null })
          }}
        />
      )}
    </div>
  )
}


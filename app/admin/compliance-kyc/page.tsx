'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import {
  CheckCircle2,
  Eye,
  Download,
  FileText,
  XCircle,
  AlertTriangle,
  User,
  Clock,
  Search,
  Copy,
  ShieldCheck,
  Phone,
  Mail,
  CreditCard,
  RefreshCw,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { apiGetUsers } from '@/lib/api/users'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type KYCStatus = 'pending' | 'verified' | 'rejected' | 'expired'
type ComplianceStatus = 'Compliant' | 'Under Review' | 'Non-Compliant'

interface KYCUser {
  userId: string
  fullName: string
  email: string
  phoneNumber: string
  nationalId: string
  status: KYCStatus
  complianceStatus: ComplianceStatus
  submittedAt: string
  // Persona KYC fields
  kycVerified: boolean
  personaInquiryId: string | null
  personaStatus: string | null
  personaVerifiedName: string | null
  personaVerifiedEmail: string | null
  personaVerifiedPhone: string | null
  personaVerifiedDob: string | null
  identityMismatchFlag: boolean | null
  identityMismatchDetails: string | null
}

interface KYCMetrics {
  totalUsers: number
  verifiedUsers: number
  pendingVerification: number
  rejectedVerifications: number
  identityMismatches: number
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComplianceKYCPage() {
  // State
  const [loading, setLoading] = useState(true)
  const [kycUsers, setKycUsers] = useState<KYCUser[]>([])
  const [metrics, setMetrics] = useState<KYCMetrics>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingVerification: 0,
    rejectedVerifications: 0,
    identityMismatches: 0,
  })

  // Modal states
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null)

  // Filter states
  const [filters, setFilters] = useState<{
    status: string
    complianceStatus: string
  }>({
    status: 'all',
    complianceStatus: 'all',
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Load KYC data from real API
  const loadKYCData = async () => {
    try {
      setLoading(true)
      const usersResponse = await apiGetUsers({ page: 0, limit: 500 })
      
      // Transform users into KYC view with Persona fields
      const kycUsersData: KYCUser[] = usersResponse.data.map((user: any) => {
        const kycVerified = user.kyc_verified ?? user.kycVerified ?? false
        const personaStatus = user.personaStatus
        
        // Determine KYC status based on kycVerified and personaStatus
        let status: KYCStatus = 'pending'
        if (kycVerified === true) {
          status = 'verified'
        } else if (personaStatus === 'declined' || personaStatus === 'failed') {
          status = 'rejected'
        } else if (personaStatus === 'expired') {
          status = 'expired'
        }
        
        // Determine compliance status
        let complianceStatus: ComplianceStatus = 'Under Review'
        if (status === 'verified' && !user.identityMismatchFlag) {
          complianceStatus = 'Compliant'
        } else if (status === 'rejected' || user.identityMismatchFlag) {
          complianceStatus = 'Non-Compliant'
        }
        
        const fullName = user.fullName || 
          [user.firstname, user.lastname].filter(Boolean).join(' ').trim() || 
          user.username || 
          'Unknown'
        
        return {
          userId: user.id,
          fullName,
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          nationalId: user.nationalId || '',
          status,
          complianceStatus,
          submittedAt: user.registrationDate || user.createdAt || new Date().toISOString(),
          // Persona KYC fields
          kycVerified: kycVerified,
          personaInquiryId: user.personaInquiryId || null,
          personaStatus: user.personaStatus || null,
          personaVerifiedName: user.personaVerifiedName || null,
          personaVerifiedEmail: user.personaVerifiedEmail || null,
          personaVerifiedPhone: user.personaVerifiedPhone || null,
          personaVerifiedDob: user.personaVerifiedDob || null,
          identityMismatchFlag: user.identityMismatchFlag ?? null,
          identityMismatchDetails: user.identityMismatchDetails || null,
        }
      })
      
      setKycUsers(kycUsersData)
      
      // Calculate metrics from real data
      setMetrics({
        totalUsers: kycUsersData.length,
        verifiedUsers: kycUsersData.filter((u) => u.status === 'verified').length,
        pendingVerification: kycUsersData.filter((u) => u.status === 'pending').length,
        rejectedVerifications: kycUsersData.filter((u) => u.status === 'rejected' || u.status === 'expired').length,
        identityMismatches: kycUsersData.filter((u) => u.identityMismatchFlag === true).length,
      })
      
    } catch (error) {
      console.error('Failed to load KYC data:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load KYC data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Initialize data
  useEffect(() => {
    loadKYCData()
  }, [])

  // Filtered data
  const filteredUsers = useMemo(() => {
    return kycUsers.filter((user) => {
      if (filters.status !== 'all' && user.status !== filters.status) return false
      if (filters.complianceStatus !== 'all' && user.complianceStatus !== filters.complianceStatus) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !user.fullName.toLowerCase().includes(query) &&
          !user.userId.toLowerCase().includes(query) &&
          !user.email.toLowerCase().includes(query) &&
          !user.phoneNumber.toLowerCase().includes(query) &&
          !(user.nationalId && user.nationalId.toLowerCase().includes(query))
        )
          return false
      }
      return true
    })
  }, [kycUsers, filters, searchQuery])

  // Table columns
  const kycColumns: Column<KYCUser>[] = [
    {
      key: 'user',
      header: 'User',
      accessor: (user) => (
        <div>
          <div className="font-medium text-foreground">{user.fullName}</div>
          <div className="text-xs text-muted-foreground font-mono mt-1">{user.userId}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'contact',
      header: 'Contact',
      accessor: (user) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{user.email || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{user.phoneNumber || 'N/A'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'nationalId',
      header: 'National ID',
      accessor: (user) => (
        <div className="flex items-center gap-1">
          <CreditCard className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-mono text-muted-foreground">{user.nationalId || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'KYC Status',
      accessor: (user) => {
        const colors = {
          verified: 'bg-green-500/20 text-green-400 border-green-500/30',
          rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
          expired: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        }
        return (
          <Badge className={colors[user.status]}>
            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
          </Badge>
        )
      },
      sortable: true,
    },
    {
      key: 'personaStatus',
      header: 'Persona Status',
      accessor: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.personaStatus || 'Not Started'}
        </span>
      ),
    },
    {
      key: 'complianceStatus',
      header: 'Compliance',
      accessor: (user) => {
        const colors = {
          Compliant: 'bg-green-500/20 text-green-400 border-green-500/30',
          'Non-Compliant': 'bg-red-500/20 text-red-400 border-red-500/30',
          'Under Review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        }
        return (
          <div className="flex items-center gap-2">
            <Badge className={colors[user.complianceStatus]}>{user.complianceStatus}</Badge>
            {user.identityMismatchFlag && (
              <span title="Identity Mismatch">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </span>
            )}
          </div>
        )
      },
      sortable: true,
    },
    {
      key: 'submittedAt',
      header: 'Registered',
      accessor: (user) => (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(user.submittedAt), 'MMM d, yyyy')}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (user) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedUser(user)}
          className="h-8"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-white dark:bg-black min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            Compliance & KYC
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage KYC verification and compliance status (Persona Integration)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadKYCData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast({ title: 'Export', description: 'Export functionality coming soon' })}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KYC Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.totalUsers}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">KYC Verified</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.verifiedUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {!loading && metrics.totalUsers > 0
                    ? `${Math.round((metrics.verifiedUsers / metrics.totalUsers) * 100)}% verified`
                    : ''}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.pendingVerification}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected/Expired</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.rejectedVerifications}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ID Mismatches</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.identityMismatches}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC Verification Queue */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>KYC Verification Records</CardTitle>
              <CardDescription>Users with KYC verification status from Persona</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64 bg-background border-slate-200 dark:border-slate-700"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-32 bg-background border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.complianceStatus}
                onValueChange={(value) => setFilters({ ...filters, complianceStatus: value })}
              >
                <SelectTrigger className="w-40 bg-background border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Compliance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Compliance</SelectItem>
                  <SelectItem value="Compliant">Compliant</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <DataTable
              data={filteredUsers}
              columns={kycColumns}
              pagination={{ pageSize: 15 }}
              emptyMessage="No KYC records found"
            />
          )}
        </CardContent>
      </Card>

      {/* User KYC Details Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-3xl bg-white dark:bg-black border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
                KYC Details - {selectedUser.fullName}
              </DialogTitle>
              <DialogDescription>Persona verification details and compliance status</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm">{selectedUser.userId}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUser.userId)
                        toast({ title: 'Copied', description: 'User ID copied' })
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium mt-1">{selectedUser.fullName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="mt-1">{selectedUser.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="mt-1">{selectedUser.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">National ID</Label>
                  <p className="font-mono mt-1">{selectedUser.nationalId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registered</Label>
                  <p className="mt-1">{format(parseISO(selectedUser.submittedAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>

              {/* KYC Status */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <h3 className="text-sm font-semibold mb-3">KYC Verification Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">KYC Verified</Label>
                    <div className="mt-1">
                      <Badge
                        className={
                          selectedUser.kycVerified
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }
                      >
                        {selectedUser.kycVerified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Compliance Status</Label>
                    <div className="mt-1">
                      <Badge
                        className={
                          selectedUser.complianceStatus === 'Compliant'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : selectedUser.complianceStatus === 'Non-Compliant'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }
                      >
                        {selectedUser.complianceStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Persona Details */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <h3 className="text-sm font-semibold mb-3">Persona Verification Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Persona Inquiry ID</Label>
                    <p className="font-mono text-sm mt-1">{selectedUser.personaInquiryId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Persona Status</Label>
                    <p className="mt-1">{selectedUser.personaStatus || 'Not Started'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Verified Name</Label>
                    <p className="mt-1">{selectedUser.personaVerifiedName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Verified Email</Label>
                    <p className="mt-1">{selectedUser.personaVerifiedEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Verified Phone</Label>
                    <p className="mt-1">{selectedUser.personaVerifiedPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Verified DOB</Label>
                    <p className="mt-1">{selectedUser.personaVerifiedDob || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Identity Mismatch Warning */}
              {selectedUser.identityMismatchFlag && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      <h3 className="text-sm font-semibold text-red-400">Identity Mismatch Detected</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.identityMismatchDetails || 'Identity verification data does not match user-provided information.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
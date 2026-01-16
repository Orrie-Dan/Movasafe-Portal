'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { toast } from '@/hooks/use-toast'
import {
  CheckCircle2,
  Eye,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  User,
  Clock,
  Search,
  Filter,
  Calendar,
  FileCheck,
  UserCheck,
  Ban,
  Bell,
  ShieldCheck,
  FileX,
  Upload,
  Copy,
  Image as ImageIcon,
} from 'lucide-react'
import { format, subDays, subHours, parseISO } from 'date-fns'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type KYCStatus = 'pending' | 'verified' | 'rejected' | 'expired'
type KYCLevel = 'Basic' | 'Full' | 'Enhanced'
type ComplianceStatus = 'Compliant' | 'Under Review' | 'Non-Compliant'
type AMLResult = 'Clear' | 'Potential Match' | 'High Risk'
type DocumentType = 'id' | 'passport' | 'selfie' | 'proof_of_address' | 'other'
type DocumentStatus = 'pending' | 'approved' | 'rejected'

interface KYCDocument {
  id: string
  type: DocumentType
  url: string
  status: DocumentStatus
  uploadedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

interface KYCUser {
  userId: string
  fullName: string
  email: string
  kycLevel: KYCLevel
  status: KYCStatus
  complianceStatus: ComplianceStatus
  submittedAt: string
  verifiedAt?: string
  rejectedAt?: string
  rejectedReason?: string
  documents: KYCDocument[]
  riskFlags?: string[]
  amlCheck?: {
    watchlist: AMLResult
    pep: AMLResult
    sanctions: AMLResult
    checkedAt: string
    reviewed: boolean
  }
}

interface AuditLogEntry {
  id: string
  reviewer: string
  action: string
  userId: string
  userName: string
  timestamp: string
  reason?: string
  comments?: string
}

interface Notification {
  id: string
  type: 'kyc_approved' | 'kyc_rejected' | 'documents_requested'
  userId: string
  userName: string
  message: string
  timestamp: string
  read: boolean
}

interface KYCMetrics {
  totalUsers: number
  verifiedUsers: number
  pendingVerification: number
  rejectedVerifications: number
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateMockKYCUsers = (): KYCUser[] => {
  const names = [
    'John Doe',
    'Jane Smith',
    'Michael Johnson',
    'Sarah Williams',
    'David Brown',
    'Emily Davis',
    'Robert Wilson',
    'Lisa Anderson',
    'James Taylor',
    'Maria Garcia',
    'William Martinez',
    'Patricia Lee',
    'Richard Thompson',
    'Jennifer White',
    'Charles Harris',
  ]

  const documentTypes: DocumentType[] = ['id', 'passport', 'selfie', 'proof_of_address']
  const kycLevels: KYCLevel[] = ['Basic', 'Full', 'Enhanced']
  const statuses: KYCStatus[] = ['pending', 'verified', 'rejected', 'expired']
  const complianceStatuses: ComplianceStatus[] = ['Compliant', 'Under Review', 'Non-Compliant']
  const amlResults: AMLResult[] = ['Clear', 'Potential Match', 'High Risk']

  return Array.from({ length: 20 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const submittedDate = subDays(new Date(), Math.floor(Math.random() * 30))
    
    return {
      userId: `user_${i + 1}`,
      fullName: names[i % names.length],
      email: `user${i + 1}@example.com`,
      kycLevel: kycLevels[Math.floor(Math.random() * kycLevels.length)],
      status,
      complianceStatus: complianceStatuses[Math.floor(Math.random() * complianceStatuses.length)],
      submittedAt: submittedDate.toISOString(),
      verifiedAt: status === 'verified' ? subHours(submittedDate, -2).toISOString() : undefined,
      rejectedAt: status === 'rejected' ? subHours(submittedDate, -1).toISOString() : undefined,
      rejectedReason: status === 'rejected' ? 'Document quality insufficient' : undefined,
      documents: documentTypes.map((type, idx) => ({
        id: `doc_${i}_${idx}`,
        type,
        url: `/documents/${i}_${type}.jpg`,
        status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)] as DocumentStatus,
        uploadedAt: subHours(submittedDate, -idx).toISOString(),
        reviewedAt: Math.random() > 0.5 ? subHours(submittedDate, -idx + 1).toISOString() : undefined,
        reviewedBy: Math.random() > 0.5 ? 'admin@movasafe.com' : undefined,
        rejectionReason: Math.random() > 0.7 ? 'Image quality too low' : undefined,
      })),
      riskFlags: Math.random() > 0.7 ? ['Unusual transaction pattern', 'High-risk country'] : [],
      amlCheck: {
        watchlist: amlResults[Math.floor(Math.random() * amlResults.length)],
        pep: amlResults[Math.floor(Math.random() * amlResults.length)],
        sanctions: amlResults[Math.floor(Math.random() * amlResults.length)],
        checkedAt: subHours(submittedDate, -1).toISOString(),
        reviewed: Math.random() > 0.5,
      },
    }
  })
}

const generateMockNotifications = (): Notification[] => {
  return [
    {
      id: 'notif_1',
      type: 'kyc_approved',
      userId: 'user_1',
      userName: 'John Doe',
      message: 'KYC verification approved for John Doe',
      timestamp: subHours(new Date(), 2).toISOString(),
      read: false,
    },
    {
      id: 'notif_2',
      type: 'documents_requested',
      userId: 'user_5',
      userName: 'David Brown',
      message: 'Additional documents requested for David Brown',
      timestamp: subHours(new Date(), 4).toISOString(),
      read: false,
    },
    {
      id: 'notif_3',
      type: 'kyc_rejected',
      userId: 'user_8',
      userName: 'Lisa Anderson',
      message: 'KYC verification rejected for Lisa Anderson',
      timestamp: subHours(new Date(), 6).toISOString(),
      read: true,
    },
  ]
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComplianceKYCPage() {
  // State
  const [loading, setLoading] = useState(true)
  const [kycUsers, setKycUsers] = useState<KYCUser[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [metrics, setMetrics] = useState<KYCMetrics>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingVerification: 0,
    rejectedVerifications: 0,
  })

  // Modal states
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
    variant?: 'default' | 'destructive'
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  })

  // Filter states
  const [filters, setFilters] = useState<{
    status: string
    kycLevel: string
    complianceStatus: string
    dateRange: string
  }>({
    status: 'all',
    kycLevel: 'all',
    complianceStatus: 'all',
    dateRange: 'all',
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize data
  useEffect(() => {
    setTimeout(() => {
      const users = generateMockKYCUsers()
      setKycUsers(users)
      setNotifications(generateMockNotifications())
      
      // Calculate metrics
      setMetrics({
        totalUsers: users.length,
        verifiedUsers: users.filter((u) => u.status === 'verified').length,
        pendingVerification: users.filter((u) => u.status === 'pending').length,
        rejectedVerifications: users.filter((u) => u.status === 'rejected').length,
      })
      
      setLoading(false)
    }, 1000)
  }, [])

  // Add audit log entry
  const addAuditLog = (
    reviewer: string,
    action: string,
    userId: string,
    userName: string,
    reason?: string,
    comments?: string
  ) => {
    const log: AuditLogEntry = {
      id: `log_${Date.now()}`,
      reviewer,
      action,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      reason,
      comments,
    }
    setAuditLogs((prev) => [log, ...prev].slice(0, 100)) // Keep last 100 entries
  }

  // KYC Actions
  const handleApproveKYC = (user: KYCUser) => {
    setConfirmDialog({
      open: true,
      title: 'Approve KYC Verification',
      description: `Are you sure you want to approve KYC verification for ${user.fullName}?`,
      onConfirm: () => {
        setKycUsers((prev) =>
          prev.map((u) =>
            u.userId === user.userId
              ? {
                  ...u,
                  status: 'verified' as KYCStatus,
                  verifiedAt: new Date().toISOString(),
                  complianceStatus: 'Compliant' as ComplianceStatus,
                }
              : u
          )
        )
        addAuditLog('admin@movasafe.com', 'Approve KYC', user.userId, user.fullName, undefined, reviewNote)
        
        // Add notification
        const notification: Notification = {
          id: `notif_${Date.now()}`,
          type: 'kyc_approved',
          userId: user.userId,
          userName: user.fullName,
          message: `KYC verification approved for ${user.fullName}`,
          timestamp: new Date().toISOString(),
          read: false,
        }
        setNotifications((prev) => [notification, ...prev])
        
        toast({
          title: 'KYC Approved',
          description: `KYC verification has been approved for ${user.fullName}`,
        })
        setSelectedUser(null)
        setReviewNote('')
        setConfirmDialog({ ...confirmDialog, open: false })
      },
    })
  }

  const handleRejectKYC = (user: KYCUser) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      })
      return
    }

    setConfirmDialog({
      open: true,
      title: 'Reject KYC Verification',
      description: `Are you sure you want to reject KYC verification for ${user.fullName}?`,
      variant: 'destructive',
      onConfirm: () => {
        setKycUsers((prev) =>
          prev.map((u) =>
            u.userId === user.userId
              ? {
                  ...u,
                  status: 'rejected' as KYCStatus,
                  rejectedAt: new Date().toISOString(),
                  rejectedReason: rejectionReason,
                  complianceStatus: 'Non-Compliant' as ComplianceStatus,
                }
              : u
          )
        )
        addAuditLog(
          'admin@movasafe.com',
          'Reject KYC',
          user.userId,
          user.fullName,
          rejectionReason,
          reviewNote
        )
        
        // Add notification
        const notification: Notification = {
          id: `notif_${Date.now()}`,
          type: 'kyc_rejected',
          userId: user.userId,
          userName: user.fullName,
          message: `KYC verification rejected for ${user.fullName}`,
          timestamp: new Date().toISOString(),
          read: false,
        }
        setNotifications((prev) => [notification, ...prev])
        
        toast({
          title: 'KYC Rejected',
          description: `KYC verification has been rejected for ${user.fullName}`,
          variant: 'destructive',
        })
        setSelectedUser(null)
        setRejectionReason('')
        setReviewNote('')
        setConfirmDialog({ ...confirmDialog, open: false })
      },
    })
  }

  const handleRequestDocuments = (user: KYCUser) => {
    addAuditLog(
      'admin@movasafe.com',
      'Request Additional Documents',
      user.userId,
      user.fullName,
      undefined,
      reviewNote
    )
    
    // Add notification
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      type: 'documents_requested',
      userId: user.userId,
      userName: user.fullName,
      message: `Additional documents requested for ${user.fullName}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setNotifications((prev) => [notification, ...prev])
    
    toast({
      title: 'Documents Requested',
      description: `Additional documents have been requested from ${user.fullName}`,
    })
    setReviewNote('')
  }

  const handleUpdateComplianceStatus = (user: KYCUser, status: ComplianceStatus) => {
    setKycUsers((prev) =>
      prev.map((u) => (u.userId === user.userId ? { ...u, complianceStatus: status } : u))
    )
    addAuditLog(
      'admin@movasafe.com',
      `Update Compliance Status to ${status}`,
      user.userId,
      user.fullName
    )
    toast({
      title: 'Compliance Status Updated',
      description: `Compliance status updated to ${status} for ${user.fullName}`,
    })
  }

  const handleMarkAMLReviewed = (user: KYCUser) => {
    setKycUsers((prev) =>
      prev.map((u) =>
        u.userId === user.userId && u.amlCheck
          ? {
              ...u,
              amlCheck: { ...u.amlCheck, reviewed: true },
            }
          : u
      )
    )
    addAuditLog('admin@movasafe.com', 'Mark AML Check as Reviewed', user.userId, user.fullName)
    toast({
      title: 'AML Check Reviewed',
      description: `AML check marked as reviewed for ${user.fullName}`,
    })
  }

  // Filtered data
  const filteredUsers = useMemo(() => {
    return kycUsers.filter((user) => {
      if (filters.status !== 'all' && user.status !== filters.status) return false
      if (filters.kycLevel !== 'all' && user.kycLevel !== filters.kycLevel) return false
      if (filters.complianceStatus !== 'all' && user.complianceStatus !== filters.complianceStatus) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !user.fullName.toLowerCase().includes(query) &&
          !user.userId.toLowerCase().includes(query) &&
          !user.email.toLowerCase().includes(query)
        )
          return false
      }
      return true
    })
  }, [kycUsers, filters, searchQuery])

  // Chart data
  const kycStatusChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      return {
        date: format(date, 'MMM d'),
        verified: Math.floor(Math.random() * 15) + 5,
        pending: Math.floor(Math.random() * 10) + 2,
        rejected: Math.floor(Math.random() * 5) + 1,
      }
    })
  }, [])

  // Table columns
  const kycColumns: Column<KYCUser>[] = [
    {
      key: 'user',
      header: 'User',
      accessor: (user) => (
        <div>
          <div className="font-medium text-foreground">{user.fullName}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <div className="text-xs text-muted-foreground font-mono mt-1">{user.userId}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'kycLevel',
      header: 'KYC Level',
      accessor: (user) => (
        <Badge
          variant={
            user.kycLevel === 'Enhanced'
              ? 'default'
              : user.kycLevel === 'Full'
              ? 'secondary'
              : 'outline'
          }
        >
          {user.kycLevel}
        </Badge>
      ),
      sortable: true,
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
      key: 'complianceStatus',
      header: 'Compliance',
      accessor: (user) => {
        const colors = {
          Compliant: 'bg-green-500/20 text-green-400 border-green-500/30',
          'Non-Compliant': 'bg-red-500/20 text-red-400 border-red-500/30',
          'Under Review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        }
        return <Badge className={colors[user.complianceStatus]}>{user.complianceStatus}</Badge>
      },
      sortable: true,
    },
    {
      key: 'documents',
      header: 'Documents',
      accessor: (user) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {user.documents.length} {user.documents.filter((d) => d.status === 'approved').length > 0 && (
              <span className="text-green-400">
                ({user.documents.filter((d) => d.status === 'approved').length} approved)
              </span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
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

  const auditLogColumns: Column<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      accessor: (log) => (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(log.timestamp), 'MMM d, HH:mm:ss')}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'reviewer',
      header: 'Reviewer',
      accessor: (log) => <span className="font-medium">{log.reviewer}</span>,
      sortable: true,
    },
    {
      key: 'action',
      header: 'Action',
      accessor: (log) => <span className="font-medium">{log.action}</span>,
      sortable: true,
    },
    {
      key: 'user',
      header: 'User',
      accessor: (log) => (
        <div>
          <div className="font-medium">{log.userName}</div>
          <div className="text-xs text-muted-foreground font-mono">{log.userId}</div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason/Comments',
      accessor: (log) => (
        <div className="text-sm text-muted-foreground">
          {log.reason && <div className="font-medium">{log.reason}</div>}
          {log.comments && <div className="mt-1">{log.comments}</div>}
        </div>
      ),
    },
  ]

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels = {
      id: 'ID Card',
      passport: 'Passport',
      selfie: 'Selfie',
      proof_of_address: 'Proof of Address',
      other: 'Other',
    }
    return labels[type]
  }

  const getAMLResultColor = (result: AMLResult) => {
    switch (result) {
      case 'Clear':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Potential Match':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'High Risk':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-black min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            Compliance & KYC
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage KYC verification and compliance status
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast({ title: 'Export', description: 'Export functionality will be implemented' })}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV/PDF
        </Button>
      </div>

      {/* KYC Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black border-slate-200 dark:border-slate-800">
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

        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">KYC Verified</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.verifiedUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {loading
                    ? ''
                    : `${Math.round((metrics.verifiedUsers / metrics.totalUsers) * 100)}% verified`}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Verification</p>
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

        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
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
      </div>

      {/* KYC Status Chart */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>KYC Verification Trends</CardTitle>
          <CardDescription>Last 7 days of KYC verifications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <EnhancedLineChart
              data={kycStatusChartData}
              dataKeys={[
                { key: 'verified', name: 'Verified', color: '#10b981' },
                { key: 'pending', name: 'Pending', color: '#f59e0b' },
                { key: 'rejected', name: 'Rejected', color: '#ef4444' },
              ]}
              xAxisKey="date"
              height={300}
            />
          )}
        </CardContent>
      </Card>

      {/* KYC Verification Queue */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>KYC Verification Queue</CardTitle>
              <CardDescription>Users awaiting KYC review and verification</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-48 bg-background border-slate-200 dark:border-slate-700"
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
                value={filters.kycLevel}
                onValueChange={(value) => setFilters({ ...filters, kycLevel: value })}
              >
                <SelectTrigger className="w-32 bg-background border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="KYC Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Full">Full</SelectItem>
                  <SelectItem value="Enhanced">Enhanced</SelectItem>
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
              pagination={{ pageSize: 10 }}
              emptyMessage="No KYC records found"
            />
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-400" />
            KYC Notifications
          </CardTitle>
          <CardDescription>Recent KYC status updates and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`border rounded-lg p-3 flex items-start justify-between ${
                    notif.read
                      ? 'border-slate-200 dark:border-slate-800 bg-black'
                      : 'border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          notif.type === 'kyc_approved'
                            ? 'default'
                            : notif.type === 'kyc_rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {notif.type === 'kyc_approved'
                          ? 'Approved'
                          : notif.type === 'kyc_rejected'
                          ? 'Rejected'
                          : 'Documents Requested'}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{notif.message}</span>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(notif.timestamp), 'MMM d, HH:mm')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === notif.id ? { ...n, read: !n.read } : n))
                      )
                    }}
                    className="h-8"
                  >
                    {notif.read ? 'Mark Unread' : 'Mark Read'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Review Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-5xl bg-black border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-400" />
                KYC Review - {selectedUser.fullName}
              </DialogTitle>
              <DialogDescription>Review KYC documents and verification status</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <p className="font-mono text-sm mt-1">{selectedUser.userId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium mt-1">{selectedUser.fullName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="mt-1">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">KYC Level</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedUser.kycLevel}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">KYC Status</Label>
                  <div className="mt-1">
                    <Badge
                      className={
                        selectedUser.status === 'verified'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : selectedUser.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }
                    >
                      {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
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
                <div>
                  <Label className="text-muted-foreground">Submitted At</Label>
                  <p className="text-sm mt-1">
                    {format(parseISO(selectedUser.submittedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                {selectedUser.verifiedAt && (
                  <div>
                    <Label className="text-muted-foreground">Verified At</Label>
                    <p className="text-sm mt-1">
                      {format(parseISO(selectedUser.verifiedAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </div>

              {/* Risk Flags */}
              {selectedUser.riskFlags && selectedUser.riskFlags.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2">Risk Flags</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.riskFlags.map((flag, idx) => (
                      <Badge key={idx} variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <Label className="text-muted-foreground mb-2">Uploaded Documents</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedUser.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border rounded-lg p-3 bg-black"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{getDocumentTypeLabel(doc.type)}</span>
                        </div>
                        <Badge
                          className={
                            doc.status === 'approved'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : doc.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }
                        >
                          {doc.status}
                        </Badge>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 rounded p-4 min-h-[120px] flex items-center justify-center mb-2">
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">Document Preview</p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {doc.url.split('/').pop()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDocument(doc)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          navigator.clipboard.writeText(doc.url)
                          toast({ title: 'Copied', description: 'Document URL copied to clipboard' })
                        }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      {doc.reviewedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Reviewed: {format(parseISO(doc.reviewedAt), 'MMM d, HH:mm')} by{' '}
                          {doc.reviewedBy}
                        </p>
                      )}
                      {doc.rejectionReason && (
                        <p className="text-xs text-red-400 mt-1">Reason: {doc.rejectionReason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AML & Watchlist Checks */}
              {selectedUser.amlCheck && (
                <div>
                  <Label className="text-muted-foreground mb-2">AML & Watchlist Checks</Label>
                  <div className="border rounded-lg p-4 bg-black">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Watchlist</Label>
                        <Badge className={getAMLResultColor(selectedUser.amlCheck.watchlist)}>
                          {selectedUser.amlCheck.watchlist}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">PEP Check</Label>
                        <Badge className={getAMLResultColor(selectedUser.amlCheck.pep)}>
                          {selectedUser.amlCheck.pep}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Sanctions</Label>
                        <Badge className={getAMLResultColor(selectedUser.amlCheck.sanctions)}>
                          {selectedUser.amlCheck.sanctions}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Checked: {format(parseISO(selectedUser.amlCheck.checkedAt), 'MMM d, HH:mm')}
                      </p>
                      {!selectedUser.amlCheck.reviewed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAMLReviewed(selectedUser)}
                        >
                          <ShieldCheck className="h-4 w-4 mr-1" />
                          Mark as Reviewed
                        </Button>
                      )}
                      {selectedUser.amlCheck.reviewed && (
                        <Badge variant="default">Reviewed</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Compliance Status Update */}
              <div>
                <Label className="text-muted-foreground mb-2">Update Compliance Status</Label>
                <div className="flex gap-2">
                  {(['Compliant', 'Under Review', 'Non-Compliant'] as ComplianceStatus[]).map(
                    (status) => (
                      <Button
                        key={status}
                        variant={selectedUser.complianceStatus === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUpdateComplianceStatus(selectedUser, status)}
                      >
                        {status}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* Review Notes */}
              <div>
                <Label className="text-muted-foreground mb-2">Review Notes</Label>
                <Textarea
                  placeholder="Add review notes or comments..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="bg-background border-slate-200 dark:border-slate-700"
                  rows={3}
                />
              </div>

              {/* Rejection Reason (if rejecting) */}
              {selectedUser.status === 'pending' && (
                <div>
                  <Label className="text-muted-foreground mb-2">Rejection Reason (if rejecting)</Label>
                  <Textarea
                    placeholder="Provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="bg-background border-slate-200 dark:border-slate-700"
                    rows={2}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="flex-wrap gap-2">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
              {selectedUser.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleRequestDocuments(selectedUser)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Request Documents
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectKYC(selectedUser)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject KYC
                  </Button>
                  <Button onClick={() => handleApproveKYC(selectedUser)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve KYC
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && selectedUser && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl bg-black border-slate-200 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle>{getDocumentTypeLabel(selectedDocument.type)}</DialogTitle>
              <DialogDescription>
                Document for {selectedUser.fullName} - {selectedDocument.status}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-slate-100 dark:bg-slate-800 rounded p-8 min-h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Document Preview</p>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    {selectedDocument.url}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    In production, this would display the actual document image or PDF viewer
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Document Details</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Type:</span>{' '}
                    {getDocumentTypeLabel(selectedDocument.type)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Status:</span>{' '}
                    <Badge
                      className={
                        selectedDocument.status === 'approved'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : selectedDocument.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }
                    >
                      {selectedDocument.status}
                    </Badge>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Uploaded:</span>{' '}
                    {format(parseISO(selectedDocument.uploadedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                  {selectedDocument.reviewedAt && (
                    <p>
                      <span className="text-muted-foreground">Reviewed:</span>{' '}
                      {format(parseISO(selectedDocument.reviewedAt), 'MMM d, yyyy HH:mm')} by{' '}
                      {selectedDocument.reviewedBy}
                    </p>
                  )}
                  {selectedDocument.rejectionReason && (
                    <p>
                      <span className="text-muted-foreground">Rejection Reason:</span>{' '}
                      <span className="text-red-400">{selectedDocument.rejectionReason}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* KYC History & Audit Log */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            KYC History & Audit Log
          </CardTitle>
          <CardDescription>Record of all KYC review actions and changes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p>No audit log entries yet</p>
              <p className="text-sm">Actions will be logged here as you review KYC submissions</p>
            </div>
          ) : (
            <DataTable
              data={auditLogs}
              columns={auditLogColumns}
              pagination={{ pageSize: 10 }}
              emptyMessage="No audit log entries"
            />
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { DateRangePicker } from '@/components/admin/DateRangePicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { apiGetAuditLogs, apiExportAuditLogs } from '@/lib/api/audit'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { PermissionGate } from '@/components/admin/PermissionGate'
import type { AuditLog } from '@/lib/types/audit'
import { Download, Search, AlertTriangle, Shield } from 'lucide-react'
import { AlertCenter } from '@/components/dashboard/alerts/AlertCenter'
import { useMemo } from 'react'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    status: '',
    search: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
  })

  useEffect(() => {
    loadLogs()
  }, [filters])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const params: any = {
        limit: 100,
      }
      if (filters.action) params.action = filters.action
      if (filters.resource) params.resource = filters.resource
      if (filters.status) params.status = filters.status
      if (filters.search) params.search = filters.search
      if (filters.startDate) params.startDate = filters.startDate.toISOString()
      if (filters.endDate) params.endDate = filters.endDate.toISOString()

      const response = await apiGetAuditLogs(params)
      setLogs(response.data)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load audit logs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params: any = {}
      if (filters.startDate) params.startDate = filters.startDate.toISOString()
      if (filters.endDate) params.endDate = filters.endDate.toISOString()
      if (filters.action) params.action = filters.action
      if (filters.resource) params.resource = filters.resource
      if (filters.status) params.status = filters.status

      const blob = await apiExportAuditLogs(params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Success',
        description: 'Audit logs exported successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export audit logs',
        variant: 'destructive',
      })
    }
  }

  // Failed login attempts alerts
  const failedLoginAlerts = useMemo(() => {
    const failedLogins = logs.filter(log => 
      log.action?.toLowerCase().includes('login') && 
      (log.status === 'failed' || log.status === 'error')
    )
    
    if (failedLogins.length === 0) return []
    
    return [{
      id: 'failed-logins',
      type: 'error' as const,
      title: 'Failed Login Attempts',
      description: `${failedLogins.length} failed login attempts detected`,
      count: failedLogins.length,
      onAction: () => {
        setFilters({ ...filters, action: 'login', status: 'failed' })
      },
    }]
  }, [logs])

  const columns: Column<AuditLog>[] = [
    {
      key: 'admin',
      header: 'Admin',
      accessor: (log) => (
        <div>
          <div className="font-medium text-foreground">{log.user?.fullName || log.userId}</div>
          {log.user?.role && (
            <div className="text-xs text-muted-foreground">{log.user.role}</div>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'action',
      header: 'Action',
      accessor: (log) => (
        <span className="text-foreground">{log.action}</span>
      ),
      sortable: true,
    },
    {
      key: 'target',
      header: 'Target',
      accessor: (log) => (
        <span className="text-muted-foreground text-sm">
          {log.resource} {log.resourceId ? `(${log.resourceId.slice(0, 8)}...)` : ''}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      accessor: (log) => (
        <span className="text-foreground">
          {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'user',
      header: 'User',
      accessor: (log) => (
        <div>
          <div className="text-foreground">{log.username || log.userEmail || log.userId}</div>
          {log.userEmail && log.username && (
            <div className="text-sm text-muted-foreground">{log.userEmail}</div>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      accessor: (log) => (
        <span className="text-blue-400 font-medium">{log.action}</span>
      ),
      sortable: true,
    },
    {
      key: 'resource',
      header: 'Resource',
      accessor: (log) => (
        <div>
          <div className="text-foreground">{log.resource}</div>
          {log.resourceId && (
            <div className="text-sm text-muted-foreground">{log.resourceId}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (log) => (
        <span
          className={`text-xs px-2 py-1 rounded ${
            log.status === 'success'
              ? 'bg-green-500/10 text-green-400'
              : log.status === 'failure'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-yellow-500/10 text-yellow-400'
          }`}
        >
          {log.status}
        </span>
      ),
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      accessor: (log) => (
        <span className="text-muted-foreground text-sm">{log.ipAddress || '-'}</span>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-black">
      <PageHeader
        title="Audit Logs"
        description="View and export system activity logs"
        action={{
          label: 'Export',
          onClick: handleExport,
          icon: <Download className="h-4 w-4 mr-2" />,
          permission: PERMISSIONS.EXPORT_LOGS,
        }}
      />

      {/* Failed Login Attempts Alert */}
      {failedLoginAlerts.length > 0 && (
        <AlertCenter
          alerts={failedLoginAlerts}
          title="Security Alerts"
          description="Failed login attempts detected"
        />
      )}

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-foreground"
              />
            </div>
            <Select
              value={filters.action}
              onValueChange={(value) => setFilters({ ...filters, action: value })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker
              value={{ from: filters.startDate, to: filters.endDate }}
              onChange={(range) =>
                setFilters({
                  ...filters,
                  startDate: range.from,
                  endDate: range.to,
                })
              }
            />
          </div>

          <DataTable
            data={logs}
            columns={columns}
            pagination={{ pageSize: 50 }}
            emptyMessage="No audit logs found"
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}


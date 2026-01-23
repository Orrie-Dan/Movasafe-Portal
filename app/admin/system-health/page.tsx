'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { PerformanceChangeMetrics } from '@/components/analytics/PerformanceChangeMetrics'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, CheckCircle2, AlertTriangle, XCircle, Database, Server, Filter } from 'lucide-react'
import type { SystemHealth } from '@/lib/types/fintech'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMemo } from 'react'

// Mock data - replace with actual API calls
const mockSystemHealth: SystemHealth[] = [
  {
    service: 'API Gateway',
    status: 'operational',
    uptime: 99.9,
    responseTime: 120,
    errorRate: 0.1,
    lastChecked: new Date().toISOString(),
  },
  {
    service: 'Payment Processor',
    status: 'operational',
    uptime: 99.8,
    responseTime: 85,
    errorRate: 0.2,
    lastChecked: new Date().toISOString(),
  },
  {
    service: 'Database',
    status: 'degraded',
    uptime: 98.5,
    responseTime: 250,
    errorRate: 1.5,
    lastChecked: new Date().toISOString(),
  },
]

const mockUptimeData = [
  { date: 'Mon', uptime: 99.9 },
  { date: 'Tue', uptime: 99.8 },
  { date: 'Wed', uptime: 99.9 },
  { date: 'Thu', uptime: 99.7 },
  { date: 'Fri', uptime: 99.9 },
  { date: 'Sat', uptime: 99.8 },
  { date: 'Sun', uptime: 99.9 },
]

const mockErrorRateData = [
  { date: 'Mon', errors: 0.1 },
  { date: 'Tue', errors: 0.2 },
  { date: 'Wed', errors: 0.1 },
  { date: 'Thu', errors: 0.3 },
  { date: 'Fri', errors: 0.1 },
  { date: 'Sat', errors: 0.2 },
  { date: 'Sun', errors: 0.1 },
]

export default function SystemHealthPage() {
  const [loading, setLoading] = useState(true)
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>(mockSystemHealth)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Mock queue/job backlog data
  const queueBacklog = useMemo(() => ({
    pendingJobs: 1247,
    processingJobs: 89,
    failedJobs: 12,
    completedToday: 3456,
  }), [])

  const filteredServices = useMemo(() => {
    if (filterStatus === 'all') return systemHealth
    return systemHealth.filter(s => s.status === filterStatus)
  }, [systemHealth, filterStatus])

  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchData = async () => {
    //   const data = await apiGetSystemHealth()
    //   setSystemHealth(data)
    //   setLoading(false)
    // }
    // fetchData()
    setLoading(false)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Operational
          </Badge>
        )
      case 'degraded':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Degraded
          </Badge>
        )
      case 'down':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Down
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-white dark:bg-black">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
          <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          System Health
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Monitor API uptime, error rates, and service status
        </p>
      </div>

      {/* Queue & Job Backlog Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="pb-2 px-6 pt-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="z-10 relative text-sm font-medium text-slate-600 dark:text-slate-400">Pending Jobs</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{queueBacklog.pendingJobs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="pb-2 px-6 pt-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="z-10 relative text-sm font-medium text-slate-600 dark:text-slate-400">Processing</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{queueBacklog.processingJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently running</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="pb-2 px-6 pt-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="z-10 relative text-sm font-medium text-slate-600 dark:text-slate-400">Failed Jobs</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{queueBacklog.failedJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="pb-2 px-6 pt-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="z-10 relative text-sm font-medium text-slate-600 dark:text-slate-400">Completed Today</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{queueBacklog.completedToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="z-10 relative text-slate-900 dark:text-white">API Uptime</CardTitle>
            <CardDescription className="z-10 relative">Last 7 days</CardDescription>
          </div>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <EnhancedLineChart
                data={mockUptimeData}
                dataKeys={[{ key: 'uptime', name: 'Uptime %', color: '#10b981' }]}
                xAxisKey="date"
                height={300}
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="z-10 relative text-slate-900 dark:text-white">Error Rate</CardTitle>
            <CardDescription className="z-10 relative">Last 7 days</CardDescription>
          </div>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <EnhancedLineChart
                data={mockErrorRateData}
                dataKeys={[{ key: 'errors', name: 'Error Rate %', color: '#ef4444' }]}
                xAxisKey="date"
                height={300}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Status Table */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between z-10 relative">
            <div>
              <CardTitle className="text-slate-900 dark:text-white">Service Status</CardTitle>
              <CardDescription className="z-10 relative">Real-time service health monitoring</CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="degraded">Degraded</SelectItem>
                <SelectItem value="down">Down</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Service</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Uptime</TableHead>
                  <TableHead className="text-slate-400">Response Time</TableHead>
                  <TableHead className="text-slate-400">Error Rate</TableHead>
                  <TableHead className="text-slate-400">Last Checked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.service} className="border-slate-700 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-white">{service.service}</TableCell>
                    <TableCell>{getStatusBadge(service.status)}</TableCell>
                    <TableCell className="text-slate-300">{service.uptime.toFixed(2)}%</TableCell>
                    <TableCell className="text-slate-300">{service.responseTime}ms</TableCell>
                    <TableCell className="text-slate-300">{service.errorRate.toFixed(2)}%</TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {new Date(service.lastChecked).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle className="z-10 relative text-slate-900 dark:text-white">Performance Metrics</CardTitle>
          <CardDescription className="z-10 relative">System performance trends and changes</CardDescription>
        </div>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <PerformanceChangeMetrics data={null} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}


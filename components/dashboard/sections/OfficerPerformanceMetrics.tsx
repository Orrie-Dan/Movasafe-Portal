'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { GaugeChart } from '@/components/gauge-chart'
import { UserCheck, RefreshCw, FileText, TrendingUp } from 'lucide-react'
import type { OfficerMetrics } from '@/lib/api'

export interface OfficerPerformanceMetricsProps {
  officerMetrics: OfficerMetrics[]
  loading?: boolean
  onRefresh?: () => void
  reports?: Array<{
    id: string
    title: string
    status: string
    currentAssignment?: {
      assignee?: { id: string }
    }
  }>
  sort?: 'highest' | 'lowest'
  onSortChange?: (sort: 'highest' | 'lowest') => void
  page?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  className?: string
}

export function OfficerPerformanceMetrics({
  officerMetrics,
  loading = false,
  onRefresh,
  reports = [],
  sort: externalSort,
  onSortChange,
  page: externalPage,
  onPageChange,
  pageSize: externalPageSize,
  onPageSizeChange,
  className,
}: OfficerPerformanceMetricsProps) {
  const [internalSort, setInternalSort] = useState<'highest' | 'lowest'>('highest')
  const [internalPage, setInternalPage] = useState(1)
  const [internalPageSize, setInternalPageSize] = useState(10)
  
  const sort = externalSort !== undefined ? externalSort : internalSort
  const page = externalPage !== undefined ? externalPage : internalPage
  const pageSize = externalPageSize !== undefined ? externalPageSize : internalPageSize
  
  const setSort = onSortChange || setInternalSort
  const setPage = onPageChange || setInternalPage
  const setPageSize = onPageSizeChange || setInternalPageSize

  // Calculate current active assignments for each officer
  const officerAssignments = new Map<string, { count: number; tasks: Array<{ id: string; title: string; status: string }> }>()
  
  officerMetrics.forEach(officer => {
    officerAssignments.set(officer.officerId, { count: 0, tasks: [] })
  })
  
  reports.forEach(report => {
    const assigneeId = report.currentAssignment?.assignee?.id
    if (assigneeId && officerAssignments.has(assigneeId)) {
      if (report.status !== 'resolved' && report.status !== 'rejected') {
        const current = officerAssignments.get(assigneeId)!
        current.count++
        current.tasks.push({
          id: report.id,
          title: report.title,
          status: report.status
        })
        officerAssignments.set(assigneeId, current)
      }
    }
  })
  
  const officersWithAssignments = officerMetrics.map((officer: any) => ({
    ...officer,
    currentAssignments: officerAssignments.get(officer.officerId) || { count: 0, tasks: [] },
    isFree: (officerAssignments.get(officer.officerId)?.count || 0) === 0,
  }))
  
  const sortedOfficers = [...officersWithAssignments].sort((a, b) => {
    if (sort === 'highest') {
      return (b.performance || 0) - (a.performance || 0)
    } else {
      return (a.performance || 0) - (b.performance || 0)
    }
  })

  const totalPages = Math.ceil(sortedOfficers.length / pageSize)
  const startIndex = (page - 1) * pageSize
  const paginatedOfficers = sortedOfficers.slice(startIndex, startIndex + pageSize)

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all">
        <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="relative z-10">
            <CardTitle size="lg" className="flex items-center gap-2 text-white">
              <UserCheck className="h-5 w-5 text-blue-400" />
              Officer Performance Metrics
            </CardTitle>
            <CardDescription className="text-slate-400">
              Case statistics and success rates for all officers
            </CardDescription>
          </div>
          {onRefresh && (
            <div className="relative z-10">
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                disabled={loading}
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 transition-all"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          )}
        </div>
        <CardContent>
          {loading ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                    <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                      <Skeleton className="h-4 w-24 relative z-10" />
                      <Skeleton className="h-8 w-8 rounded relative z-10" />
                    </div>
                    <CardContent>
                      <Skeleton className="h-8 w-20 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </>
          ) : officerMetrics.length === 0 ? (
            <EmptyState
              title="No Officer Metrics Available"
              description="Officer performance data will appear here once officers start completing collections."
              icon={UserCheck}
            />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                  <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                    <CardTitle size="sm" className="text-white z-10 relative">Total Officers</CardTitle>
                    <div className="p-2 rounded-lg bg-blue-500/10 relative z-10">
                      <UserCheck className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{officerMetrics.length}</div>
                    <p className="text-xs text-slate-400 mt-1">Active officers</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                  <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                    <CardTitle size="sm" className="text-white z-10 relative">Total Cases</CardTitle>
                    <div className="p-2 rounded-lg bg-purple-500/10 relative z-10">
                      <FileText className="h-4 w-4 text-purple-400" />
                    </div>
                  </div>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {officerMetrics.reduce((sum, m) => sum + m.totalCollections, 0)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Across all officers</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                  <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                    <CardTitle size="sm" className="text-white z-10 relative">Avg Success Rate</CardTitle>
                    <div className="p-2 rounded-lg bg-green-500/10 relative z-10">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {officerMetrics.length > 0
                        ? Math.round(
                            officerMetrics.reduce((sum, m) => sum + (m.performance || 0), 0) / officerMetrics.length
                          )
                        : 0}
                      %
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Average across all officers</p>
                  </CardContent>
                </Card>
              </div>

              {/* Gauge Charts Visualization */}
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 mb-6">
                <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10 flex-1">
                    <div>
                      <CardTitle size="md" className="text-white">Success Rate by Officer</CardTitle>
                      <CardDescription className="text-slate-400">Individual officer performance metrics</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={sort}
                        onChange={(e) => {
                          const value = e.target.value as 'highest' | 'lowest'
                          setSort(value)
                          setPage(1)
                        }}
                      >
                        <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="highest">Highest First</SelectItem>
                          <SelectItem value="lowest">Lowest First</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={String(pageSize)}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value))
                          setPage(1)
                        }}
                      >
                        <SelectTrigger className="w-[120px] bg-slate-800 border-slate-700 text-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="20">20 per page</SelectItem>
                          <SelectItem value="30">30 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                    {paginatedOfficers.map((officer: any) => (
                      <div
                        key={officer.officerId}
                        className="flex flex-col p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-white mb-1">{officer.officerName || 'Unknown'}</h3>
                            <p className="text-xs text-slate-400">{officer.officerEmail || ''}</p>
                          </div>
                          <Badge 
                            className={`${
                              officer.isFree 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            } text-xs px-2 py-1 min-w-[60px] text-center inline-block`}
                          >
                            {officer.isFree ? 'Free' : 'Busy'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-center mb-3">
                          <GaugeChart
                            value={officer.performance || 0}
                            label=""
                          />
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Resolved:</span>
                            <span className="font-medium">{officer.completed || 0} / {officer.totalCollections || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Current Tasks:</span>
                            <span className={`font-medium ${
                              officer.currentAssignments?.count > 0 ? 'text-orange-400' : 'text-green-400'
                            }`}>
                              {officer.currentAssignments?.count || 0}
                            </span>
                          </div>
                          {officer.currentAssignments?.count > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-700">
                              <p className="text-slate-400 mb-1">Active Tasks:</p>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {officer.currentAssignments.tasks.slice(0, 3).map((task: any) => (
                                  <div key={task.id} className="text-slate-300 truncate" title={task.title}>
                                    • {task.title}
                                  </div>
                                ))}
                                {officer.currentAssignments.tasks.length > 3 && (
                                  <div className="text-slate-400 text-xs">
                                    +{officer.currentAssignments.tasks.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-700">
                      <div className="text-sm text-slate-400">
                        Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedOfficers.length)} of {sortedOfficers.length} officers
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPage(1)}
                          disabled={page === 1}
                          className="text-slate-400 hover:text-white"
                        >
                          First
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPage(prev => Math.max(1, prev - 1))}
                          disabled={page === 1}
                          className="text-slate-400 hover:text-white"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-slate-400 px-2">
                          Page {page} of {totalPages}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={page === totalPages}
                          className="text-slate-400 hover:text-white"
                        >
                          Next
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPage(totalPages)}
                          disabled={page === totalPages}
                          className="text-slate-400 hover:text-white"
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


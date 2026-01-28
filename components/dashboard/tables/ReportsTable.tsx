'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Search,
  Filter,
  Calendar as CalendarIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  CheckSquare,
  Square,
  Settings,
  Save,
  Columns,
  Camera,
  MoreVertical,
  MapPin,
  Eye,
  UserCheck,
  Send,
  CheckCircle,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import type { AdminReport } from '@/lib/api'

export interface ReportsTableProps {
  reports: AdminReport[]
  loading?: boolean
  onViewReport?: (report: AdminReport) => void
  onAssignReport?: (report: AdminReport) => void
  onUpdateStatus?: (reportId: string, status: string) => Promise<void>
  onAutoAssign?: () => Promise<void>
  onExport?: () => void
  onRefresh?: () => void
  getTypeDisplayName?: (type: string) => string
  getSeverityBadgeClassName?: (severity: string) => string
  getStatusBadgeClassName?: (status: string) => string
  formatLocation?: (report: AdminReport) => string
  getPhotoCount?: (report: AdminReport) => number
  isOverdue?: (report: AdminReport) => boolean
  updatingStatus?: string | null
  autoAssigning?: boolean
  // Geographic filter props
  filterProvince?: string | null
  filterDistrict?: string | null
  filterSector?: string | null
  onProvinceFilterChange?: (province: string | null) => void
  onDistrictFilterChange?: (district: string | null) => void
  onSectorFilterChange?: (sector: string | null) => void
  className?: string
}

export function ReportsTable({
  reports,
  loading = false,
  onViewReport,
  onAssignReport,
  onUpdateStatus,
  onAutoAssign,
  onExport,
  onRefresh,
  getTypeDisplayName = (type: string) => type,
  getSeverityBadgeClassName = () => '',
  getStatusBadgeClassName = () => '',
  formatLocation = (report: AdminReport) => report.district || 'Unknown',
  getPhotoCount = (report: AdminReport) => report.photos?.length || 0,
  isOverdue = () => false,
  updatingStatus = null,
  autoAssigning = false,
  filterProvince,
  filterDistrict,
  filterSector,
  onProvinceFilterChange,
  onDistrictFilterChange,
  onSectorFilterChange,
  className,
}: ReportsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' })
  const [sortColumn, setSortColumn] = useState<string>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5)
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(['title', 'type', 'severity', 'status', 'location', 'assignedTo', 'photos', 'createdAt', 'actions']))
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [showColumnToggle, setShowColumnToggle] = useState(false)
  const [searchReporter, setSearchReporter] = useState('')
  const [searchAssignee, setSearchAssignee] = useState('')

  // Filter reports
  const filteredReports = reports.filter(report => {
    if (filterProvince && report.province?.trim() !== filterProvince) return false
    if (filterDistrict && report.district?.trim() !== filterDistrict) return false
    if (filterSector && report.sector?.trim() !== filterSector) return false
    if (filterStatus && report.status !== filterStatus) return false
    if (filterType && report.type !== filterType) return false
    if (filterSeverity && report.severity !== filterSeverity) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!report.title.toLowerCase().includes(query) && 
          !report.description.toLowerCase().includes(query)) {
        return false
      }
    }
    if (searchReporter) {
      const query = searchReporter.toLowerCase()
      if (!report.reporter?.email?.toLowerCase().includes(query) &&
          !report.reporter?.fullName?.toLowerCase().includes(query)) {
        return false
      }
    }
    if (searchAssignee) {
      const query = searchAssignee.toLowerCase()
      const assigneeName = report.currentAssignment?.assignee?.fullName?.toLowerCase() || ''
      const orgName = report.currentAssignment?.organization?.name?.toLowerCase() || ''
      if (!assigneeName.includes(query) && !orgName.includes(query)) {
        return false
      }
    }
    if (dateRange.from || dateRange.to) {
      const reportDate = new Date(report.createdAt)
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from)
        fromDate.setHours(0, 0, 0, 0)
        if (reportDate < fromDate) return false
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        if (reportDate > toDate) return false
      }
    }
    return true
  })

  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortColumn) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      case 'severity':
        const severityOrder = { low: 1, medium: 2, high: 3 }
        aValue = severityOrder[a.severity as keyof typeof severityOrder] || 0
        bValue = severityOrder[b.severity as keyof typeof severityOrder] || 0
        break
      case 'type':
        aValue = a.type
        bValue = b.type
        break
      case 'createdAt':
      default:
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedReports.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedReports = sortedReports.slice(startIndex, startIndex + pageSize)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const handleSelectAll = () => {
    if (selectedReports.size === paginatedReports.length) {
      setSelectedReports(new Set())
    } else {
      setSelectedReports(new Set(paginatedReports.map(r => r.id)))
    }
  }

  const handleSelectReport = (reportId: string) => {
    const newSelected = new Set(selectedReports)
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId)
    } else {
      newSelected.add(reportId)
    }
    setSelectedReports(newSelected)
  }

  const handleQuickTriage = async (report: AdminReport) => {
    if (onUpdateStatus) {
      await onUpdateStatus(report.id, 'triaged')
    }
  }

  const handleQuickResolve = async (report: AdminReport) => {
    if (onUpdateStatus) {
      await onUpdateStatus(report.id, 'resolved')
    }
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedReports.size === 0 || !onUpdateStatus) return
    
    const promises = Array.from(selectedReports).map(id => onUpdateStatus(id, status))
    await Promise.all(promises)
    setSelectedReports(new Set())
  }

  const clearFilters = () => {
    setFilterStatus('')
    setFilterType('')
    setFilterSeverity('')
    setSearchQuery('')
    setDateRange({ from: '', to: '' })
    setSearchReporter('')
    setSearchAssignee('')
    onProvinceFilterChange?.(null)
    onDistrictFilterChange?.(null)
    onSectorFilterChange?.(null)
    setCurrentPage(1)
  }

  const uniqueTypes = Array.from(new Set(reports.map(r => r.type)))

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-5 w-5 text-slate-400" />
        <h2 className="text-xl font-semibold text-white">Reports Management</h2>
      </div>
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all">
        <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="flex items-center justify-between flex-wrap gap-4 relative z-10 flex-1">
            <div>
              <CardTitle size="md" className="text-white">
                Reports ({filteredReports.length})
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review, assign, and resolve reports
              </CardDescription>
              {/* Geographic Filter Indicators */}
              {(filterProvince || filterDistrict || filterSector) && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">Active filters:</span>
                  {filterProvince && (
                    <Badge 
                      variant="secondary" 
                      className="bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30 cursor-pointer"
                      onClick={() => {
                        onProvinceFilterChange?.(null)
                        onDistrictFilterChange?.(null)
                      }}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Province: {filterProvince}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  {filterDistrict && (
                    <Badge 
                      variant="secondary" 
                      className="bg-green-500/20 text-green-300 border-green-500/50 hover:bg-green-500/30 cursor-pointer"
                      onClick={() => {
                        onDistrictFilterChange?.(null)
                      }}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      District: {filterDistrict}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  {filterSector && (
                    <Badge 
                      variant="secondary" 
                      className="bg-purple-500/20 text-purple-300 border-purple-500/50 hover:bg-purple-500/30 cursor-pointer"
                      onClick={() => {
                        onSectorFilterChange?.(null)
                      }}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Sector: {filterSector}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onAutoAssign && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAutoAssign}
                  disabled={autoAssigning}
                  className="bg-blue-600/10 border-blue-500/50 text-blue-400 hover:bg-blue-600/20 hover:border-blue-500 hover:text-blue-300"
                  title="Auto-assign unassigned reports to officers with fewer cases"
                >
                  <UserCheck className={`h-4 w-4 mr-2 ${autoAssigning ? 'animate-spin' : ''}`} />
                  {autoAssigning ? 'Assigning...' : 'Auto-Assign'}
                </Button>
              )}
              {selectedReports.size > 0 && (
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm text-slate-400">{selectedReports.size} selected</span>
                  <Select
                    value=""
                    onChange={(e) => {
                      const value = e.target.value
                      if (value) handleBulkStatusUpdate(value)
                    }}
                  >
                    <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-white h-8">
                      <SelectValue placeholder="Bulk Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="triaged">Mark as Triaged</SelectItem>
                      <SelectItem value="assigned">Mark as Assigned</SelectItem>
                      <SelectItem value="in_progress">Mark In Progress</SelectItem>
                      <SelectItem value="resolved">Mark Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {onExport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onExport}
                  className="text-slate-400 hover:text-white"
                  title="Export to CSV"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="text-slate-400 hover:text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
              {(filterProvince || filterDistrict || filterSector || filterStatus || filterType || filterSeverity || searchQuery || dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="space-y-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <Input
                  placeholder="Search reports by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <Settings className="h-4 w-4 mr-2" />
                {showAdvancedSearch ? 'Hide' : 'Advanced'} Search
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColumnToggle(!showColumnToggle)}
                className="text-slate-400 hover:text-white hover:bg-slate-700/50"
              >
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </div>
            
            {/* Advanced Search */}
            {showAdvancedSearch && (
              <div className="flex items-center gap-4 flex-wrap p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <Input
                    placeholder="Search by reporter email/name..."
                    value={searchReporter}
                    onChange={(e) => setSearchReporter(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <UserCheck className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <Input
                    placeholder="Search by assignee email/name..."
                    value={searchAssignee}
                    onChange={(e) => setSearchAssignee(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
                  />
                </div>
              </div>
            )}

            {/* Column Visibility Toggle */}
            {showColumnToggle && (
              <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Columns className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Visible Columns</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'title', label: 'Title' },
                    { key: 'type', label: 'Type' },
                    { key: 'severity', label: 'Severity' },
                    { key: 'status', label: 'Status' },
                    { key: 'assignedTo', label: 'Assigned To' },
                    { key: 'createdAt', label: 'Created' },
                  ].map(col => (
                    <label key={col.key} className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.key)}
                        onChange={(e) => {
                          const newVisible = new Set(visibleColumns)
                          if (e.target.checked) {
                            newVisible.add(col.key)
                          } else {
                            newVisible.delete(col.key)
                          }
                          setVisibleColumns(newVisible)
                        }}
                        className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-300">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <Select value={filterStatus || undefined} onChange={(e) => setFilterStatus(e.target.value === 'all' ? '' : e.target.value)}>
                  <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white hover:border-slate-600">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="triaged">Triaged</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={filterType || undefined} onChange={(e) => setFilterType(e.target.value === 'all' ? '' : e.target.value)}>
                <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white hover:border-slate-600">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>{getTypeDisplayName(type)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSeverity || undefined} onChange={(e) => setFilterSeverity(e.target.value === 'all' ? '' : e.target.value)}>
                <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white hover:border-slate-600">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-[160px] bg-slate-800/50 border-slate-700 text-white hover:border-slate-600 focus:border-slate-600"
                  placeholder="From"
                />
                <span className="text-slate-400">to</span>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-[160px] bg-slate-800/50 border-slate-700 text-white hover:border-slate-600 focus:border-slate-600"
                  placeholder="To"
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableHead className="w-12">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center justify-center"
                      title="Select all"
                    >
                      {selectedReports.size === paginatedReports.length && paginatedReports.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-blue-400" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </TableHead>
                  {visibleColumns.has('title') && (
                    <TableHead className="text-sm font-medium text-slate-600">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-1 hover:text-white"
                      >
                        Title
                        {sortColumn === 'title' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-500" />
                        )}
                      </button>
                    </TableHead>
                  )}
                  {visibleColumns.has('type') && (
                    <TableHead className="text-sm font-medium text-slate-600">
                      <button
                        onClick={() => handleSort('type')}
                        className="flex items-center gap-1 hover:text-white"
                      >
                        Type
                        {sortColumn === 'type' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-500" />
                        )}
                      </button>
                    </TableHead>
                  )}
                  {visibleColumns.has('severity') && (
                    <TableHead className="text-sm font-medium text-slate-600">
                      <button
                        onClick={() => handleSort('severity')}
                        className="flex items-center gap-1 hover:text-white"
                      >
                        Severity
                        {sortColumn === 'severity' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-500" />
                        )}
                      </button>
                    </TableHead>
                  )}
                  {visibleColumns.has('status') && (
                    <TableHead className="text-sm font-medium text-slate-600">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 hover:text-white"
                      >
                        Status
                        {sortColumn === 'status' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-500" />
                        )}
                      </button>
                    </TableHead>
                  )}
                  {visibleColumns.has('location') && (
                    <TableHead className="text-sm font-medium text-slate-600">Location</TableHead>
                  )}
                  {visibleColumns.has('assignedTo') && (
                    <TableHead className="text-sm font-medium text-slate-600">Assigned To</TableHead>
                  )}
                  {visibleColumns.has('photos') && (
                    <TableHead className="text-sm font-medium text-slate-600">Photos</TableHead>
                  )}
                  {visibleColumns.has('createdAt') && (
                    <TableHead className="text-sm font-medium text-slate-600">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 hover:text-white"
                      >
                        Created
                        {sortColumn === 'createdAt' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-slate-500" />
                        )}
                      </button>
                    </TableHead>
                  )}
                  {visibleColumns.has('actions') && (
                    <TableHead className="text-sm font-medium text-slate-600">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                        {visibleColumns.has('title') && (
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                        )}
                        {visibleColumns.has('type') && (
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                        )}
                        {visibleColumns.has('severity') && (
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                        )}
                        {visibleColumns.has('status') && (
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                        )}
                        {visibleColumns.has('location') && (
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        )}
                        {visibleColumns.has('assignedTo') && (
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        )}
                        {visibleColumns.has('photos') && (
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                        )}
                        {visibleColumns.has('createdAt') && (
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        )}
                        {visibleColumns.has('actions') && (
                          <TableCell>
                            <Skeleton className="h-8 w-20" />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </>
                ) : paginatedReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.size + 1} className="h-[400px]">
                      <EmptyState
                        title="No Reports Found"
                        description={
                          searchQuery || filterStatus || filterType || filterSeverity || filterProvince || filterDistrict || filterSector
                            ? "No reports match your current filters. Try adjusting your search criteria."
                            : "No reports have been created yet. Reports will appear here once they are submitted."
                        }
                        icon={FileText}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReports.map((report) => (
                    <TableRow key={report.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>
                        <button
                          onClick={() => handleSelectReport(report.id)}
                          className="flex items-center justify-center"
                        >
                          {selectedReports.has(report.id) ? (
                            <CheckSquare className="h-4 w-4 text-blue-400" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </TableCell>
                      {visibleColumns.has('title') && (
                        <TableCell className="font-medium text-white max-w-xs truncate text-sm">{report.title}</TableCell>
                      )}
                      {visibleColumns.has('type') && (
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="border-slate-700 text-slate-300 whitespace-nowrap px-2 py-1 min-w-[80px] text-center inline-block text-xs">
                            {getTypeDisplayName(report.type)}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.has('severity') && (
                        <TableCell>
                          <Badge variant={report.severity === 'high' ? 'destructive' : report.severity === 'medium' ? 'default' : 'secondary'} className="px-2 py-1 min-w-[80px] text-center inline-block text-xs">
                            {report.severity}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.has('status') && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusBadgeClassName(report.status)} border text-xs px-2 py-1 min-w-[80px] text-center inline-block`}>
                              {report.status}
                            </Badge>
                            {isOverdue(report) && (
                              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                          {visibleColumns.has('location') && (
                            <TableCell className="text-slate-300 text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-500 flex-shrink-0" />
                                {(onProvinceFilterChange || onDistrictFilterChange) ? (
                                  <button
                                    onClick={() => {
                                      if (report.district && onDistrictFilterChange) {
                                        onDistrictFilterChange(report.district)
                                      }
                                      if (report.province && onProvinceFilterChange) {
                                        onProvinceFilterChange(report.province)
                                      }
                                    }}
                                    className="hover:text-blue-400 hover:underline text-left max-w-[150px] truncate"
                                    title={`Click to filter by ${formatLocation(report)}`}
                                  >
                                    {formatLocation(report)}
                                  </button>
                                ) : (
                                  formatLocation(report)
                                )}
                              </div>
                            </TableCell>
                          )}
                      {visibleColumns.has('assignedTo') && (
                        <TableCell className="text-slate-300 text-sm">
                          {report.currentAssignment?.assignee ? (
                            <span>{report.currentAssignment.assignee.fullName}</span>
                          ) : report.currentAssignment?.organization ? (
                            <span>{report.currentAssignment.organization.name}</span>
                          ) : (
                            <span className="text-slate-500">Unassigned</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.has('photos') && (
                        <TableCell className="text-slate-400 text-sm">
                          {getPhotoCount(report) > 0 ? (
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/50 text-xs px-2 py-1">
                              <Camera className="h-3 w-3 mr-1 inline" />
                              {getPhotoCount(report)}
                            </Badge>
                          ) : (
                            <span className="text-slate-500 text-xs">No photos</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.has('createdAt') && (
                        <TableCell className="text-slate-400 text-sm">
                          {format(new Date(report.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                      )}
                      {visibleColumns.has('actions') && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 bg-transparent border-0">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-900 border-slate-700 text-white right-0">
                              {onViewReport && (
                                <DropdownMenuItem
                                  onClick={() => onViewReport(report)}
                                  className="text-blue-400 focus:text-blue-300 focus:bg-slate-800 cursor-pointer"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              )}
                              {report.status === 'new' && onUpdateStatus && (
                                <DropdownMenuItem
                                  onClick={() => updatingStatus !== report.id && handleQuickTriage(report)}
                                  className={`text-purple-400 focus:text-purple-300 focus:bg-slate-800 ${updatingStatus === report.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Mark as Triaged
                                </DropdownMenuItem>
                              )}
                              {(report.status === 'new' || report.status === 'triaged') && onAssignReport && (
                                <DropdownMenuItem
                                  onClick={() => onAssignReport(report)}
                                  className="text-orange-400 focus:text-orange-300 focus:bg-slate-800 cursor-pointer"
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Assign Report
                                </DropdownMenuItem>
                              )}
                              {report.status !== 'resolved' && report.status !== 'rejected' && onUpdateStatus && (
                                <>
                                  {(report.status === 'new' || report.status === 'triaged' || report.status === 'assigned') && (
                                    <DropdownMenuSeparator className="bg-slate-700" />
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => updatingStatus !== report.id && handleQuickResolve(report)}
                                    className={`text-green-400 focus:text-green-300 focus:bg-slate-800 ${updatingStatus === report.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Resolved
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {sortedReports.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedReports.length)} of {sortedReports.length} reports
                </span>
                <Select
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[100px] h-8 bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-slate-400">per page</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="text-slate-400 hover:text-white"
                >
                  First
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="text-slate-400 hover:text-white"
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-400 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="text-slate-400 hover:text-white"
                >
                  Next
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="text-slate-400 hover:text-white"
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


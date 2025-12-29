'use client'

import { useState, useEffect } from 'react'
import { apiGetCollections, apiGetCollectionsStats, apiGetServiceProviders, apiGetMarkets, type Collection, type ServiceProvider, type Market } from '@/lib/api'
import { AdminSidebar } from '@/components/admin-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ReportDetailView } from '@/components/report-detail-view'
import { Trash2, RefreshCw, Search, Eye, Calendar, MapPin, Truck, TrendingUp, Clock, Building2, Store, Filter, X, Layers, FileText, Inbox, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { MetricTooltip } from '@/components/ui/tooltip'
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns'
import { COLLECTION_STATUSES, STATUS_DISPLAY_NAMES } from '@/components/constants/waste-types'

// Rwanda provinces
const RWANDA_PROVINCES = [
  'Kigali City',
  'Eastern Province',
  'Northern Province',
  'Southern Province',
  'Western Province',
] as const

const COLLECTION_TYPES = [
  { value: 'household', label: 'Household' },
  { value: 'public_space', label: 'Public Space' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'institutional', label: 'Institutional' },
  { value: 'market', label: 'Market' },
  { value: 'smart_bin', label: 'Smart Bin' },
  { value: 'special', label: 'Special' },
] as const

function getCollectionStatusBadge(status: string) {
  // Map report statuses to collection statuses
  const statusMap: Record<string, string> = {
    'new': 'scheduled',
    'triaged': 'scheduled',
    'assigned': 'scheduled',
    'in_progress': 'in_progress',
    'resolved': 'completed',
    'rejected': 'cancelled',
  }
  
  const collectionStatus = statusMap[status] || status
  
  switch (collectionStatus) {
    case 'scheduled':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'in_progress':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    case 'completed':
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'missed':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'cancelled':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }
}

function getCollectionStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'new': 'scheduled',
    'triaged': 'scheduled',
    'assigned': 'scheduled',
    'in_progress': 'in_progress',
    'resolved': 'completed',
    'rejected': 'cancelled',
  }
  
  const collectionStatus = statusMap[status] || status
  return STATUS_DISPLAY_NAMES[collectionStatus as keyof typeof STATUS_DISPLAY_NAMES] || collectionStatus.replace('_', ' ')
}

export default function WasteCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCollectionType, setFilterCollectionType] = useState<string>('')
  const [filterProvince, setFilterProvince] = useState<string>('')
  const [filterDistrict, setFilterDistrict] = useState<string>('')
  const [filterSector, setFilterSector] = useState<string>('')
  const [filterServiceProvider, setFilterServiceProvider] = useState<string>('')
  const [filterDateRange, setFilterDateRange] = useState<string>('')
  const [stats, setStats] = useState({
    totalCollections: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    todayCollections: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [collectionsResponse, statsResponse, providersResponse, marketsResponse] = await Promise.all([
        apiGetCollections({ limit: 1000 }),
        apiGetCollectionsStats(),
        apiGetServiceProviders(),
        apiGetMarkets(),
      ])
      
      setCollections(collectionsResponse.data)
      setServiceProviders(providersResponse.data)
      setMarkets(marketsResponse.data)
      
      // Update stats from API response
      setStats({
        totalCollections: statsResponse.totalCollections || collectionsResponse.data.length,
        scheduled: statsResponse.scheduled || 0,
        inProgress: statsResponse.inProgress || 0,
        completed: statsResponse.completed || 0,
        todayCollections: statsResponse.todayCollections || 0,
      })
    } catch (error) {
      console.error('Failed to fetch collections:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch collections'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleViewCollection = (collection: Collection) => {
    setSelectedCollection(collection)
    setIsDetailOpen(true)
  }

  const handleCollectionUpdated = () => {
    fetchData()
    setIsDetailOpen(false)
  }

  const getCollectionTypeLabel = (type: string) => {
    return COLLECTION_TYPES.find(t => t.value === type)?.label || type
  }

  const getMarketName = (marketId?: string) => {
    if (!marketId) return null
    return markets.find(m => m.id === marketId)?.name || null
  }

  const getServiceProviderName = (providerId?: string) => {
    if (!providerId) return null
    return serviceProviders.find(p => p.id === providerId)?.name || null
  }

  const filteredCollections = collections.filter(collection => {
    // Status filter
    if (filterStatus && filterStatus !== 'all' && collection.status !== filterStatus) {
      return false
    }
    
    // Collection type filter
    if (filterCollectionType && filterCollectionType !== 'all' && collection.collectionType !== filterCollectionType) {
      return false
    }
    
    // Province filter
    if (filterProvince && filterProvince !== 'all' && collection.location.province !== filterProvince) {
      return false
    }
    
    // District filter
    if (filterDistrict && filterDistrict !== 'all' && collection.location.district !== filterDistrict) {
      return false
    }
    
    // Sector filter
    if (filterSector && filterSector !== 'all' && collection.location.sector !== filterSector) {
      return false
    }
    
    // Service provider filter
    if (filterServiceProvider && filterServiceProvider !== 'all' && collection.serviceProviderId !== filterServiceProvider) {
      return false
    }
    
    // Date range filter
    if (filterDateRange && filterDateRange !== 'all') {
      const collectionDate = parseISO(collection.scheduledTime)
      switch (filterDateRange) {
        case 'today':
          if (!isToday(collectionDate)) return false
          break
        case 'week':
          if (!isThisWeek(collectionDate)) return false
          break
        case 'month':
          if (!isThisMonth(collectionDate)) return false
          break
      }
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const searchableText = [
        collection.collectionNumber,
        collection.location.address,
        collection.location.sector,
        collection.location.district,
        collection.location.province,
        collection.assignedOfficer.name,
        getServiceProviderName(collection.serviceProviderId),
        getMarketName(collection.source.marketId),
      ].filter(Boolean).join(' ').toLowerCase()
      
      if (!searchableText.includes(query)) {
        return false
      }
    }
    return true
  })

  // Get unique values for filters
  const uniqueProvinces = Array.from(new Set(collections.map(c => c.location.province).filter(Boolean)))
  const uniqueDistricts = filterProvince && filterProvince !== 'all'
    ? Array.from(new Set(collections.filter(c => c.location.province === filterProvince).map(c => c.location.district).filter(Boolean)))
    : Array.from(new Set(collections.map(c => c.location.district).filter(Boolean)))
  const uniqueSectors = filterDistrict && filterDistrict !== 'all'
    ? Array.from(new Set(collections.filter(c => c.location.district === filterDistrict).map(c => c.location.sector).filter(Boolean)))
    : Array.from(new Set(collections.map(c => c.location.sector).filter(Boolean)))

  // Count active filters
  const activeFiltersCount = [
    searchQuery,
    filterStatus,
    filterCollectionType,
    filterDateRange,
    filterProvince,
    filterDistrict,
    filterSector,
    filterServiceProvider,
  ].filter(Boolean).length

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('')
    setFilterStatus('')
    setFilterCollectionType('')
    setFilterDateRange('')
    setFilterProvince('')
    setFilterDistrict('')
    setFilterSector('')
    setFilterServiceProvider('')
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <AdminSidebar variant="admin" userName="Admin User" userRole="admin" />
      
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader userName="Admin User" userRole="Administrator" />
        
        <div className="p-6 lg:p-8 space-y-8 bg-black">
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="group bg-black border-slate-800 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-800 bg-black relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Total Collections</CardTitle>
                <div className="relative z-10 p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Trash2 className="h-4 w-4 text-blue-400" />
              </div>
              </div>
              <CardContent className="p-6 bg-black">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-white mb-1">{stats.totalCollections.toLocaleString()}</div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      All time
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="group bg-black border-slate-800 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 cursor-pointer">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-800 bg-black relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Scheduled</CardTitle>
                <div className="relative z-10 p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <Calendar className="h-4 w-4 text-green-400" />
              </div>
              </div>
              <CardContent className="p-6 bg-black">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-white mb-1">{stats.scheduled.toLocaleString()}</div>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Upcoming
                </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="group bg-black border-slate-800 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300 cursor-pointer">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-800 bg-black relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">In Progress</CardTitle>
                <div className="relative z-10 p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                  <Clock className="h-4 w-4 text-yellow-400" />
              </div>
              </div>
              <CardContent className="p-6 bg-black">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-white mb-1">{stats.inProgress.toLocaleString()}</div>
                    <p className="text-xs text-yellow-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Active now
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="group bg-black border-slate-800 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 cursor-pointer">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-800 bg-black relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Completed</CardTitle>
                <div className="relative z-10 p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
              </div>
              <CardContent className="p-6 bg-black">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-white mb-1">{stats.completed.toLocaleString()}</div>
                    <p className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      This period
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="group bg-black border-slate-800 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-800 bg-black relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Today</CardTitle>
                <div className="relative z-10 p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Calendar className="h-4 w-4 text-purple-400" />
              </div>
              </div>
              <CardContent className="p-6 bg-black">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-white mb-1">{stats.todayCollections.toLocaleString()}</div>
                    <p className="text-xs text-purple-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Collections
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Collection Type Breakdown */}
          <Card className="bg-black border-slate-800">
            <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-900/50 bg-black">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <CardTitle size="md" className="text-white relative z-10">Collection Type Breakdown</CardTitle>
              <CardDescription className="text-slate-400 relative z-10">Collections by type and source</CardDescription>
            </div>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {COLLECTION_TYPES.map((type) => {
                  const count = collections.filter(c => c.collectionType === type.value).length
                  const totalWeight = collections
                    .filter(c => c.collectionType === type.value)
                    .reduce((sum, c) => sum + (c.wasteData?.totalWeight || 0), 0)
                  return (
                    <div key={type.value} className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                      <div className="text-sm text-slate-400 mb-1">{type.label}</div>
                      <div className="text-2xl font-bold text-white mb-1">{count}</div>
                      <div className="text-xs text-slate-400">
                        {totalWeight > 0 ? `${(totalWeight / 1000).toFixed(1)}K kg` : 'No weight data'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="bg-black border-slate-800">
            <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-900/50 bg-black">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <CardTitle size="md" className="text-white relative z-10">Collection Performance Metrics</CardTitle>
              <CardDescription className="text-slate-400 relative z-10">Efficiency and completion metrics</CardDescription>
            </div>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Completion Rate</div>
                  <div className="text-2xl font-bold text-white">
                    {stats.totalCollections > 0 
                      ? Math.round((stats.completed / stats.totalCollections) * 100)
                      : 0}%
                  </div>
                  <div className="text-xs text-green-400 mt-1">Completed / Total</div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Missed Collections</div>
                  <div className="text-2xl font-bold text-red-400">
                    {collections.filter(c => c.status === 'missed').length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Requires attention</div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">On-Time Rate</div>
                  <div className="text-2xl font-bold text-white">
                    {collections.filter(c => {
                      if (!c.actualStartTime || !c.scheduledTime) return false
                      const scheduled = new Date(c.scheduledTime)
                      const actual = new Date(c.actualStartTime)
                      const diff = Math.abs(actual.getTime() - scheduled.getTime()) / (1000 * 60) // minutes
                      return diff <= 30 // within 30 minutes
                    }).length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Within 30 min</div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Avg Collections/Day</div>
                  <div className="text-2xl font-bold text-white">
                    {stats.todayCollections > 0 ? stats.todayCollections : 'N/A'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Today's average</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card className="bg-black border-slate-800">
            <CardHeader>
              <CardTitle size="md">Geographic Distribution</CardTitle>
              <CardDescription className="text-slate-400">Collections by location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {RWANDA_PROVINCES.map((province) => {
                  const provinceCollections = collections.filter(c => c.location.province === province).length
                  return (
                    <div key={province} className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-400" />
                        <div className="text-sm font-medium text-white">{province}</div>
                      </div>
                      <div className="text-2xl font-bold text-white">{provinceCollections}</div>
                      <div className="text-xs text-slate-400 mt-1">Collections</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle size="md">Waste Collections ({filteredCollections.length})</CardTitle>
                  <CardDescription className="text-slate-400">Manage and track waste collection operations</CardDescription>
                </div>
                <Button 
                  onClick={fetchData} 
                  variant="outline" 
                  size="sm" 
                  disabled={loading}
                  className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 backdrop-blur-sm p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-300 mb-1">Error loading collections</p>
                    <p className="text-xs text-red-400/80">{error}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Filters */}
              <div className="space-y-4 p-5 rounded-lg bg-black border border-slate-800">
                {/* Filter Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <h3 className="text-xs font-medium text-slate-400">Filters</h3>
                    {activeFiltersCount > 0 && (
                      <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                        {activeFiltersCount} active
                      </Badge>
                    )}
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Search Bar */}
                <div className="pb-3 border-b border-slate-800">
                  <label className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Search Collections
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search by ID, location, officer, or provider..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="h-9 w-9 p-0 text-slate-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Primary Filters */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Collection Filters
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Status Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Status
                      </label>
                      <Select value={filterStatus || ''} onChange={(e) => setFilterStatus(e.target.value === 'all' ? '' : e.target.value)}>
                        <SelectTrigger className={`w-full bg-slate-900/50 border-slate-800 text-white hover:border-slate-700 focus:border-blue-500/50 ${filterStatus ? 'border-blue-500/50' : ''}`}>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                    </SelectContent>
                  </Select>
                    </div>

                    {/* Collection Type Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Layers className="h-3 w-3" />
                        Collection Type
                      </label>
                      <Select value={filterCollectionType || ''} onChange={(e) => setFilterCollectionType(e.target.value === 'all' ? '' : e.target.value)}>
                        <SelectTrigger className={`w-full bg-slate-900/50 border-slate-800 text-white hover:border-slate-700 focus:border-blue-500/50 ${filterCollectionType ? 'border-blue-500/50' : ''}`}>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {COLLECTION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        Date Range
                      </label>
                      <Select value={filterDateRange || ''} onChange={(e) => setFilterDateRange(e.target.value === 'all' ? '' : e.target.value)}>
                        <SelectTrigger className={`w-full bg-slate-900/50 border-slate-800 text-white hover:border-slate-700 focus:border-blue-500/50 ${filterDateRange ? 'border-blue-500/50' : ''}`}>
                      <SelectValue placeholder="All Dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                    </div>
                  </div>
                </div>
                
                {/* Geographic Filters */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Location Filters
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Province Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500">Province</label>
                      <Select value={filterProvince || ''} onChange={(e) => {
                        const value = e.target.value
                    setFilterProvince(value === 'all' ? '' : value)
                    setFilterDistrict('')
                    setFilterSector('')
                  }}>
                        <SelectTrigger className={`w-full bg-slate-900/50 border-slate-800 text-white hover:border-slate-700 focus:border-blue-500/50 ${filterProvince ? 'border-blue-500/50' : ''}`}>
                      <SelectValue placeholder="All Provinces" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Provinces</SelectItem>
                      {RWANDA_PROVINCES.map(province => (
                        <SelectItem key={province} value={province}>{province}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    </div>

                    {/* District Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500">District</label>
                      <Select 
                        value={filterDistrict || ''} 
                        onChange={(e) => {
                          const value = e.target.value
                    setFilterDistrict(value === 'all' ? '' : value)
                    setFilterSector('')
                        }} 
                        disabled={!filterProvince || filterProvince === 'all'}
                      >
                        <SelectTrigger className={`w-full bg-slate-900/50 border-slate-800 text-white hover:border-slate-700 focus:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed ${filterDistrict ? 'border-blue-500/50' : ''}`}>
                          <SelectValue placeholder={!filterProvince || filterProvince === 'all' ? "Select province first" : "All Districts"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Districts</SelectItem>
                      {uniqueDistricts.map(district => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    </div>

                    {/* Sector Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500">Sector</label>
                      <Select 
                        value={filterSector || ''} 
                        onChange={(e) => setFilterSector(e.target.value === 'all' ? '' : e.target.value)} 
                        disabled={!filterDistrict || filterDistrict === 'all'}
                      >
                        <SelectTrigger className={`w-full bg-slate-900/50 border-slate-800 text-white hover:border-slate-700 focus:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed ${filterSector ? 'border-blue-500/50' : ''}`}>
                          <SelectValue placeholder={!filterDistrict || filterDistrict === 'all' ? "Select district first" : "All Sectors"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sectors</SelectItem>
                      {uniqueSectors.map(sector => (
                        <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    </div>

                    {/* Service Provider Filter */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" />
                        Service Provider
                      </label>
                      <Select value={filterServiceProvider || ''} onChange={(e) => setFilterServiceProvider(e.target.value === 'all' ? '' : e.target.value)}>
                        <SelectTrigger className={`w-full bg-slate-900/50 border-slate-800 text-white hover:border-slate-700 focus:border-blue-500/50 ${filterServiceProvider ? 'border-blue-500/50' : ''}`}>
                      <SelectValue placeholder="All Providers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {serviceProviders.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-slate-800 overflow-hidden bg-black">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                      <TableRow className="border-slate-800 bg-slate-900 hover:bg-slate-900">
                        <TableHead className="text-slate-300 font-semibold">Collection ID</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Type</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Location</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Service Provider</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Assigned Officer</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Scheduled Date</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <TableRow key={i} className="border-slate-800">
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                      </TableRow>
                          ))}
                        </>
                    ) : filteredCollections.length === 0 ? (
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          <TableCell colSpan={8} className="p-0">
                            <EmptyState
                              title="No collections found"
                              description={activeFiltersCount > 0 
                                ? "Try adjusting your filters to see more results."
                                : "No waste collections have been recorded yet."}
                              icon={Inbox}
                              action={activeFiltersCount > 0 ? {
                                label: "Clear all filters",
                                onClick: clearAllFilters
                              } : undefined}
                            />
                        </TableCell>
                      </TableRow>
                    ) : (
                        filteredCollections.map((collection, index) => (
                          <TableRow 
                            key={collection.id} 
                            className="border-slate-800 hover:bg-slate-800/60 transition-colors duration-150 group cursor-pointer"
                            onClick={() => handleViewCollection(collection)}
                          >
                            <TableCell className="font-medium text-white group-hover:text-blue-400 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {collection.collectionNumber || `#${collection.id.slice(0, 8)}`}
                              </div>
                          </TableCell>
                          <TableCell>
                              <div className="flex flex-col gap-1.5">
                                <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs w-fit">
                              {getCollectionTypeLabel(collection.collectionType)}
                            </Badge>
                            {collection.source.marketId && (
                                  <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Store className="h-3 w-3" />
                                {getMarketName(collection.source.marketId)}
                              </div>
                            )}
                              </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-slate-300">
                              <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <span className="max-w-xs truncate">{collection.location.address || `${collection.location.sector}, ${collection.location.district}`}</span>
                              </div>
                                <div className="text-xs text-slate-400 pl-6">
                                {collection.location.sector}, {collection.location.district}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                              <Badge className={`${getCollectionStatusBadge(collection.status)} border text-xs px-2.5 py-1 font-medium`}>
                              {STATUS_DISPLAY_NAMES[collection.status as keyof typeof STATUS_DISPLAY_NAMES] || collection.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {collection.serviceProviderId ? (
                              <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <span className="max-w-xs truncate">{getServiceProviderName(collection.serviceProviderId) || 'Unknown'}</span>
                              </div>
                            ) : (
                                <span className="text-slate-500 italic">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {collection.assignedOfficer ? (
                              <div className="flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <span>{collection.assignedOfficer.name}</span>
                              </div>
                            ) : (
                                <span className="text-slate-500 italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            {format(new Date(collection.scheduledTime), 'MMM d, yyyy')}
                              </div>
                          </TableCell>
                          <TableCell>
                              <MetricTooltip content="View Details">
                            <Button
                              variant="ghost"
                              size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewCollection(collection)
                                  }}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                              </MetricTooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-black border-slate-800 text-white">
          {selectedCollection && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Trash2 className="h-5 w-5 text-blue-400" />
                  </div>
                  Collection Details
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/30">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Collection Number</span>
                      <p className="text-white font-medium">{selectedCollection.collectionNumber || selectedCollection.id}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Type</span>
                      <Badge variant="outline" className="border-slate-700 text-slate-300 text-sm">
                        {getCollectionTypeLabel(selectedCollection.collectionType)}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Status</span>
                      <Badge className={`${getCollectionStatusBadge(selectedCollection.status)} border text-sm px-3 py-1.5 font-medium`}>
                        {STATUS_DISPLAY_NAMES[selectedCollection.status as keyof typeof STATUS_DISPLAY_NAMES] || selectedCollection.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Scheduled Date</span>
                      <p className="text-white font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(selectedCollection.scheduledTime), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/30">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h4>
                  <div className="space-y-2">
              <div>
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Address</span>
                      <p className="text-white font-medium mt-1">{selectedCollection.location.address || 'N/A'}</p>
                  </div>
                    <div className="grid grid-cols-3 gap-4">
                  <div>
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Sector</span>
                        <p className="text-white mt-1">{selectedCollection.location.sector}</p>
                  </div>
                  <div>
                        <span className="text-xs text-slate-500 uppercase tracking-wide">District</span>
                        <p className="text-white mt-1">{selectedCollection.location.district}</p>
                  </div>
                  <div>
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Province</span>
                        <p className="text-white mt-1">{selectedCollection.location.province}</p>
                  </div>
                    </div>
                  </div>
                </div>

                {/* Assignment Information */}
                <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/30">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Assignment
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                  {selectedCollection.serviceProviderId && (
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Service Provider</span>
                        <p className="text-white font-medium flex items-center gap-2 mt-1">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          {getServiceProviderName(selectedCollection.serviceProviderId)}
                        </p>
                      </div>
                    )}
                    {selectedCollection.assignedOfficer && (
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Assigned Officer</span>
                        <p className="text-white font-medium flex items-center gap-2 mt-1">
                          <Truck className="h-4 w-4 text-slate-400" />
                          {selectedCollection.assignedOfficer.name}
                        </p>
                    </div>
                  )}
                  {selectedCollection.source.marketId && (
                      <div className="space-y-1">
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Market</span>
                        <p className="text-white font-medium flex items-center gap-2 mt-1">
                          <Store className="h-4 w-4 text-slate-400" />
                          {getMarketName(selectedCollection.source.marketId)}
                        </p>
                    </div>
                  )}
                  </div>
                </div>

                {/* Waste Data */}
                  {selectedCollection.wasteData && (
                  <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/30">
                    <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Waste Data
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Total Weight</span>
                        <p className="text-white font-semibold text-lg mt-1">
                          {selectedCollection.wasteData.totalWeight.toLocaleString()} {selectedCollection.wasteData.unit}
                        </p>
                      </div>
                      {selectedCollection.wasteData.wasteTypes && selectedCollection.wasteData.wasteTypes.length > 0 && (
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wide mb-2 block">Waste Types</span>
                          <div className="grid grid-cols-2 gap-2">
                          {selectedCollection.wasteData.wasteTypes.map((wt, idx) => (
                              <div key={idx} className="p-2 rounded border border-slate-700 bg-slate-800/30">
                                <span className="text-xs text-slate-400">{wt.type}</span>
                                <p className="text-white font-medium">{wt.weight} {selectedCollection.wasteData.unit}</p>
                            </div>
                          ))}
                        </div>
                    </div>
                  )}
                </div>
              </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailOpen(false)}
                  className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


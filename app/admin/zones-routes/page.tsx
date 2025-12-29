'use client'

import { useState, useEffect } from 'react'
import { apiGetOrganizations, apiGetGeographicData } from '@/lib/api'
import { AdminSidebar } from '@/components/admin-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { MetricTooltip } from '@/components/ui/tooltip'
import { MapPin, RefreshCw, Search, Plus, Edit, Trash2, Route, Users, TrendingUp, CheckCircle2, Inbox, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { WasteGenerationHeatmap } from '@/components/dashboard/geographic/WasteGenerationHeatmap'
import { CollectionHotspots } from '@/components/dashboard/geographic/CollectionHotspots'
import { BinStatusMap } from '@/components/dashboard/geographic/BinStatusMap'
import { IllegalDumpingMap } from '@/components/dashboard/geographic/IllegalDumpingMap'

// Rwanda's administrative structure
const RWANDA_PROVINCES = [
  'Kigali City',
  'Eastern Province',
  'Northern Province',
  'Southern Province',
  'Western Province',
] as const

// Note: Rwanda has 30 districts total and 416 sectors total
// For demo purposes, we'll use a subset

interface Zone {
  id: string
  name: string
  province: string
  district: string
  sector: string
  coverage: number
  routes: number
  collections: number
  status: 'active' | 'inactive'
  serviceProviderId?: string
}

interface Route {
  id: string
  name: string
  zone: string
  assignedOfficer: string
  collections: number
  efficiency: number
  status: 'active' | 'inactive'
}

export default function ZonesRoutesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'zones' | 'routes'>('zones')
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false)
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [zoneSortConfig, setZoneSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [routeSortConfig, setRouteSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [zoneCurrentPage, setZoneCurrentPage] = useState(1)
  const [routeCurrentPage, setRouteCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [orgsResponse, geoResponse] = await Promise.all([
        apiGetOrganizations(),
        apiGetGeographicData(),
      ])

      // Mock zones based on Rwanda's geographic structure
      // Zones map to sectors (primary zone level) or districts (for larger operations)
      const mockZones: Zone[] = geoResponse.provinces.map((province, provIdx) => {
        // Create zones for each province (representing sectors)
        const sectorsPerProvince = provIdx === 0 ? 3 : 2 // Kigali City has more sectors
        return Array.from({ length: sectorsPerProvince }, (_, sectorIdx) => ({
          id: `zone-${provIdx}-${sectorIdx}`,
          name: `${province.name} - Sector ${sectorIdx + 1}`,
          province: province.name,
          district: `${province.name} District ${Math.floor(sectorIdx / 2) + 1}`,
          sector: `Sector ${sectorIdx + 1}`,
          coverage: Math.floor(Math.random() * 30) + 70, // 70-100% coverage
          routes: Math.floor(Math.random() * 5) + 2, // 2-7 routes per zone
          collections: Math.floor(Math.random() * 500) + 50,
          status: sectorIdx % 4 === 0 ? 'inactive' : 'active',
          serviceProviderId: orgsResponse.data[sectorIdx % orgsResponse.data.length]?.id,
        }))
      }).flat()

      // Mock routes
      const mockRoutes: Route[] = mockZones.flatMap((zone, zoneIdx) =>
        Array.from({ length: zone.routes }, (_, routeIdx) => ({
          id: `route-${zoneIdx}-${routeIdx}`,
          name: `Route ${zoneIdx + 1}-${routeIdx + 1}`,
          zone: zone.name,
          assignedOfficer: `Officer ${zoneIdx * 3 + routeIdx + 1}`,
          collections: Math.floor(Math.random() * 100) + 10,
          efficiency: Math.floor(Math.random() * 40) + 60,
          status: routeIdx % 4 === 0 ? 'inactive' : 'active',
        }))
      )

      setZones(mockZones)
      setRoutes(mockRoutes)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateZone = () => {
    setSelectedZone(null)
    setIsZoneDialogOpen(true)
  }

  const handleEditZone = (zone: Zone) => {
    setSelectedZone(zone)
    setIsZoneDialogOpen(true)
  }

  const handleCreateRoute = () => {
    setSelectedRoute(null)
    setIsRouteDialogOpen(true)
  }

  const handleEditRoute = (route: Route) => {
    setSelectedRoute(route)
    setIsRouteDialogOpen(true)
  }

  const handleSaveZone = () => {
    toast({
      title: 'Success',
      description: selectedZone ? 'Zone updated successfully' : 'Zone created successfully',
    })
    setIsZoneDialogOpen(false)
    setSelectedZone(null)
    fetchData()
  }

  const handleSaveRoute = () => {
    toast({
      title: 'Success',
      description: selectedRoute ? 'Route updated successfully' : 'Route created successfully',
    })
    setIsRouteDialogOpen(false)
    setSelectedRoute(null)
    fetchData()
  }

  const filteredZones = zones.filter(zone => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        zone.name.toLowerCase().includes(query) ||
        zone.province.toLowerCase().includes(query) ||
        zone.district.toLowerCase().includes(query)
      )
    }
    return true
  })

  const filteredRoutes = routes.filter(route => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        route.name.toLowerCase().includes(query) ||
        route.zone.toLowerCase().includes(query) ||
        route.assignedOfficer.toLowerCase().includes(query)
      )
    }
    return true
  })

  const handleZoneSort = (key: string) => {
    setZoneSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleRouteSort = (key: string) => {
    setRouteSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const sortedZones = [...filteredZones].sort((a, b) => {
    if (!zoneSortConfig) return 0
    
    let aValue: any
    let bValue: any
    
    switch (zoneSortConfig.key) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'province':
        aValue = a.province.toLowerCase()
        bValue = b.province.toLowerCase()
        break
      case 'district':
        aValue = a.district.toLowerCase()
        bValue = b.district.toLowerCase()
        break
      case 'sector':
        aValue = a.sector.toLowerCase()
        bValue = b.sector.toLowerCase()
        break
      case 'coverage':
        aValue = a.coverage
        bValue = b.coverage
        break
      case 'routes':
        aValue = a.routes
        bValue = b.routes
        break
      case 'collections':
        aValue = a.collections
        bValue = b.collections
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return zoneSortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return zoneSortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    if (!routeSortConfig) return 0
    
    let aValue: any
    let bValue: any
    
    switch (routeSortConfig.key) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'zone':
        aValue = a.zone.toLowerCase()
        bValue = b.zone.toLowerCase()
        break
      case 'assignedOfficer':
        aValue = a.assignedOfficer.toLowerCase()
        bValue = b.assignedOfficer.toLowerCase()
        break
      case 'collections':
        aValue = a.collections
        bValue = b.collections
        break
      case 'efficiency':
        aValue = a.efficiency
        bValue = b.efficiency
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return routeSortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return routeSortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Pagination
  const zoneTotalPages = Math.ceil(sortedZones.length / pageSize)
  const zoneStartIndex = (zoneCurrentPage - 1) * pageSize
  const paginatedZones = sortedZones.slice(zoneStartIndex, zoneStartIndex + pageSize)

  const routeTotalPages = Math.ceil(sortedRoutes.length / pageSize)
  const routeStartIndex = (routeCurrentPage - 1) * pageSize
  const paginatedRoutes = sortedRoutes.slice(routeStartIndex, routeStartIndex + pageSize)

  useEffect(() => {
    setZoneCurrentPage(1)
    setRouteCurrentPage(1)
  }, [searchQuery, activeTab])

  const stats = {
    totalZones: zones.length,
    activeZones: zones.filter(z => z.status === 'active').length,
    totalRoutes: routes.length,
    activeRoutes: routes.filter(r => r.status === 'active').length,
    avgEfficiency: routes.length > 0
      ? Math.round(routes.reduce((sum, r) => sum + r.efficiency, 0) / routes.length)
      : 0,
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <AdminSidebar variant="admin" userName="Admin User" userRole="admin" />
      
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader userName="Admin User" userRole="Administrator" />
        
        <div className="p-6 lg:p-8 space-y-8 bg-black">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                Zones & Routes
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-1">
                Where are we collecting? – Service zones, routes, coverage, and efficiency
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="group bg-black border-slate-800 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-800 bg-black relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Total Zones</CardTitle>
                <div className="relative z-10 p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <MapPin className="h-4 w-4 text-blue-400" />
                </div>
              </div>
              <CardContent className="p-6 bg-black">
                <div className="text-3xl font-bold text-white mb-1">{stats.totalZones.toLocaleString()}</div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Geographic zones
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-black border-slate-800 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 cursor-pointer">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-800 bg-black relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Active Zones</CardTitle>
                <div className="relative z-10 p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
              </div>
              <CardContent className="p-6 bg-black">
                <div className="text-3xl font-bold text-white mb-1">{stats.activeZones.toLocaleString()}</div>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Operational
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-black border-slate-800 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-800 bg-black relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Total Routes</CardTitle>
                <div className="relative z-10 p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Route className="h-4 w-4 text-purple-400" />
                </div>
              </div>
              <CardContent className="p-6 bg-black">
                <div className="text-3xl font-bold text-white mb-1">{stats.totalRoutes.toLocaleString()}</div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Route className="h-3 w-3" />
                  Collection routes
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-black border-slate-800 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-300 cursor-pointer">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-800 bg-black relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Active Routes</CardTitle>
                <div className="relative z-10 p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                <Route className="h-4 w-4 text-yellow-400" />
                </div>
              </div>
              <CardContent className="p-6 bg-black">
                <div className="text-3xl font-bold text-white mb-1">{stats.activeRoutes.toLocaleString()}</div>
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  In operation
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-black border-slate-800 hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 cursor-pointer">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-800 bg-black relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Avg Efficiency</CardTitle>
                <div className="relative z-10 p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
              </div>
              <CardContent className="p-6 bg-black">
                <div className="text-3xl font-bold text-white mb-1">{stats.avgEfficiency}%</div>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Route performance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('zones')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'zones'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Zones
            </button>
            <button
              onClick={() => setActiveTab('routes')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'routes'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Routes
            </button>
          </div>

          {/* Main Content */}
          <Card className="bg-black border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle size="md">
                    {activeTab === 'zones' ? `Zones (${sortedZones.length})` : `Routes (${sortedRoutes.length})`}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {activeTab === 'zones' 
                      ? 'Manage geographic zones and coverage areas'
                      : 'Manage collection routes and assignments'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={activeTab === 'zones' ? handleCreateZone : handleCreateRoute}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {activeTab === 'zones' ? 'Zone' : 'Route'}
                  </Button>
                  <Button 
                    onClick={fetchData} 
                    variant="outline" 
                    size="sm" 
                    className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 transition-all"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500 bg-red-500/10 p-4">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Search */}
              <div className="flex items-center gap-2 p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
                />
              </div>

              {/* Zones Table */}
              {activeTab === 'zones' && (
                <div className="rounded-lg border border-slate-800 overflow-hidden bg-black">
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                        <TableRow className="border-slate-800 bg-slate-900 hover:bg-slate-900">
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleZoneSort('name')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Zone Name
                              {zoneSortConfig?.key === 'name' ? (
                                zoneSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleZoneSort('province')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Province
                              {zoneSortConfig?.key === 'province' ? (
                                zoneSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleZoneSort('district')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              District
                              {zoneSortConfig?.key === 'district' ? (
                                zoneSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleZoneSort('sector')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Sector
                              {zoneSortConfig?.key === 'sector' ? (
                                zoneSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleZoneSort('coverage')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Coverage
                              {zoneSortConfig?.key === 'coverage' ? (
                                zoneSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleZoneSort('routes')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Routes
                              {zoneSortConfig?.key === 'routes' ? (
                                zoneSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleZoneSort('collections')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Collections
                              {zoneSortConfig?.key === 'collections' ? (
                                zoneSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleZoneSort('status')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Status
                              {zoneSortConfig?.key === 'status' ? (
                                zoneSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                          <>
                            {[...Array(5)].map((_, i) => (
                              <TableRow key={i} className="border-slate-800">
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                            ))}
                          </>
                      ) : filteredZones.length === 0 ? (
                          <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableCell colSpan={9} className="p-0">
                              <EmptyState
                                title="No zones found"
                                description={searchQuery ? "Try adjusting your search query." : "No zones have been created yet."}
                                icon={Inbox}
                                action={!searchQuery ? {
                                  label: "Create Zone",
                                  onClick: handleCreateZone
                                } : undefined}
                              />
                          </TableCell>
                        </TableRow>
                      ) : (
                          paginatedZones.map((zone) => (
                            <TableRow key={zone.id} className={`border-slate-800 hover:bg-slate-800/60 transition-colors duration-150 ${zone.status === 'inactive' ? 'opacity-60' : ''}`}>
                            <TableCell className="font-medium text-white">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${zone.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}`} />
                                {zone.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">{zone.province}</TableCell>
                            <TableCell className="text-slate-300">{zone.district}</TableCell>
                            <TableCell className="text-slate-300">{zone.sector}</TableCell>
                            <TableCell className="text-slate-300">{zone.coverage}%</TableCell>
                            <TableCell className="text-slate-300">{zone.routes}</TableCell>
                            <TableCell className="text-slate-300">{zone.collections}</TableCell>
                            <TableCell>
                              <Badge className={zone.status === 'active' 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              }>
                                {zone.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MetricTooltip content="Edit Zone">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditZone(zone)}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                </MetricTooltip>
                                <MetricTooltip content="Delete Zone">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-slate-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                </MetricTooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                  {/* Pagination Controls for Zones */}
                  {sortedZones.length > pageSize && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-black">
                      <div className="text-sm text-slate-400">
                        Showing {zoneStartIndex + 1} to {Math.min(zoneStartIndex + pageSize, sortedZones.length)} of {sortedZones.length} zones
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoneCurrentPage(p => Math.max(1, p - 1))}
                          disabled={zoneCurrentPage === 1}
                          className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-slate-400">
                          Page {zoneCurrentPage} of {zoneTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setZoneCurrentPage(p => Math.min(zoneTotalPages, p + 1))}
                          disabled={zoneCurrentPage >= zoneTotalPages}
                          className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Routes Table */}
              {activeTab === 'routes' && (
                <div className="rounded-lg border border-slate-800 overflow-hidden bg-black">
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                        <TableRow className="border-slate-800 bg-slate-900 hover:bg-slate-900">
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRouteSort('name')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Route Name
                              {routeSortConfig?.key === 'name' ? (
                                routeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRouteSort('zone')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Zone
                              {routeSortConfig?.key === 'zone' ? (
                                routeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRouteSort('assignedOfficer')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Assigned Officer
                              {routeSortConfig?.key === 'assignedOfficer' ? (
                                routeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRouteSort('collections')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Collections
                              {routeSortConfig?.key === 'collections' ? (
                                routeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRouteSort('efficiency')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Efficiency
                              {routeSortConfig?.key === 'efficiency' ? (
                                routeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRouteSort('status')}
                              className="h-8 px-2 hover:bg-slate-700/50 -ml-2 font-semibold"
                            >
                              Status
                              {routeSortConfig?.key === 'status' ? (
                                routeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 ml-1 text-slate-500" />
                              )}
                            </Button>
                          </TableHead>
                          <TableHead className="text-slate-300 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                          <>
                            {[...Array(5)].map((_, i) => (
                              <TableRow key={i} className="border-slate-800">
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                            ))}
                          </>
                      ) : filteredRoutes.length === 0 ? (
                          <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableCell colSpan={7} className="p-0">
                              <EmptyState
                                title="No routes found"
                                description={searchQuery ? "Try adjusting your search query." : "No routes have been created yet."}
                                icon={Route}
                                action={!searchQuery ? {
                                  label: "Create Route",
                                  onClick: handleCreateRoute
                                } : undefined}
                              />
                          </TableCell>
                        </TableRow>
                      ) : (
                          paginatedRoutes.map((route) => (
                            <TableRow key={route.id} className={`border-slate-800 hover:bg-slate-800/60 transition-colors duration-150 ${route.status === 'inactive' ? 'opacity-60' : ''}`}>
                            <TableCell className="font-medium text-white">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${route.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}`} />
                                {route.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">{route.zone}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-slate-300">
                                <Users className="h-4 w-4 text-slate-400" />
                                {route.assignedOfficer}
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">{route.collections}</TableCell>
                            <TableCell>
                              <Badge className={route.efficiency >= 80 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : route.efficiency >= 60
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }>
                                {route.efficiency}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={route.status === 'active' 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              }>
                                {route.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MetricTooltip content="Edit Route">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRoute(route)}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                </MetricTooltip>
                                <MetricTooltip content="Delete Route">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300 hover:bg-slate-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                </MetricTooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                  {/* Pagination Controls for Routes */}
                  {sortedRoutes.length > pageSize && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-black">
                      <div className="text-sm text-slate-400">
                        Showing {routeStartIndex + 1} to {Math.min(routeStartIndex + pageSize, sortedRoutes.length)} of {sortedRoutes.length} routes
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRouteCurrentPage(p => Math.max(1, p - 1))}
                          disabled={routeCurrentPage === 1}
                          className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-slate-400">
                          Page {routeCurrentPage} of {routeTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRouteCurrentPage(p => Math.min(routeTotalPages, p + 1))}
                          disabled={routeCurrentPage >= routeTotalPages}
                          className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Geographic Analytics Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-400" />
              Geographic Analytics
            </h2>
            
            {/* Waste Generation Heatmap & Collection Hotspots */}
            <div className="grid gap-6 lg:grid-cols-2">
              <WasteGenerationHeatmap />
              <CollectionHotspots />
            </div>

            {/* Bin Status & Illegal Dumping */}
            <div className="grid gap-6 lg:grid-cols-2">
              <BinStatusMap />
              <IllegalDumpingMap />
            </div>
          </div>
        </div>
      </div>

      {/* Zone Dialog */}
      <Dialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>{selectedZone ? 'Edit Zone' : 'Create New Zone'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedZone ? 'Update zone information' : 'Add a new geographic zone'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="zoneName" className="text-slate-300">Zone Name</Label>
              <Input
                id="zoneName"
                placeholder="Enter zone name"
                defaultValue={selectedZone?.name || ''}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province" className="text-slate-300">Province (Rwanda)</Label>
              <Select defaultValue={selectedZone?.province || ''}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {RWANDA_PROVINCES.map(province => (
                    <SelectItem key={province} value={province}>{province}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">Rwanda has 5 provinces</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="district" className="text-slate-300">District</Label>
              <Input
                id="district"
                placeholder="Enter district name"
                defaultValue={selectedZone?.district || ''}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-400">Rwanda has 30 districts total</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector" className="text-slate-300">Sector</Label>
              <Input
                id="sector"
                placeholder="Enter sector name"
                defaultValue={selectedZone?.sector || ''}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-400">Rwanda has 416 sectors total. Zones typically map to sectors.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsZoneDialogOpen(false)
                setSelectedZone(null)
              }}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveZone}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {selectedZone ? 'Update' : 'Create'} Zone
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Route Dialog */}
      <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>{selectedRoute ? 'Edit Route' : 'Create New Route'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedRoute ? 'Update route information' : 'Add a new collection route'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="routeName" className="text-slate-300">Route Name</Label>
              <Input
                id="routeName"
                placeholder="Enter route name"
                defaultValue={selectedRoute?.name || ''}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routeZone" className="text-slate-300">Zone</Label>
              <Select defaultValue={selectedRoute?.zone || ''}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(zone => (
                    <SelectItem key={zone.id} value={zone.name}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedOfficer" className="text-slate-300">Assigned Officer</Label>
              <Input
                id="assignedOfficer"
                placeholder="Enter officer name"
                defaultValue={selectedRoute?.assignedOfficer || ''}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsRouteDialogOpen(false)
                setSelectedRoute(null)
              }}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRoute}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {selectedRoute ? 'Update' : 'Create'} Route
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


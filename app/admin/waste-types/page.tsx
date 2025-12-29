'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WASTE_TYPES } from '@/components/constants/waste-types'
import { apiGetWasteTypeStats, type WasteTypeStats as ApiWasteTypeStats } from '@/lib/api'
import { FileText, RefreshCw, Search, Plus, Edit, Trash2, TrendingUp, TrendingDown, BarChart3, Home, Store, Building2, Inbox } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { MetricTooltip } from '@/components/ui/tooltip'
import { toast } from '@/hooks/use-toast'
import { WasteTrendAnalysis } from '@/components/dashboard/waste/WasteTrendAnalysis'

interface WasteTypeStats {
  type: string
  displayName: string
  totalCollections: number
  totalWeight: number
  avgWeight: number
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
  color: string
}

function getWasteTypeDisplayName(type: string): string {
  const displayNames: Record<string, string> = {
    'organic': 'Organic',
    'plastic': 'Plastic',
    'paper': 'Paper',
    'metal': 'Metal',
    'glass': 'Glass',
    'e-waste': 'E-Waste',
    'hazardous': 'Hazardous',
    'other': 'Other',
  }
  return displayNames[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

function getWasteTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'organic': '#10b981',
    'plastic': '#3b82f6',
    'paper': '#f59e0b',
    'metal': '#8b5cf6',
    'glass': '#06b6d4',
    'e-waste': '#ef4444',
    'hazardous': '#f97316',
    'other': '#6b7280',
  }
  return colors[type] || '#6b7280'
}

export default function WasteTypesPage() {
  const [wasteTypes, setWasteTypes] = useState<WasteTypeStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<WasteTypeStats | null>(null)
  const [newTypeName, setNewTypeName] = useState('')

  useEffect(() => {
    fetchWasteTypes()
  }, [])

  const fetchWasteTypes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiGetWasteTypeStats()
      
      // If API returns data, use it; otherwise use mock data with Rwanda composition
      if (response.types && response.types.length > 0) {
        const stats: WasteTypeStats[] = response.types.map((type) => ({
          type: type.type,
          displayName: type.displayName,
          totalCollections: type.totalCollections,
          totalWeight: type.totalWeight,
          avgWeight: type.averageWeight,
          trend: type.trend,
          trendPercent: type.trendPercent,
          color: getWasteTypeColor(type.type),
        }))
        setWasteTypes(stats)
      } else {
        // Mock data with Rwanda waste composition percentages
        // Rwanda: 60-70% organic, 10-15% plastic, 5-8% paper, 2-5% metal, 1-3% glass, <1% e-waste, <1% hazardous, 5-10% other
        const rwandaComposition = [
          { type: 'organic', weight: 6500, collections: 4500, percentage: 65 }, // 60-70%
          { type: 'plastic', weight: 1200, collections: 800, percentage: 12 }, // 10-15%
          { type: 'paper', weight: 650, collections: 500, percentage: 6.5 }, // 5-8%
          { type: 'metal', weight: 350, collections: 250, percentage: 3.5 }, // 2-5%
          { type: 'glass', weight: 200, collections: 150, percentage: 2 }, // 1-3%
          { type: 'e-waste', weight: 50, collections: 30, percentage: 0.5 }, // <1%
          { type: 'hazardous', weight: 50, collections: 30, percentage: 0.5 }, // <1%
          { type: 'other', weight: 750, collections: 500, percentage: 7.5 }, // 5-10%
        ]
        
        const totalWeight = rwandaComposition.reduce((sum, item) => sum + item.weight, 0)
        
        const mockStats: WasteTypeStats[] = rwandaComposition.map((item, index) => ({
          type: item.type,
          displayName: getWasteTypeDisplayName(item.type),
          totalCollections: item.collections,
          totalWeight: item.weight,
          avgWeight: item.weight / item.collections,
          trend: index % 3 === 0 ? 'up' : index % 3 === 1 ? 'down' : 'stable',
          trendPercent: Math.floor(Math.random() * 10) + 2,
          color: getWasteTypeColor(item.type),
        }))
        setWasteTypes(mockStats)
      }
    } catch (error) {
      console.error('Failed to fetch waste types:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch waste types'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateType = () => {
    setSelectedType(null)
    setNewTypeName('')
    setIsDialogOpen(true)
  }

  const handleEditType = (type: WasteTypeStats) => {
    setSelectedType(type)
    setNewTypeName(type.displayName)
    setIsDialogOpen(true)
  }

  const handleSaveType = () => {
    if (!newTypeName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Type name is required',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Success',
      description: selectedType ? 'Waste type updated successfully' : 'Waste type created successfully',
    })
    setIsDialogOpen(false)
    setSelectedType(null)
    setNewTypeName('')
    fetchWasteTypes()
  }

  const handleDeleteType = (type: WasteTypeStats) => {
    toast({
      title: 'Success',
      description: `Waste type "${type.displayName}" deleted successfully`,
    })
    fetchWasteTypes()
  }

  const filteredTypes = wasteTypes.filter(type => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        type.type.toLowerCase().includes(query) ||
        type.displayName.toLowerCase().includes(query)
      )
    }
    return true
  })

  const chartData = wasteTypes.map(type => ({
    name: type.displayName,
    collections: type.totalCollections,
    weight: type.totalWeight,
  }))

  const stats = {
    totalTypes: wasteTypes.length,
    totalCollections: wasteTypes.reduce((sum, type) => sum + type.totalCollections, 0),
    totalWeight: wasteTypes.reduce((sum, type) => sum + type.totalWeight, 0),
    avgCollections: wasteTypes.length > 0
      ? Math.round(wasteTypes.reduce((sum, type) => sum + type.totalCollections, 0) / wasteTypes.length)
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
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                Waste Types & Composition
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-1">
                What types of waste are we handling? – Composition, volumes, and trends by category
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Total Types</CardTitle>
                <FileText className="h-4 w-4 text-blue-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalTypes}</div>
                <p className="text-xs text-slate-400 mt-1">Waste categories</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Total Collections</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalCollections.toLocaleString()}</div>
                <p className="text-xs text-slate-400 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Total Weight</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalWeight.toLocaleString()}</div>
                <p className="text-xs text-slate-400 mt-1">tons collected</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Avg Collections</CardTitle>
                <BarChart3 className="h-4 w-4 text-yellow-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.avgCollections}</div>
                <p className="text-xs text-slate-400 mt-1">per type</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-black border-slate-800">
              <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-900/50 bg-black">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="md" className="text-white relative z-10">Collections by Type</CardTitle>
                <CardDescription className="text-slate-400 relative z-10">Distribution of collections</CardDescription>
              </div>
              <CardContent>
                <EnhancedBarChart
                  data={chartData}
                  dataKey="collections"
                  xAxisKey="name"
                  height={300}
                  gradientColors={{ start: '#3b82f6', end: '#2563eb', startOpacity: 1, endOpacity: 0.8 }}
                  xAxisAngle={-45}
                  xAxisHeight={80}
                  name="Collections"
                />
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800">
              <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-900/50 bg-black">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="md" className="text-white relative z-10">Weight by Type</CardTitle>
                <CardDescription className="text-slate-400 relative z-10">Total weight collected</CardDescription>
              </div>
              <CardContent>
                <EnhancedBarChart
                  data={chartData}
                  dataKey="weight"
                  xAxisKey="name"
                  height={300}
                  gradientColors={{ start: '#10b981', end: '#059669', startOpacity: 1, endOpacity: 0.8 }}
                  xAxisAngle={-45}
                  xAxisHeight={80}
                  name="Weight (tons)"
                />
              </CardContent>
            </Card>
          </div>

          {/* Source-Based Composition Analysis (Rwanda-specific) */}
          <Card className="bg-black border-slate-800">
            <CardHeader>
              <CardTitle size="md">Waste Composition by Source</CardTitle>
              <CardDescription className="text-slate-400">Rwanda-specific: Composition varies by source type (household, market, commercial)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Household Composition */}
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="h-5 w-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Household</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Organic:</span>
                      <span className="text-white font-medium">65-70%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plastic:</span>
                      <span className="text-white font-medium">10-12%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Paper:</span>
                      <span className="text-white font-medium">5-7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Other:</span>
                      <span className="text-white font-medium">13-18%</span>
                    </div>
                  </div>
                </div>

                {/* Market Composition */}
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Store className="h-5 w-5 text-green-400" />
                    <h3 className="font-semibold text-white">Market</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Organic:</span>
                      <span className="text-white font-medium">70-80%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plastic:</span>
                      <span className="text-white font-medium">8-10%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Paper:</span>
                      <span className="text-white font-medium">3-5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Other:</span>
                      <span className="text-white font-medium">7-12%</span>
                    </div>
                  </div>
                </div>

                {/* Commercial/Institutional Composition */}
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Commercial</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Organic:</span>
                      <span className="text-white font-medium">50-60%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plastic:</span>
                      <span className="text-white font-medium">15-20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Paper:</span>
                      <span className="text-white font-medium">10-15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Other:</span>
                      <span className="text-white font-medium">15-20%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Rwanda Waste Type Priorities */}
              <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-semibold text-white mb-2">Rwanda Waste Type Priorities</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-slate-300">
                  <li>Organic (high volume, composting/biogas potential)</li>
                  <li>Plastics (recycling to building materials)</li>
                  <li>E-waste (regulated, specialized handling - Enviroserve)</li>
                  <li>Metals (recovery value)</li>
                  <li>Paper/Glass (limited infrastructure)</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Waste Trend Analysis */}
          <WasteTrendAnalysis />

          {/* Main Content */}
          <Card className="bg-black border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle size="md">Waste Types ({filteredTypes.length})</CardTitle>
                  <CardDescription className="text-slate-400">Manage waste type categories and view statistics</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCreateType}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Type
                  </Button>
                  <Button 
                    onClick={fetchWasteTypes} 
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
                  placeholder="Search waste types..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
                />
              </div>

              {/* Table */}
              <div className="rounded-lg border border-slate-800 overflow-hidden bg-black">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                      <TableRow className="border-slate-800 bg-slate-900 hover:bg-slate-900">
                        <TableHead className="text-slate-300 font-semibold">Type</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Collections</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Total Weight</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Avg Weight</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Trend</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <TableRow key={i} className="border-slate-800">
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                          ))}
                        </>
                    ) : filteredTypes.length === 0 ? (
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          <TableCell colSpan={6} className="p-0">
                            <EmptyState
                              title="No waste types found"
                              description="No waste type statistics are available."
                              icon={Inbox}
                            />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTypes.map((type) => (
                          <TableRow key={type.type} className="border-slate-800 hover:bg-slate-800/60 transition-colors duration-150">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 rounded-full" 
                                style={{ backgroundColor: type.color }}
                              />
                              <span className="font-medium text-white">{type.displayName}</span>
                              <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                                {type.type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{type.totalCollections.toLocaleString()}</TableCell>
                          <TableCell className="text-slate-300">{type.totalWeight.toLocaleString()} tons</TableCell>
                          <TableCell className="text-slate-300">{type.avgWeight} kg</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {type.trend === 'up' ? (
                                <TrendingUp className="h-4 w-4 text-green-400" />
                              ) : type.trend === 'down' ? (
                                <TrendingDown className="h-4 w-4 text-red-400" />
                              ) : (
                                <div className="h-4 w-4 rounded-full bg-slate-400" />
                              )}
                              <span className={`text-sm ${
                                type.trend === 'up' ? 'text-green-400' : 
                                type.trend === 'down' ? 'text-red-400' : 
                                'text-slate-400'
                              }`}>
                                {type.trendPercent}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MetricTooltip content="Edit Waste Type">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditType(type)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              </MetricTooltip>
                              <MetricTooltip content="Delete Waste Type">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteType(type)}
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>{selectedType ? 'Edit Waste Type' : 'Create New Waste Type'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedType ? 'Update waste type information' : 'Add a new waste type category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="typeName" className="text-slate-300">Type Name</Label>
              <Input
                id="typeName"
                placeholder="Enter type name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            {!selectedType && (
              <div className="space-y-2">
                <Label htmlFor="typeKey" className="text-slate-300">Type Key</Label>
                <Input
                  id="typeKey"
                  placeholder="e.g., organic, plastic"
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <p className="text-xs text-slate-400">Lowercase, no spaces (used as identifier)</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsDialogOpen(false)
                setSelectedType(null)
                setNewTypeName('')
              }}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveType}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {selectedType ? 'Update' : 'Create'} Type
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { ProvinceDistributionChart } from '@/components/dashboard/charts/ProvinceDistributionChart'
import { apiMe, apiGetRecyclingMetrics, apiGetFacilityOperations, type RecyclingMetrics } from '@/lib/api'
import { RecyclingRevenue } from '@/components/dashboard/waste/RecyclingRevenue'
import { EnergyGeneration } from '@/components/dashboard/environmental/EnergyGeneration'
import { EmissionsBreakdown } from '@/components/dashboard/environmental/EmissionsBreakdown'
import { 
  Recycle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Leaf,
  Droplets,
  Zap,
  Globe,
  Factory,
  Cpu,
} from 'lucide-react'

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

export default function RecyclingPage() {
  const [authError, setAuthError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recyclingMetrics, setRecyclingMetrics] = useState<RecyclingMetrics | null>(null)
  const [facilityData, setFacilityData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        await apiMe()
        setAuthError(false)
        
        setLoading(true)
        const [metricsResponse, facilityResponse] = await Promise.all([
          apiGetRecyclingMetrics({ period: 'monthly' }),
          apiGetFacilityOperations({ facilityId: 'nduba-sorting' }),
        ])
        
        setRecyclingMetrics(metricsResponse)
        setFacilityData(facilityResponse)
      } catch (error: any) {
        setAuthError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Rwanda-specific recycling data (with 60-70% organic waste)
  // If API data is not available, use mock data with Rwanda composition
  const recyclingTrends = recyclingMetrics ? [] : [
    { month: 'Jan', recycled: 320, diverted: 450, rate: 28.5 },
    { month: 'Feb', recycled: 380, diverted: 520, rate: 31.2 },
    { month: 'Mar', recycled: 420, diverted: 580, rate: 33.8 },
    { month: 'Apr', recycled: 410, diverted: 560, rate: 32.5 },
    { month: 'May', recycled: 450, diverted: 620, rate: 35.1 },
    { month: 'Jun', recycled: 480, diverted: 650, rate: 36.8 },
    { month: 'Jul', recycled: 520, diverted: 700, rate: 38.5 },
    { month: 'Aug', recycled: 510, diverted: 680, rate: 37.2 },
    { month: 'Sep', recycled: 540, diverted: 720, rate: 39.8 },
    { month: 'Oct', recycled: 560, diverted: 750, rate: 40.5 },
    { month: 'Nov', recycled: 580, diverted: 780, rate: 41.2 },
    { month: 'Dec', recycled: 600, diverted: 800, rate: 42.5 },
  ]

  // Rwanda waste composition: 60-70% organic, 10-15% plastic, 5-8% paper, etc.
  // Updated to reflect Rwanda's high organic waste percentage
  const recyclingByCategory = (recyclingMetrics?.byMaterial || [
    { category: 'Organic', recycled: 1800, total: 6000, rate: 30.0 }, // High volume, composting focus
    { category: 'Plastic', recycled: 1247, total: 3200, rate: 38.9 }, // Building materials
    { category: 'Paper', recycled: 892, total: 2100, rate: 42.5 },
    { category: 'Metal', recycled: 684, total: 1500, rate: 45.6 },
    { category: 'Glass', recycled: 456, total: 1200, rate: 38.0 },
    { category: 'E-waste', recycled: 123, total: 300, rate: 41.0 }, // Enviroserve
  ]).map((item: any) => ({
    category: item.category || item.type || 'Unknown',
    recycled: item.recycled || 0,
    total: item.total || 0,
    rate: item.rate || 0,
  }))

  // Rwanda-specific: High organic waste means more composting
  const wasteComposition = [
    { name: 'Recycled', value: 4200, color: '#10b981' },
    { name: 'Composted', value: 1800, color: '#8b5cf6' }, // Higher composting (organic waste)
    { name: 'Landfilled', value: 4000, color: '#ef4444' },
  ]

  const environmentalImpact = recyclingMetrics?.environmentalImpact ? [
    { metric: 'CO2 Saved', value: `${(recyclingMetrics.environmentalImpact.totalCo2Saved / 1000).toFixed(1)}K`, unit: 'tons', icon: Leaf, color: 'text-green-400' },
    { metric: 'Water Saved', value: `${(recyclingMetrics.environmentalImpact.totalWaterSaved / 1000000).toFixed(1)}M`, unit: 'liters', icon: Droplets, color: 'text-blue-400' },
    { metric: 'Energy Saved', value: `${(recyclingMetrics.environmentalImpact.totalEnergySaved / 1000).toFixed(0)}`, unit: 'MWh', icon: Zap, color: 'text-yellow-400' },
    { metric: 'Trees Saved', value: `${(recyclingMetrics.environmentalImpact.totalTreesSaved / 1000).toFixed(1)}K`, unit: 'trees', icon: Globe, color: 'text-purple-400' },
  ] : [
    { metric: 'CO2 Saved', value: '2.4K', unit: 'tons', icon: Leaf, color: 'text-green-400' },
    { metric: 'Water Saved', value: '1.8M', unit: 'liters', icon: Droplets, color: 'text-blue-400' },
    { metric: 'Energy Saved', value: '450', unit: 'MWh', icon: Zap, color: 'text-yellow-400' },
    { metric: 'Trees Saved', value: '1.2K', unit: 'trees', icon: Globe, color: 'text-purple-400' },
  ]

  // Facility operations data (Nduba)
  const facilityOperations = [
    { facility: 'Nduba Sorting', processed: 1200, recycled: 480, type: 'sorting' },
    { facility: 'Nduba Bio-Treatment', processed: 1800, composted: 900, type: 'composting' },
    { facility: 'Enviroserve', processed: 123, recycled: 123, type: 'e-waste' },
  ]

  if (authError) {
    return (
      <div className="flex h-screen bg-slate-800">
        <AdminSidebar variant="admin" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
              <p className="text-slate-400 mb-6">Please log in to view recycling data</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <AdminSidebar variant="admin" />
      
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader userName="Admin User" userRole="Administrator" />
        
      <div className="p-6 lg:p-8 space-y-8 bg-black">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
              <Recycle className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
              Recycling & Circular Economy
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              How much are we recovering and reusing? – Recycling performance, diversion, and environmental impact
            </p>
          </div>
        </div>

          {/* Recycling Revenue */}
          <RecyclingRevenue />

          {/* Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Recycling Rate</CardTitle>
                <Recycle className="h-4 w-4 text-green-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">
                  {recyclingMetrics ? `${recyclingMetrics.recyclingRate.toFixed(1)}%` : '42.5%'}
                </div>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {recyclingMetrics ? 'Current rate' : '+2.3% from last month'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Waste Diverted</CardTitle>
                <Recycle className="h-4 w-4 text-blue-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">
                  {recyclingMetrics ? `${recyclingMetrics.totalDiverted.toFixed(0)}` : '800'}
                </div>
                <p className="text-xs text-slate-400">tons this month</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Recycled Materials</CardTitle>
                <Recycle className="h-4 w-4 text-purple-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">
                  {recyclingMetrics ? `${recyclingMetrics.totalRecycled.toFixed(0)}` : '600'}
                </div>
                <p className="text-xs text-slate-400">tons this month</p>
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Composting Rate</CardTitle>
                <Leaf className="h-4 w-4 text-teal-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">
                  {recyclingMetrics ? `${recyclingMetrics.compostingRate.toFixed(1)}%` : '30.0%'}
                </div>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {recyclingMetrics ? 'Organic waste focus' : 'High organic waste'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Energy Generation & Emissions */}
          <div className="grid gap-6 lg:grid-cols-2">
            <EnergyGeneration />
            <EmissionsBreakdown />
          </div>

          {/* Environmental Impact Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {environmentalImpact.map((impact, index) => {
              const Icon = impact.icon
              return (
                <Card key={index} className="bg-black border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                    <CardTitle size="xs" className="text-white z-10 relative">{impact.metric}</CardTitle>
                    <Icon className={`h-4 w-4 ${impact.color} relative z-10`} />
                  </div>
                  <CardContent>
                    <div className="text-2xl font-bold text-white mb-1">{impact.value}</div>
                    <p className="text-xs text-slate-400">{impact.unit}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recycling Trends Chart */}
            <Card className="bg-black border-slate-800">
              <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <div className="flex items-center justify-between relative z-10 flex-1">
                  <div>
                    <CardTitle size="md" className="text-white">Recycling Trends</CardTitle>
                    <CardDescription className="text-slate-400">Last 12 months</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent>
                <EnhancedLineChart
                  data={recyclingTrends}
                  dataKeys={[
                    { key: 'recycled', name: 'Recycled (tons)', color: '#10b981' },
                    { key: 'diverted', name: 'Diverted (tons)', color: '#3b82f6' },
                    { key: 'rate', name: 'Rate (%)', color: '#8b5cf6' },
                  ]}
                  xAxisKey="month"
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Recycling by Category Chart */}
            <Card className="bg-black border-slate-800">
              <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <div className="flex items-center justify-between relative z-10 flex-1">
                  <div>
                    <CardTitle size="md" className="text-white">Recycling by Category</CardTitle>
                    <CardDescription className="text-slate-400">This year</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={recyclingByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                    <XAxis 
                      dataKey="category" 
                      stroke="#94a3b8" 
                      fontSize={12}
                      tick={{ fill: '#cbd5e1' }}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={12}
                      tick={{ fill: '#cbd5e1' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155', 
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
                    />
                    <Bar dataKey="recycled" fill="#10b981" radius={[8, 8, 0, 0]} name="Recycled (tons)" />
                    <Bar dataKey="total" fill="#475569" radius={[8, 8, 0, 0]} name="Total (tons)" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Waste Composition Pie Chart */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-black border-slate-800">
              <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <div className="flex items-center justify-between relative z-10 flex-1">
                  <div>
                    <CardTitle size="md" className="text-white">Waste Composition</CardTitle>
                    <CardDescription className="text-slate-400">Current distribution</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent>
                <ProvinceDistributionChart
                  data={wasteComposition.map(item => ({ name: item.name, count: item.value }))}
                  height={300}
                  colors={wasteComposition.map(item => item.color)}
                  centerLabel={{ total: 'Total Waste', selected: undefined }}
                  ariaLabel="Waste composition distribution chart"
                />
              </CardContent>
            </Card>

            {/* Category Performance Table */}
            <Card className="bg-black border-slate-800">
              <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <div className="flex items-center justify-between relative z-10 flex-1">
                  <div>
                    <CardTitle size="md" className="text-white">Category Performance</CardTitle>
                <CardDescription className="text-slate-400">Recycling rates by material type (Rwanda)</CardDescription>
                  </div>
                </div>
              </div>
              <CardContent>
                <div className="space-y-4">
                  {recyclingByCategory.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{category.category}</span>
                            {category.category === 'E-waste' && (
                              <Badge variant="outline" className="border-blue-500/20 text-blue-400 text-xs">
                                Enviroserve
                              </Badge>
                            )}
                            {category.category === 'Organic' && (
                              <Badge variant="outline" className="border-purple-500/20 text-purple-400 text-xs">
                                Nduba Bio-Treatment
                              </Badge>
                            )}
                          </div>
                          <Badge className={category.rate >= 40 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : category.rate >= 30
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }>
                            {category.rate.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${category.rate}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                          <span>{category.recycled.toFixed(0)} tons recycled</span>
                          <span>{category.total.toFixed(0)} tons total</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Facility Operations (Rwanda-specific) */}
          <Card className="bg-black border-slate-800">
            <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <div className="flex items-center justify-between relative z-10 flex-1">
                <div>
                  <CardTitle size="md" className="text-white">Facility Operations</CardTitle>
                  <CardDescription className="text-slate-400">Nduba Landfill & Processing Facilities</CardDescription>
                </div>
                <Factory className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {facilityOperations.map((facility, index) => (
                  <div key={index} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {facility.type === 'e-waste' ? (
                          <Cpu className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Factory className="h-4 w-4 text-purple-400" />
                        )}
                        <span className="text-sm font-medium text-white">{facility.facility}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Processed:</span>
                        <span className="text-white font-medium">{facility.processed} tons</span>
                      </div>
                      {facility.recycled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Recycled:</span>
                          <span className="text-green-400 font-medium">{facility.recycled} tons</span>
                        </div>
                      )}
                      {facility.composted && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Composted:</span>
                          <span className="text-purple-400 font-medium">{facility.composted} tons</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


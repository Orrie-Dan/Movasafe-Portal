'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer } from 'recharts'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { ProvinceDistributionChart } from '@/components/dashboard/charts/ProvinceDistributionChart'
import { apiMe, apiGetTrendData, apiGetOperationalMetrics, apiGetFinancialMetrics, apiGetEnvironmentalMetrics, apiGetGeographicData, apiGetCollectionsStats, apiGetWasteTypeStats, apiGetFinancialForecast, apiGetRiskIndicators, apiGetPaymentBehavior, apiGetPerformanceMetrics, apiGetEfficiencyMetrics, apiGetContributionAnalysis, apiGetTrendAnalysis } from '@/lib/api'
import { Forecasting } from '@/components/financial/Forecasting'
import { RiskIndicators } from '@/components/financial/RiskIndicators'
import { PaymentBehavior } from '@/components/financial/PaymentBehavior'
import { PerformanceChangeMetrics } from '@/components/analytics/PerformanceChangeMetrics'
import { EfficiencyMetrics } from '@/components/analytics/EfficiencyMetrics'
import { ContributionAnalysis } from '@/components/analytics/ContributionAnalysis'
import { TrendAnalysis } from '@/components/analytics/TrendAnalysis'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Skeleton } from '@/components/ui/skeleton'
import { WasteForecast } from '@/components/dashboard/analytics/WasteForecast'
import { BinFillPrediction } from '@/components/dashboard/analytics/BinFillPrediction'
import { MaintenanceForecast } from '@/components/dashboard/analytics/MaintenanceForecast'
import { RouteOptimization } from '@/components/dashboard/analytics/RouteOptimization'
import { 
  Trash2,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plug,
  Building2,
  Palette,
  Download,
  Database,
  Shield,
  Plus,
  Pencil,
  Upload,
  MessageSquare,
  Trash,
  Eye,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Truck,
  Recycle,
  BarChart3,
  Calendar,
  CreditCard,
  Target,
  PieChart,
} from 'lucide-react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'
import type { FinancialFilters } from '@/lib/types/financial'

export default function AnalyticsPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month')
  const [trendData, setTrendData] = useState<any>(null)
  const [operationalMetrics, setOperationalMetrics] = useState<any>(null)
  const [financialMetrics, setFinancialMetrics] = useState<any>(null)
  const [environmentalMetrics, setEnvironmentalMetrics] = useState<any>(null)
  const [geographicData, setGeographicData] = useState<any>(null)
  const [wasteTypeStats, setWasteTypeStats] = useState<any>(null)
  const [comparisonPeriod, setComparisonPeriod] = useState<'previous' | 'yoy'>('previous')
  const [forecast, setForecast] = useState<any>(null)
  const [riskIndicators, setRiskIndicators] = useState<any>(null)
  const [paymentBehavior, setPaymentBehavior] = useState<any>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<any>(null)
  const [contributionAnalysis, setContributionAnalysis] = useState<any>(null)
  const [trendAnalysis, setTrendAnalysis] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiMe()
        setAuthError(false)
        fetchAnalyticsData()
      } catch (error: any) {
        setAuthError(true)
        setTimeout(() => router.replace('/login'), 2000)
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!authError) {
      fetchAnalyticsData()
    }
  }, [timePeriod, comparisonPeriod])

  // Helper function to convert timePeriod to FinancialFilters
  const getPaymentBehaviorFilters = (): FinancialFilters | undefined => {
    const now = new Date()
    
    if (timePeriod === 'today') {
      return {
        dateRange: {
          start: format(startOfDay(now), 'yyyy-MM-dd'),
          end: format(endOfDay(now), 'yyyy-MM-dd'),
        },
        period: 'custom',
      }
    } else if (timePeriod === 'week') {
      return {
        dateRange: {
          start: format(startOfWeek(now), 'yyyy-MM-dd'),
          end: format(endOfWeek(now), 'yyyy-MM-dd'),
        },
        period: 'custom',
      }
    } else if (timePeriod === 'month' || timePeriod === 'quarter' || timePeriod === 'year') {
      return {
        dateRange: {
          start: format(now, 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd'),
        },
        period: timePeriod,
      }
    }
    
    return undefined
  }

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const [trend, operational, financial, environmental, geographic, wasteTypes, forecastData, risks, payments, performance, efficiency, contribution, trendAnalysis] = await Promise.all([
        apiGetTrendData({ period: timePeriod }),
        apiGetOperationalMetrics(timePeriod),
        apiGetFinancialMetrics(timePeriod),
        apiGetEnvironmentalMetrics(timePeriod),
        apiGetGeographicData(),
        apiGetWasteTypeStats(),
        apiGetFinancialForecast(6),
        apiGetRiskIndicators(),
        apiGetPaymentBehavior(getPaymentBehaviorFilters()),
        apiGetPerformanceMetrics(timePeriod),
        apiGetEfficiencyMetrics(timePeriod),
        apiGetContributionAnalysis(timePeriod),
        apiGetTrendAnalysis(timePeriod),
      ])
      setTrendData(trend)
      setOperationalMetrics(operational)
      setFinancialMetrics(financial)
      setEnvironmentalMetrics(environmental)
      setGeographicData(geographic)
      setWasteTypeStats(wasteTypes)
      setForecast(forecastData)
      setRiskIndicators(risks)
      setPaymentBehavior(payments)
      setPerformanceMetrics(performance)
      setEfficiencyMetrics(efficiency)
      setContributionAnalysis(contribution)
      setTrendAnalysis(trendAnalysis)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for charts
  const performanceData = [
    { month: 'Jan', collections: 1200, waste: 45 },
    { month: 'Feb', collections: 1350, waste: 52 },
    { month: 'Mar', collections: 1420, waste: 58 },
    { month: 'Apr', collections: 1380, waste: 55 },
    { month: 'May', collections: 1500, waste: 62 },
    { month: 'Jun', collections: 1650, waste: 68 },
    { month: 'Jul', collections: 1720, waste: 72 },
    { month: 'Aug', collections: 1680, waste: 70 },
    { month: 'Sep', collections: 1750, waste: 75 },
    { month: 'Oct', collections: 1820, waste: 78 },
    { month: 'Nov', collections: 1900, waste: 82 },
    { month: 'Dec', collections: 1950, waste: 85 },
  ]

  const categoryData = [
    { category: 'Organic', count: 1247 },
    { category: 'Plastic', count: 892 },
    { category: 'Paper', count: 684 },
    { category: 'Metal', count: 456 },
    { category: 'Glass', count: 234 },
    { category: 'E-waste', count: 123 },
  ]

  // System History data
  const systemHistory = [
    { icon: Plug, color: 'text-green-400', title: 'Route Optimized', description: 'Route #12 optimized by System • Reduced travel time by 15%', status: 'success', time: '10 minutes ago' },
    { icon: Building2, color: 'text-blue-400', title: 'Zone Updated', description: 'Kigali City Zone by Admin User • Added 5 new collection points', status: 'success', time: '25 minutes ago' },
    { icon: Palette, color: 'text-purple-400', title: 'Schedule Changed', description: 'Weekly Schedule by System • Updated collection times', status: 'success', time: '1 hour ago' },
    { icon: Download, color: 'text-blue-400', title: 'Backup Created', description: 'Full System Backup by System • Scheduled backup - 2.4 GB', status: 'success', time: '2 hours ago' },
    { icon: Plug, color: 'text-green-400', title: 'Fleet Added', description: 'New Truck #15 by Admin User • Added to active fleet', status: 'success', time: '3 hours ago' },
    { icon: Shield, color: 'text-orange-400', title: 'Security Scan', description: 'System Security Check by System • No threats detected', status: 'success', time: '4 hours ago' },
    { icon: Plug, color: 'text-red-400', title: 'Route Deactivated', description: 'Route #8 by Admin User • Temporarily disabled for maintenance', status: 'warning', time: '6 hours ago' },
    { icon: Database, color: 'text-blue-400', title: 'Data Optimized', description: 'Database Cleanup by System • Removed 1,247 old records', status: 'success', time: '8 hours ago' },
  ]

  // User Activity data
  const userActivity = [
    { name: 'Sarah Johnson', role: 'Officer', roleColor: 'bg-green-500', icon: Plus, iconColor: 'text-green-400', action: 'Created New collection: Zone A-12 • Organic waste category', time: '5 minutes ago' },
    { name: 'Mike Chen', role: 'Supervisor', roleColor: 'bg-blue-500', icon: Pencil, iconColor: 'text-blue-400', action: 'Updated Route #5 Schedule • Adjusted pickup times', time: '15 minutes ago' },
    { name: 'Emma Wilson', role: 'Admin', roleColor: 'bg-yellow-500', icon: Upload, iconColor: 'text-yellow-400', action: 'Uploaded waste-report-2024.pdf • 2.4 MB document', time: '1 hour ago' },
    { name: 'Alex Rodriguez', role: 'Moderator', roleColor: 'bg-purple-500', icon: MessageSquare, iconColor: 'text-purple-400', action: 'Approved Collection Request • Zone B-8 approved', time: '2 hours ago' },
    { name: 'Lisa Wang', role: 'Officer', roleColor: 'bg-blue-500', icon: Trash, iconColor: 'text-red-400', action: 'Cancelled Collection: Zone C-3 • Rescheduled for tomorrow', time: '3 hours ago' },
    { name: 'John Smith', role: 'Viewer', roleColor: 'bg-gray-500', icon: Eye, iconColor: 'text-blue-400', action: 'Viewed Analytics Dashboard • Generated report', time: '4 hours ago' },
  ]

  if (authError) {
    return (
      <div className="flex h-screen bg-slate-800">
        <AdminSidebar variant="admin" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
              <p className="text-slate-400 mb-6">Please log in to view analytics</p>
              <Button onClick={() => router.push('/login')}>Go to Login</Button>
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
        
        {/* Main Content */}
        <div className="p-6 lg:p-8 space-y-8 bg-black">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
                Analytics & Insights
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-1">
                How are we performing? – Trends, efficiency, and behavior analytics
              </p>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Total Collections</CardTitle>
                <Trash2 className="h-4 w-4 text-blue-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">1,247</div>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12.5%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Waste Collected</CardTitle>
                <Trash2 className="h-4 w-4 text-green-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">89.2K</div>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +23.1%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Active Routes</CardTitle>
                <MapPin className="h-4 w-4 text-purple-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">2,847</div>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +8.2%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Active Officers</CardTitle>
                <Users className="h-4 w-4 text-orange-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">24</div>
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  -2.1%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Scheduled</CardTitle>
                <Clock className="h-4 w-4 text-yellow-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">18</div>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +5.3%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="text-white z-10 relative">Recycling Rate</CardTitle>
                <Recycle className="h-4 w-4 text-teal-400 relative z-10" />
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">32.5%</div>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +15.7%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Collection Performance Chart */}
            <Card className="bg-black border-slate-800">
              <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <div className="relative z-10">
                  <CardTitle size="md" className="text-white">Collection Performance</CardTitle>
                  <CardDescription className="text-slate-400">Last 12 months</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white relative z-10">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <CardContent>
                <EnhancedLineChart
                  data={performanceData}
                  dataKeys={[
                    { key: 'collections', name: 'Collections', color: '#3b82f6' },
                    { key: 'waste', name: 'Waste (K)', color: '#10b981' },
                  ]}
                  xAxisKey="month"
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Waste by Category Chart */}
            <Card className="bg-black border-slate-800">
              <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <div className="relative z-10">
                  <CardTitle size="md" className="text-white">Waste by Category</CardTitle>
                  <CardDescription className="text-slate-400">This year</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white relative z-10">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <CardContent>
                <EnhancedBarChart
                  data={categoryData}
                  dataKey="count"
                  xAxisKey="category"
                  height={300}
                  gradientColors={{ start: '#3b82f6', end: '#2563eb', startOpacity: 1, endOpacity: 0.8 }}
                  name="Count"
                />
              </CardContent>
            </Card>
          </div>

          {/* Time Period Selector */}
          <Card className="bg-black border-slate-800">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Time Period</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(['today', 'week', 'month', 'quarter', 'year'] as const).map((period) => (
                    <Button
                      key={period}
                      variant={timePeriod === period ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimePeriod(period)}
                      className={
                        timePeriod === period
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Executive Summary Dashboard */}
          <Card className="bg-black border-slate-800">
            <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-900/50 bg-black">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <CardTitle size="md" className="text-white relative z-10">Executive Summary - Key Performance Indicators</CardTitle>
              <CardDescription className="text-slate-400 relative z-10">Overview of critical metrics</CardDescription>
            </div>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Total Waste Collected</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {operationalMetrics?.totalWasteCollected?.value 
                      ? `${(operationalMetrics.totalWasteCollected.value / 1000).toFixed(1)}K kg`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-green-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {operationalMetrics?.totalWasteCollected?.change 
                      ? `${operationalMetrics.totalWasteCollected.change > 0 ? '+' : ''}${operationalMetrics.totalWasteCollected.change.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Collection Completion Rate</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {operationalMetrics?.collectionCompletionRate?.value 
                      ? `${operationalMetrics.collectionCompletionRate.value.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-slate-400">Completed / Scheduled</div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Cost per Ton</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {financialMetrics?.costPerTon 
                      ? `${financialMetrics.costPerTon.toFixed(0)} RWF`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-slate-400">Operational efficiency</div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Recycling Rate</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {environmentalMetrics?.recyclingRate 
                      ? `${environmentalMetrics.recyclingRate.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-green-400 flex items-center gap-1">
                    <Recycle className="h-3 w-3" />
                    Environmental impact
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparative Analysis */}
          <Card className="bg-black border-slate-800">
            <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <div className="flex items-center justify-between relative z-10 flex-1">
                <div>
                  <CardTitle size="md" className="text-white">Comparative Analysis</CardTitle>
                  <CardDescription className="text-slate-400">Period-over-period comparisons</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={comparisonPeriod === 'previous' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setComparisonPeriod('previous')}
                  >
                    vs Previous Period
                  </Button>
                  <Button
                    variant={comparisonPeriod === 'yoy' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setComparisonPeriod('yoy')}
                  >
                    vs Same Period Last Year
                  </Button>
                </div>
              </div>
            </div>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-2">Collections Volume</div>
                  <div className="text-2xl font-bold text-white mb-1">+12.5%</div>
                  <div className="text-xs text-green-400">Increase from previous period</div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-2">Revenue</div>
                  <div className="text-2xl font-bold text-white mb-1">+8.3%</div>
                  <div className="text-xs text-green-400">Growth rate</div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-2">Recycling Rate</div>
                  <div className="text-2xl font-bold text-white mb-1">+15.7%</div>
                  <div className="text-xs text-green-400">Improvement</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geographic Analytics */}
          {geographicData && (
            <Card className="bg-black border-slate-800">
              <CardHeader>
                <CardTitle size="md" className="text-white">Geographic Analytics</CardTitle>
                <CardDescription className="text-slate-400">Waste collection by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {geographicData.provinces?.slice(0, 5).map((province: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-400" />
                        <div className="text-sm font-medium text-white">{province.name}</div>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {Math.floor(Math.random() * 500) + 100}
                      </div>
                      <div className="text-xs text-slate-400">Collections this period</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Waste Composition Analytics */}
          {wasteTypeStats && (
            <Card className="bg-black border-slate-800">
              <CardHeader>
                <CardTitle size="md">Waste Composition Analytics</CardTitle>
                <CardDescription className="text-slate-400">Breakdown by waste type and source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-4">Composition by Type</h4>
                    <ProvinceDistributionChart
                      data={(wasteTypeStats.types || categoryData).map((item: any) => ({
                        name: item.category || item.name,
                        count: item.count || item.value,
                      }))}
                      height={300}
                      isMobile={false}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-4">Composition Trends</h4>
                    <EnhancedBarChart
                      data={wasteTypeStats.types || categoryData}
                      dataKey="count"
                      xAxisKey="category"
                      height={300}
                      gradientColors={{ start: '#3b82f6', end: '#2563eb', startOpacity: 1, endOpacity: 0.8 }}
                      name="Count"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operational Efficiency Analytics */}
          <Card className="bg-black border-slate-800">
            <CardHeader>
              <CardTitle size="md" className="text-white">Operational Efficiency Analytics</CardTitle>
              <CardDescription className="text-slate-400">Route efficiency, fuel consumption, and time analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Route Efficiency</div>
                  <div className="text-2xl font-bold text-white">
                    {operationalMetrics?.routeEfficiency?.value 
                      ? `${operationalMetrics.routeEfficiency.value.toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Fuel Consumption</div>
                  <div className="text-2xl font-bold text-white">
                    {operationalMetrics?.fuelConsumption?.value 
                      ? `${operationalMetrics.fuelConsumption.value.toFixed(0)} L`
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Avg Time per Job</div>
                  <div className="text-2xl font-bold text-white">
                    {operationalMetrics?.avgTimePerJob?.value 
                      ? `${operationalMetrics.avgTimePerJob.value.toFixed(0)} min`
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Idle Time</div>
                  <div className="text-2xl font-bold text-white">
                    {operationalMetrics?.idleTime?.value 
                      ? `${operationalMetrics.idleTime.value.toFixed(1)} hrs`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Analytics */}
          <Card className="bg-black border-slate-800">
            <CardHeader>
              <CardTitle size="md" className="text-white">Financial Analytics</CardTitle>
              <CardDescription className="text-slate-400">Revenue, costs, and profitability trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {financialMetrics?.totalRevenue 
                      ? `${(financialMetrics.totalRevenue / 1000000).toFixed(1)}M RWF`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-green-400">+8.3% from previous</div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Outstanding Payments</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {financialMetrics?.outstandingPayments 
                      ? `${(financialMetrics.outstandingPayments / 1000).toFixed(1)}K RWF`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-orange-400">Requires attention</div>
                </div>
                <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                  <div className="text-sm text-slate-400 mb-1">Cost per Route</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {financialMetrics?.costPerRoute 
                      ? `${financialMetrics.costPerRoute.toFixed(0)} RWF`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-slate-400">Average operational cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System History and User Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* System History */}
            <Card className="bg-black border-slate-800">
              <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="md" className="text-white z-10 relative">System History</CardTitle>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs relative z-10">
                  View all <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {systemHistory.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <div key={index} className="flex items-start gap-3 pb-4 border-b border-slate-600 last:border-0">
                        <div className={`p-2 rounded-lg bg-slate-800 ${item.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">{item.title}</span>
                            <Badge 
                              className={`text-xs ${
                                item.status === 'success' 
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mb-1">{item.description}</p>
                          <p className="text-xs text-slate-500">{item.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* User Activity */}
            <Card className="bg-black border-slate-800">
              <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="md" className="text-white z-10 relative">User Activity</CardTitle>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs relative z-10">
                  View all <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {userActivity.map((user, index) => {
                    const Icon = user.icon
                    return (
                      <div key={index} className="flex items-start gap-3 pb-4 border-b border-slate-600 last:border-0">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-slate-800">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">{user.name}</span>
                            <Badge className={`${user.roleColor} text-white text-xs`}>
                              {user.role}
                            </Badge>
                            <div className={`${user.iconColor} ml-auto`}>
                              <Icon className="h-4 w-4" />
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mb-1">{user.action}</p>
                          <p className="text-xs text-slate-500">{user.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <p className="text-xs text-slate-400">24 active users today</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Analytics Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-400" />
              Financial Analytics - What Do the Numbers Mean?
            </h2>
            <p className="text-slate-400">Insights, trends, and actionable metrics for decision-making</p>

            {/* Performance Change Metrics */}
            <CollapsibleSection
              title="Performance Change Metrics"
              description="Is performance improving or declining?"
              defaultExpanded={true}
              icon={TrendingUp}
            >
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <PerformanceChangeMetrics data={performanceMetrics} />
              )}
            </CollapsibleSection>

            {/* Efficiency Metrics */}
            <CollapsibleSection
              title="Efficiency Metrics"
              description="How well is money being used?"
              defaultExpanded={true}
              icon={Target}
            >
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <EfficiencyMetrics data={efficiencyMetrics} />
              )}
            </CollapsibleSection>

            {/* Contribution Analysis */}
            <CollapsibleSection
              title="Mix & Contribution Analysis"
              description="What matters most?"
              defaultExpanded={true}
              icon={PieChart}
            >
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ContributionAnalysis data={contributionAnalysis} />
              )}
            </CollapsibleSection>

            {/* Trend Analysis */}
            <CollapsibleSection
              title="Trend & Pattern Analysis"
              description="What's changing over time?"
              defaultExpanded={false}
              icon={Calendar}
            >
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <TrendAnalysis data={trendAnalysis} />
              )}
            </CollapsibleSection>

            {/* Payment Behavior Analytics */}
            <CollapsibleSection
              title="Customer & Payment Behavior"
              description="Who pays and how reliably?"
              defaultExpanded={false}
              icon={CreditCard}
            >
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <PaymentBehavior data={paymentBehavior} />
              )}
            </CollapsibleSection>

            {/* Forecasting */}
            <CollapsibleSection
              title="Forecasting & Projections"
              description="What will happen next?"
              defaultExpanded={false}
              icon={Calendar}
            >
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <Forecasting data={forecast} />
              )}
            </CollapsibleSection>

            {/* Risk Indicators */}
            <CollapsibleSection
              title="Risk & Anomaly Detection"
              description="What should worry us?"
              defaultExpanded={false}
              icon={AlertTriangle}
            >
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <RiskIndicators data={riskIndicators} />
              )}
            </CollapsibleSection>
          </div>

          {/* Predictive Analytics Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-400" />
              Operational Predictive Analytics
            </h2>
            
            {/* Waste Forecast & Bin Fill Predictions */}
            <div className="grid gap-6 lg:grid-cols-2">
              <WasteForecast />
              <BinFillPrediction />
            </div>

            {/* Maintenance Forecast & Route Optimization */}
            <div className="grid gap-6 lg:grid-cols-2">
              <MaintenanceForecast />
              <RouteOptimization />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

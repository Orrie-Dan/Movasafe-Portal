'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { apiGetAdminReports, apiUpdateReportStatus, apiAssignReport, apiGetUsers, apiGetOrganizations, apiAutoAssignReports, apiGetGeographicData, apiMe, apiGetCollections, apiGetCollectionsStats, apiGetOperationalMetrics, apiGetFinancialMetrics, apiGetEnvironmentalMetrics, apiGetTrendData, apiGetCustomerMetrics, apiGetStaffPerformanceMetrics, type AdminReport, type GeographicData, type Collection } from '@/lib/api'
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
import { ReportDetailView } from '@/components/report-detail-view'
import { GaugeChart } from '@/components/gauge-chart'
import { MetricCardGroup } from '@/components/dashboard/metrics/MetricCardGroup'
import { MetricCardEnhanced } from '@/components/dashboard/metrics/MetricCardEnhanced'
import { MetricsSection } from '@/components/dashboard/metrics/MetricsSection'
import { TimePeriodFilter } from '@/components/dashboard/filters/TimePeriodFilter'
import { RealTimeStatus } from '@/components/dashboard/alerts/RealTimeStatus'
import { AlertCenter } from '@/components/dashboard/alerts/AlertCenter'
import { QuickActionsPanel } from '@/components/dashboard/sections/QuickActionsPanel'
import { PerformanceTrends } from '@/components/dashboard/sections/PerformanceTrends'
import { ExecutiveSummary } from '@/components/dashboard/sections/ExecutiveSummary'
import { PerformanceMetricsCards } from '@/components/dashboard/sections/PerformanceMetricsCards'
import { CategoryResolutionTimes } from '@/components/dashboard/sections/CategoryResolutionTimes'
import { OfficerPerformanceMetrics } from '@/components/dashboard/sections/OfficerPerformanceMetrics'
import { TimeBasedCharts } from '@/components/dashboard/charts/TimeBasedCharts'
import { DistributionCharts } from '@/components/dashboard/charts/DistributionCharts'
import { GeographicDistributionCharts } from '@/components/dashboard/geographic/GeographicDistributionCharts'
import { ReportsMapView } from '@/components/dashboard/geographic/ReportsMapView'
import { LiveFleetTracking } from '@/components/dashboard/fleet/LiveFleetTracking'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'
import { 
  BarChart3, 
  BarChart, 
  PieChart, 
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  RefreshCw,
  Search,
  Calendar as CalendarIcon,
  MapPin,
  UserCheck,
  Send,
  CheckCircle,
  X,
  Filter,
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
  Trash2,
  Recycle,
  Users,
  Leaf,
  Factory,
  Truck,
  Store,
  ChevronRight,
  ChevronUp,
  Shield,
  Plus,
  AlertTriangle,
  MessageSquare
} from 'lucide-react'
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Sector,
  LineChart,
  Line
} from 'recharts'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subWeeks, subMonths, subQuarters, subYears } from 'date-fns'
import dynamic from 'next/dynamic'

// Rwanda's 5 provinces (constant for all calculations)
const RWANDA_PROVINCES = [
  'Kigali City',
  'Eastern Province',
  'Northern Province',
  'Southern Province',
  'Western Province'
] as const
const TOTAL_RWANDA_PROVINCES = 5

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })

// Create custom icons based on severity - lazy load Leaflet only on client
let leafletLoaded = false
let L: any = null

async function loadLeaflet() {
  if (typeof window === 'undefined' || leafletLoaded) return L
  
  L = await import('leaflet')
  // @ts-ignore - CSS import doesn't have type declarations
  await import('leaflet/dist/leaflet.css')
  
  // Fix for default Leaflet icons when bundling
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  })
  
  leafletLoaded = true
  return L
}

function createSeverityIcon(severity: string) {
  if (typeof window === 'undefined') {
    // Return a placeholder during SSR
    return null as any
  }
  
  // Load Leaflet synchronously if not already loaded (for client-side)
  if (!L && typeof window !== 'undefined') {
    // This will be called during render, so we'll handle it in useEffect
    return null as any
  }
  
  if (!L) return null as any
  
  const color = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f97316' : '#2563eb'
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)
  const [reportDetailKey, setReportDetailKey] = useState(0)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [filterProvince, setFilterProvince] = useState<string | null>(null)
  const [filterDistrict, setFilterDistrict] = useState<string | null>(null)
  const [filterSector, setFilterSector] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterSeverity, setFilterSeverity] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [assigningReport, setAssigningReport] = useState<AdminReport | null>(null)
  const [showMapView, setShowMapView] = useState(false)
  const [geographicData, setGeographicData] = useState<GeographicData | null>(null)
  const [geographicLoading, setGeographicLoading] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [assignData, setAssignData] = useState({ assigneeId: '', organizationId: '', dueAt: '' })
  const [users, setUsers] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [statusPieActiveIndex, setStatusPieActiveIndex] = useState<number | undefined>(undefined)
  const [isMobile, setIsMobile] = useState(false)
  const [operationalMetrics, setOperationalMetrics] = useState<any | null>(null)
  const [environmentalMetrics, setEnvironmentalMetrics] = useState<any | null>(null)
  const [financialMetrics, setFinancialMetrics] = useState<any | null>(null)
  const [customerMetrics, setCustomerMetrics] = useState<any | null>(null)
  const [staffMetrics, setStaffMetrics] = useState<any | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    operational: false,
    financial: false,
    environmental: false
  })
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('month')
  const [customDateRange, setCustomDateRange] = useState<{from: Date | null, to: Date | null}>({from: null, to: null})
  const [filterExpanded, setFilterExpanded] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      return saved === 'true'
    }
    return false
  })
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [collectionsStats, setCollectionsStats] = useState<any>(null)
  const [trendData, setTrendData] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check authentication before rendering
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await apiMe()
        if (user.role !== 'admin') {
          router.push('/login')
          return
        }
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Authentication failed:', error)
        router.push('/login')
      } finally {
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [router])

  // Load Leaflet on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadLeaflet().then(() => {
        setMapReady(true)
      })
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchReports()
      fetchUsersAndOrgs()
      fetchAllMetrics()
      fetchCollectionsData()
      fetchTrendData()
    }
  }, [isAuthenticated, timePeriod, customDateRange])

  // Calculate geographic data when collections change
  useEffect(() => {
    if (collections.length > 0 || !collectionsLoading) {
      fetchGeographicData()
    }
  }, [collections, collectionsLoading])

  // Auto-refresh for real-time updates
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return
    
    const interval = setInterval(() => {
      fetchCollectionsData()
      fetchAllMetrics()
      setLastUpdated(new Date())
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, isAuthenticated, timePeriod, customDateRange])

  // Debug: Log users state changes
  useEffect(() => {
    console.log('Users state changed:', { count: users.length, users })
  }, [users])

  const fetchUsersAndOrgs = async () => {
    setUsersLoading(true)
    setUsersError(null)
    try {
      console.log('Fetching users and organizations...')
      const [usersRes, orgsRes] = await Promise.all([
        apiGetUsers(),
        apiGetOrganizations()
      ])
      console.log('Users response:', usersRes)
      console.log('Organizations response:', orgsRes)
      
      const usersData = usersRes.data || []
      const orgsData = orgsRes.data || []
      
      console.log('Setting users state:', { count: usersData.length, users: usersData })
      setUsers(usersData)
      setOrganizations(orgsData)
      
      if (usersData.length === 0) {
        setUsersError('No officers found. Please create officers first.')
        console.warn('No officers returned from API')
      } else {
        console.log(`Successfully loaded ${usersData.length} officers into state`)
      }
    } catch (error) {
      console.error('Failed to fetch users/organizations:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch officers'
      setUsersError(errorMessage)
      toast({
        title: 'Failed to load officers',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setUsersLoading(false)
    }
  }

  // Calculate geographic data from collections
  const calculateGeographicData = (collections: Collection[]): GeographicData => {
    const provinceCounts = new Map<string, number>()
    const districtCounts = new Map<string, { province: string; count: number }>()
    const sectorCounts = new Map<string, { district: string; province: string; count: number }>()
    
    // Initialize all 5 Rwanda provinces
    RWANDA_PROVINCES.forEach(province => {
      provinceCounts.set(province, 0)
    })
    
    // Count collections by location
    collections.forEach(collection => {
      const { province, district, sector } = collection.location
      
      if (province) {
        provinceCounts.set(province, (provinceCounts.get(province) || 0) + 1)
      }
      
      if (district && province) {
        const key = `${district}|${province}`
        const current = districtCounts.get(key) || { province, count: 0 }
        districtCounts.set(key, { ...current, count: current.count + 1 })
      }
      
      if (sector && district && province) {
        const key = `${sector}|${district}|${province}`
        const current = sectorCounts.get(key) || { district, province, count: 0 }
        sectorCounts.set(key, { ...current, count: current.count + 1 })
      }
    })
    
    return {
      provinces: Array.from(provinceCounts.entries()).map(([name, count]) => ({ name, count })),
      districts: Array.from(districtCounts.entries()).map(([key, data]) => {
        const [district] = key.split('|')
        return { name: district, province: data.province, count: data.count }
      }),
      sectors: Array.from(sectorCounts.entries()).map(([key, data]) => {
        const [sector] = key.split('|')
        return { name: sector, district: data.district, province: data.province, count: data.count }
      })
    }
  }

  const fetchGeographicData = () => {
    setGeographicLoading(true)
    try {
      const data = calculateGeographicData(collections)
      setGeographicData(data)
    } catch (error) {
      console.error('Failed to calculate geographic data:', error)
      setGeographicData(null)
    } finally {
      setGeographicLoading(false)
    }
  }

  // Compute filtered geographic data based on selections
  const filteredGeographicData = useMemo(() => {
    if (!geographicData) return null
    
    let filteredDistricts = geographicData.districts
    let filteredSectors = geographicData.sectors
    
    // Filter districts by selected province
    if (selectedProvince) {
      filteredDistricts = geographicData.districts.filter(d => d.province === selectedProvince)
      // Also filter sectors by province
      filteredSectors = geographicData.sectors.filter(s => s.province === selectedProvince)
    }
    
    // Filter sectors by selected district (only if district is selected)
    if (selectedDistrict) {
      filteredSectors = filteredSectors.filter(s => s.district === selectedDistrict)
    }
    
    return {
      provinces: geographicData.provinces,
      districts: filteredDistricts,
      sectors: filteredSectors,
    }
  }, [geographicData, selectedProvince, selectedDistrict])

  const fetchAllMetrics = async () => {
    try {
      const [operational, financial, environmental, customer, staff] = await Promise.all([
        apiGetOperationalMetrics(timePeriod),
        apiGetFinancialMetrics(timePeriod),
        apiGetEnvironmentalMetrics(timePeriod),
        apiGetCustomerMetrics(),
        apiGetStaffPerformanceMetrics(),
      ])
      setOperationalMetrics(operational)
      setFinancialMetrics(financial)
      setEnvironmentalMetrics(environmental)
      setCustomerMetrics(customer)
      setStaffMetrics(staff)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  const fetchCollectionsData = async () => {
    setCollectionsLoading(true)
    try {
      // Calculate date range based on time period filter
      let startDate: string | undefined
      let endDate: string | undefined
      
      const now = new Date()
      if (timePeriod === 'today') {
        startDate = format(startOfDay(now), 'yyyy-MM-dd')
        endDate = format(endOfDay(now), 'yyyy-MM-dd')
      } else if (timePeriod === 'week') {
        startDate = format(startOfWeek(now), 'yyyy-MM-dd')
        endDate = format(endOfWeek(now), 'yyyy-MM-dd')
      } else if (timePeriod === 'month') {
        startDate = format(startOfMonth(now), 'yyyy-MM-dd')
        endDate = format(endOfMonth(now), 'yyyy-MM-dd')
      } else if (timePeriod === 'quarter') {
        startDate = format(startOfQuarter(now), 'yyyy-MM-dd')
        endDate = format(endOfQuarter(now), 'yyyy-MM-dd')
      } else if (timePeriod === 'year') {
        startDate = format(startOfYear(now), 'yyyy-MM-dd')
        endDate = format(endOfYear(now), 'yyyy-MM-dd')
      } else if (timePeriod === 'custom' && customDateRange.from && customDateRange.to) {
        startDate = format(customDateRange.from, 'yyyy-MM-dd')
        endDate = format(customDateRange.to, 'yyyy-MM-dd')
      }
      
      // For analytics charts, we need historical data (12 months, 8 weeks, 30 days)
      // Always fetch at least a year of data to populate all time-based charts
      // The filter is used for other metrics, but charts need historical context
      const oneYearAgo = subYears(now, 1)
      const chartStartDate = format(oneYearAgo, 'yyyy-MM-dd')
      const chartEndDate = format(now, 'yyyy-MM-dd')
      
      // Use the filter date range if it's larger than a year, otherwise use full year for charts
      if (!startDate || !endDate) {
        startDate = chartStartDate
        endDate = chartEndDate
      } else {
        // Ensure we have at least a year of data for charts
        const filterStart = new Date(startDate)
        const oneYearAgoDate = subYears(now, 1)
        if (filterStart > oneYearAgoDate) {
          startDate = chartStartDate
        }
      }
      
      const [collectionsResponse, statsResponse] = await Promise.all([
        apiGetCollections({ 
          limit: 1000, 
          startDate,
          endDate,
        }),
        apiGetCollectionsStats({ startDate, endDate }),
      ])
      setCollections(collectionsResponse.data || [])
      setCollectionsStats(statsResponse)
    } catch (error) {
      console.error('Failed to fetch collections:', error)
    } finally {
      setCollectionsLoading(false)
    }
  }

  const fetchTrendData = async () => {
    try {
      const data = await apiGetTrendData({ period: timePeriod })
      setTrendData(data)
    } catch (error) {
      console.error('Failed to fetch trend data:', error)
    }
  }

  const fetchReports = async (): Promise<AdminReport[]> => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching reports from API...')
      const response = await apiGetAdminReports({ limit: 1000 })
      console.log('Reports fetched:', response.data.length, 'reports')
      if (response.data.length > 0) {
        console.log('Sample report:', response.data[0])
      }
      setReports(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reports. Please check your API connection.'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = async (report: AdminReport) => {
    // Always fetch fresh data when opening a report to ensure we have the latest assignment status
    // This is especially important for reports that were auto-assigned previously
    try {
      const updatedReports = await fetchReports()
      const freshReport = updatedReports.find(r => r.id === report.id) || report
      setSelectedReport(freshReport)
      setIsDetailOpen(true)
      // Reset the detail key to ensure fresh fetch in ReportDetailView
      setReportDetailKey(prev => prev + 1)
    } catch (error) {
      // If fetch fails, still open with the report from the list
      console.error('Failed to refresh reports before viewing:', error)
      setSelectedReport(report)
      setIsDetailOpen(true)
    }
  }

  const handleReportUpdated = () => {
    fetchReports()
    setIsDetailOpen(false)
  }

  // Calculate statistics
  const stats = {
    total: reports.length,
    new: reports.filter(r => r.status === 'new').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    high: reports.filter(r => r.severity === 'high').length,
  }

  // Urgent reports (high severity, unresolved)
  const urgentReports = reports
    .filter(r => r.severity === 'high' && r.status !== 'resolved' && r.status !== 'rejected')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  // Performance metrics
  const performanceMetrics = (() => {
    const resolvedReports = reports.filter(r => r.status === 'resolved' && r.createdAt && r.updatedAt)
    
    // Calculate average resolution time
    const resolutionTimes = resolvedReports.map(r => {
      const created = new Date(r.createdAt || Date.now()).getTime()
      const updated = new Date(r.updatedAt || Date.now()).getTime()
      return (updated - created) / (1000 * 60 * 60) // hours
    })
    
    const avgResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0

    // Calculate overdue assignments (assigned more than 7 days ago, not resolved)
    const overdueReports = reports.filter(r => {
      if (r.status === 'resolved' || r.status === 'rejected') return false
      if (!r.currentAssignment?.createdAt) return false
      const assignedDate = new Date(r.currentAssignment.createdAt)
      const daysSinceAssignment = (Date.now() - assignedDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceAssignment > 7
    })

    // SLA compliance (assuming 7-day SLA)
    // Calculate from assignment date, include all assigned reports
    const slaTarget = 7 * 24 // 7 days in hours
    
    // Get all reports that have been assigned (have a currentAssignment with createdAt)
    const assignedReports = reports.filter(r => {
      // Check if report has an assignment with createdAt
      const hasAssignment = r.currentAssignment?.createdAt
      if (!hasAssignment && r.currentAssignment) {
        // Debug: log reports with assignment but no createdAt
        console.log('Report with assignment but no createdAt:', {
          id: r.id,
          title: r.title,
          currentAssignment: r.currentAssignment
        })
      }
      return hasAssignment && r.status !== 'rejected'
    })
    
    // Debug logging
    if (reports.length > 0) {
      console.log('SLA Debug:', {
        totalReports: reports.length,
        assignedReportsCount: assignedReports.length,
        reportsWithAssignment: reports.filter(r => r.currentAssignment).length,
        reportsWithAssignmentCreatedAt: reports.filter(r => r.currentAssignment?.createdAt).length,
        sampleReport: reports.find(r => r.currentAssignment)?.currentAssignment
      })
    }
    
    // For each assigned report, check if it's SLA compliant
    const slaCompliant = assignedReports.filter(r => {
      const createdAt = r.currentAssignment?.createdAt
      if (!createdAt) return false
      
      const assignedDate = new Date(createdAt).getTime()
      
      if (r.status === 'resolved') {
        // For resolved reports: check if resolved within SLA from assignment
        const resolvedDate = new Date(r.updatedAt || Date.now()).getTime()
        const hoursToResolve = (resolvedDate - assignedDate) / (1000 * 60 * 60)
        return hoursToResolve <= slaTarget
      } else {
        // For unresolved reports: check if still within SLA (not overdue)
        const now = Date.now()
        const hoursSinceAssignment = (now - assignedDate) / (1000 * 60 * 60)
        return hoursSinceAssignment <= slaTarget
      }
    }).length
    
    // Calculate compliance rate, or return null if no assigned reports
    const slaComplianceRate = assignedReports.length > 0
      ? (slaCompliant / assignedReports.length) * 100
      : null

    // Category-specific resolution times
    const categoryResolutionTimes = new Map<string, { total: number; hours: number }>()
    resolvedReports.forEach(r => {
      if (!categoryResolutionTimes.has(r.type)) {
        categoryResolutionTimes.set(r.type, { total: 0, hours: 0 })
      }
      const created = new Date(r.createdAt || Date.now()).getTime()
      const updated = new Date(r.updatedAt || Date.now()).getTime()
      const hours = (updated - created) / (1000 * 60 * 60)
      const cat = categoryResolutionTimes.get(r.type)!
      cat.total++
      cat.hours += hours
    })
    
    const categoryAvgTimes = Array.from(categoryResolutionTimes.entries()).map(([type, data]) => ({
      type,
      avgHours: data.hours / data.total,
      count: data.total,
    }))

    // Overdue percentage
    const totalAssigned = reports.filter(r => 
      r.currentAssignment?.createdAt && r.status !== 'rejected'
    ).length
    const overduePercentage = totalAssigned > 0
      ? (overdueReports.length / totalAssigned) * 100
      : 0

    return {
      avgResolutionTime,
      overdueCount: overdueReports.length,
      overduePercentage,
      slaComplianceRate,
      categoryAvgTimes,
    }
  })()

  // Reports by province
  const provinceData = (() => {
    const provinceMap = new Map<string, number>()
    reports.forEach(report => {
      const province = report.province?.trim()
      if (province && province.length > 0) {
        provinceMap.set(province, (provinceMap.get(province) || 0) + 1)
      }
    })
    return Array.from(provinceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  })()

  // Reports by district (filtered by province if selected)
  const districtData = (() => {
    const districtMap = new Map<string, number>()
    const reportsToUse = filterProvince 
      ? reports.filter(report => report.province?.trim() === filterProvince)
      : reports
    reportsToUse.forEach(report => {
      const district = report.district?.trim()
      if (district && district.length > 0) {
        districtMap.set(district, (districtMap.get(district) || 0) + 1)
      }
    })
    return Array.from(districtMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 districts
  })()

  // Reports by sector (filtered by district and province if selected)
  const sectorData = (() => {
    const sectorMap = new Map<string, number>()
    let reportsToUse = reports
    if (filterProvince) {
      reportsToUse = reportsToUse.filter(report => report.province?.trim() === filterProvince)
    }
    if (filterDistrict) {
      reportsToUse = reportsToUse.filter(report => report.district?.trim() === filterDistrict)
    }
    reportsToUse.forEach(report => {
      const sector = report.sector?.trim()
      if (sector && sector.length > 0) {
        sectorMap.set(sector, (sectorMap.get(sector) || 0) + 1)
      }
    })
    return Array.from(sectorMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Top 10 sectors
  })()

  // Debug: Log data availability
  useEffect(() => {
    if (reports.length > 0) {
      console.log('Dashboard Statistics:', stats)
      console.log('Total reports:', reports.length)
      console.log('Reports with district:', reports.filter(r => r.district).length)
      console.log('Reports with sector:', reports.filter(r => r.sector).length)
      console.log('Reports with province:', reports.filter(r => r.province).length)
      
      // Log sample reports to see what fields are available
      if (reports.length > 0) {
        console.log('Sample report fields:', {
          id: reports[0].id,
          district: reports[0].district,
          sector: reports[0].sector,
          province: reports[0].province,
          hasDistrict: !!reports[0].district,
          hasSector: !!reports[0].sector,
        })
      }
      
      const districts = [...new Set(reports.filter(r => r.district && r.district.trim()).map(r => r.district))].slice(0, 5)
      const sectors = [...new Set(reports.filter(r => r.sector && r.sector.trim()).map(r => r.sector))].slice(0, 5)
      console.log('Sample districts:', districts)
      console.log('Sample sectors:', sectors)
      console.log('Province data for chart:', provinceData)
      console.log('District data for chart:', districtData)
      console.log('Sector data for chart:', sectorData)
    }
  }, [reports, stats, provinceData, districtData, sectorData])

  // Filter reports based on geographic filters (for map view)
  const filteredReports = reports.filter(report => {
    if (filterProvince && report.province?.trim() !== filterProvince) return false
    if (filterDistrict && report.district?.trim() !== filterDistrict) return false
    if (filterSector && report.sector?.trim() !== filterSector) return false
    return true
  })

  // Calculate map bounds from filtered reports
  const mapCenterAndBounds = useMemo(() => {
    const reportsWithLocation = filteredReports.filter(r => r.latitude && r.longitude)
    if (reportsWithLocation.length === 0) {
      return { center: [-1.9441, 30.0619] as [number, number], zoom: 11 } // Default to Kigali
    }
    
    const lats = reportsWithLocation.map(r => r.latitude!)
    const lngs = reportsWithLocation.map(r => r.longitude!)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2
    
    // Calculate zoom level based on bounds
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const maxDiff = Math.max(latDiff, lngDiff)
    
    let zoom = 11
    if (maxDiff > 0.5) zoom = 8
    else if (maxDiff > 0.2) zoom = 9
    else if (maxDiff > 0.1) zoom = 10
    else if (maxDiff > 0.05) zoom = 11
    else if (maxDiff > 0.02) zoom = 12
    else zoom = 13
    
    return {
      center: [centerLat, centerLng] as [number, number],
      zoom,
      bounds: [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]]
    }
  }, [filteredReports])

  // Don't render content until authenticated
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  // Reports by status
  const statusData = [
    { name: 'Scheduled', value: reports.filter(r => r.status === 'scheduled').length, color: '#3b82f6' },
    { name: 'In Progress', value: reports.filter(r => r.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'Completed', value: reports.filter(r => r.status === 'completed').length, color: '#10b981' },
    { name: 'Missed', value: reports.filter(r => r.status === 'missed').length, color: '#ef4444' },
    { name: 'Cancelled', value: reports.filter(r => r.status === 'cancelled').length, color: '#6b7280' },
  ].filter(item => item.value > 0)

  // Helper function to format waste type display names
  const getTypeDisplayName = (type: string): string => {
    const typeDisplayNames: Record<string, string> = {
      'organic': 'Organic Waste',
      'plastic': 'Plastic',
      'paper': 'Paper',
      'metal': 'Metal',
      'glass': 'Glass',
      'e-waste': 'E-Waste',
      'hazardous': 'Hazardous',
      'waste_collection': 'Waste Collection',
      'recycling': 'Recycling',
      'bulk_waste': 'Bulk Waste',
      'other': 'Other',
    }
    return typeDisplayNames[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
  }

  // Reports by type - dynamically count all unique types
  const typeData = (() => {
    const typeCounts = new Map<string, number>()
    
    reports.forEach(report => {
      const count = typeCounts.get(report.type) || 0
      typeCounts.set(report.type, count + 1)
    })
    
    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({
        name: getTypeDisplayName(type),
        value: count,
      }))
      .sort((a, b) => b.value - a.value) // Sort by count descending
      .filter(item => item.value > 0)
  })()

  // Helper function to get collection timestamp (prefer actual time, fallback to scheduled)
  const getCollectionTimestamp = (collection: Collection): Date => {
    // Prefer actual start time if available (collection happened)
    if (collection.actualStartTime) {
      return new Date(collection.actualStartTime)
    }
    // Use scheduled time (when collection was planned)
    if (collection.scheduledTime) {
      return new Date(collection.scheduledTime)
    }
    // Fallback to creation time
    return new Date(collection.createdAt)
  }

  // Collections by hour of day
  const hourlyData = (() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      collections: 0,
    }))
    
    collections.forEach(collection => {
      const collectionDate = getCollectionTimestamp(collection)
      const hour = collectionDate.getHours()
      hours[hour].collections += 1
    })
    
    return hours
  })()

  // Monthly collections (last 12 months)
  const monthlyData = (() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return {
        month: format(date, 'MMM'),
        collections: 0,
      }
    })
    
    collections.forEach(collection => {
      const collectionDate = getCollectionTimestamp(collection)
      const monthIndex = collectionDate.getMonth()
      const monthDiff = new Date().getMonth() - monthIndex
      if (monthDiff >= 0 && monthDiff < 12) {
        months[11 - monthDiff].collections += 1
      }
    })
    
    return months
  })()

  // Weekly collections data (last 8 weeks)
  const weeklyData = (() => {
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (7 - i) * 7)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      return {
        week: `Week ${8 - i}`,
        label: format(weekStart, 'MMM d'),
        weekStart: weekStart,
        collections: 0,
      }
    })

    collections.forEach(collection => {
      const collectionDate = getCollectionTimestamp(collection)
      const weekStart = new Date(collectionDate)
      weekStart.setDate(collectionDate.getDate() - collectionDate.getDay())
      
      // Find which week this collection belongs to
      for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i]
        const weekEnd = new Date(week.weekStart)
        weekEnd.setDate(week.weekStart.getDate() + 6)
        
        if (collectionDate >= week.weekStart && collectionDate <= weekEnd) {
          week.collections++
          break
        }
      }
    })

    return weeks
  })()

  // Daily collections data (last 30 days)
  const dailyData = (() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return {
        day: format(date, 'MMM d'),
        date: new Date(date),
        collections: 0,
      }
    })

    collections.forEach(collection => {
      const collectionDate = getCollectionTimestamp(collection)
      collectionDate.setHours(0, 0, 0, 0)
      
      const dayData = days.find(d => {
        const dayDate = new Date(d.date)
        dayDate.setHours(0, 0, 0, 0)
        return dayDate.getTime() === collectionDate.getTime()
      })
      
      if (dayData) {
        dayData.collections++
      }
    })

    return days
  })()

  // Helper function to format time ago
  const formatTimeAgo = (date: string): string => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffWeeks < 4) return `${diffWeeks}w ago`
    if (diffMonths < 12) return `${diffMonths}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  }

  // Helper function to check if report is overdue
  const isOverdue = (report: AdminReport): boolean => {
    if (!report.currentAssignment?.createdAt) return false
    if (report.status === 'resolved' || report.status === 'rejected') return false
    
    const assignedDate = new Date(report.currentAssignment.createdAt)
    const daysSinceAssignment = (Date.now() - assignedDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceAssignment > 7
  }

  // Helper function to get days until/since due date
  const getDueDateInfo = (report: AdminReport): { text: string; isOverdue: boolean } | null => {
    // Note: dueAt is not in the current type definition, so this function returns null
    // If dueAt is added to the type in the future, uncomment the code below
    // if (!report.currentAssignment?.dueAt) return null
    // const dueDate = new Date(report.currentAssignment.dueAt)
    // const now = new Date()
    // const diffMs = dueDate.getTime() - now.getTime()
    // const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    // if (diffDays < 0) {
    //   return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true }
    // } else if (diffDays === 0) {
    //   return { text: 'Due today', isOverdue: false }
    // } else if (diffDays === 1) {
    //   return { text: 'Due tomorrow', isOverdue: false }
    // } else {
    //   return { text: `Due in ${diffDays}d`, isOverdue: false }
    // }
    return null
  }

  // Helper function to get assignment age
  const getAssignmentAge = (report: AdminReport): string | null => {
    if (!report.currentAssignment?.createdAt) return null
    return formatTimeAgo(report.currentAssignment.createdAt)
  }

  // Helper function to get photo count
  const getPhotoCount = (report: AdminReport): number => {
    return report.photos?.length || 0
  }

  // Helper function to format location
  const formatLocation = (report: AdminReport): string => {
    const parts: string[] = []
    if (report.district) parts.push(report.district)
    if (report.province && !parts.includes(report.province)) {
      parts.push(report.province)
    }
    return parts.length > 0 ? parts.join(', ') : 'Unknown'
  }


  const handleProvinceClick = (province: string) => {
    setFilterProvince(province)
    setFilterDistrict(null) // Clear district filter when province is selected
    setFilterSector(null) // Clear sector filter when province is selected
  }

  const handleDistrictClick = (district: string) => {
    setFilterDistrict(district)
    setFilterSector(null) // Clear sector filter when district is selected
  }

  const handleSectorClick = (sector: string) => {
    setFilterSector(sector)
    setFilterDistrict(null) // Clear district filter when sector is selected
  }

  const clearFilters = () => {
    setFilterProvince(null)
    setFilterDistrict(null)
    setFilterSector(null)
    setFilterStatus('')
    setFilterType('')
    setFilterSeverity('')
    setSearchQuery('')
    // Also clear chart selections
    setSelectedProvince(null)
    setSelectedDistrict(null)
  }

  const handleAutoAssign = async () => {
    setAutoAssigning(true)
    try {
      const response = await apiAutoAssignReports()
      toast({
        title: 'Success',
        description: `Successfully assigned reports to officers`,
      })
      // Refresh reports to show updated assignments
      const updatedReports = await fetchReports()
      // If a report detail view is open, update the selected report with fresh data
      if (selectedReport) {
        // Find the updated report from the refreshed reports list
        const updatedReport = updatedReports.find(r => r.id === selectedReport.id)
        if (updatedReport) {
          setSelectedReport(updatedReport)
          // Force ReportDetailView to refresh by updating the key
          setReportDetailKey(prev => prev + 1)
        }
      }
    } catch (error) {
      console.error('Failed to auto-assign reports:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to auto-assign reports',
        variant: 'destructive',
      })
    } finally {
      setAutoAssigning(false)
    }
  }


  const handleQuickTriage = async (report: AdminReport) => {
    setUpdatingStatus(report.id)
    try {
      await apiUpdateReportStatus(report.id, 'triaged')
      toast({
        title: 'Success',
        description: 'Report marked as triaged',
      })
      fetchReports()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleQuickResolve = async (report: AdminReport) => {
    setUpdatingStatus(report.id)
    try {
      await apiUpdateReportStatus(report.id, 'resolved')
      toast({
        title: 'Success',
        description: 'Report marked as resolved',
      })
      fetchReports()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleQuickAssign = async (report: AdminReport) => {
    setAssigningReport(report)
    setAssignData({ assigneeId: '', organizationId: '', dueAt: '' })
    
    // Always refresh users/orgs when opening dialog to ensure we have latest data
    if (users.length === 0 || !usersLoading) {
      console.log('Fetching users before opening dialog, current users count:', users.length)
      await fetchUsersAndOrgs()
    }
    
    console.log('Opening assign dialog, users available:', users.length)
    setIsAssignDialogOpen(true)
  }

  const handleAssignSubmit = async () => {
    if (!assigningReport) {
      console.error('No report selected for assignment')
      return
    }
    
    if (!assignData.assigneeId && !assignData.organizationId) {
      toast({
        title: 'Validation Error',
        description: 'Please select either an officer or organization',
        variant: 'destructive',
      })
      return
    }

    console.log('Submitting assignment:', {
      reportId: assigningReport.id,
      assignData,
    })

    try {
      const payload: {
        assigneeId?: string
        organizationId?: string
        dueAt?: string
      } = {}
      
      if (assignData.assigneeId) {
        payload.assigneeId = assignData.assigneeId
      }
      
      if (assignData.organizationId) {
        payload.organizationId = assignData.organizationId
      }
      
      if (assignData.dueAt && assignData.dueAt.trim() !== '') {
        // Convert datetime-local format to ISO string
        const dateValue = new Date(assignData.dueAt)
        if (!isNaN(dateValue.getTime())) {
          payload.dueAt = dateValue.toISOString()
        }
      }
      
      console.log('Assignment payload:', payload)
      // apiAssignReport expects (reportId: string, officerId: string)
      // Use assigneeId if available, otherwise use organizationId as fallback
      const officerId = assignData.assigneeId || assignData.organizationId || ''
      if (!officerId) {
        toast({
          title: 'Validation Error',
          description: 'Please select either an officer or organization',
          variant: 'destructive',
        })
        return
      }
      const result = await apiAssignReport(assigningReport.id, officerId)
      console.log('Assignment result:', result)
      
      toast({
        title: 'Success',
        description: 'Report assigned successfully',
      })
      setIsAssignDialogOpen(false)
      setAssigningReport(null)
      setAssignData({ assigneeId: '', organizationId: '', dueAt: '' })
      fetchReports()
    } catch (error: any) {
      console.error('Assignment error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign report',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'default'
      case 'triaged': return 'secondary'
      case 'assigned': return 'outline'
      case 'in_progress': return 'default'
      case 'resolved': return 'default'
      case 'rejected': return 'destructive'
      default: return 'default'
    }
  }

  const getSeverityBadgeClassName = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'medium':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusBadgeClassName = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      case 'triaged':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'assigned':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'in_progress':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      case 'resolved':
        return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'rejected':
        return 'bg-red-600/10 text-red-500 border-red-600/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  // Helper function to format weight
  const formatWeight = (kg: number): string => {
    if (kg >= 1000000) return `${(kg / 1000000).toFixed(1)}M kg`
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}K kg`
    return `${kg.toFixed(0)} kg`
  }

  // Helper function to format currency (RWF)
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M RWF`
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K RWF`
    return `${amount.toFixed(0)} RWF`
  }

  // Helper function to calculate completion rate
  const calculateCompletionRate = (): number => {
    const completed = reports.filter(r => r.status === 'completed' || r.status === 'resolved').length
    const scheduled = reports.filter(r => r.status === 'scheduled' || r.status === 'assigned' || r.status === 'completed' || r.status === 'resolved').length
    return scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <AdminSidebar 
        variant="admin" 
        userName="Admin User" 
        userRole="admin"
        collapsed={sidebarCollapsed}
        onCollapseChange={(collapsed) => {
          setSidebarCollapsed(collapsed)
          if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarCollapsed', String(collapsed))
          }
        }}
      />
      
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader userName="Admin User" userRole="Administrator" />
        
        {/* Main Content */}
        <div className="p-6 lg:p-8 space-y-10 bg-slate-900/50 max-w-[1920px] mx-auto">
          {/* Error Message */}
          {error && (
            <Card className="border-red-500 bg-red-500/10">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                  <h3 className="font-semibold text-red-400">Error Loading Data</h3>
                </div>
                    <p className="text-sm text-red-300">{error}</p>
                    <p className="text-xs text-red-400/80 mt-2">
                      Please check your connection and try again. If the problem persists, contact support.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                <Button
                  onClick={fetchReports}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-400 hover:bg-red-500/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                    <Button
                      onClick={() => {
                        setError(null)
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      Dismiss
                    </Button>
              </div>
            </div>
              </CardContent>
            </Card>
          )}

          {/* Urgent Reports Alert Section */}
          {!loading && urgentReports.length > 0 && (
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 border-b-0 px-4 py-3 flex flex-col space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 relative z-10">
                    <AlertCircle className="h-4 w-4 text-white" />
                    <CardTitle size="md" className="text-white">Urgent Reports</CardTitle>
                  </div>
                  <Badge className="bg-red-800/90 text-white border-red-600 px-2 py-0.5 text-xs font-medium relative z-10">
                    {urgentReports.length} urgent
                  </Badge>
                </div>
                <CardDescription className="text-red-100/90 text-xs mt-1 relative z-10">
                  High-severity reports requiring immediate attention
                </CardDescription>
              </div>
              <CardContent className="p-3">
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {urgentReports.map((report) => (
                    <div
                      key={report.id}
                      className="group flex items-center justify-between gap-3 p-2.5 rounded-md border border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70 transition-all cursor-pointer"
                      onClick={() => handleViewReport(report)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                              {report.title}
                            </h4>
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-xs px-1.5 py-0.5">
                                High
                              </Badge>
                              <Badge className={`${getStatusBadgeClassName(report.status)} border text-xs px-2 py-1 min-w-[80px] text-center inline-block`}>
                                {report.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(report.createdAt), 'MMM d, yyyy')}
                            </span>
                            {report.district && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {report.district}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewReport(report)
                        }}
                        className="h-7 w-7 flex-shrink-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Real-time Operational Dashboard */}
          <div className="grid gap-4 lg:grid-cols-3">
            <RealTimeStatus
              collections={collections}
              loading={collectionsLoading}
              autoRefresh={autoRefresh}
              onRefresh={fetchCollectionsData}
              onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
              lastUpdated={lastUpdated}
            />
            <QuickActionsPanel
              actions={[
                {
                  label: 'Create Collection',
                  icon: Plus,
                  onClick: () => router.push('/admin/waste-collections'),
                },
                {
                  label: 'Assign Pending Reports',
                  icon: UserCheck,
                  onClick: handleAutoAssign,
                },
                {
                  label: 'View Active Routes',
                  icon: MapPin,
                  onClick: () => router.push('/admin/zones-routes'),
                },
                {
                  label: 'View Alerts',
                  icon: AlertCircle,
                  onClick: () => setSelectedMetric('alerts'),
                },
              ]}
            />
          </div>

          {/* Live Fleet Tracking */}
          <LiveFleetTracking
            autoRefresh={autoRefresh}
            refreshInterval={30}
            onVehicleClick={(vehicle) => {
              // Navigate to vehicle details or show in dialog
              console.log('Vehicle clicked:', vehicle)
            }}
          />

          {/* Performance Trends */}
          {trendData && trendData.dailyTrends && (
            <PerformanceTrends
              data={trendData.dailyTrends}
              dataKeys={[
                { key: 'collections', name: 'Collections', color: '#3b82f6' },
                { key: 'completed', name: 'Completed', color: '#10b981' },
              ]}
            />
          )}

          {/* Alert & Notification Center */}
          <AlertCenter
            alerts={[
              ...(collectionsStats && collectionsStats.missed > 0
                ? [{
                    id: 'overdue-collections',
                    type: 'error' as const,
                    title: 'Overdue Collections',
                    description: 'collections require attention',
                    count: collectionsStats.missed,
                    onAction: () => router.push('/admin/waste-collections?status=missed'),
                  }]
                : []),
              ...(financialMetrics && financialMetrics.maintenanceDue > 0
                ? [{
                    id: 'vehicle-maintenance',
                    type: 'warning' as const,
                    title: 'Vehicle Maintenance Due',
                    description: 'vehicles need maintenance',
                    count: financialMetrics.maintenanceDue,
                    icon: Truck,
                    onAction: () => router.push('/admin/officers'),
                  }]
                : []),
              ...(customerMetrics && customerMetrics.paymentArrears > 0
                ? [{
                    id: 'payment-arrears',
                    type: 'warning' as const,
                    title: 'Payment Arrears',
                    description: `in outstanding payments`,
                    count: customerMetrics.paymentArrears,
                    icon: AlertTriangle,
                    onAction: () => router.push('/admin/organizations'),
                  }]
                : []),
              ...(urgentReports.length > 0
                ? [{
                    id: 'compliance-issues',
                    type: 'error' as const,
                    title: 'Compliance Issues',
                    description: 'high-severity reports pending',
                    count: urgentReports.length,
                    icon: Shield,
                    onAction: () => setSelectedMetric('reports'),
                  }]
                : []),
            ]}
            onAlertClick={(alert) => alert.onAction?.()}
          />

          {/* Time Period Filter */}
          <Card className="bg-black border-slate-800">
            <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-900/50 bg-black relative">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <div className="flex items-center justify-between relative z-10 flex-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  <CardTitle size="md" className="text-white text-sm sm:text-base">Filters</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newExpanded = !filterExpanded
                    setFilterExpanded(newExpanded)
                  }}
                  className="text-slate-400 hover:text-white text-xs sm:text-sm"
                >
                  {filterExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </div>
            </div>
            
            {filterExpanded && (
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 space-y-4">
                {/* Period Selection */}
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Time Period</label>
                  <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg p-1">
                    {(['today', 'week', 'month', 'quarter', 'year', 'custom'] as const).map((period) => (
                      <Button
                        key={period}
                        variant={timePeriod === period ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => {
              if (period === 'custom') {
                setTimePeriod('custom')
              } else {
                setTimePeriod(period)
                setCustomDateRange({ from: null, to: null })
              }
            }}
                        className={
                          timePeriod === period
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'text-slate-400 hover:text-white'
                        }
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Range */}
                {timePeriod === 'custom' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Start Date</label>
                      <Input
                        type="date"
                        value={customDateRange.from ? format(customDateRange.from, 'yyyy-MM-dd') : ''}
                        onChange={(e) =>
                          setCustomDateRange({
                            ...customDateRange,
                            from: e.target.value ? new Date(e.target.value) : null,
                          })
                        }
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">End Date</label>
                      <Input
                        type="date"
                        value={customDateRange.to ? format(customDateRange.to, 'yyyy-MM-dd') : ''}
                        onChange={(e) =>
                          setCustomDateRange({
                            ...customDateRange,
                            to: e.target.value ? new Date(e.target.value) : null,
                          })
                        }
                        className="bg-slate-800/50 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTimePeriod('month')
                      setCustomDateRange({ from: null, to: null })
                    }}
                    className="border-slate-700 text-white hover:bg-slate-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Primary Metrics - Always Visible */}
          <MetricsSection title="Primary Metrics" icon={BarChart3}>
            <MetricCardGroup
              metrics={[
                {
                  title: 'Total Collections',
                  value: stats.total,
                  icon: FileText,
                  variant: 'default',
                  change: 12.5,
                },
                {
                  title: 'Waste Collected',
                  value: operationalMetrics?.totalWasteCollected?.value || 0,
                  format: 'weight',
                  icon: Trash2,
                  variant: 'success',
                  change: operationalMetrics?.totalWasteCollected?.change,
                  onClick: () => setSelectedMetric('waste'),
                  tooltip: 'Total weight of waste collected in the selected period. Click to view breakdown by type.',
                },
                {
                  title: 'Completion Rate',
                  value: operationalMetrics?.collectionCompletionRate?.value || calculateCompletionRate(),
                  format: 'percentage',
                  icon: CheckCircle2,
                  variant: 'success',
                },
                {
                  title: 'Missed Pickups',
                  value: operationalMetrics?.missedPickups?.value || reports.filter(r => r.status === 'missed').length,
                  icon: AlertCircle,
                  variant: 'negative',
                },
                {
                  title: 'Active Routes',
                  value: stats.inProgress,
                  icon: MapPin,
                  variant: 'default',
                  change: 8.2,
                },
                {
                  title: 'Recycling Rate',
                  value: environmentalMetrics?.recyclingRate || 32.5,
                  format: 'percentage',
                  icon: Recycle,
                  variant: 'success',
                  change: 15.7,
                },
              ]}
              loading={loading}
              columns={4}
              onMetricClick={(metric) => metric.onClick?.()}
            />
          </MetricsSection>

          {/* Operational Metrics - Collapsible */}
          <MetricsSection
            title="Operational Efficiency"
            icon={Truck}
            expanded={expandedSections.operational}
            onExpandedChange={(expanded) => setExpandedSections(prev => ({ ...prev, operational: expanded }))}
            badge="Route & Performance"
          >
            <MetricCardGroup
              metrics={[
                {
                  title: 'Distance Traveled',
                  value: operationalMetrics?.distanceTraveled?.value || 0,
                  unit: operationalMetrics?.distanceTraveled?.unit || 'km',
                  icon: MapPin,
                  variant: 'default',
                },
                {
                  title: 'Fuel Consumption',
                  value: operationalMetrics?.fuelConsumption?.value || 0,
                  unit: operationalMetrics?.fuelConsumption?.unit || 'liters',
                  icon: Truck,
                  variant: 'warning',
                },
                {
                  title: 'Route Productivity',
                  value: operationalMetrics?.routeEfficiency?.value || 0,
                  unit: operationalMetrics?.routeEfficiency?.unit || 'kg/km',
                  icon: TrendingUp,
                  variant: 'success',
                },
                {
                  title: 'Idle Time',
                  value: operationalMetrics?.idleTime?.value || 0,
                  unit: operationalMetrics?.idleTime?.unit || 'hours',
                  icon: Clock,
                  variant: 'warning',
                },
              ]}
              columns={4}
            />
          </MetricsSection>

          {/* Customer Metrics - Collapsible */}
          <MetricsSection
            title="Customer Metrics"
            icon={Users}
            expanded={expandedSections.environmental}
            onExpandedChange={(expanded) => setExpandedSections(prev => ({ ...prev, environmental: expanded }))}
            badge="Engagement"
          >
            <MetricCardGroup
              metrics={[
                {
                  title: 'Active Households',
                  value: customerMetrics?.activeSubscriptions || 0,
                  icon: Users,
                  variant: 'default',
                },
                {
                  title: 'Complaints',
                  value: customerMetrics?.complaintsCount || 0,
                  icon: AlertCircle,
                  variant: 'negative',
                },
              ]}
              columns={2}
            />
          </MetricsSection>

          {/* Performance Metrics Cards */}
          {!loading && reports.length > 0 && (
            <PerformanceMetricsCards
              avgResolutionTime={performanceMetrics.avgResolutionTime}
              slaComplianceRate={performanceMetrics.slaComplianceRate}
              overdueCount={performanceMetrics.overdueCount}
              overduePercentage={performanceMetrics.overduePercentage}
            />
          )}

          {/* Category-Specific Resolution Times */}
          {!loading && reports.length > 0 && performanceMetrics.categoryAvgTimes && performanceMetrics.categoryAvgTimes.length > 0 && (
            <CategoryResolutionTimes categoryTimes={performanceMetrics.categoryAvgTimes} />
          )}

          {/* Time-based Charts Row */}
          {!loading && (
            <TimeBasedCharts
              monthlyData={monthlyData}
              weeklyData={weeklyData}
              dailyData={dailyData}
              hourlyData={hourlyData}
            />
          )}

          {/* Charts Row */}
          {!loading && reports.length > 0 && (
            <DistributionCharts
              statusData={statusData}
              typeData={typeData}
              isMobile={isMobile}
            />
          )}

          {/* Geographic Distribution Charts */}
          <GeographicDistributionCharts
            geographicData={geographicData}
            loading={geographicLoading}
            selectedProvince={selectedProvince}
            selectedDistrict={selectedDistrict}
            onProvinceSelect={(province) => {
              setSelectedProvince(province)
              setFilterProvince(province)
                                  setSelectedDistrict(null)
                                  setFilterDistrict(null)
            }}
            onDistrictSelect={(district) => {
              setSelectedDistrict(district)
              setFilterDistrict(district)
            }}
            onClearFilters={() => {
                            setSelectedProvince(null)
              setFilterProvince(null)
                            setSelectedDistrict(null)
              setFilterDistrict(null)
            }}
            filteredGeographicData={filteredGeographicData}
            isMobile={isMobile}
          />

          {/* Map View */}
          {!loading && reports.length > 0 && (
            <ReportsMapView
              reports={filteredReports}
              mapCenter={mapCenterAndBounds.center}
              mapZoom={mapCenterAndBounds.zoom}
              onReportClick={handleViewReport}
              getSeverityBadgeClassName={getSeverityBadgeClassName}
              getStatusBadgeClassName={getStatusBadgeClassName}
            />
          )}

        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-white p-0">
          {selectedReport && (
            <ReportDetailView
              key={`${selectedReport.id}-${reportDetailKey}`}
              reportId={selectedReport.id}
              onUpdate={handleReportUpdated}
              onClose={() => setIsDetailOpen(false)}
              userRole="admin"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Assign Report</DialogTitle>
            <DialogDescription className="text-slate-400">
              Assign this report to an officer or organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Assign to Officer</Label>
              <div className="flex gap-2">
                <Select
                  value={assignData.assigneeId || undefined}
                  onChange={(e) => {
                    const value = e.target.value
                    console.log('Officer selected:', value)
                    setAssignData((prev) => ({ ...prev, assigneeId: value, organizationId: '' }))
                  }}
                  disabled={usersLoading}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white flex-1">
                    <SelectValue placeholder={
                      usersLoading 
                        ? "Loading officers..." 
                        : users.length === 0 
                          ? "No officers available" 
                          : "Select an officer"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {usersLoading ? (
                      <div className="px-2 py-1.5 text-sm text-slate-400">
                        Loading officers...
                      </div>
                    ) : users.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-slate-400">
                        {usersError || "No officers found. Create officers in the Officers page."}
                      </div>
                    ) : (
                      users.map((user) => (
                        <SelectItem 
                          key={user.id} 
                          value={user.id}
                          className="text-white hover:bg-slate-700 focus:bg-slate-700"
                        >
                          {user.fullName || user.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {assignData.assigneeId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setAssignData((prev) => ({ ...prev, assigneeId: '' }))}
                    className="h-10 w-10 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="text-center text-sm text-slate-400">OR</div>

            <div className="space-y-2">
              <Label className="text-slate-300">Assign to Organization</Label>
              <div className="flex gap-2">
                <Select
                  value={assignData.organizationId || undefined}
                  onChange={(e) => setAssignData((prev) => ({ ...prev, organizationId: e.target.value, assigneeId: '' }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white flex-1">
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignData.organizationId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setAssignData((prev) => ({ ...prev, organizationId: '' }))}
                    className="h-10 w-10 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Due Date (Optional)</Label>
              <Input
                type="datetime-local"
                value={assignData.dueAt}
                onChange={(e) => setAssignData((prev) => ({ ...prev, dueAt: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsAssignDialogOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
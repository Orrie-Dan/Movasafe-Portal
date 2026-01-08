'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
// API imports removed - using mock data
// import { apiGetUsers, apiMe, apiGetAllTransactions, apiGetAllWallets, apiGetEscrows, type Transaction, type Wallet, TransactionStatus, EscrowStatus } from '@/lib/api'
import type { Transaction, Wallet, TransactionStatus, EscrowStatus } from '@/lib/api'
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
import { AlertCenter } from '@/components/dashboard/alerts/AlertCenter'
import { QuickActionsPanel } from '@/components/dashboard/sections/QuickActionsPanel'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
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
  MessageSquare,
  Wallet,
  DollarSign,
  Activity,
  Server,
  XCircle
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
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subWeeks, subMonths, subQuarters, subYears } from 'date-fns'
import dynamic from 'next/dynamic'


export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDark, setIsDark] = useState(false)
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  const [authLoading, setAuthLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [statusPieActiveIndex, setStatusPieActiveIndex] = useState<number | undefined>(undefined)
  const [isMobile, setIsMobile] = useState(false)
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
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [walletsLoading, setWalletsLoading] = useState(false)
  
  // Set loading to false on mount since we're not fetching data
  useEffect(() => {
    setLoading(false)
    setTransactionsLoading(false)
    setWalletsLoading(false)
    setUsersLoading(false)
  }, [])
  const [escrows, setEscrows] = useState<any[]>([])
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
        // Check if token exists first
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token')
          if (!token) {
            router.push('/login')
            setAuthLoading(false)
            return
          }
        }
        
        // API call removed - just check for token
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


  // API calls removed - using mock data
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     fetchTransactions()
  //     fetchWallets()
  //     fetchEscrowsData()
  //     fetchUsersAndOrgs()
  //   }
  // }, [isAuthenticated, timePeriod, customDateRange])


  // Auto-refresh disabled - API calls removed
  // useEffect(() => {
  //   if (!autoRefresh || !isAuthenticated) return
  //   
  //   const interval = setInterval(() => {
  //     fetchTransactions()
  //     fetchWallets()
  //     fetchEscrowsData()
  //     setLastUpdated(new Date())
  //   }, 30000) // Refresh every 30 seconds

  //   return () => clearInterval(interval)
  // }, [autoRefresh, isAuthenticated, timePeriod, customDateRange])

  // Debug: Log users state changes
  useEffect(() => {
    console.log('Users state changed:', { count: users.length, users })
  }, [users])

  // API functions removed - using mock data
  // const fetchUsersAndOrgs = async () => {
  //   setUsersLoading(true)
  //   setUsersError(null)
  //   try {
  //     console.log('Fetching users...')
  //     const usersRes = await apiGetUsers()
  //     console.log('Users response:', usersRes)
  //     
  //     const usersData = usersRes.data || []
  //     
  //     console.log('Setting users state:', { count: usersData.length, users: usersData })
  //     setUsers(usersData)
  //     setOrganizations([])
  //     
  //     if (usersData.length === 0) {
  //       setUsersError('No officers found. Please create officers first.')
  //       console.warn('No officers returned from API')
  //     } else {
  //       console.log(`Successfully loaded ${usersData.length} officers into state`)
  //     }
  //   } catch (error) {
  //     console.error('Failed to fetch users/organizations:', error)
  //     const errorMessage = error instanceof Error ? error.message : 'Failed to fetch officers'
  //     setUsersError(errorMessage)
  //     toast({
  //       title: 'Failed to load officers',
  //       description: errorMessage,
  //       variant: 'destructive',
  //     })
  //   } finally {
  //     setUsersLoading(false)
  //   }
  // }

  // const fetchAllMetrics = async () => {
  //   try {
  //     const [operational, financial, environmental, customer, staff] = await Promise.all([
  //       apiGetOperationalMetrics(timePeriod),
  //       apiGetFinancialMetrics(timePeriod),
  //       apiGetEnvironmentalMetrics(timePeriod),
  //       apiGetCustomerMetrics(),
  //       apiGetStaffPerformanceMetrics(),
  //     ])
  //     setOperationalMetrics(operational)
  //     setFinancialMetrics(financial)
  //     setEnvironmentalMetrics(environmental)
  //     setCustomerMetrics(customer)
  //     setStaffMetrics(staff)
  //   } catch (error) {
  //     console.error('Failed to fetch metrics:', error)
  //   }
  // }

  // const fetchTransactions = async () => {
  //   setTransactionsLoading(true)
  //   try {
  //     let startDate: string | undefined
  //     let endDate: string | undefined
  //     
  //     const now = new Date()
  //     if (timePeriod === 'today') {
  //       startDate = format(startOfDay(now), 'yyyy-MM-dd')
  //       endDate = format(endOfDay(now), 'yyyy-MM-dd')
  //     } else if (timePeriod === 'week') {
  //       startDate = format(startOfWeek(now), 'yyyy-MM-dd')
  //       endDate = format(endOfWeek(now), 'yyyy-MM-dd')
  //     } else if (timePeriod === 'month') {
  //       startDate = format(startOfMonth(now), 'yyyy-MM-dd')
  //       endDate = format(endOfMonth(now), 'yyyy-MM-dd')
  //     } else if (timePeriod === 'quarter') {
  //       startDate = format(startOfQuarter(now), 'yyyy-MM-dd')
  //       endDate = format(endOfQuarter(now), 'yyyy-MM-dd')
  //     } else if (timePeriod === 'year') {
  //       startDate = format(startOfYear(now), 'yyyy-MM-dd')
  //       endDate = format(endOfYear(now), 'yyyy-MM-dd')
  //     } else if (timePeriod === 'custom' && customDateRange.from && customDateRange.to) {
  //       startDate = format(customDateRange.from, 'yyyy-MM-dd')
  //       endDate = format(customDateRange.to, 'yyyy-MM-dd')
  //     }
  //     
  //     const response = await apiGetAllTransactions({
  //       limit: 1000,
  //       startDate,
  //       endDate,
  //     })
  //     setTransactions(response)
  //   } catch (error) {
  //     console.error('Failed to fetch transactions:', error)
  //   } finally {
  //     setTransactionsLoading(false)
  //   }
  // }

  // const fetchWallets = async () => {
  //   setWalletsLoading(true)
  //   try {
  //     const response = await apiGetAllWallets({ limit: 1000 })
  //     setWallets(response)
  //   } catch (error) {
  //     console.error('Failed to fetch wallets:', error)
  //   } finally {
  //     setWalletsLoading(false)
  //   }
  // }

  // const fetchEscrowsData = async () => {
  //   try {
  //     const response = await apiGetEscrows({ limit: 1000 })
  //     setEscrows(response)
  //   } catch (error) {
  //     console.error('Failed to fetch escrows:', error)
  //   }
  // }


  // Calculate statistics
  const stats = {
    total: transactions.length,
    successful: transactions.filter(t => t.status === TransactionStatus.SUCCESSFUL).length,
    pending: transactions.filter(t => t.status === TransactionStatus.PENDING).length,
    failed: transactions.filter(t => t.status === TransactionStatus.FAILED).length,
    totalVolume: transactions
      .filter(t => t.status === TransactionStatus.SUCCESSFUL)
      .reduce((sum, t) => sum + t.amount, 0),
    totalCommission: transactions
      .filter(t => t.commissionAmount)
      .reduce((sum, t) => sum + (t.commissionAmount || 0), 0),
    activeWallets: wallets.length,
  }

  // Calculate fintech KPIs
  const fintechKPIs = useMemo(() => {
    const today = startOfDay(new Date())
    const todayTransactions = transactions.filter(t => 
      parseISO(t.createdAt) >= today
    )
    const successfulToday = todayTransactions.filter(t => t.status === TransactionStatus.SUCCESSFUL).length
    const totalToday = todayTransactions.length
    const successRate = totalToday > 0 ? (successfulToday / totalToday) * 100 : 0
    const revenueToday = todayTransactions
      .filter(t => t.status === TransactionStatus.SUCCESSFUL)
      .reduce((sum, t) => sum + (t.commissionAmount || 0), 0)
    const totalWalletBalance = wallets.reduce((sum, w) => sum + w.walletBalance, 0)
    const activeUsers = new Set(transactions.map(t => t.userId)).size

    return {
      activeUsers,
      walletBalance: totalWalletBalance,
      transactionsToday: totalToday,
      successRate,
      revenueToday,
    }
  }, [transactions, wallets])

  // Calculate trend data for charts
  const transactionTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      const dayTransactions = transactions.filter(t => {
        const txDate = parseISO(t.createdAt)
        return format(txDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      })
      const successful = dayTransactions.filter(t => t.status === TransactionStatus.SUCCESSFUL).length
      const failed = dayTransactions.filter(t => t.status === TransactionStatus.FAILED).length
      return {
        date: format(date, 'MMM d'),
        volume: dayTransactions.length,
        successful,
        failed,
        errorRate: dayTransactions.length > 0 ? (failed / dayTransactions.length) * 100 : 0,
      }
    })
    return last7Days
  }, [transactions])

  // Fintech-specific alerts
  const fintechAlerts = useMemo(() => {
    const alerts = []
    
    // High-value transactions alert
    const highValueTxs = transactions.filter(t => 
      t.amount > 1000000 && t.status === TransactionStatus.SUCCESSFUL
    )
    if (highValueTxs.length > 10) {
      alerts.push({
        id: 'high-value-transactions',
        type: 'warning' as const,
        title: 'High-Value Transactions',
        description: `${highValueTxs.length} transactions over 1M RWF today`,
        count: highValueTxs.length,
        onAction: () => router.push('/admin/transactions?minAmount=1000000'),
      })
    }

    // SLA breach alert (transactions pending >24 hours)
    const pendingLong = transactions.filter(t => {
      if (t.status !== TransactionStatus.PENDING) return false
      const hoursPending = (new Date().getTime() - parseISO(t.createdAt).getTime()) / (1000 * 60 * 60)
      return hoursPending > 24
    })
    if (pendingLong.length > 0) {
      alerts.push({
        id: 'sla-breach',
        type: 'error' as const,
        title: 'SLA Breach',
        description: `${pendingLong.length} transactions pending >24 hours`,
        count: pendingLong.length,
        onAction: () => router.push('/admin/transactions?status=PENDING'),
      })
    }

    // High error rate alert
    const errorRate = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0
    if (errorRate > 10) {
      alerts.push({
        id: 'high-error-rate',
        type: 'error' as const,
        title: 'High Error Rate',
        description: `${errorRate.toFixed(1)}% transaction failure rate`,
        count: stats.failed,
        onAction: () => router.push('/admin/transactions?status=FAILED'),
      })
    }

    return alerts
  }, [transactions, stats, router])

  // Active escrows requiring attention
  const activeEscrows = escrows
    .filter(e => e.status === EscrowStatus.ACTIVE)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  // Performance metrics - simplified without waste-related data
  const performanceMetrics = {
    overdueCount: 0,
    overduePercentage: 0,
    slaComplianceRate: null,
    categoryAvgTimes: [],
  }


  // Don't render content until authenticated
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-slate-900 dark:text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
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


  return (
    <div className="p-6 lg:p-8 space-y-12 bg-slate-50 dark:bg-slate-900/50 max-w-[1920px] mx-auto">
          {/* Error Message */}
          {error && (
            <Card className="border-red-500 bg-red-50 dark:bg-red-500/10">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                  <h3 className="font-semibold text-red-600 dark:text-red-400">Error Loading Data</h3>
                </div>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-2">
                      Please check your connection and try again. If the problem persists, contact support.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                  <Button
                  onClick={() => {
                    // API calls removed
                    // fetchTransactions()
                    // fetchWallets()
                    // fetchEscrowsData()
                  }}
                  variant="outline"
                  size="sm"
                  className="border-red-500 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
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
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      Dismiss
                    </Button>
              </div>
            </div>
              </CardContent>
            </Card>
          )}

          {/* 1. System Health - Top Priority (Above the Fold) - Full Width */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              System Health
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">System Status</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400 relative z-10" />
                </div>
                <CardContent>
                  <Badge className="bg-green-500/20 text-green-500 dark:text-green-400 border-green-500/30 mb-2">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">API Uptime</CardTitle>
                  <Server className="h-4 w-4 text-blue-500 dark:text-blue-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">99.9%</div>
                  <p className="text-xs text-muted-foreground">Last 24h / 7d: 99.8%</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">Avg Response Time</CardTitle>
                  <Activity className="h-4 w-4 text-blue-500 dark:text-blue-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">125ms</div>
                  <p className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    -5ms
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">Active Incidents</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500 dark:text-red-400 mb-1">0</div>
                  <p className="text-xs text-muted-foreground">No critical issues</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Active Escrows Alert Section */}
          {!loading && activeEscrows.length > 0 && (
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b-0 px-4 py-3 flex flex-col space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 relative z-10">
                    <Shield className="h-4 w-4 text-white" />
                    <CardTitle size="md" className="text-white">Active Escrows</CardTitle>
                  </div>
                  <Badge className="bg-blue-800/90 text-white border-blue-600 px-2 py-0.5 text-xs font-medium relative z-10">
                    {activeEscrows.length} active
                  </Badge>
                </div>
                <CardDescription className="text-blue-100/90 text-xs mt-1 relative z-10">
                  Escrow payments awaiting approval or release
                </CardDescription>
              </div>
              <CardContent className="p-3">
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {activeEscrows.slice(0, 5).map((escrow) => (
                    <div
                      key={escrow.id}
                      className="group flex items-center justify-between gap-3 p-2.5 rounded-md border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                              {formatCurrency(escrow.amount)}
                            </h4>
                            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs px-1.5 py-0.5">
                              Active
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(escrow.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2. Transaction Overview - Core Business Metrics */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              Transaction Overview
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative">Total Transactions Today</CardTitle>
                  <FileText className="h-4 w-4 text-blue-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{fintechKPIs.transactionsToday.toLocaleString()}</div>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +15.3%
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative">Total Volume</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{formatCurrency(stats.totalVolume)}</div>
                  <p className="text-xs text-muted-foreground">Today / This Month</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative">Failed Transactions</CardTitle>
                  <XCircle className="h-4 w-4 text-red-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400 mb-1">
                    {stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">{stats.failed} failed</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative">Pending Transactions</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.pending.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Awaiting processing</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 2. Key Business Metrics - Large KPIs for Transactions & Volume */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                Key Business Metrics
              </h2>
              {loading || transactionsLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
                      <div className="p-8">
                        <Skeleton className="h-4 w-32 mb-4" />
                        <Skeleton className="h-12 w-40 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Large KPI Card - Total Volume */}
                  <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div className="flex flex-col space-y-1.5 p-8 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                      <CardTitle className="relative z-10 text-foreground">Total Transaction Volume</CardTitle>
                      <CardDescription className="relative z-10 text-muted-foreground">Today / This Month</CardDescription>
                    </div>
                    <CardContent className="p-8">
                      <div className="text-4xl font-bold text-foreground mb-2">{formatCurrency(stats.totalVolume)}</div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
                        <span className="text-green-500 dark:text-green-400">+8.3%</span> vs last month
                      </p>
                    </CardContent>
                  </Card>

                  {/* Large KPI Card - Transactions Today */}
                  <Card 
                    className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                    onClick={() => router.push('/admin/transactions')}
                  >
                    <div className="flex flex-col space-y-1.5 p-8 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                      <CardTitle className="relative z-10 text-foreground">Transactions Today</CardTitle>
                      <CardDescription className="relative z-10 text-muted-foreground">Successful transactions</CardDescription>
                    </div>
                    <CardContent className="p-8">
                      <div className="text-4xl font-bold text-foreground mb-2">{fintechKPIs.transactionsToday.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
                        <span className="text-green-500 dark:text-green-400">+15.3%</span> vs yesterday
                      </p>
                    </CardContent>
                  </Card>

                  {/* Large KPI Card - Success Rate */}
                  <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div className="flex flex-col space-y-1.5 p-8 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                      <CardTitle className="relative z-10 text-foreground">Success Rate</CardTitle>
                      <CardDescription className="relative z-10 text-muted-foreground">Transaction success percentage</CardDescription>
                    </div>
                    <CardContent className="p-8">
                      <div className="text-4xl font-bold text-foreground mb-2">{fintechKPIs.successRate.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
                        <span className="text-green-500 dark:text-green-400">+2.1%</span> improvement
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Supporting Metrics - Medium Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">Failed</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500 dark:text-red-400 mb-1">
                    {stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">{stats.failed} failed</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500 dark:text-yellow-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500 dark:text-yellow-400 mb-1">{stats.pending.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Awaiting processing</p>
                </CardContent>
              </Card>

              <Card 
                className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                onClick={() => router.push('/admin/wallets')}
              >
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">Wallet Balance</CardTitle>
                  <Wallet className="h-4 w-4 text-green-500 dark:text-green-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">{formatCurrency(fintechKPIs.walletBalance)}</div>
                  <p className="text-xs text-muted-foreground">Total platform balance</p>
                </CardContent>
              </Card>

              <Card 
                className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                onClick={() => router.push('/admin/revenue')}
              >
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">Revenue Today</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500 dark:text-green-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">{formatCurrency(fintechKPIs.revenueToday)}</div>
                  <p className="text-xs text-muted-foreground">Commission earned</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 4. User Activity & Growth */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              User Activity & Growth
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card 
                className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                onClick={() => router.push('/admin/users')}
              >
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-500 dark:text-blue-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">{fintechKPIs.activeUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">24h / 7d: {fintechKPIs.activeUsers}</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">New Wallets Today</CardTitle>
                  <Wallet className="h-4 w-4 text-green-500 dark:text-green-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">{stats.activeWallets}</div>
                  <p className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +5.2%
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">Verified Users</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-500 dark:text-green-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {Math.round(fintechKPIs.activeUsers * 0.85).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">85% verified</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  <CardTitle size="xs" className="z-10 relative text-foreground">Blocked Accounts</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 relative z-10" />
                </div>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500 dark:text-red-400 mb-1">0</div>
                  <p className="text-xs text-muted-foreground">No blocked accounts</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 3. Risk & Alerts - Visually Distinct Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                Risk & Alerts
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-white dark:bg-black border-red-200 dark:border-red-600/50 hover:border-red-300 dark:hover:border-red-600 transition-all">
                  <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
                    <CardTitle size="xs" className="z-10 relative text-foreground">Flagged Transactions</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 relative z-10" />
                  </div>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500 dark:text-red-400 mb-2">0</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
                      onClick={() => router.push('/admin/risk-fraud')}
                    >
                      View flagged →
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                    <CardTitle size="xs" className="z-10 relative text-foreground">Fraud Risk Score</CardTitle>
                    <Shield className="h-4 w-4 text-blue-500 dark:text-blue-400 relative z-10" />
                  </div>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-500 dark:text-green-400 mb-1">Low</div>
                    <p className="text-xs text-muted-foreground">Avg: 12/100</p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                    <CardTitle size="xs" className="z-10 relative text-foreground">Suspicious Activity</CardTitle>
                    <MapPin className="h-4 w-4 text-orange-500 dark:text-orange-400 relative z-10" />
                  </div>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-500 dark:text-orange-400 mb-1">0</div>
                    <p className="text-xs text-muted-foreground">No suspicious locations</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Alert Center - Visually Prominent */}
            <AlertCenter
              alerts={[
                ...fintechAlerts,
                ...(stats.failed > 0
                  ? [{
                      id: 'failed-transactions',
                      type: 'error' as const,
                      title: 'Failed Transactions',
                      description: 'transactions require attention',
                      count: stats.failed,
                      onAction: () => router.push('/admin/transactions?status=FAILED'),
                    }]
                  : []),
                ...(activeEscrows.length > 0
                  ? [{
                      id: 'active-escrows',
                      type: 'warning' as const,
                      title: 'Active Escrows',
                      description: 'escrows awaiting approval',
                      count: activeEscrows.length,
                      icon: Shield,
                      onAction: () => router.push('/admin/escrows?status=ACTIVE'),
                    }]
                  : []),
                ...(stats.pending > 0
                  ? [{
                      id: 'pending-transactions',
                      type: 'warning' as const,
                      title: 'Pending Transactions',
                      description: 'transactions pending',
                      count: stats.pending,
                      icon: Clock,
                      onAction: () => router.push('/admin/transactions?status=PENDING'),
                    }]
                  : []),
              ]}
              onAlertClick={(alert) => alert.onAction?.()}
              title="Critical Alerts"
              description="System, fraud, and SLA alerts requiring attention"
            />
          </div>


          {/* Trend Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
              <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle className="relative z-10">Transaction Volume Trend</CardTitle>
                <CardDescription className="relative z-10">Last 7 days</CardDescription>
              </div>
              <CardContent>
                {loading || transactionsLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <EnhancedLineChart
                    data={transactionTrendData}
                    dataKeys={[
                      { key: 'volume', name: 'Total', color: '#3b82f6' },
                      { key: 'successful', name: 'Successful', color: '#10b981' },
                    ]}
                    xAxisKey="date"
                    height={300}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
              <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle className="relative z-10">Error Rate Trend</CardTitle>
                <CardDescription className="relative z-10">Last 7 days</CardDescription>
              </div>
              <CardContent>
                {loading || transactionsLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <EnhancedLineChart
                    data={transactionTrendData}
                    dataKeys={[
                      { key: 'errorRate', name: 'Error Rate %', color: '#ef4444' },
                    ]}
                    xAxisKey="date"
                    height={300}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* 5. Recent Activity / Context */}
          <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
            <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <CardTitle className="relative z-10 text-foreground">Recent Activity</CardTitle>
              <CardDescription className="relative z-10 text-muted-foreground">Live timeline of system events</CardDescription>
            </div>
            <CardContent>
              {loading || transactionsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {transactions.slice(0, 10).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all"
                    >
                      <div className={`h-2 w-2 rounded-full ${
                        tx.status === TransactionStatus.SUCCESSFUL ? 'bg-green-400' :
                        tx.status === TransactionStatus.FAILED ? 'bg-red-400' :
                        'bg-yellow-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white">
                          {tx.status === TransactionStatus.SUCCESSFUL ? (
                            <>User <span className="font-mono text-xs">{tx.userId.slice(0, 8)}...</span> completed transfer of {formatCurrency(tx.amount)}</>
                          ) : tx.status === TransactionStatus.FAILED ? (
                            <>Transaction <span className="font-mono text-xs">#{tx.id.slice(0, 8)}</span> failed – {tx.description || 'timeout'}</>
                          ) : (
                            <>Transaction <span className="font-mono text-xs">#{tx.id.slice(0, 8)}</span> pending</>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(tx.createdAt), 'MMM d, yyyy HH:mm:ss')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/transactions?id=${tx.id}`)}
                        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 lg:grid-cols-1">
            <QuickActionsPanel
              actions={[
                {
                  label: 'View Transactions',
                  icon: FileText,
                  onClick: () => router.push('/admin/transactions'),
                },
                {
                  label: 'Manage Escrows',
                  icon: Shield,
                  onClick: () => router.push('/admin/escrows'),
                },
                {
                  label: 'View Wallets',
                  icon: Wallet,
                  onClick: () => router.push('/admin/wallets'),
                },
                {
                  label: 'View Merchants',
                  icon: Store,
                  onClick: () => router.push('/admin/merchants'),
                },
              ]}
            />
          </div>



          {/* Time Period Filter */}
          <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
            <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <div className="flex items-center justify-between relative z-10 flex-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-400" />
                  <CardTitle size="md" className="text-sm sm:text-base">Filters</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newExpanded = !filterExpanded
                    setFilterExpanded(newExpanded)
                  }}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm"
                >
                  {filterExpanded ? 'Collapse' : 'Expand'}
                </Button>
              </div>
            </div>
            
            {filterExpanded && (
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6 space-y-4">
                {/* Period Selection */}
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Time Period</label>
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
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
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                      <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">Start Date</label>
                      <Input
                        type="date"
                        value={customDateRange.from ? format(customDateRange.from, 'yyyy-MM-dd') : ''}
                        onChange={(e) =>
                          setCustomDateRange({
                            ...customDateRange,
                            from: e.target.value ? new Date(e.target.value) : null,
                          })
                        }
                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">End Date</label>
                      <Input
                        type="date"
                        value={customDateRange.to ? format(customDateRange.to, 'yyyy-MM-dd') : ''}
                        onChange={(e) =>
                          setCustomDateRange({
                            ...customDateRange,
                            to: e.target.value ? new Date(e.target.value) : null,
                          })
                        }
                        className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTimePeriod('month')
                      setCustomDateRange({ from: null, to: null })
                    }}
                    className="border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>


    </div>
  )
}
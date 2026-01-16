// API client functions
// These are placeholder implementations - replace with actual API calls

import type { FleetStatus, DriverPerformance, TruckUtilization } from './types/dashboard'
import type {
  ExecutiveSnapshot,
  RevenueAnalytics,
  ExpenseAnalytics,
  ProfitabilityMetrics,
  CashFlowData,
  PaymentBehavior,
  ForecastData,
  RiskIndicators,
  FinancialFilters,
  FinancialReportExport
} from './types/financial'

// Helper function to get auth token
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// Re-export auth functions
export { apiMe, apiLogin, apiLogout, apiRefreshToken, apiRegister, apiResendOtp, apiGetAccountStatus } from './api/auth'
export type { User as AuthUser, LoginResponse, LoginCredentials, RegisterUserDTO, ResendOtpDTO } from './types/auth'

// Re-export transaction functions
export { 
  apiGetAllTransactions, 
  apiGetUserTransactions, 
  apiGetTransactionById,
  apiCreateTransfer,
  apiCreateEscrowPayment
} from './api/transactions'
export type { Transaction, PaginatedTransactionResponse } from './api/transactions'
export type { TransactionFilters, CreateTransferDTO, CreateEscrowPaymentDTO } from './types/transactions'
export { TransactionType, TransactionStatus, TransactionDescription } from './types/transactions'

// Re-export wallet functions
export {
  apiGetWallet,
  apiGetUserWallet,
  apiGetAllWallets,
  apiCreateWalletAccount
} from './api/wallets'
export type { Wallet, CreateWalletAccountDTO, WalletFilters } from './types/wallets'

// Re-export escrow functions
export {
  apiCreateEscrow,
  apiGetEscrows,
  apiGetEscrowById,
  apiApproveEscrow,
  apiReleaseEscrow,
  apiRefundEscrow
} from './api/escrows'
export type { EscrowTransaction, CreateEscrowDTO, EscrowFilters } from './types/escrows'
export { EscrowStatus } from './types/escrows'

export async function apiGetAdminReports(params?: any) {
  return { data: [] }
}

export async function apiUpdateReportStatus(reportId: string, status: string) {
  return { success: true }
}

export async function apiAssignReport(reportId: string, officerId: string) {
  return { success: true }
}

// Re-export user management functions
export { apiGetUsers, apiGetUser, apiCreateUser, apiUpdateUser, apiDeleteUser, apiSuspendUser, apiActivateUser, apiResetUserPassword } from './api/users'
export type { User, CreateUserRequest, UpdateUserRequest, UserListParams, UserListResponse } from './types/user'

export async function apiGetOrganizations() {
  return { data: [] }
}

// New API functions for Rwanda-specific data collection

export async function apiGetCollections(params?: {
  limit?: number
  page?: number
  status?: string
  collectionType?: string
  province?: string
  district?: string
  sector?: string
  startDate?: string
  endDate?: string
}) {
  // TODO: Replace with actual API call
  return { data: [] as Collection[] }
}

export async function apiGetCollectionsStats(params?: {
  date?: string
  startDate?: string
  endDate?: string
}) {
  // TODO: Replace with actual API call
  return {
    totalCollections: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    missed: 0,
    todayCollections: 0,
    byType: {} as Record<string, number>,
    byProvince: {} as Record<string, number>,
  }
}

export async function apiGetMarkets(params?: {
  province?: string
  district?: string
  status?: string
}) {
  // TODO: Replace with actual API call
  return { data: [] as Market[] }
}

export async function apiGetServiceProviders(params?: {
  type?: string
  status?: string
}) {
  // TODO: Replace with actual API call
  return { data: [] as ServiceProvider[] }
}

export async function apiGetSubscriptions(params?: {
  customerType?: string
  serviceProviderId?: string
  status?: string
  province?: string
  district?: string
}) {
  // TODO: Replace with actual API call
  return { data: [] as Subscription[] }
}

export async function apiGetFacilityOperations(params?: {
  facilityId?: string
  operationType?: string
  startDate?: string
  endDate?: string
}) {
  // TODO: Replace with actual API call
  return { data: [] as FacilityOperation[] }
}


export async function apiGetComplianceData(params?: {
  providerId?: string
  startDate?: string
  endDate?: string
}) {
  // TODO: Replace with actual API call
  return { data: [] as ComplianceData[] }
}

export async function apiGetOfficerMetrics() {
  return { data: [] }
}

export async function apiAutoAssignReports() {
  return { success: true }
}

export async function apiGetGeographicData() {
  // TODO: Replace with actual API call
  // Return structure expected by the admin dashboard
  return {
    provinces: [
      { name: 'Kigali City', count: 0 },
      { name: 'Eastern Province', count: 0 },
      { name: 'Northern Province', count: 0 },
      { name: 'Southern Province', count: 0 },
      { name: 'Western Province', count: 0 },
    ],
    districts: [],
    sectors: [],
  }
}

export async function apiGetTrendData(params?: any) {
  // TODO: Replace with actual API call
  return { 
    data: [],
    categoryTrends: [],
    statusTrends: [],
    monthlyData: []
  }
}

export async function apiGetOperationalMetrics(period?: string) {
  try {
    const response = await fetch(
      `/api/metrics/operational${period ? `?period=${period}` : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch operational metrics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching operational metrics:', error)
    // Return default structure on error
    return {
      totalWasteCollected: { value: 0, unit: 'kg', change: 0 },
      collectionCompletionRate: { value: 0, unit: '%', change: 0 },
      missedPickups: { value: 0, unit: 'count', change: 0 },
      avgTimePerJob: { value: 0, unit: 'minutes', change: 0 },
      fuelConsumption: { value: 0, unit: 'liters', change: 0 },
      distanceTraveled: { value: 0, unit: 'km', change: 0 },
      routeEfficiency: { value: 0, unit: 'kg/km', change: 0 },
      idleTime: { value: 0, unit: 'hours', change: 0 },
    }
  }
}

export async function apiGetFinancialMetrics(period?: string) {
  try {
    const response = await fetch(
      `/api/metrics/financial${period ? `?period=${period}` : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch financial metrics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching financial metrics:', error)
    return {
      totalRevenue: 0,
      outstandingPayments: 0,
      costPerRoute: 0,
      costPerTon: 0,
      fuelCost: 0,
      operationalCost: 0,
      revenueByZone: [],
    }
  }
}

export async function apiGetEnvironmentalMetrics(period?: string) {
  try {
    const response = await fetch(
      `/api/metrics/environmental${period ? `?period=${period}` : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch environmental metrics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching environmental metrics:', error)
    return {
      recyclingRate: 0,
      wasteDiverted: 0,
      carbonEmissions: 0,
      emissionsReduction: 0,
      wasteComposition: [],
      landfillStatus: { capacity: 0, utilization: 0 },
    }
  }
}

export async function apiGetCustomerMetrics() {
  try {
    const response = await fetch('/api/metrics/customers', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch customer metrics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching customer metrics:', error)
    return {
      totalHouseholds: 0,
      activeSubscriptions: 0,
      paymentArrears: 0,
      complaintsCount: 0,
      serviceRequests: 0,
    }
  }
}

export async function apiGetStaffPerformanceMetrics() {
  try {
    const response = await fetch('/api/metrics/staff-performance', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch staff performance metrics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching staff performance metrics:', error)
  return {
      totalStaff: 0,
      activeDrivers: 0,
      avgPickupsPerDriver: 0,
      avgFuelUsagePerDriver: 0,
      complaintsPerDriver: 0,
      avgWorkHours: 0,
    }
  }
}

export async function apiGetFleetMetrics() {
  try {
    const response = await fetch('/api/metrics/fleet', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch fleet metrics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching fleet metrics:', error)
    return {
      activeTrucks: 0,
      inactiveTrucks: 0,
      maintenanceDue: 0,
      breakdowns: 0,
      avgDowntime: 0,
      binsInService: 0,
      damagedBins: 0,
      overflowingBins: 0,
      recyclingBins: 0,
      generalWasteBins: 0,
    }
  }
}

export async function apiGetFleetStatus(): Promise<{ data: FleetStatus[] }> {
  try {
    const response = await fetch('/api/fleet/status', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch fleet status')
    return await response.json()
  } catch (error) {
    console.error('Error fetching fleet status:', error)
    return { data: [] }
  }
}

export async function apiGetTruckUtilization(params?: {
  startDate?: string
  endDate?: string
  vehicleId?: string
}): Promise<{ data: TruckUtilization[] }> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.vehicleId) queryParams.append('vehicleId', params.vehicleId)
    
    const response = await fetch(`/api/fleet/utilization?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch truck utilization')
    return await response.json()
  } catch (error) {
    console.error('Error fetching truck utilization:', error)
    return { data: [] }
  }
}

export async function apiGetDriverPerformance(params?: {
  driverId?: string
  startDate?: string
  endDate?: string
}): Promise<{ data: DriverPerformance[] }> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.driverId) queryParams.append('driverId', params.driverId)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/fleet/driver-performance?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch driver performance')
    return await response.json()
  } catch (error) {
    console.error('Error fetching driver performance:', error)
    return { data: [] }
  }
}

export async function apiGetRequestMetrics() {
  // TODO: Replace with actual API call
  return {
    totalRequests: 0,
    pending: 0,
    completed: 0,
    avgResolutionTime: 0,
    escalationRate: 0,
    topComplaintTypes: [],
  }
}


export async function apiGetZoneMetrics() {
  // TODO: Replace with actual API call
  return {
    topZones: [],
    coverage: 0,
    predictedWaste: 0,
  }
}

export async function apiGetStaffMetrics() {
  // TODO: Replace with actual API call
  return {
    totalStaff: 0,
    activeDrivers: 0,
    avgPerformanceScore: 0,
    tasksCompleted: 0,
    attendanceRate: 0,
    incidents: 0,
  }
}

export async function apiGetPredictiveData() {
  // TODO: Replace with actual API call
  return {
    predictedWaste: [],
    alerts: [],
    forecasts: [],
  }
}

export async function apiExportReports(params?: any) {
  return { success: true }
}

export async function apiGetReport(reportId: string) {
  // TODO: Replace with actual API call
  return {
    id: reportId,
    title: 'Sample Report',
    status: 'new',
    type: 'waste_collection',
    createdAt: new Date().toISOString(),
  }
}

export async function apiCreateUser(payload: CreateUserPayload) {
  // TODO: Replace with actual API call
  return {
    success: true,
    user: {
      id: Date.now().toString(),
      ...payload,
    },
  }
}

export async function apiUpdateUserPassword(userId: string, newPassword: string) {
  // TODO: Replace with actual API call
  return { success: true }
}

// Type definitions for Movasafe Digital Wallet System

// Collection type (legacy - may be removed if not used)
export type Collection = {
  id: string
  collectionNumber: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
  
  // Collection Type (Rwanda-specific)
  collectionType: 'household' | 'public_space' | 'commercial' | 'institutional' | 'market' | 'smart_bin' | 'special'
  
  // Source Information
  source: {
    type: 'household' | 'business' | 'market' | 'public_space' | 'institution'
    subscriptionId?: string
    marketId?: string
  }
  
  // Location (Rwanda administrative structure)
  location: {
    latitude: number
    longitude: number
    address: string
    province: string
    district: string
    sector: string
    zoneId?: string
    routeId?: string
  }
  
  // Scheduling
  scheduledTime: string
  actualStartTime?: string
  actualEndTime?: string
  estimatedDuration?: number // minutes
  
  // Assignment
  assignedOfficer: {
    id: string
    name: string
    vehicleId?: string
  }
  
  // Service Provider (Rwanda-specific)
  serviceProviderId?: string
  serviceProvider?: {
    id: string
    name: string
    type: 'private_company' | 'cbo' | 'cooperative'
  }
  
  // Waste Data
  wasteData: {
    totalWeight: number
    unit: 'kg' | 'tons'
    wasteTypes: Array<{
      type: string
      weight: number
    }>
  }
  
  // Metadata
  photos?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
}

// Service Provider (Rwanda-specific)
export type ServiceProvider = {
  id: string
  name: string
  type: 'private_company' | 'cbo' | 'cooperative'
  ruraLicense?: string
  contactEmail?: string
  contactPhone?: string
  serviceAreas: string[] // zone IDs
  status: 'active' | 'suspended' | 'revoked'
  createdAt: string
  updatedAt: string
}

// Subscription (Household/Business)
export type Subscription = {
  id: string
  customerType: 'household' | 'business' | 'institution'
  customerName?: string
  contactPhone?: string
  location: {
    province: string
    district: string
    sector: string
    address: string
  }
  serviceProviderId: string
  collectionFrequency: 'weekly' | 'biweekly' | 'daily'
  paymentPlan: 'monthly' | 'quarterly' | 'annual'
  status: 'active' | 'suspended' | 'cancelled'
  createdAt: string
  updatedAt: string
}

// Market (Rwanda-specific)
export type Market = {
  id: string
  name: string
  code: string
  location: {
    province: string
    district: string
    sector: string
    address: string
    latitude?: number
    longitude?: number
  }
  vendorCount?: number
  collectionFrequency: 'daily' | 'biweekly' | 'weekly'
  typicalOrganicPercentage: number // percentage
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

// Facility Operation (Nduba Landfill)
export type FacilityOperation = {
  id: string
  facilityId: string // 'nduba-landfill', 'nduba-sorting', 'nduba-bio-treatment'
  operationType: 'waste_received' | 'waste_sorted' | 'organic_processed'
  batchId?: string
  inputWeight: number
  outputWeight?: number
  weightUnit: 'kg' | 'tons'
  operationData: Record<string, any>
  processedAt?: string
  createdAt: string
}


// Compliance Data (RURA)
export type ComplianceData = {
  providerId: string
  checkDate: string
  metrics: {
    serviceCoverage: number // percentage
    collectionRate: number // percentage
    customerSatisfaction: number // out of 5
    complaints: number
    resolvedComplaints: number
  }
  status: 'compliant' | 'non_compliant' | 'warning'
}

// Legacy AdminReport type (kept for backward compatibility)
export type AdminReport = {
  id: string
  title: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled' | 'assigned' | 'resolved' | 'new' | 'triaged' | 'rejected'
  type: 'organic' | 'plastic' | 'paper' | 'metal' | 'glass' | 'e-waste' | 'hazardous' | 'waste_collection' | 'recycling' | 'bulk_waste' | 'other'
  severity: 'low' | 'medium' | 'high'
  province?: string
  district?: string
  sector?: string
  createdAt: string
  updatedAt?: string
  currentAssignment?: {
    assignee?: { id: string; fullName: string }
    organization?: { id: string; name: string }
    createdAt?: string
  }
  [key: string]: any
}

export type OfficerMetrics = {
  totalCollections: number
  completed: number
  inProgress: number
  performance: number
  [key: string]: any
}

export type GeographicData = {
  provinces: Array<{ name: string; count: number }>
  districts: Array<{ name: string; province: string; count: number }>
  sectors: Array<{ name: string; district: string; province: string; count: number }>
}

export type TrendData = {
  data: any[]
  categoryTrends: Array<{ type: string; data: Array<{ month: string; count: number }> }>
  statusTrends: Array<{ status: string; data: Array<{ month: string; count: number }> }>
  monthlyData: Array<{ month: string; count: number }>
}

export type ApiReport = {
  id: string
  title: string
  status: string
  type: string
  createdAt: string
  [key: string]: any
}

export type User = {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'officer'
  [key: string]: any
}

export type CreateUserPayload = {
  email: string
  fullName: string
  role: 'admin' | 'officer'
  password?: string
  [key: string]: any
}

export type Organization = {
  id: string
  name: string
  [key: string]: any
}


export async function apiGetClientMetrics(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/clients/metrics?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch client metrics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching client metrics:', error)
    return {
      activeClients: 0,
      newClientsThisMonth: 0,
      growthRate: 0,
      lifecycleData: [],
    }
  }
}

export async function apiGetChurnRate(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/clients/churn-rate?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch churn rate')
    return await response.json()
  } catch (error) {
    console.error('Error fetching churn rate:', error)
    return {
      churnRate: 0,
      churnedThisMonth: 0,
      trendData: [],
    }
  }
}

export async function apiGetClientCompliance(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/clients/compliance?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch client compliance')
    return await response.json()
  } catch (error) {
    console.error('Error fetching client compliance:', error)
    return {
      overallComplianceRate: 0,
      sortedClients: 0,
      unsortedClients: 0,
      byCategory: [],
      byArea: [],
    }
  }
}

export async function apiGetSubscriptionBreakdown(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/subscriptions/breakdown?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch subscription breakdown')
    return await response.json()
  } catch (error) {
    console.error('Error fetching subscription breakdown:', error)
    return {
      totalSubscriptions: 0,
      byCategory: [],
      byFrequency: [],
      byPaymentPlan: [],
    }
  }
}

export async function apiGetCostPerClient(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/clients/cost-analysis?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch cost per client')
    return await response.json()
  } catch (error) {
    console.error('Error fetching cost per client:', error)
    return {
      avgCostPerClient: 0,
      avgCostPerCollection: 0,
      totalCost: 0,
      trend: 0,
      trendData: [],
      byCategory: [],
    }
  }
}

export async function apiGetEnergyGeneration(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/environmental/energy-generation?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch energy generation')
    return await response.json()
  } catch (error) {
    console.error('Error fetching energy generation:', error)
    return {
      totalEnergyGenerated: 0,
      avgDailyGeneration: 0,
      facilities: [],
      trendData: [],
    }
  }
}

export async function apiGetEmissionsBreakdown(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/environmental/emissions-breakdown?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch emissions breakdown')
    return await response.json()
  } catch (error) {
    console.error('Error fetching emissions breakdown:', error)
    return {
      totalEmissions: 0,
      emissionsSaved: 0,
      bySource: [],
      trendData: [],
    }
  }
}


// Comprehensive Financial Analytics API Functions

export async function apiGetExecutiveSnapshot(
  period: 'month' | 'quarter' | 'year' = 'month',
  comparisonPeriod?: 'month' | 'quarter' | 'year'
): Promise<ExecutiveSnapshot> {
  try {
    const response = await fetch(
      `/api/financial/executive-snapshot?period=${period}${comparisonPeriod ? `&compare=${comparisonPeriod}` : ''}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch executive snapshot')
    return await response.json()
  } catch (error) {
    console.error('Error fetching executive snapshot:', error)
    // Return mock data
    const currentRevenue = 2500000
    const previousRevenue = 2200000
    const currentExpenses = 1800000
    const previousExpenses = 1700000
    const netProfit = currentRevenue - currentExpenses
    const previousNetProfit = previousRevenue - previousExpenses
    
    return {
      totalRevenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: ((currentRevenue - previousRevenue) / previousRevenue) * 100,
        trend: currentRevenue > previousRevenue ? 'up' : 'down',
        mtd: currentRevenue * 0.4,
        ytd: currentRevenue * 4.2,
      },
      totalExpenses: {
        current: currentExpenses,
        previous: previousExpenses,
        change: ((currentExpenses - previousExpenses) / previousExpenses) * 100,
        trend: currentExpenses > previousExpenses ? 'up' : 'down',
      },
      netProfit: {
        current: netProfit,
        previous: previousNetProfit,
        change: ((netProfit - previousNetProfit) / Math.abs(previousNetProfit || 1)) * 100,
        trend: netProfit > previousNetProfit ? 'up' : 'down',
      },
      cashBalance: 3500000,
      profitMargin: {
        current: (netProfit / currentRevenue) * 100,
        previous: (previousNetProfit / previousRevenue) * 100,
        change: ((netProfit / currentRevenue) - (previousNetProfit / previousRevenue)) * 100,
        trend: (netProfit / currentRevenue) > (previousNetProfit / previousRevenue) ? 'up' : 'down',
      },
      burnRate: 1800000,
      lastUpdated: new Date().toISOString(),
    }
  }
}

export async function apiGetRevenueAnalytics(filters?: FinancialFilters): Promise<RevenueAnalytics> {
  try {
    const params = new URLSearchParams()
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start)
      params.append('endDate', filters.dateRange.end)
    }
    const response = await fetch(
      `/api/financial/revenue-analytics?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch revenue analytics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching revenue analytics:', error)
    // Return mock data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return {
      totalRevenue: 2500000,
      revenueOverTime: months.map((month, i) => ({
        date: `${month} 2024`,
        revenue: 2000000 + (i * 100000) + Math.random() * 200000,
      })),
      revenueByCategory: [
        { category: 'Transaction Fees', revenue: 1200000, percentage: 48, change: 12.5 },
        { category: 'Escrow Services', revenue: 800000, percentage: 32, change: 8.3 },
        { category: 'Consulting', revenue: 300000, percentage: 12, change: -2.1 },
        { category: 'Other Services', revenue: 200000, percentage: 8, change: 5.4 },
      ],
      revenueBySegment: [
        { segment: 'Household', revenue: 1000000, customerCount: 5000, arpu: 200 },
        { segment: 'Business', revenue: 1200000, customerCount: 200, arpu: 6000 },
        { segment: 'Institution', revenue: 300000, customerCount: 50, arpu: 6000 },
      ],
      recurringRevenue: 2000000,
      oneTimeRevenue: 500000,
      paymentMethodBreakdown: [
        { method: 'mobile_money', provider: 'mtn_momo', revenue: 1200000, transactionCount: 2400, percentage: 48 },
        { method: 'mobile_money', provider: 'airtel_money', revenue: 600000, transactionCount: 1200, percentage: 24 },
        { method: 'cash', revenue: 400000, transactionCount: 800, percentage: 16 },
        { method: 'bank_transfer', revenue: 300000, transactionCount: 150, percentage: 12 },
      ],
      arpu: 250,
      period: 'month',
    }
  }
}

export async function apiGetExpenseAnalytics(filters?: FinancialFilters): Promise<ExpenseAnalytics> {
  try {
    const params = new URLSearchParams()
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start)
      params.append('endDate', filters.dateRange.end)
    }
    const response = await fetch(
      `/api/financial/expense-analytics?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch expense analytics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching expense analytics:', error)
    // Return mock data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return {
      totalExpenses: 1800000,
      expensesOverTime: months.map((month, i) => ({
        date: `${month} 2024`,
        expenses: 1600000 + (i * 50000) + Math.random() * 100000,
      })),
      expenseCategories: [
        { category: 'Fuel', amount: 600000, percentage: 33.3, type: 'variable', department: 'Operations' },
        { category: 'Staff Salaries', amount: 500000, percentage: 27.8, type: 'fixed', department: 'HR' },
        { category: 'Vehicle Maintenance', amount: 300000, percentage: 16.7, type: 'variable', department: 'Operations' },
        { category: 'Infrastructure', amount: 200000, percentage: 11.1, type: 'fixed', department: 'Operations' },
        { category: 'Logistics', amount: 150000, percentage: 8.3, type: 'variable', department: 'Operations' },
        { category: 'Administration', amount: 50000, percentage: 2.8, type: 'fixed', department: 'Admin' },
      ],
      fixedCosts: 750000,
      variableCosts: 1050000,
      costByDepartment: [
        { department: 'Operations', cost: 1250000 },
        { department: 'HR', cost: 500000 },
        { department: 'Admin', cost: 50000 },
      ],
      operationalCosts: 1250000,
      staffCosts: 500000,
      infrastructureCosts: 200000,
      fuelCosts: 600000,
      logisticsCosts: 150000,
      period: 'month',
    }
  }
}

export async function apiGetProfitabilityAnalysis(filters?: FinancialFilters): Promise<ProfitabilityMetrics> {
  try {
    const params = new URLSearchParams()
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start)
      params.append('endDate', filters.dateRange.end)
    }
    const response = await fetch(
      `/api/financial/profitability?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch profitability analysis')
    return await response.json()
  } catch (error) {
    console.error('Error fetching profitability analysis:', error)
    // Return mock data
    const revenue = 2500000
    const cogs = 800000
    const grossProfit = revenue - cogs
    const expenses = 1000000
    const netProfit = grossProfit - expenses
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    
    return {
      grossProfit,
      netProfit,
      grossProfitMargin: (grossProfit / revenue) * 100,
      netProfitMargin: (netProfit / revenue) * 100,
      profitMarginByService: [
        { service: 'Transaction Processing', margin: 25.5, revenue: 1200000, cost: 900000 },
        { service: 'Escrow Services', margin: 35.2, revenue: 800000, cost: 520000 },
        { service: 'Consulting', margin: 40.0, revenue: 300000, cost: 180000 },
        { service: 'Other Services', margin: 20.0, revenue: 200000, cost: 160000 },
      ],
      breakEvenPoint: {
        units: 1200,
        revenue: 1800000,
        monthsToBreakEven: 2.5,
      },
      costPerTransaction: 750,
      costPerService: [
        { service: 'Transaction Processing', cost: 180 },
        { service: 'Escrow Services', cost: 130 },
        { service: 'Consulting', cost: 600 },
        { service: 'Other Services', cost: 200 },
      ],
      revenueVsExpenses: months.map((month, i) => ({
        date: `${month} 2024`,
        revenue: 2000000 + (i * 100000),
        expenses: 1600000 + (i * 50000),
      })),
    }
  }
}

export async function apiGetCashFlow(filters?: FinancialFilters): Promise<CashFlowData> {
  try {
    const params = new URLSearchParams()
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start)
      params.append('endDate', filters.dateRange.end)
    }
    const response = await fetch(
      `/api/financial/cash-flow?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch cash flow data')
    return await response.json()
  } catch (error) {
    console.error('Error fetching cash flow data:', error)
    // Return mock data
    const cashBalance = 3500000
    const monthlyBurnRate = 1800000
    const daysOfCash = Math.floor((cashBalance / monthlyBurnRate) * 30)
    
    return {
      totalInflows: 2500000,
      totalOutflows: 1800000,
      netCashFlow: 700000,
      cashBalance,
      daysOfCashRemaining: daysOfCash,
      outstandingReceivables: 450000,
      outstandingPayables: 320000,
      cashFlowItems: [
        { date: '2024-01-15', type: 'inflow', category: 'Revenue', amount: 2500000, description: 'Monthly revenue' },
        { date: '2024-01-20', type: 'outflow', category: 'Salaries', amount: 500000, description: 'Staff salaries' },
        { date: '2024-01-22', type: 'outflow', category: 'Fuel', amount: 600000, description: 'Fuel expenses' },
        { date: '2024-01-25', type: 'outflow', category: 'Maintenance', amount: 300000, description: 'Vehicle maintenance' },
        { date: '2024-01-28', type: 'outflow', category: 'Other', amount: 400000, description: 'Other expenses' },
      ],
      expectedInflows: [
        { date: '2024-02-15', amount: 2500000, description: 'Expected monthly revenue' },
        { date: '2024-02-20', amount: 450000, description: 'Outstanding receivables collection' },
      ],
      expectedOutflows: [
        { date: '2024-02-20', amount: 500000, description: 'Staff salaries' },
        { date: '2024-02-22', amount: 600000, description: 'Fuel expenses' },
        { date: '2024-02-25', amount: 320000, description: 'Outstanding payables' },
      ],
      lowCashThreshold: 2000000,
      isLowCash: cashBalance < 2000000,
    }
  }
}

export async function apiGetPaymentBehavior(filters?: FinancialFilters): Promise<PaymentBehavior> {
  try {
    const params = new URLSearchParams()
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start)
      params.append('endDate', filters.dateRange.end)
    }
    const response = await fetch(
      `/api/financial/payment-behavior?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch payment behavior')
    return await response.json()
  } catch (error) {
    console.error('Error fetching payment behavior:', error)
    // Return mock data
    return {
      topPayingCustomers: [
        { customerId: '1', customerName: 'Kigali Business Center', totalPaid: 120000, totalOwed: 0, averagePaymentDelay: 0, paymentReliability: 100, lastPaymentDate: '2024-01-15', status: 'current' },
        { customerId: '2', customerName: 'Rwanda University', totalPaid: 95000, totalOwed: 5000, averagePaymentDelay: 5, paymentReliability: 95, lastPaymentDate: '2024-01-10', status: 'late' },
        { customerId: '3', customerName: 'Green Tech Ltd', totalPaid: 85000, totalOwed: 0, averagePaymentDelay: 0, paymentReliability: 100, lastPaymentDate: '2024-01-12', status: 'current' },
      ],
      latePayments: [
        { customerId: '2', customerName: 'Rwanda University', totalPaid: 95000, totalOwed: 5000, averagePaymentDelay: 5, paymentReliability: 95, lastPaymentDate: '2024-01-10', status: 'late' },
        { customerId: '4', customerName: 'City Market', totalPaid: 60000, totalOwed: 15000, averagePaymentDelay: 12, paymentReliability: 80, lastPaymentDate: '2024-01-05', status: 'overdue' },
      ],
      churnedCustomers: [
        { customerId: '5', customerName: 'Small Shop', totalPaid: 30000, totalOwed: 0, averagePaymentDelay: 0, paymentReliability: 0, lastPaymentDate: '2023-12-20', status: 'churned' },
      ],
      averagePaymentDelay: 3.5,
      failedPayments: 45,
      successfulPayments: 2555,
      paymentSuccessRate: 98.3,
      totalOutstanding: 20000,
    }
  }
}

export async function apiGetFinancialForecast(periods: number = 6): Promise<ForecastData> {
  try {
    const response = await fetch(
      `/api/financial/forecast?periods=${periods}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch financial forecast')
    return await response.json()
  } catch (error) {
    console.error('Error fetching financial forecast:', error)
    // Return mock data with simple linear projection
    const baseRevenue = 2500000
    const baseExpenses = 1800000
    const growthRate = 0.05 // 5% monthly growth
    const expenseGrowth = 0.03 // 3% monthly growth
    
    const forecastPeriods = Array.from({ length: periods }, (_, i) => {
      const month = new Date()
      month.setMonth(month.getMonth() + i + 1)
      return month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    })
    
    const revenueForecast = forecastPeriods.map((_, i) => 
      baseRevenue * Math.pow(1 + growthRate, i + 1)
    )
    const expenseForecast = forecastPeriods.map((_, i) => 
      baseExpenses * Math.pow(1 + expenseGrowth, i + 1)
    )
    const cashFlow = revenueForecast.map((rev, i) => rev - expenseForecast[i])
    const cashRunway = Math.floor((3500000 / (baseExpenses - baseRevenue + cashFlow[0])) * 30)
    
    return {
      periods: forecastPeriods,
      revenueForecast,
      expenseForecast,
      cashRunway,
      scenarios: [
        {
          scenario: 'best',
          revenue: revenueForecast.map(r => r * 1.15),
          expenses: expenseForecast.map(e => e * 0.95),
          cashFlow: revenueForecast.map((r, i) => (r * 1.15) - (expenseForecast[i] * 0.95)),
        },
        {
          scenario: 'expected',
          revenue: revenueForecast,
          expenses: expenseForecast,
          cashFlow,
        },
        {
          scenario: 'worst',
          revenue: revenueForecast.map(r => r * 0.85),
          expenses: expenseForecast.map(e => e * 1.1),
          cashFlow: revenueForecast.map((r, i) => (r * 0.85) - (expenseForecast[i] * 1.1)),
        },
      ],
      confidence: 75,
    }
  }
}

export async function apiGetRiskIndicators(): Promise<RiskIndicators> {
  try {
    const response = await fetch(
      `/api/financial/risk-indicators`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch risk indicators')
    return await response.json()
  } catch (error) {
    console.error('Error fetching risk indicators:', error)
    // Return mock data
    return {
      indicators: [
        {
          id: '1',
          type: 'expense_spike',
          severity: 'medium',
          title: 'Unusual Fuel Cost Increase',
          description: 'Fuel costs increased by 25% compared to last month',
          detectedAt: new Date().toISOString(),
          value: 600000,
          threshold: 500000,
          recommendation: 'Review fuel consumption patterns and consider route optimization',
        },
        {
          id: '2',
          type: 'revenue_dependency',
          severity: 'high',
          title: 'High Dependency on Single Revenue Source',
          description: '48% of revenue comes from Transaction Processing services',
          detectedAt: new Date().toISOString(),
          value: 48,
          threshold: 40,
          recommendation: 'Diversify revenue streams to reduce risk',
        },
        {
          id: '3',
          type: 'budget_overrun',
          severity: 'low',
          title: 'Operational Costs Near Budget Limit',
          description: 'Operational costs at 95% of monthly budget',
          detectedAt: new Date().toISOString(),
          value: 95,
          threshold: 90,
          recommendation: 'Monitor expenses closely for remainder of month',
        },
      ],
      totalRisks: 3,
      criticalRisks: 0,
      highRisks: 1,
      lastScan: new Date().toISOString(),
    }
  }
}

export async function apiExportFinancialReport(
  format: 'pdf' | 'excel',
  filters?: FinancialFilters
): Promise<Blob> {
  try {
    const params = new URLSearchParams()
    params.append('format', format)
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start)
      params.append('endDate', filters.dateRange.end)
    }
    const response = await fetch(
      `/api/financial/export?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      }
    )
    if (!response.ok) throw new Error('Failed to export financial report')
    return await response.blob()
  } catch (error) {
    console.error('Error exporting financial report:', error)
    // Return empty blob as placeholder
    return new Blob()
  }
}

export async function apiGetCollectionHotspots(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/geographic/collection-hotspots?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch collection hotspots')
    return await response.json()
  } catch (error) {
    console.error('Error fetching collection hotspots:', error)
    return { data: [] }
  }
}

export async function apiGetBinStatus() {
  try {
    const response = await fetch('/api/bins/status', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch bin status')
    return await response.json()
  } catch (error) {
    console.error('Error fetching bin status:', error)
    return { data: [] }
  }
}

export async function apiGetIllegalDumpingZones(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/geographic/illegal-dumping?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch illegal dumping zones')
    return await response.json()
  } catch (error) {
    console.error('Error fetching illegal dumping zones:', error)
    return { data: [] }
  }
}

export async function apiGetBinFillPredictions() {
  try {
    const response = await fetch('/api/analytics/bin-fill-predictions', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch bin fill predictions')
    return await response.json()
  } catch (error) {
    console.error('Error fetching bin fill predictions:', error)
    return { data: [] }
  }
}

export async function apiGetMaintenanceForecast() {
  try {
    const response = await fetch('/api/analytics/maintenance-forecast', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch maintenance forecast')
    return await response.json()
  } catch (error) {
    console.error('Error fetching maintenance forecast:', error)
    return { data: [] }
  }
}

export async function apiGetOptimalRoutes() {
  try {
    const response = await fetch('/api/analytics/optimal-routes', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch optimal routes')
    return await response.json()
  } catch (error) {
    console.error('Error fetching optimal routes:', error)
    return { data: [] }
  }
}

export async function apiGetAttendanceMetrics(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/staff/attendance?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch attendance metrics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching attendance metrics:', error)
    return {
      attendanceRate: 0,
      totalShifts: 0,
      presentShifts: 0,
      absentShifts: 0,
      trendData: [],
      byDepartment: [],
    }
  }
}

export async function apiGetSafetyIncidents(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/staff/safety-incidents?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch safety incidents')
    return await response.json()
  } catch (error) {
    console.error('Error fetching safety incidents:', error)
    return {
      totalIncidents: 0,
      incidentsThisMonth: 0,
      trend: 0,
      byType: [],
      trendData: [],
    }
  }
}

export async function apiGetTrainingCompliance() {
  try {
    const response = await fetch('/api/staff/training-compliance', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch training compliance')
    return await response.json()
  } catch (error) {
    console.error('Error fetching training compliance:', error)
    return {
      overallCompliance: 0,
      compliantWorkers: 0,
      nonCompliantWorkers: 0,
      byTraining: [],
    }
  }
}

export async function apiGetTicketMetrics(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/support/ticket-metrics?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch ticket metrics')
    return await response.json()
  } catch (error) {
    console.error('Error fetching ticket metrics:', error)
    return {
      ticketsOpened: 0,
      ticketsResolved: 0,
      avgResolutionTime: 0,
      trendData: [],
    }
  }
}

export async function apiGetComplaintCategories(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/support/complaint-categories?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch complaint categories')
    return await response.json()
  } catch (error) {
    console.error('Error fetching complaint categories:', error)
    return { data: [] }
  }
}

export async function apiGetResolutionTimeTrends(params?: {
  startDate?: string
  endDate?: string
}) {
  try {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const response = await fetch(`/api/support/resolution-time-trends?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    })
    if (!response.ok) throw new Error('Failed to fetch resolution time trends')
    return await response.json()
  } catch (error) {
    console.error('Error fetching resolution time trends:', error)
    return {
      avgResolutionTime: 0,
      trend: 0,
      timeData: [],
      byCategory: [],
    }
  }
}

// Analytics APIs - For insights, trends, and actionable metrics

export async function apiGetPerformanceMetrics(period?: string) {
  // TODO: Replace with actual API call
  return {
    revenueGrowthRate: 12.5,
    expenseGrowthRate: 5.2,
    profitGrowth: 18.3,
    marginChange: 3.1,
    momComparison: {
      revenue: 8.3,
      expenses: 4.1,
      profit: 15.2,
    },
    yoyComparison: {
      revenue: 22.5,
      expenses: 12.3,
      profit: 35.8,
    },
  }
}

export async function apiGetEfficiencyMetrics(period?: string) {
  // TODO: Replace with actual API call
  return {
    costPerTransaction: 1500,
    costPerService: 2500,
    revenuePerCustomer: 45000,
    revenuePerEmployee: 1200000,
    operatingCostRatio: 65.5,
    utilizationRate: 78.2,
    trends: [
      { period: 'Jan', costPerTransaction: 1600, revenuePerCustomer: 42000, operatingCostRatio: 68.2 },
      { period: 'Feb', costPerTransaction: 1550, revenuePerCustomer: 43000, operatingCostRatio: 67.1 },
      { period: 'Mar', costPerTransaction: 1500, revenuePerCustomer: 45000, operatingCostRatio: 65.5 },
    ],
  }
}

export async function apiGetContributionAnalysis(period?: string) {
  // TODO: Replace with actual API call
  return {
    topRevenueSources: [
      { source: 'Household Collections', amount: 4500000, percentage: 35.2, trend: 'up' as const },
      { source: 'Commercial Services', amount: 3200000, percentage: 25.0, trend: 'up' as const },
      { source: 'Escrow Revenue', amount: 2800000, percentage: 21.9, trend: 'stable' as const },
      { source: 'Special Collections', amount: 2300000, percentage: 18.0, trend: 'down' as const },
    ],
    topCostDrivers: [
      { driver: 'Labor Costs', amount: 3200000, percentage: 42.1, trend: 'up' as const },
      { driver: 'Vehicle Maintenance', amount: 1800000, percentage: 23.7, trend: 'stable' as const },
      { driver: 'Fuel Costs', amount: 1200000, percentage: 15.8, trend: 'down' as const },
      { driver: 'Facility Costs', amount: 800000, percentage: 10.5, trend: 'stable' as const },
    ],
    revenueConcentration: {
      top3Percentage: 82.1,
      top5Percentage: 95.3,
      herfindahlIndex: 0.28,
    },
    productProfitability: [
      { product: 'Household Collections', revenue: 4500000, cost: 2800000, profit: 1700000, margin: 37.8 },
      { product: 'Commercial Services', revenue: 3200000, cost: 2100000, profit: 1100000, margin: 34.4 },
      { product: 'Escrow Revenue', revenue: 2800000, cost: 1500000, profit: 1300000, margin: 46.4 },
    ],
    customerSegmentProfitability: [
      { segment: 'Residential', revenue: 4500000, cost: 2800000, profit: 1700000, margin: 37.8 },
      { segment: 'Commercial', revenue: 3200000, cost: 2100000, profit: 1100000, margin: 34.4 },
    ],
  }
}

export async function apiGetTrendAnalysis(period?: string) {
  // TODO: Replace with actual API call
  return {
    seasonalPatterns: [
      { month: 'Jan', revenue: 1200000, expenses: 800000, average: 1000000 },
      { month: 'Feb', revenue: 1350000, expenses: 850000, average: 1100000 },
      { month: 'Mar', revenue: 1420000, expenses: 880000, average: 1150000 },
      { month: 'Apr', revenue: 1380000, expenses: 870000, average: 1125000 },
      { month: 'May', revenue: 1500000, expenses: 900000, average: 1200000 },
      { month: 'Jun', revenue: 1650000, expenses: 920000, average: 1285000 },
    ],
    expenseSpikes: [
      { date: '2024-03-15', amount: 450000, category: 'Vehicle Maintenance', reason: 'Fleet upgrade' },
      { date: '2024-05-20', amount: 320000, category: 'Facility Costs', reason: 'Warehouse expansion' },
    ],
    demandCycles: [
      { period: 'Q1', demand: 85, cycle: 'low' as const },
      { period: 'Q2', demand: 95, cycle: 'normal' as const },
      { period: 'Q3', demand: 110, cycle: 'peak' as const },
      { period: 'Q4', demand: 100, cycle: 'normal' as const },
    ],
    peakVsLow: {
      peakPeriod: {
        period: 'Q3 2024',
        revenue: 4950000,
        expenses: 2760000,
      },
      lowPeriod: {
        period: 'Q1 2024',
        revenue: 3970000,
        expenses: 2530000,
      },
      difference: {
        revenue: 980000,
        expenses: 230000,
      },
    },
  }
}


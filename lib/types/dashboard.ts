// Shared types for dashboard data structures

export interface MetricValue {
  value: number
  unit?: string
  change?: number
}

export interface OperationalMetrics {
  totalWasteCollected: MetricValue
  collectionCompletionRate: MetricValue
  missedPickups: MetricValue
  avgTimePerJob: MetricValue
  fuelConsumption: MetricValue
  distanceTraveled: MetricValue
  routeEfficiency: MetricValue
  idleTime: MetricValue
}

export interface FleetMetrics {
  activeTrucks: number
  inactiveTrucks: number
  maintenanceDue: number
  breakdowns: number
  avgDowntime: number
  binsInService: number
  damagedBins: number
  overflowingBins: number
  recyclingBins: number
  generalWasteBins: number
}

export interface RequestMetrics {
  totalRequests: number
  pending: number
  completed: number
  avgResolutionTime: number
  escalationRate: number
  topComplaintTypes: Array<{ type: string; count: number }>
}

export interface FinancialMetrics {
  totalRevenue: number
  outstandingPayments: number
  costPerRoute: number
  costPerTon: number
  fuelCost: number
  operationalCost: number
  revenueByZone: Array<{ zone: string; revenue: number }>
  // Extended fields for comprehensive analytics
  cashBalance?: number
  netProfit?: number
  profitMargin?: number
  burnRate?: number
  totalExpenses?: number
  grossProfit?: number
}

export interface EnvironmentalMetrics {
  recyclingRate: number
  wasteDiverted: number
  carbonEmissions: number
  emissionsReduction: number
  wasteComposition: Array<{ type: string; percentage: number }>
  landfillStatus: {
    capacity: number // tons
    utilization: number // percentage
    remainingCapacity: number // tons
  }
}

export interface ZoneMetrics {
  topZones: Array<{ zone: string; waste: number; requests: number }>
  coverage: number
  predictedWaste: number
}

export interface StaffMetrics {
  totalStaff: number
  activeDrivers: number
  avgPerformanceScore: number
  tasksCompleted: number
  attendanceRate: number
  incidents: number
}

export interface CustomerMetrics {
  totalHouseholds: number
  activeSubscriptions: number
  paymentArrears: number
  complaintsCount: number
  serviceRequests: number
  paymentStatusBreakdown: {
    paid: number
    pending: number
    overdue: number
  }
}

export interface StaffPerformanceMetrics {
  totalStaff: number
  activeDrivers: number
  avgPickupsPerDriver: number
  avgFuelUsagePerDriver: number
  complaintsPerDriver: number
  avgWorkHours: number
  topPerformers: Array<{
    driverId: string
    name: string
    pickupsCompleted: number
    fuelEfficiency: number
  }>
}

export interface FleetStatus {
  vehicleId: string
  vehicleNumber: string
  driverId?: string
  driverName?: string
  status: 'active' | 'idle' | 'maintenance' | 'offline'
  location: {
    latitude: number
    longitude: number
    address?: string
    lastUpdate: string
  }
  currentRoute?: string
  speed?: number // km/h
  heading?: number // degrees
  fuelLevel?: number // percentage
}

export interface DriverPerformance {
  driverId: string
  driverName: string
  performanceScore: number // 0-100
  speedingIncidents: number
  idlingTime: number // hours
  lateArrivals: number
  onTimeRate: number // percentage
  collectionsCompleted: number
  avgCollectionTime: number // minutes
  fuelEfficiency: number // km/liter
  safetyScore: number // 0-100
}

export interface TruckUtilization {
  vehicleId: string
  vehicleNumber: string
  utilizationRate: number // percentage
  activeHours: number
  totalHours: number
  collectionsCount: number
  distanceTraveled: number // km
  fuelConsumption: number // liters
  avgRouteDuration: number // minutes
}


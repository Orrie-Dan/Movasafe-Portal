// Comprehensive financial analytics type definitions

export interface PeriodComparison {
  current: number
  previous: number
  change: number // percentage change
  trend: 'up' | 'down' | 'neutral'
}

export interface ExecutiveSnapshot {
  totalRevenue: PeriodComparison & { mtd: number; ytd: number }
  totalExpenses: PeriodComparison
  netProfit: PeriodComparison
  cashBalance: number
  profitMargin: PeriodComparison
  burnRate?: number // monthly burn rate if applicable
  lastUpdated: string
}

export interface RevenueByCategory {
  category: string
  revenue: number
  percentage: number
  change: number
}

export interface RevenueBySegment {
  segment: string
  revenue: number
  customerCount: number
  arpu: number // Average Revenue Per User
}

export interface PaymentMethodBreakdown {
  method: 'cash' | 'mobile_money' | 'bank_transfer' | 'card'
  provider?: 'mtn_momo' | 'airtel_money' | 'other' // Rwanda-specific
  revenue: number
  transactionCount: number
  percentage: number
}

export interface RevenueAnalytics {
  totalRevenue: number
  revenueOverTime: Array<{ date: string; revenue: number }>
  revenueByCategory: RevenueByCategory[]
  revenueBySegment: RevenueBySegment[]
  recurringRevenue: number
  oneTimeRevenue: number
  paymentMethodBreakdown: PaymentMethodBreakdown[]
  arpu: number
  period: string
}

export interface ExpenseCategory {
  category: string
  amount: number
  percentage: number
  type: 'fixed' | 'variable'
  department?: string
}

export interface ExpenseAnalytics {
  totalExpenses: number
  expensesOverTime: Array<{ date: string; expenses: number }>
  expenseCategories: ExpenseCategory[]
  fixedCosts: number
  variableCosts: number
  costByDepartment: Array<{ department: string; cost: number }>
  operationalCosts: number
  staffCosts: number
  infrastructureCosts: number
  fuelCosts: number
  logisticsCosts: number
  period: string
}

export interface ProfitabilityMetrics {
  grossProfit: number
  netProfit: number
  grossProfitMargin: number
  netProfitMargin: number
  profitMarginByService: Array<{ service: string; margin: number; revenue: number; cost: number }>
  breakEvenPoint: {
    units: number
    revenue: number
    monthsToBreakEven: number
  }
  costPerTransaction: number
  costPerService: Array<{ service: string; cost: number }>
  revenueVsExpenses: Array<{ date: string; revenue: number; expenses: number }>
}

export interface CashFlowItem {
  date: string
  type: 'inflow' | 'outflow'
  category: string
  amount: number
  description?: string
}

export interface CashFlowData {
  totalInflows: number
  totalOutflows: number
  netCashFlow: number
  cashBalance: number
  daysOfCashRemaining: number
  outstandingReceivables: number
  outstandingPayables: number
  cashFlowItems: CashFlowItem[]
  expectedInflows: Array<{ date: string; amount: number; description: string }>
  expectedOutflows: Array<{ date: string; amount: number; description: string }>
  lowCashThreshold: number
  isLowCash: boolean
}

export interface CustomerPaymentRecord {
  customerId: string
  customerName: string
  totalPaid: number
  totalOwed: number
  averagePaymentDelay: number // days
  paymentReliability: number // percentage
  lastPaymentDate: string
  status: 'current' | 'late' | 'overdue' | 'churned'
}

export interface PaymentBehavior {
  topPayingCustomers: CustomerPaymentRecord[]
  latePayments: CustomerPaymentRecord[]
  churnedCustomers: CustomerPaymentRecord[]
  averagePaymentDelay: number
  failedPayments: number
  successfulPayments: number
  paymentSuccessRate: number
  totalOutstanding: number
}

export interface ForecastScenario {
  scenario: 'best' | 'expected' | 'worst'
  revenue: number[]
  expenses: number[]
  cashFlow: number[]
}

export interface ForecastData {
  periods: string[] // e.g., ['Jan 2024', 'Feb 2024', ...]
  revenueForecast: number[]
  expenseForecast: number[]
  cashRunway: number // days
  scenarios: ForecastScenario[]
  confidence: number // percentage
}

export interface RiskIndicator {
  id: string
  type: 'expense_spike' | 'revenue_drop' | 'fraud' | 'budget_overrun' | 'revenue_dependency'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  detectedAt: string
  value: number
  threshold: number
  recommendation?: string
}

export interface RiskIndicators {
  indicators: RiskIndicator[]
  totalRisks: number
  criticalRisks: number
  highRisks: number
  lastScan: string
}

export interface FinancialFilters {
  dateRange: {
    start: string
    end: string
  }
  period?: 'month' | 'quarter' | 'year' | 'custom'
  currency?: 'RWF' | 'USD' | 'EUR'
  location?: string[]
  branch?: string[]
  department?: string[]
  service?: string[]
  product?: string[]
  customerSegment?: string[]
}

export interface FinancialReportExport {
  format: 'pdf' | 'excel'
  sections: string[]
  filters: FinancialFilters
  generatedAt: string
  generatedBy: string
}


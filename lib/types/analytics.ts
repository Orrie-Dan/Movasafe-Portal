// Analytics Types - For insights, trends, and actionable metrics

export interface PerformanceMetrics {
  revenueGrowthRate: number // %
  expenseGrowthRate: number // %
  profitGrowth: number // %
  marginChange: number // %
  momComparison: {
    revenue: number
    expenses: number
    profit: number
  }
  yoyComparison: {
    revenue: number
    expenses: number
    profit: number
  }
}

export interface EfficiencyMetrics {
  costPerTransaction: number
  costPerService: number
  revenuePerCustomer: number
  revenuePerEmployee: number
  operatingCostRatio: number // %
  utilizationRate: number // %
  trends: Array<{
    period: string
    costPerTransaction: number
    revenuePerCustomer: number
    operatingCostRatio: number
  }>
}

export interface ContributionAnalysis {
  topRevenueSources: Array<{
    source: string
    amount: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }>
  topCostDrivers: Array<{
    driver: string
    amount: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }>
  revenueConcentration: {
    top3Percentage: number
    top5Percentage: number
    herfindahlIndex: number
  }
  productProfitability: Array<{
    product: string
    revenue: number
    cost: number
    profit: number
    margin: number
  }>
  customerSegmentProfitability: Array<{
    segment: string
    revenue: number
    cost: number
    profit: number
    margin: number
  }>
}

export interface TrendData {
  seasonalPatterns: Array<{
    month: string
    revenue: number
    expenses: number
    average: number
  }>
  expenseSpikes: Array<{
    date: string
    amount: number
    category: string
    reason?: string
  }>
  demandCycles: Array<{
    period: string
    demand: number
    cycle: 'peak' | 'low' | 'normal'
  }>
  peakVsLow: {
    peakPeriod: {
      period: string
      revenue: number
      expenses: number
    }
    lowPeriod: {
      period: string
      revenue: number
      expenses: number
    }
    difference: {
      revenue: number
      expenses: number
    }
  }
}

export interface PaymentBehaviorAnalytics {
  paymentSuccessRate: number // %
  latePaymentRate: number // %
  averagePaymentDelay: number // days
  repeatPaymentRate: number // %
  churnVsRevenue: {
    churnedCustomers: number
    revenueLost: number
    revenueRetained: number
    churnRate: number
  }
  trends: Array<{
    period: string
    successRate: number
    lateRate: number
    avgDelay: number
  }>
}


// Financial utility functions

export function formatCurrency(
  amount: number,
  currency: 'RWF' | 'USD' | 'EUR' = 'RWF',
  options?: { decimals?: number; compact?: boolean }
): string {
  const { decimals = 0 } = options || {}
  
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${currency}`
}

export function calculatePercentageChange(
  current: number,
  previous: number
): { change: number; trend: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    return { change: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'neutral' }
  }
  
  const change = ((current - previous) / Math.abs(previous)) * 100
  
  let trend: 'up' | 'down' | 'neutral' = 'neutral'
  if (change > 0.1) trend = 'up'
  else if (change < -0.1) trend = 'down'
  
  return { change, trend }
}

export function calculateDaysOfCash(
  cashBalance: number,
  monthlyBurnRate: number
): number {
  if (monthlyBurnRate <= 0) return Infinity
  return Math.floor((cashBalance / monthlyBurnRate) * 30)
}

export interface AnomalyThreshold {
  field: string
  threshold: number
  type: 'above' | 'below' | 'percentage_change'
}

export interface DetectedAnomaly {
  field: string
  value: number
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

export function detectAnomalies(
  data: Record<string, number>,
  thresholds: AnomalyThreshold[],
  previousData?: Record<string, number>
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = []
  
  for (const threshold of thresholds) {
    const value = data[threshold.field]
    if (value === undefined) continue
    
    let isAnomaly = false
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    let message = ''
    
    if (threshold.type === 'above' && value > threshold.threshold) {
      isAnomaly = true
      const excess = ((value - threshold.threshold) / threshold.threshold) * 100
      if (excess > 50) severity = 'critical'
      else if (excess > 25) severity = 'high'
      else if (excess > 10) severity = 'medium'
      message = `${threshold.field} exceeds threshold by ${excess.toFixed(1)}%`
    } else if (threshold.type === 'below' && value < threshold.threshold) {
      isAnomaly = true
      const deficit = ((threshold.threshold - value) / threshold.threshold) * 100
      if (deficit > 50) severity = 'critical'
      else if (deficit > 25) severity = 'high'
      else if (deficit > 10) severity = 'medium'
      message = `${threshold.field} is below threshold by ${deficit.toFixed(1)}%`
    } else if (threshold.type === 'percentage_change' && previousData) {
      const previous = previousData[threshold.field]
      if (previous !== undefined && previous !== 0) {
        const change = ((value - previous) / Math.abs(previous)) * 100
        if (Math.abs(change) > threshold.threshold) {
          isAnomaly = true
          const absChange = Math.abs(change)
          if (absChange > 50) severity = 'critical'
          else if (absChange > 25) severity = 'high'
          else if (absChange > 10) severity = 'medium'
          message = `${threshold.field} changed by ${change.toFixed(1)}%`
        }
      }
    }
    
    if (isAnomaly) {
      anomalies.push({
        field: threshold.field,
        value,
        threshold: threshold.threshold,
        severity,
        message,
      })
    }
  }
  
  return anomalies
}

export interface ForecastOptions {
  method?: 'linear' | 'exponential' | 'moving_average'
  periods?: number
  growthRate?: number
}

export function generateForecast(
  historicalData: number[],
  periods: number = 6,
  options?: ForecastOptions
): number[] {
  const { method = 'linear', growthRate } = options || {}
  
  if (historicalData.length === 0) {
    return Array(periods).fill(0)
  }
  
  if (historicalData.length === 1) {
    return Array(periods).fill(historicalData[0])
  }
  
  const forecast: number[] = []
  
  if (method === 'linear') {
    // Simple linear regression
    const n = historicalData.length
    const sumX = (n * (n + 1)) / 2
    const sumY = historicalData.reduce((a, b) => a + b, 0)
    const sumXY = historicalData.reduce((sum, val, idx) => sum + (idx + 1) * val, 0)
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    for (let i = 1; i <= periods; i++) {
      forecast.push(intercept + slope * (n + i))
    }
  } else if (method === 'exponential') {
    // Exponential growth with optional growth rate
    const lastValue = historicalData[historicalData.length - 1]
    const avgGrowthRate = growthRate || calculateAverageGrowthRate(historicalData)
    
    for (let i = 1; i <= periods; i++) {
      forecast.push(lastValue * Math.pow(1 + avgGrowthRate, i))
    }
  } else if (method === 'moving_average') {
    // Moving average
    const window = Math.min(3, historicalData.length)
    const recentValues = historicalData.slice(-window)
    const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length
    
    for (let i = 1; i <= periods; i++) {
      forecast.push(avg)
    }
  }
  
  return forecast
}

function calculateAverageGrowthRate(data: number[]): number {
  if (data.length < 2) return 0
  
  const growthRates: number[] = []
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1] !== 0) {
      growthRates.push((data[i] - data[i - 1]) / data[i - 1])
    }
  }
  
  if (growthRates.length === 0) return 0
  return growthRates.reduce((a, b) => a + b, 0) / growthRates.length
}

export function calculateBreakEven(
  fixedCosts: number,
  variableCostPerUnit: number,
  pricePerUnit: number
): { units: number; revenue: number } {
  if (pricePerUnit <= variableCostPerUnit) {
    return { units: Infinity, revenue: Infinity }
  }
  
  const contributionMargin = pricePerUnit - variableCostPerUnit
  const units = Math.ceil(fixedCosts / contributionMargin)
  const revenue = units * pricePerUnit
  
  return { units, revenue }
}

export function calculateProfitMargin(
  revenue: number,
  costs: number
): number {
  if (revenue === 0) return 0
  return ((revenue - costs) / revenue) * 100
}


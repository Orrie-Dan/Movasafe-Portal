import { Transaction, TransactionStatus, TransactionType } from '@/lib/api'
import { format, parseISO, eachDayOfInterval } from 'date-fns'

export interface CoreTrendsDataPoint {
  date: string
  fullDate: string
  volume: number
  count: number
  activeUsers: number
  failureRate: number
  successful: number
  failed: number
  pending: number
}

export interface TransactionAnalyticsData {
  byType: Array<{
    type: string
    count: number
    successful: number
    failed: number
    totalAmount: number
    avgAmount: number
  }>
}

export interface UserAnalyticsDataPoint {
  date: string
  newUsers: number
  returningUsers: number
  activeUsers: number
}

export interface RevenueDataPoint {
  date: string
  fees: number
  revenue: number
}

export interface RiskDataPoint {
  date: string
  flagged: number
}

export interface SummaryMetrics {
  totalTransactions: number
  totalVolume: number
  activeUsers: number
  successRate: number
  totalFees: number
  failureRate: number
}

export function computeCoreTrendsData(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): CoreTrendsDataPoint[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayTransactions = transactions.filter(
      (t) => format(parseISO(t.createdAt), 'yyyy-MM-dd') === dayStr
    )

    const successful = dayTransactions.filter((t) => t.status === TransactionStatus.SUCCESSFUL)
    const failed = dayTransactions.filter((t) => t.status === TransactionStatus.FAILED)
    const pending = dayTransactions.filter((t) => t.status === TransactionStatus.PENDING)

    // Get unique user IDs for active users
    const uniqueUsers = new Set(dayTransactions.map((t) => t.userId))

    return {
      date: format(day, 'MMM d'),
      fullDate: dayStr,
      volume: successful.reduce((sum, t) => sum + t.amount, 0),
      count: dayTransactions.length,
      activeUsers: uniqueUsers.size,
      failureRate:
        dayTransactions.length > 0 ? (failed.length / dayTransactions.length) * 100 : 0,
      successful: successful.length,
      failed: failed.length,
      pending: pending.length,
    }
  })
}

export function computeTransactionAnalyticsData(
  transactions: Transaction[]
): TransactionAnalyticsData {
  const byType = transactions.reduce(
    (acc, t) => {
      const type = t.transactionType
      if (!acc[type]) {
        acc[type] = { total: 0, successful: 0, failed: 0, totalAmount: 0 }
      }
      acc[type].total++
      acc[type].totalAmount += t.amount || 0
      if (t.status === TransactionStatus.SUCCESSFUL) acc[type].successful++
      if (t.status === TransactionStatus.FAILED) acc[type].failed++
      return acc
    },
    {} as Record<string, { total: number; successful: number; failed: number; totalAmount: number }>
  )

  return {
    byType: Object.entries(byType).map(([type, data]) => ({
      type:
        type === TransactionType.CASH_IN
          ? 'Cash In'
          : type === TransactionType.CASH_OUT
            ? 'Cash Out'
            : String(type),
      count: data.total,
      successful: data.successful,
      failed: data.failed,
      totalAmount: data.totalAmount,
      avgAmount: data.total > 0 ? data.totalAmount / data.total : 0,
    })),
  }
}

export function computeAvgTransactionValueData(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
) {
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayTransactions = transactions.filter(
      (t) =>
        format(parseISO(t.createdAt), 'yyyy-MM-dd') === dayStr &&
        t.status === TransactionStatus.SUCCESSFUL
    )

    const avgValue =
      dayTransactions.length > 0
        ? dayTransactions.reduce((sum, t) => sum + t.amount, 0) / dayTransactions.length
        : 0

    return {
      date: format(day, 'MMM d'),
      avgValue,
    }
  })
}

export function computeUserAnalyticsData(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): UserAnalyticsDataPoint[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const userFirstTransaction = new Map<string, string>()
  transactions.forEach((t) => {
    const firstDate = userFirstTransaction.get(t.userId)
    if (!firstDate || t.createdAt < firstDate) {
      userFirstTransaction.set(t.userId, t.createdAt)
    }
  })

  return days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayTransactions = transactions.filter(
      (t) => format(parseISO(t.createdAt), 'yyyy-MM-dd') === dayStr
    )

    const uniqueUsers = new Set(dayTransactions.map((t) => t.userId))
    let newUsers = 0
    let returningUsers = 0

    uniqueUsers.forEach((userId) => {
      const firstDate = userFirstTransaction.get(userId)
      if (firstDate && format(parseISO(firstDate), 'yyyy-MM-dd') === dayStr) {
        newUsers++
      } else {
        returningUsers++
      }
    })

    return {
      date: format(day, 'MMM d'),
      newUsers,
      returningUsers,
      activeUsers: uniqueUsers.size,
    }
  })
}

export function computeRevenueData(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): RevenueDataPoint[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayTransactions = transactions.filter(
      (t) =>
        format(parseISO(t.createdAt), 'yyyy-MM-dd') === dayStr &&
        t.status === TransactionStatus.SUCCESSFUL
    )

    // Fees can be returned as chargeFee (preferred) or commissionAmount (legacy)
    const fees = dayTransactions.reduce(
      (sum, t) => sum + (t.chargeFee ?? t.commissionAmount ?? 0),
      0
    )
    const revenue = dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)

    return {
      date: format(day, 'MMM d'),
      fees,
      revenue,
    }
  })
}

export function computeRevenueByTypeData(transactions: Transaction[]) {
  const byType = transactions
    .filter((t) => t.status === TransactionStatus.SUCCESSFUL)
    .reduce(
      (acc, t) => {
        const type = t.transactionType
        if (!acc[type]) {
          acc[type] = { revenue: 0, fees: 0 }
        }
        acc[type].revenue += t.amount || 0
        acc[type].fees += t.chargeFee ?? t.commissionAmount ?? 0
        return acc
      },
      {} as Record<string, { revenue: number; fees: number }>
    )

  return Object.entries(byType).map(([type, data]) => ({
    type:
      type === TransactionType.CASH_IN
        ? 'Cash In'
        : type === TransactionType.CASH_OUT
          ? 'Cash Out'
          : String(type),
    revenue: data.revenue,
    fees: data.fees,
  }))
}

export function computeRiskData(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): RiskDataPoint[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  return days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayTransactions = transactions.filter(
      (t) => format(parseISO(t.createdAt), 'yyyy-MM-dd') === dayStr
    )

    // Flagged transactions (failed or rolled back)
    const flagged = dayTransactions.filter(
      (t) =>
        t.status === TransactionStatus.FAILED || t.status === TransactionStatus.ROLLED_BACK
    ).length

    return {
      date: format(day, 'MMM d'),
      flagged,
    }
  })
}

export function computeRiskScoreDistribution(transactions: Transaction[]) {
  // Simplified risk scoring based on transaction patterns
  const riskScores: Record<string, number> = {}

  transactions.forEach((t) => {
    const userId = t.userId
    if (!riskScores[userId]) {
      riskScores[userId] = 0
    }

    // Increase risk score for failed transactions
    if (t.status === TransactionStatus.FAILED) {
      riskScores[userId] += 2
    } else if (t.status === TransactionStatus.ROLLED_BACK) {
      riskScores[userId] += 3
    } else if (t.status === TransactionStatus.SUCCESSFUL) {
      riskScores[userId] = Math.max(0, riskScores[userId] - 0.5)
    }
  })

  const distribution = {
    low: 0,
    medium: 0,
    high: 0,
  }

  Object.values(riskScores).forEach((score) => {
    if (score < 2) distribution.low++
    else if (score < 5) distribution.medium++
    else distribution.high++
  })

  return [
    { category: 'Low Risk', count: distribution.low },
    { category: 'Medium Risk', count: distribution.medium },
    { category: 'High Risk', count: distribution.high },
  ]
}

export function computeSummaryMetrics(transactions: Transaction[]): SummaryMetrics {
  const successful = transactions.filter((t) => t.status === TransactionStatus.SUCCESSFUL)
  const failed = transactions.filter((t) => t.status === TransactionStatus.FAILED)
  const uniqueUsers = new Set(transactions.map((t) => t.userId))

  const totalVolume = successful.reduce((sum, t) => sum + (t.amount || 0), 0)
  // Fees can be returned as chargeFee (preferred) or commissionAmount (legacy)
  const totalFees = successful.reduce((sum, t) => sum + (t.chargeFee ?? t.commissionAmount ?? 0), 0)
  const successRate =
    transactions.length > 0 ? (successful.length / transactions.length) * 100 : 0

  return {
    totalTransactions: transactions.length,
    totalVolume,
    activeUsers: uniqueUsers.size,
    successRate,
    totalFees,
    failureRate:
      transactions.length > 0 ? (failed.length / transactions.length) * 100 : 0,
  }
}


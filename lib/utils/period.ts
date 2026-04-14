import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
} from 'date-fns'

export type PeriodKey = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

export interface PeriodRangeInput {
  period: PeriodKey
  customFrom?: Date | null
  customTo?: Date | null
  now?: Date
}

export interface PeriodRange {
  start: Date
  end: Date
  label: string
}

export function getPeriodRange(input: PeriodRangeInput): PeriodRange {
  const now = input.now ?? new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  switch (input.period) {
    case 'today':
      return { start: todayStart, end: todayEnd, label: 'Today' }
    case 'week':
      return { start: startOfDay(subDays(now, 7)), end: todayEnd, label: 'Last 7 days' }
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now), label: 'This month' }
    case 'quarter':
      return { start: startOfQuarter(now), end: endOfQuarter(now), label: 'This quarter' }
    case 'year':
      return { start: startOfYear(now), end: endOfYear(now), label: 'This year' }
    case 'custom':
      if (input.customFrom && input.customTo) {
        return {
          start: startOfDay(input.customFrom),
          end: endOfDay(input.customTo),
          label: `${format(input.customFrom, 'MMM d, yyyy')} - ${format(input.customTo, 'MMM d, yyyy')}`,
        }
      }
      return { start: startOfMonth(now), end: endOfMonth(now), label: 'Custom range' }
    case 'all':
    default:
      return { start: startOfMonth(now), end: todayEnd, label: 'All time' }
  }
}

export function getPreviousPeriodRange(current: PeriodRange): PeriodRange {
  const durationMs = Math.max(1, current.end.getTime() - current.start.getTime() + 1)
  const prevEnd = new Date(current.start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - durationMs + 1)
  return {
    start: prevStart,
    end: prevEnd,
    label: 'Previous period',
  }
}

export function computePercentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

export function filterByDateRange<T>(
  rows: T[],
  getDate: (row: T) => Date | null,
  range: PeriodRange
): T[] {
  return rows.filter((row) => {
    const date = getDate(row)
    return !!date && date >= range.start && date <= range.end
  })
}

export function buildTimeBuckets(range: PeriodRange, period: PeriodKey): Date[] {
  if (period === 'year' || period === 'all') {
    return eachMonthOfInterval({ start: startOfMonth(range.start), end: endOfMonth(range.end) })
  }
  return eachDayOfInterval({ start: startOfDay(range.start), end: endOfDay(range.end) })
}


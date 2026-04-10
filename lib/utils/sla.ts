import type { SlaState } from '@/lib/types/risk'

const APPROACHING_MINUTES = 10
const BREACH_MINUTES = 15

export function getSlaState(minutesInQueue: number): SlaState {
  if (minutesInQueue > BREACH_MINUTES) return 'breach'
  if (minutesInQueue > APPROACHING_MINUTES) return 'approaching_breach'
  return 'within_target'
}

export function getSlaToneClass(state: SlaState): string {
  if (state === 'breach') return 'text-red-400'
  if (state === 'approaching_breach') return 'text-amber-400'
  return 'text-emerald-400'
}

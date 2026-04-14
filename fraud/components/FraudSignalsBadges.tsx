import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function normalizeSignals(signals?: string | null): string[] {
  const raw = String(signals ?? '').trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function badgeClass(signal: string): string {
  const s = signal.toUpperCase()
  if (s.includes('HIGH') || s.includes('ANOMALY')) {
    return 'bg-red-500/10 text-red-400 border-red-500/20'
  }
  return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
}

export function FraudSignalsBadges({
  fraudSignals,
  className,
}: {
  fraudSignals?: string | null
  className?: string
}) {
  const signals = normalizeSignals(fraudSignals)
  if (signals.length === 0) return <span className={cn('text-sm text-muted-foreground', className)}>—</span>

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {signals.map((signal) => (
        <Badge key={signal} className={cn('text-xs', badgeClass(signal))}>
          {signal}
        </Badge>
      ))}
    </div>
  )
}


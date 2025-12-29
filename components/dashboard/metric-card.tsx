import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: number
  unit?: string
  change?: number
  icon: LucideIcon
  variant?: 'default' | 'negative' | 'warning'
  format?: 'number' | 'currency'
  currency?: string
}

export function MetricCard({
  title,
  value,
  unit,
  change,
  icon: Icon,
  variant = 'default',
  format = 'number',
  currency = 'RWF',
}: MetricCardProps) {
  const formattedValue =
    format === 'currency'
      ? new Intl.NumberFormat('en-RW', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
        }).format(value)
      : value.toLocaleString()

  const iconColor =
    variant === 'negative'
      ? 'text-red-400'
      : variant === 'warning'
        ? 'text-yellow-400'
        : 'text-blue-400'

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle size="sm">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">
          {formattedValue} {unit && format !== 'currency' && unit}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center text-xs mt-1 ${
              change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(change).toFixed(1)}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  )
}


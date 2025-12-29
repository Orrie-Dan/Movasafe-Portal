'use client'

interface GaugeChartProps {
  value: number
  max?: number
  label?: string
}

export function GaugeChart({ value, max = 100, label }: GaugeChartProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="flex flex-col items-center">
      {label && <p className="text-sm text-muted-foreground mb-2">{label}</p>}
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${percentage * 2.51} 251`}
            className="text-primary"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(value)}%</span>
        </div>
      </div>
    </div>
  )
}


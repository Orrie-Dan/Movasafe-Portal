'use client'

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'

export interface CategoryResolutionTime {
  type: string
  avgHours: number
  count: number
}

export interface CategoryResolutionTimesProps {
  categoryTimes: CategoryResolutionTime[]
  className?: string
}

export function CategoryResolutionTimes({
  categoryTimes,
  className,
}: CategoryResolutionTimesProps) {
  if (!categoryTimes || categoryTimes.length === 0) {
    return null
  }

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all mt-6 ${className}`}>
      <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-900/50 bg-black">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <CardTitle size="md" className="text-white relative z-10">Resolution Time by Category</CardTitle>
        <CardDescription className="text-slate-400 relative z-10">Average resolution time for each report category</CardDescription>
      </div>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryTimes
            .sort((a, b) => b.avgHours - a.avgHours)
            .map((cat) => (
              <div
                key={cat.type}
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300 capitalize">
                    {cat.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">({cat.count} reports)</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {(cat.avgHours / 24).toFixed(1)} days
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {cat.avgHours < 168 ? 'Within SLA' : 'Over SLA'}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}


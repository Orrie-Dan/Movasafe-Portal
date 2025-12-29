'use client'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Clock, TrendingUp, AlertCircle } from 'lucide-react'

export interface PerformanceMetricsCardsProps {
  avgResolutionTime: number
  slaComplianceRate: number | null
  overdueCount: number
  overduePercentage?: number
  loading?: boolean
  className?: string
}

export function PerformanceMetricsCards({
  avgResolutionTime,
  slaComplianceRate,
  overdueCount,
  overduePercentage,
  loading = false,
  className,
}: PerformanceMetricsCardsProps) {
  if (loading) {
    return null
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-1 md:grid-cols-3 ${className}`}>
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-blue-500/50 transition-all">
        <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle size="sm" className="text-white z-10 relative">Avg Resolution Time</CardTitle>
          <div className="p-2 rounded-lg bg-blue-500/10 relative z-10">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
        </div>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-1">
            {avgResolutionTime > 0
              ? `${Math.round(avgResolutionTime / 24 * 10) / 10} days`
              : 'N/A'}
          </div>
          <p className="text-xs text-slate-400">Average time to resolve</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-green-500/50 transition-all">
        <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle size="sm" className="text-white z-10 relative">SLA Compliance</CardTitle>
          <div className="p-2 rounded-lg bg-green-500/10 relative z-10">
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
        </div>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-1">
            {slaComplianceRate !== null
              ? `${Math.round(slaComplianceRate)}%`
              : 'N/A'}
          </div>
          <p className="text-xs text-slate-400">
            {slaComplianceRate !== null
              ? `Assigned reports within 7-day SLA`
              : 'No assigned reports yet'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-red-500/50 transition-all">
        <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle size="sm" className="text-white z-10 relative">Overdue Assignments</CardTitle>
          <div className="p-2 rounded-lg bg-red-500/10 relative z-10">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
        </div>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-1">{overdueCount}</div>
          <p className="text-xs text-slate-400">
            {overduePercentage !== undefined && overduePercentage > 0
              ? `${Math.round(overduePercentage)}% of assigned reports`
              : 'Assigned > 7 days ago'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}


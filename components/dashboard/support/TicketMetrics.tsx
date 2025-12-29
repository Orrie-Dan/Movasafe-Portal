'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { apiGetTicketMetrics } from '@/lib/api'

interface TicketMetricsProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function TicketMetrics({
  startDate,
  endDate,
  className,
}: TicketMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [startDate, endDate])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const response = await apiGetTicketMetrics({ startDate, endDate })
      setMetrics(response)
    } catch (error) {
      console.error('Failed to fetch ticket metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const ticketsOpened = metrics?.ticketsOpened || 0
  const ticketsResolved = metrics?.ticketsResolved || 0
  const avgResolutionTime = metrics?.avgResolutionTime || 0
  const resolutionRate = ticketsOpened > 0 ? (ticketsResolved / ticketsOpened) * 100 : 0
  const trendData = metrics?.trendData || []

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="relative z-10 flex-1">
          <CardTitle className="flex items-center gap-2 text-white">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Ticket Metrics
          </CardTitle>
          <CardDescription className="text-slate-400">
            Customer support ticket overview
          </CardDescription>
          <div className="mt-4 grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400">Tickets Opened</p>
            <p className="text-2xl font-bold text-white">{ticketsOpened}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Tickets Resolved</p>
            <p className="text-2xl font-bold text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {ticketsResolved}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Avg Resolution</p>
            <p className="text-2xl font-bold text-blue-400 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {avgResolutionTime.toFixed(0)}h
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Resolution Rate</p>
            <p className={`text-2xl font-bold ${
              resolutionRate >= 80 ? 'text-green-400' :
              resolutionRate >= 60 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {resolutionRate.toFixed(1)}%
            </p>
          </div>
        </div>
        </div>
        <div className="relative z-10">
          <Badge className={
            resolutionRate >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/50' :
            resolutionRate >= 60 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
            'bg-red-500/20 text-red-400 border-red-500/50'
          }>
            {resolutionRate.toFixed(1)}% Resolved
          </Badge>
        </div>
      </div>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="space-y-6">
            {/* Tickets Trend */}
            {trendData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Tickets Trend</h3>
                <EnhancedLineChart
                  data={trendData}
                  dataKeys={[
                    { key: 'opened', name: 'Opened', color: '#3b82f6' },
                    { key: 'resolved', name: 'Resolved', color: '#10b981' },
                  ]}
                  xAxisKey="period"
                  height={300}
                  yAxisLabel={{ value: 'Tickets', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


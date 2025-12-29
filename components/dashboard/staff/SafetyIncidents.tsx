'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { apiGetSafetyIncidents } from '@/lib/api'

interface SafetyIncidentsProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function SafetyIncidents({
  startDate,
  endDate,
  className,
}: SafetyIncidentsProps) {
  const [incidentData, setIncidentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIncidents()
  }, [startDate, endDate])

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const response = await apiGetSafetyIncidents({ startDate, endDate })
      setIncidentData(response)
    } catch (error) {
      console.error('Failed to fetch safety incidents:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalIncidents = incidentData?.totalIncidents || 0
  const incidentsThisMonth = incidentData?.incidentsThisMonth || 0
  const trend = incidentData?.trend || 0
  const byType = incidentData?.byType || []
  const trendData = incidentData?.trendData || []

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Safety Incidents
            </CardTitle>
            <CardDescription className="text-slate-400">
              Safety incident tracking and analysis
            </CardDescription>
          </div>
          <Badge className={
            trend < 0 ? 'bg-green-500/20 text-green-400 border-green-500/50' :
            'bg-red-500/20 text-red-400 border-red-500/50'
          }>
            {trend < 0 ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : (
              <TrendingUp className="h-3 w-3 mr-1" />
            )}
            {Math.abs(trend).toFixed(1)}% vs last month
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Total Incidents</p>
            <p className="text-2xl font-bold text-white">{totalIncidents}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">This Month</p>
            <p className="text-2xl font-bold text-red-400">{incidentsThisMonth}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Trend</p>
            <p className={`text-2xl font-bold flex items-center gap-1 ${
              trend < 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {Math.abs(trend).toFixed(1)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="space-y-6">
            {/* Incidents Trend */}
            {trendData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Incidents Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="period"
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      label={{ value: 'Incidents', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Incidents"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Incidents by Type */}
            {byType.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Incidents by Type</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={byType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="type"
                      stroke="#9ca3af"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      label={{ value: 'Incidents', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="count" name="Incidents" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


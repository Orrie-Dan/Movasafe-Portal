'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserPlus, UserMinus, TrendingUp, TrendingDown } from 'lucide-react'
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { apiGetClientMetrics, apiGetChurnRate } from '@/lib/api'

interface ClientLifecycleMetricsProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function ClientLifecycleMetrics({
  startDate,
  endDate,
  className,
}: ClientLifecycleMetricsProps) {
  const [metrics, setMetrics] = useState<any>(null)
  const [churnData, setChurnData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [startDate, endDate])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const [metricsResponse, churnResponse] = await Promise.all([
        apiGetClientMetrics({ startDate, endDate }),
        apiGetChurnRate({ startDate, endDate }),
      ])
      setMetrics(metricsResponse)
      setChurnData(churnResponse)
    } catch (error) {
      console.error('Failed to fetch client metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeClients = metrics?.activeClients || 0
  const newClients = metrics?.newClientsThisMonth || 0
  const churnRate = churnData?.churnRate || 0
  const growthRate = metrics?.growthRate || 0

  const lifecycleData = metrics?.lifecycleData || []
  const churnTrendData = churnData?.trendData || []

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Client Lifecycle Metrics
            </CardTitle>
            <CardDescription className="text-slate-400">
              Client acquisition, retention, and churn analysis
            </CardDescription>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400">Active Clients</p>
            <p className="text-2xl font-bold text-white">{activeClients.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">New This Month</p>
            <p className="text-2xl font-bold text-green-400 flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              {newClients.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Churn Rate</p>
            <p className={`text-2xl font-bold flex items-center gap-1 ${
              churnRate < 5 ? 'text-green-400' : churnRate < 10 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {churnRate < 5 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {churnRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Growth Rate</p>
            <p className={`text-2xl font-bold flex items-center gap-1 ${
              growthRate > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {growthRate > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(growthRate).toFixed(1)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="space-y-6">
            {/* Lifecycle Chart */}
            {lifecycleData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Client Lifecycle Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={lifecycleData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="period"
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      label={{ value: 'Clients', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
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
                      dataKey="active"
                      name="Active Clients"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="new"
                      name="New Clients"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="churned"
                      name="Churned Clients"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Churn Rate Trend */}
            {churnTrendData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Churn Rate Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={churnTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="period"
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      label={{ value: 'Churn Rate (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Churn Rate']}
                    />
                    <Bar
                      dataKey="churnRate"
                      name="Churn Rate"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-slate-300">New Clients</span>
                </div>
                <p className="text-2xl font-bold text-white">{newClients}</p>
                <p className="text-xs text-slate-400 mt-1">This month</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <UserMinus className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-slate-300">Churned</span>
                </div>
                <p className="text-2xl font-bold text-white">{churnData?.churnedThisMonth || 0}</p>
                <p className="text-xs text-slate-400 mt-1">This month</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-slate-300">Net Growth</span>
                </div>
                <p className={`text-2xl font-bold ${
                  (newClients - (churnData?.churnedThisMonth || 0)) > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {newClients - (churnData?.churnedThisMonth || 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">This month</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


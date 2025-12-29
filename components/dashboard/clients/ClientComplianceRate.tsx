'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { apiGetClientCompliance } from '@/lib/api'

interface ClientComplianceRateProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function ClientComplianceRate({
  startDate,
  endDate,
  className,
}: ClientComplianceRateProps) {
  const [complianceData, setComplianceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompliance()
  }, [startDate, endDate])

  const fetchCompliance = async () => {
    setLoading(true)
    try {
      const response = await apiGetClientCompliance({ startDate, endDate })
      setComplianceData(response)
    } catch (error) {
      console.error('Failed to fetch client compliance:', error)
    } finally {
      setLoading(false)
    }
  }

  const overallCompliance = complianceData?.overallComplianceRate || 0
  const sortedClients = complianceData?.sortedClients || 0
  const unsortedClients = complianceData?.unsortedClients || 0
  const totalClients = sortedClients + unsortedClients

  const pieData = [
    { name: 'Sorted', value: sortedClients, color: '#10b981' },
    { name: 'Unsorted', value: unsortedClients, color: '#ef4444' },
  ]

  const byCategory = complianceData?.byCategory || []
  const byArea = complianceData?.byArea || []

  const getComplianceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400'
    if (rate >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getComplianceBadge = (rate: number) => {
    if (rate >= 80) return 'bg-green-500/20 text-green-400 border-green-500/50'
    if (rate >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    return 'bg-red-500/20 text-red-400 border-red-500/50'
  }

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Client Compliance Rate
            </CardTitle>
            <CardDescription className="text-slate-400">
              Waste sorting compliance tracking
            </CardDescription>
          </div>
          <Badge className={getComplianceBadge(overallCompliance)}>
            {overallCompliance.toFixed(1)}% Compliant
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Overall Compliance</p>
            <p className={`text-2xl font-bold ${getComplianceColor(overallCompliance)}`}>
              {overallCompliance.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Sorted Waste</p>
            <p className="text-2xl font-bold text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {sortedClients}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Unsorted Waste</p>
            <p className="text-2xl font-bold text-red-400 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              {unsortedClients}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="space-y-6">
            {/* Compliance Distribution Pie Chart */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Compliance Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Compliance by Category */}
            {byCategory.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Compliance by Client Category</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="category"
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      domain={[0, 100]}
                      label={{ value: 'Compliance (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Compliance']}
                    />
                    <Bar
                      dataKey="complianceRate"
                      name="Compliance Rate"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Compliance by Area */}
            {byArea.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Top Areas by Compliance</h3>
                <div className="space-y-2">
                  {byArea.slice(0, 5).map((area: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                    >
                      <div>
                        <p className="font-medium text-white">{area.area}</p>
                        <p className="text-xs text-slate-400">{area.clientCount} clients</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${area.complianceRate}%`,
                              backgroundColor: area.complianceRate >= 80 ? '#10b981' : area.complianceRate >= 60 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <Badge className={getComplianceBadge(area.complianceRate)}>
                          {area.complianceRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


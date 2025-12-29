'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Leaf, TrendingDown, Truck, Factory } from 'lucide-react'
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
import { apiGetEmissionsBreakdown } from '@/lib/api'

interface EmissionsBreakdownProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function EmissionsBreakdown({
  startDate,
  endDate,
  className,
}: EmissionsBreakdownProps) {
  const [emissionsData, setEmissionsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmissions()
  }, [startDate, endDate])

  const fetchEmissions = async () => {
    setLoading(true)
    try {
      const response = await apiGetEmissionsBreakdown({ startDate, endDate })
      setEmissionsData(response)
    } catch (error) {
      console.error('Failed to fetch emissions breakdown:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalEmissions = emissionsData?.totalEmissions || 0
  const emissionsSaved = emissionsData?.emissionsSaved || 0
  const netEmissions = totalEmissions - emissionsSaved
  const bySource = emissionsData?.bySource || []
  const trendData = emissionsData?.trendData || []

  const formatEmissions = (tons: number) => {
    if (tons >= 1000) return `${(tons / 1000).toFixed(2)}K tons`
    return `${tons.toFixed(2)} tons`
  }

  return (
    <Card className={`bg-black border-slate-800 ${className}`}>
      <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="flex items-center justify-between relative z-10 flex-1">
          <div>
            <CardTitle size="md" className="text-white flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-400" />
              Emissions Breakdown
            </CardTitle>
            <CardDescription className="text-slate-400">
              CO₂ emissions from operations and savings from recycling
            </CardDescription>
          </div>
        </div>
      </div>
      <CardContent className="pt-6">
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400">Total Emissions</p>
            <p className="text-2xl font-bold text-red-400">{formatEmissions(totalEmissions)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Saved (Recycling)</p>
            <p className="text-2xl font-bold text-green-400 flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              {formatEmissions(emissionsSaved)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Net Emissions</p>
            <p className={`text-2xl font-bold ${
              netEmissions < 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatEmissions(Math.abs(netEmissions))}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Reduction Rate</p>
            <p className="text-2xl font-bold text-green-400">
              {totalEmissions > 0 ? ((emissionsSaved / totalEmissions) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="space-y-6">
            {/* Emissions by Source */}
            {bySource.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Emissions by Source</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={bySource}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="source"
                      stroke="#9ca3af"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      label={{ value: 'CO₂ (tons)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => formatEmissions(value)}
                    />
                    <Legend />
                    <Bar dataKey="emissions" name="Emissions" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saved" name="Saved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Emissions Trend */}
            {trendData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Emissions Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
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
                      label={{ value: 'CO₂ (tons)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => formatEmissions(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="emissions"
                      name="Total Emissions"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="saved"
                      name="Saved (Recycling)"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      name="Net Emissions"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Source Breakdown Details */}
            {bySource.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Source Details</h3>
                <div className="space-y-2">
                  {bySource.map((source: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        {source.source === 'Fleet' ? (
                          <Truck className="h-5 w-5 text-blue-400" />
                        ) : (
                          <Factory className="h-5 w-5 text-orange-400" />
                        )}
                        <div>
                          <p className="font-medium text-white">{source.source}</p>
                          <p className="text-xs text-slate-400">
                            {source.wasteProcessed} tons processed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-400">{formatEmissions(source.emissions)}</p>
                        {source.saved > 0 && (
                          <p className="text-xs text-green-400">
                            Saved: {formatEmissions(source.saved)}
                          </p>
                        )}
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


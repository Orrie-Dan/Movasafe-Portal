'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Truck, TrendingUp } from 'lucide-react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { TruckUtilization } from '@/lib/types/dashboard'
import { apiGetTruckUtilization } from '@/lib/api'

interface TruckUtilizationChartProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function TruckUtilizationChart({
  startDate,
  endDate,
  className,
}: TruckUtilizationChartProps) {
  const [utilizationData, setUtilizationData] = useState<TruckUtilization[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'utilization' | 'collections' | 'distance'>('utilization')

  useEffect(() => {
    fetchUtilization()
  }, [startDate, endDate])

  const fetchUtilization = async () => {
    setLoading(true)
    try {
      const response = await apiGetTruckUtilization({ startDate, endDate })
      setUtilizationData(response.data || [])
    } catch (error) {
      console.error('Failed to fetch truck utilization:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedData = [...utilizationData].sort((a, b) => {
    switch (sortBy) {
      case 'utilization':
        return b.utilizationRate - a.utilizationRate
      case 'collections':
        return b.collectionsCount - a.collectionsCount
      case 'distance':
        return b.distanceTraveled - a.distanceTraveled
      default:
        return 0
    }
  }).slice(0, 10) // Top 10

  const chartData = sortedData.map(truck => ({
    vehicle: truck.vehicleNumber,
    utilization: truck.utilizationRate,
    collections: truck.collectionsCount,
    distance: truck.distanceTraveled,
    fuel: truck.fuelConsumption,
  }))

  const avgUtilization = utilizationData.length > 0
    ? utilizationData.reduce((sum, t) => sum + t.utilizationRate, 0) / utilizationData.length
    : 0

  const getColor = (value: number, max: number) => {
    const ratio = value / max
    if (ratio >= 0.8) return '#10b981' // green
    if (ratio >= 0.6) return '#3b82f6' // blue
    if (ratio >= 0.4) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const maxUtilization = Math.max(...chartData.map(d => d.utilization), 1)

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-400" />
              Truck Utilization
            </CardTitle>
            <CardDescription className="text-slate-400">
              Vehicle utilization rates and performance
            </CardDescription>
          </div>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="utilization">Sort by Utilization</SelectItem>
              <SelectItem value="collections">Sort by Collections</SelectItem>
              <SelectItem value="distance">Sort by Distance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-400">Average Utilization</p>
            <p className="text-2xl font-bold text-white">{avgUtilization.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Vehicles</p>
            <p className="text-2xl font-bold text-white">{utilizationData.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-slate-400">No utilization data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <RechartsBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="vehicle"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  label={{ value: 'Utilization (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
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
                <Bar dataKey="utilization" name="Utilization Rate (%)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.utilization, maxUtilization)} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>

            {/* Detailed Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Vehicle</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Utilization</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Collections</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Distance (km)</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Fuel (L)</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">Avg Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((truck) => (
                    <tr key={truck.vehicleId} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-2 px-3 text-white font-medium">{truck.vehicleNumber}</td>
                      <td className="py-2 px-3 text-right text-white">
                        <div className="flex items-center justify-end gap-2">
                          <span>{truck.utilizationRate.toFixed(1)}%</span>
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full"
                              style={{
                                width: `${truck.utilizationRate}%`,
                                backgroundColor: getColor(truck.utilizationRate, 100),
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">{truck.collectionsCount}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{truck.distanceTraveled.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{truck.fuelConsumption.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{truck.avgRouteDuration.toFixed(0)} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


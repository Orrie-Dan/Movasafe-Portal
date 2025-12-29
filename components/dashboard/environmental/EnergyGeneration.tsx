'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Zap, TrendingUp, Factory } from 'lucide-react'
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
import { apiGetEnergyGeneration } from '@/lib/api'

interface EnergyGenerationProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function EnergyGeneration({
  startDate,
  endDate,
  className,
}: EnergyGenerationProps) {
  const [energyData, setEnergyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnergyData()
  }, [startDate, endDate])

  const fetchEnergyData = async () => {
    setLoading(true)
    try {
      const response = await apiGetEnergyGeneration({ startDate, endDate })
      setEnergyData(response)
    } catch (error) {
      console.error('Failed to fetch energy generation:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalEnergy = energyData?.totalEnergyGenerated || 0
  const avgDaily = energyData?.avgDailyGeneration || 0
  const facilities = energyData?.facilities || []
  const trendData = energyData?.trendData || []

  const formatEnergy = (kwh: number) => {
    if (kwh >= 1000000) return `${(kwh / 1000000).toFixed(2)} GWh`
    if (kwh >= 1000) return `${(kwh / 1000).toFixed(2)} MWh`
    return `${kwh.toFixed(2)} kWh`
  }

  return (
    <Card className={`bg-black border-slate-800 ${className}`}>
      <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="flex items-center justify-between relative z-10 flex-1">
          <div>
            <CardTitle size="md" className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Energy Generation
            </CardTitle>
            <CardDescription className="text-slate-400">
              Waste-to-energy generation metrics
            </CardDescription>
          </div>
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            {formatEnergy(totalEnergy)}
          </Badge>
        </div>
      </div>
      <CardContent className="pt-6">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Total Generated</p>
            <p className="text-2xl font-bold text-yellow-400">{formatEnergy(totalEnergy)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Avg Daily</p>
            <p className="text-2xl font-bold text-white">{formatEnergy(avgDaily)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Facilities</p>
            <p className="text-2xl font-bold text-white">{facilities.length}</p>
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : totalEnergy === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Factory className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No energy generation data available</p>
              <p className="text-xs text-slate-500 mt-2">Waste-to-energy facilities not yet operational</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Energy Generation Trend */}
            {trendData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Energy Generation Trend</h3>
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
                      label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => formatEnergy(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="energy"
                      name="Energy Generated"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Energy by Facility */}
            {facilities.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Energy Generation by Facility</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={facilities}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="facilityName"
                      stroke="#9ca3af"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value: number) => formatEnergy(value)}
                    />
                    <Bar dataKey="energyGenerated" name="Energy Generated" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Facility Details */}
            {facilities.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Facility Details</h3>
                <div className="space-y-2">
                  {facilities.map((facility: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <Factory className="h-5 w-5 text-yellow-400" />
                        <div>
                          <p className="font-medium text-white">{facility.facilityName}</p>
                          <p className="text-xs text-slate-400">
                            {facility.wasteProcessed} tons processed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-400">{formatEnergy(facility.energyGenerated)}</p>
                        <p className="text-xs text-slate-400">
                          {((facility.energyGenerated / totalEnergy) * 100).toFixed(1)}% of total
                        </p>
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


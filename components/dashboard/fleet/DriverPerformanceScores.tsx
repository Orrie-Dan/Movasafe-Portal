'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, TrendingUp, AlertTriangle, Clock, Fuel } from 'lucide-react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import type { DriverPerformance } from '@/lib/types/dashboard'
import { apiGetDriverPerformance } from '@/lib/api'

interface DriverPerformanceScoresProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function DriverPerformanceScores({
  startDate,
  endDate,
  className,
}: DriverPerformanceScoresProps) {
  const [performanceData, setPerformanceData] = useState<DriverPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'score' | 'collections' | 'safety'>('score')
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)

  useEffect(() => {
    fetchPerformance()
  }, [startDate, endDate])

  const fetchPerformance = async () => {
    setLoading(true)
    try {
      const response = await apiGetDriverPerformance({ startDate, endDate })
      setPerformanceData(response.data || [])
    } catch (error) {
      console.error('Failed to fetch driver performance:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedData = [...performanceData].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.performanceScore - a.performanceScore
      case 'collections':
        return b.collectionsCompleted - a.collectionsCompleted
      case 'safety':
        return b.safetyScore - a.safetyScore
      default:
        return 0
    }
  })

  const avgPerformance = performanceData.length > 0
    ? performanceData.reduce((sum, d) => sum + d.performanceScore, 0) / performanceData.length
    : 0

  const avgSafety = performanceData.length > 0
    ? performanceData.reduce((sum, d) => sum + d.safetyScore, 0) / performanceData.length
    : 0

  const chartData = sortedData.slice(0, 10).map(driver => ({
    name: driver.driverName.split(' ')[0], // First name only for chart
    fullName: driver.driverName,
    performance: driver.performanceScore,
    safety: driver.safetyScore,
    collections: driver.collectionsCompleted,
    onTime: driver.onTimeRate,
  }))

  const selectedDriverData = selectedDriver
    ? performanceData.find(d => d.driverId === selectedDriver)
    : null

  const radarData = selectedDriverData ? [
    { subject: 'Performance', value: selectedDriverData.performanceScore },
    { subject: 'Safety', value: selectedDriverData.safetyScore },
    { subject: 'On-Time Rate', value: selectedDriverData.onTimeRate },
    { subject: 'Fuel Efficiency', value: selectedDriverData.fuelEfficiency * 10 }, // Scale 0-100
    { subject: 'Collections', value: Math.min(selectedDriverData.collectionsCompleted * 2, 100) }, // Scale
  ] : []

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/50'
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    return 'bg-red-500/20 text-red-400 border-red-500/50'
  }

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Driver Performance Scores
            </CardTitle>
            <CardDescription className="text-slate-400">
              Performance metrics and safety scores for drivers
            </CardDescription>
          </div>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Sort by Performance</SelectItem>
              <SelectItem value="collections">Sort by Collections</SelectItem>
              <SelectItem value="safety">Sort by Safety</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Avg Performance</p>
            <p className={`text-2xl font-bold ${getScoreColor(avgPerformance)}`}>
              {avgPerformance.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Avg Safety Score</p>
            <p className={`text-2xl font-bold ${getScoreColor(avgSafety)}`}>
              {avgSafety.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Drivers</p>
            <p className="text-2xl font-bold text-white">{performanceData.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : performanceData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-slate-400">No performance data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Performance Bar Chart */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Performance Scores</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    domain={[0, 100]}
                    label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
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
                  <Bar dataKey="performance" name="Performance Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="safety" name="Safety Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            {/* Driver Details Table */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Driver Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 font-medium">Driver</th>
                      <th className="text-right py-2 px-3 text-slate-400 font-medium">Performance</th>
                      <th className="text-right py-2 px-3 text-slate-400 font-medium">Safety</th>
                      <th className="text-right py-2 px-3 text-slate-400 font-medium">On-Time</th>
                      <th className="text-right py-2 px-3 text-slate-400 font-medium">Collections</th>
                      <th className="text-right py-2 px-3 text-slate-400 font-medium">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((driver) => (
                      <tr
                        key={driver.driverId}
                        className={`border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer ${
                          selectedDriver === driver.driverId ? 'bg-slate-800/70' : ''
                        }`}
                        onClick={() => setSelectedDriver(selectedDriver === driver.driverId ? null : driver.driverId)}
                      >
                        <td className="py-2 px-3 text-white font-medium">{driver.driverName}</td>
                        <td className="py-2 px-3 text-right">
                          <Badge className={getScoreBadge(driver.performanceScore)}>
                            {driver.performanceScore.toFixed(1)}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Badge className={getScoreBadge(driver.safetyScore)}>
                            {driver.safetyScore.toFixed(1)}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">{driver.onTimeRate.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-slate-300">{driver.collectionsCompleted}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {driver.speedingIncidents > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {driver.speedingIncidents} Speed
                              </Badge>
                            )}
                            {driver.lateArrivals > 0 && (
                              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                                {driver.lateArrivals} Late
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Radar Chart for Selected Driver */}
            {selectedDriverData && radarData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">
                  Performance Breakdown: {selectedDriverData.driverName}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={12} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                      <span className="text-slate-300">Speeding Incidents</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedDriverData.speedingIncidents}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span className="text-slate-300">Idling Time</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedDriverData.idlingTime.toFixed(1)}h</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-slate-300">Avg Collection Time</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedDriverData.avgCollectionTime.toFixed(0)} min</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Fuel className="h-4 w-4 text-orange-400" />
                      <span className="text-slate-300">Fuel Efficiency</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{selectedDriverData.fuelEfficiency.toFixed(1)} km/L</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


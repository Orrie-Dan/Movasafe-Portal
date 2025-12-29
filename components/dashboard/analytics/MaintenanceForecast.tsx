'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Wrench, AlertTriangle, Truck } from 'lucide-react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { apiGetMaintenanceForecast } from '@/lib/api'

interface MaintenanceForecastProps {
  className?: string
}

export function MaintenanceForecast({ className }: MaintenanceForecastProps) {
  const [forecastData, setForecastData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForecast()
  }, [])

  const fetchForecast = async () => {
    setLoading(true)
    try {
      const response = await apiGetMaintenanceForecast()
      setForecastData(response.data || [])
    } catch (error) {
      console.error('Failed to fetch maintenance forecast:', error)
    } finally {
      setLoading(false)
    }
  }

  const urgentMaintenance = forecastData.filter(f => f.daysUntilMaintenance <= 7).length
  const soonMaintenance = forecastData.filter(f => f.daysUntilMaintenance > 7 && f.daysUntilMaintenance <= 30).length
  const scheduledMaintenance = forecastData.filter(f => f.daysUntilMaintenance > 30).length

  const chartData = forecastData
    .sort((a, b) => a.daysUntilMaintenance - b.daysUntilMaintenance)
    .slice(0, 15)
    .map(f => ({
      vehicle: f.vehicleNumber?.substring(0, 8) || 'Unknown',
      daysUntil: f.daysUntilMaintenance || 0,
      maintenanceType: f.maintenanceType || 'General',
    }))

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wrench className="h-5 w-5 text-blue-400" />
              Maintenance Forecast
            </CardTitle>
            <CardDescription className="text-slate-400">
              Predictive maintenance scheduling for fleet vehicles
            </CardDescription>
          </div>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
            {forecastData.length} Vehicles
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Urgent (&lt;7 days)</p>
            <p className="text-2xl font-bold text-red-400">{urgentMaintenance}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Soon (7-30 days)</p>
            <p className="text-2xl font-bold text-orange-400">{soonMaintenance}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Scheduled (&gt;30 days)</p>
            <p className="text-2xl font-bold text-green-400">{scheduledMaintenance}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : forecastData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Truck className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No maintenance forecast available</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Forecast Chart */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Top 15 Vehicles by Urgency</h3>
              <ResponsiveContainer width="100%" height={300}>
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
                    label={{ value: 'Days Until Maintenance', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
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
                  <Bar dataKey="daysUntil" name="Days Until Maintenance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            {/* Urgent Maintenance List */}
            {urgentMaintenance > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  Urgent Maintenance Required
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {forecastData
                    .filter(f => f.daysUntilMaintenance <= 7)
                    .sort((a, b) => a.daysUntilMaintenance - b.daysUntilMaintenance)
                    .map((forecast, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-red-500/50 bg-red-500/10"
                      >
                        <div className="flex items-center gap-3">
                          <Truck className="h-5 w-5 text-red-400" />
                          <div>
                            <p className="font-medium text-white text-sm">{forecast.vehicleNumber || 'Unknown'}</p>
                            <p className="text-xs text-slate-400">
                              {forecast.maintenanceType || 'General Maintenance'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-400">{forecast.daysUntilMaintenance} days</p>
                          {forecast.recommendedAction && (
                            <p className="text-xs text-slate-400">{forecast.recommendedAction}</p>
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


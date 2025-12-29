'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Calendar } from 'lucide-react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { apiGetWasteForecast } from '@/lib/api'

interface WasteForecastProps {
  className?: string
}

export function WasteForecast({ className }: WasteForecastProps) {
  const [forecastData, setForecastData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [forecastPeriod, setForecastPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    fetchForecast()
  }, [forecastPeriod])

  const fetchForecast = async () => {
    setLoading(true)
    try {
      const response = await apiGetWasteForecast({ period: forecastPeriod })
      setForecastData(response)
    } catch (error) {
      console.error('Failed to fetch waste forecast:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = forecastData?.data || []
  const forecastedTotal = chartData
    .filter((d: any) => d.type === 'forecast')
    .reduce((sum: number, d: any) => sum + (d.value || 0), 0)
  const historicalTotal = chartData
    .filter((d: any) => d.type === 'historical')
    .reduce((sum: number, d: any) => sum + (d.value || 0), 0)

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Waste Forecast
            </CardTitle>
            <CardDescription className="text-slate-400">
              Predicted waste volumes for future periods
            </CardDescription>
          </div>
          <Select value={forecastPeriod} onChange={(e) => setForecastPeriod(e.target.value as typeof forecastPeriod)}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Next Week</SelectItem>
              <SelectItem value="month">Next Month</SelectItem>
              <SelectItem value="quarter">Next Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Forecasted Total</p>
            <p className="text-2xl font-bold text-blue-400">
              {(forecastedTotal / 1000).toFixed(1)} tons
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Historical Avg</p>
            <p className="text-2xl font-bold text-white">
              {(historicalTotal / 1000).toFixed(1)} tons
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Change</p>
            <p className={`text-2xl font-bold ${
              forecastedTotal > historicalTotal ? 'text-green-400' : 'text-red-400'
            }`}>
              {historicalTotal > 0 
                ? `${(((forecastedTotal - historicalTotal) / historicalTotal) * 100).toFixed(1)}%`
                : '0%'
              }
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-slate-400">No forecast data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="period"
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number) => [`${(value / 1000).toFixed(2)} tons`, 'Waste']}
              />
              <Legend />
              <ReferenceLine
                x={chartData.findIndex((d: any) => d.type === 'forecast')}
                stroke="#6b7280"
                strokeDasharray="3 3"
                label="Forecast Start"
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Waste Volume"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                strokeDasharray={chartData.map((d: any) => d.type === 'forecast' ? '5 5' : '0').join(',')}
              />
              {forecastData?.confidenceInterval && (
                <>
                  <Line
                    type="monotone"
                    dataKey="upperBound"
                    name="Upper Bound"
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lowerBound"
                    name="Lower Bound"
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                </>
              )}
            </RechartsLineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Route, TrendingUp, MapPin } from 'lucide-react'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { apiGetOptimalRoutes } from '@/lib/api'

interface RouteOptimizationProps {
  className?: string
}

export function RouteOptimization({ className }: RouteOptimizationProps) {
  const [optimizations, setOptimizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOptimizations()
  }, [])

  const fetchOptimizations = async () => {
    setLoading(true)
    try {
      const response = await apiGetOptimalRoutes()
      setOptimizations(response.data || [])
    } catch (error) {
      console.error('Failed to fetch route optimizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalSavings = optimizations.reduce((sum, opt) => sum + (opt.distanceSaved || 0), 0)
  const totalTimeSaved = optimizations.reduce((sum, opt) => sum + (opt.timeSaved || 0), 0)
  const avgEfficiencyGain = optimizations.length > 0
    ? optimizations.reduce((sum, opt) => sum + (opt.efficiencyGain || 0), 0) / optimizations.length
    : 0

  const chartData = optimizations
    .sort((a, b) => (b.efficiencyGain || 0) - (a.efficiencyGain || 0))
    .slice(0, 10)
    .map(opt => ({
      route: opt.routeName?.substring(0, 15) || 'Unknown',
      efficiencyGain: opt.efficiencyGain || 0,
      distanceSaved: opt.distanceSaved || 0,
      timeSaved: opt.timeSaved || 0,
    }))

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Route className="h-5 w-5 text-blue-400" />
              Route Optimization
            </CardTitle>
            <CardDescription className="text-slate-400">
              AI-powered route optimization recommendations
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOptimizations}
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            Refresh
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Distance Saved</p>
            <p className="text-2xl font-bold text-green-400">
              {totalSavings.toFixed(1)} km
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Time Saved</p>
            <p className="text-2xl font-bold text-blue-400">
              {totalTimeSaved.toFixed(0)} min
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Avg Efficiency Gain</p>
            <p className="text-2xl font-bold text-white">
              {avgEfficiencyGain.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : optimizations.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Route className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No optimization recommendations available</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Efficiency Gains Chart */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Top 10 Routes by Efficiency Gain</h3>
              <EnhancedBarChart
                data={chartData}
                dataKey="efficiencyGain"
                xAxisKey="route"
                height={300}
                gradientColors={{ start: '#10b981', end: '#059669', startOpacity: 1, endOpacity: 0.8 }}
                xAxisAngle={-45}
                xAxisHeight={80}
                yAxisLabel={{ value: 'Efficiency Gain (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                name="Efficiency Gain (%)"
              />
            </div>

            {/* Optimization Recommendations */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Optimization Recommendations</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {optimizations
                  .sort((a, b) => (b.efficiencyGain || 0) - (a.efficiencyGain || 0))
                  .map((opt, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="font-medium text-white text-sm">{opt.routeName || 'Unknown Route'}</p>
                          <p className="text-xs text-slate-400">
                            {opt.distanceSaved?.toFixed(1)} km saved, {opt.timeSaved?.toFixed(0)} min saved
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          +{opt.efficiencyGain?.toFixed(1)}% efficiency
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-600/20 text-blue-400 border-blue-600/50 hover:bg-blue-600/30"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, AlertTriangle } from 'lucide-react'
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
import { apiGetBinFillPredictions } from '@/lib/api'

interface BinFillPredictionProps {
  className?: string
}

export function BinFillPrediction({ className }: BinFillPredictionProps) {
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
    setLoading(true)
    try {
      const response = await apiGetBinFillPredictions()
      setPredictions(response.data || [])
    } catch (error) {
      console.error('Failed to fetch bin fill predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const urgentBins = predictions.filter(p => p.hoursUntilFull <= 24).length
  const soonBins = predictions.filter(p => p.hoursUntilFull > 24 && p.hoursUntilFull <= 48).length
  const normalBins = predictions.filter(p => p.hoursUntilFull > 48).length

  const chartData = predictions
    .sort((a, b) => a.hoursUntilFull - b.hoursUntilFull)
    .slice(0, 20)
    .map(p => ({
      binId: p.binId?.substring(0, 8) || 'Unknown',
      hoursUntilFull: p.hoursUntilFull || 0,
      currentFill: p.currentFillLevel || 0,
    }))

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-blue-400" />
              Bin Fill Predictions
            </CardTitle>
            <CardDescription className="text-slate-400">
              Predicted time until bins are full (smart bins)
            </CardDescription>
          </div>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
            {predictions.length} Bins
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Urgent (&lt;24h)</p>
            <p className="text-2xl font-bold text-red-400">{urgentBins}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Soon (24-48h)</p>
            <p className="text-2xl font-bold text-orange-400">{soonBins}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Normal (&gt;48h)</p>
            <p className="text-2xl font-bold text-green-400">{normalBins}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : predictions.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Clock className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No bin predictions available</p>
              <p className="text-xs text-slate-500 mt-2">Smart bins not yet deployed</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Predictions Chart */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Top 20 Bins by Urgency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="binId"
                    stroke="#9ca3af"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    label={{ value: 'Hours Until Full', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
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
                  <Bar dataKey="hoursUntilFull" name="Hours Until Full" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            {/* Urgent Bins List */}
            {urgentBins > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  Urgent Bins (Require Immediate Collection)
                </h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {predictions
                    .filter(p => p.hoursUntilFull <= 24)
                    .sort((a, b) => a.hoursUntilFull - b.hoursUntilFull)
                    .map((prediction, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-red-500/50 bg-red-500/10"
                      >
                        <div>
                          <p className="font-medium text-white text-sm">{prediction.binId || 'Unknown'}</p>
                          {prediction.location && (
                            <p className="text-xs text-slate-400">{prediction.location}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-400">{prediction.hoursUntilFull}h</p>
                          <p className="text-xs text-slate-400">
                            {prediction.currentFillLevel || 0}% full
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


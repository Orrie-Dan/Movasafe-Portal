'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, Layers } from 'lucide-react'
import dynamic from 'next/dynamic'
import { apiGetWasteHeatmap } from '@/lib/api'

// Dynamically import map components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface WasteGenerationHeatmapProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function WasteGenerationHeatmap({
  startDate,
  endDate,
  className,
}: WasteGenerationHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [intensityLevel, setIntensityLevel] = useState<'low' | 'medium' | 'high' | 'all'>('all')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMapReady(true)
    }
  }, [])

  useEffect(() => {
    fetchHeatmapData()
  }, [startDate, endDate])

  const fetchHeatmapData = async () => {
    setLoading(true)
    try {
      const response = await apiGetWasteHeatmap({ startDate, endDate })
      setHeatmapData(response.data || [])
    } catch (error) {
      console.error('Failed to fetch waste heatmap:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = intensityLevel === 'all'
    ? heatmapData
    : heatmapData.filter(item => {
        const intensity = item.intensity || 'medium'
        return intensity === intensityLevel
      })

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high':
        return '#ef4444' // red
      case 'medium':
        return '#f59e0b' // orange
      case 'low':
        return '#10b981' // green
      default:
        return '#6b7280' // gray
    }
  }

  const getIntensityRadius = (intensity: string, weight: number) => {
    const baseRadius = intensity === 'high' ? 15 : intensity === 'medium' ? 10 : 5
    // Scale radius based on weight (normalized)
    const maxWeight = Math.max(...heatmapData.map(d => d.weight || 0), 1)
    return baseRadius + (weight / maxWeight) * 10
  }

  const centerLat = heatmapData.length > 0
    ? heatmapData.reduce((sum, d) => sum + (d.latitude || 0), 0) / heatmapData.length
    : -1.9441 // Default to Kigali
  const centerLng = heatmapData.length > 0
    ? heatmapData.reduce((sum, d) => sum + (d.longitude || 0), 0) / heatmapData.length
    : 30.0619

  const totalWaste = filteredData.reduce((sum, d) => sum + (d.weight || 0), 0)

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-400" />
              Waste Generation Heatmap
            </CardTitle>
            <CardDescription className="text-slate-400">
              Waste generation intensity by neighborhood
            </CardDescription>
          </div>
          <Select value={intensityLevel} onChange={(e) => setIntensityLevel(e.target.value as typeof intensityLevel)}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Intensities</SelectItem>
              <SelectItem value="high">High Intensity</SelectItem>
              <SelectItem value="medium">Medium Intensity</SelectItem>
              <SelectItem value="low">Low Intensity</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-400">Total Waste</p>
            <p className="text-2xl font-bold text-white">
              {(totalWaste / 1000).toFixed(1)} tons
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Neighborhoods</p>
            <p className="text-2xl font-bold text-white">{filteredData.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : filteredData.length === 0 ? (
          <div className="h-[500px] flex items-center justify-center border border-slate-700 rounded-lg">
            <div className="text-center">
              <Layers className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No heatmap data available</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {mapReady && (
              <div className="h-[500px] rounded-lg overflow-hidden border border-slate-700">
                <MapContainer
                  center={[centerLat, centerLng]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredData.map((item, index) => (
                    <CircleMarker
                      key={index}
                      center={[item.latitude, item.longitude]}
                      radius={getIntensityRadius(item.intensity || 'medium', item.weight || 0)}
                      pathOptions={{
                        fillColor: getIntensityColor(item.intensity || 'medium'),
                        fillOpacity: 0.6,
                        color: getIntensityColor(item.intensity || 'medium'),
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-sm mb-1">{item.neighborhood || 'Unknown'}</h3>
                          <p className="text-xs text-gray-600 mb-1">
                            Waste: {(item.weight / 1000).toFixed(2)} tons
                          </p>
                          <p className="text-xs text-gray-600 mb-1">
                            Intensity: <span className="font-medium capitalize">{item.intensity || 'medium'}</span>
                          </p>
                          {item.households && (
                            <p className="text-xs text-gray-600">
                              Households: {item.households}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <span className="text-sm text-slate-300 font-medium">Intensity:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span className="text-xs text-slate-400">Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-orange-500" />
                  <span className="text-xs text-slate-400">Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span className="text-xs text-slate-400">High</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, Flame } from 'lucide-react'
import dynamic from 'next/dynamic'
import { apiGetCollectionHotspots } from '@/lib/api'

// Dynamically import map components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface CollectionHotspotsProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function CollectionHotspots({
  startDate,
  endDate,
  className,
}: CollectionHotspotsProps) {
  const [hotspotData, setHotspotData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMapReady(true)
    }
  }, [])

  useEffect(() => {
    fetchHotspots()
  }, [startDate, endDate])

  const fetchHotspots = async () => {
    setLoading(true)
    try {
      const response = await apiGetCollectionHotspots({ startDate, endDate })
      setHotspotData(response.data || [])
    } catch (error) {
      console.error('Failed to fetch collection hotspots:', error)
    } finally {
      setLoading(false)
    }
  }

  const topHotspots = [...hotspotData]
    .sort((a, b) => (b.collectionCount || 0) - (a.collectionCount || 0))
    .slice(0, 20) // Top 20 hotspots

  const getHotspotColor = (count: number, max: number) => {
    const ratio = count / max
    if (ratio >= 0.8) return '#ef4444' // red
    if (ratio >= 0.6) return '#f59e0b' // orange
    if (ratio >= 0.4) return '#eab308' // yellow
    return '#10b981' // green
  }

  const getHotspotRadius = (count: number, max: number) => {
    const ratio = count / max
    return 8 + ratio * 20 // 8-28px radius
  }

  const maxCount = Math.max(...hotspotData.map(h => h.collectionCount || 0), 1)

  const centerLat = hotspotData.length > 0
    ? hotspotData.reduce((sum, h) => sum + (h.latitude || 0), 0) / hotspotData.length
    : -1.9441
  const centerLng = hotspotData.length > 0
    ? hotspotData.reduce((sum, h) => sum + (h.longitude || 0), 0) / hotspotData.length
    : 30.0619

  const totalCollections = hotspotData.reduce((sum, h) => sum + (h.collectionCount || 0), 0)

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              Collection Hotspots
            </CardTitle>
            <CardDescription className="text-slate-400">
              High-frequency collection areas
            </CardDescription>
          </div>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
            {topHotspots.length} Hotspots
          </Badge>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-400">Total Collections</p>
            <p className="text-2xl font-bold text-white">{totalCollections.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Top Hotspot</p>
            <p className="text-2xl font-bold text-orange-400">
              {topHotspots[0]?.collectionCount || 0}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : hotspotData.length === 0 ? (
          <div className="h-[500px] flex items-center justify-center border border-slate-700 rounded-lg">
            <div className="text-center">
              <Flame className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No hotspot data available</p>
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
                  {topHotspots.map((hotspot, index) => (
                    <CircleMarker
                      key={index}
                      center={[hotspot.latitude, hotspot.longitude]}
                      radius={getHotspotRadius(hotspot.collectionCount || 0, maxCount)}
                      pathOptions={{
                        fillColor: getHotspotColor(hotspot.collectionCount || 0, maxCount),
                        fillOpacity: 0.7,
                        color: getHotspotColor(hotspot.collectionCount || 0, maxCount),
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-sm mb-1">{hotspot.location || 'Unknown'}</h3>
                          <p className="text-xs text-gray-600 mb-1">
                            Collections: {hotspot.collectionCount}
                          </p>
                          {hotspot.avgWeight && (
                            <p className="text-xs text-gray-600 mb-1">
                              Avg Weight: {(hotspot.avgWeight / 1000).toFixed(2)} tons
                            </p>
                          )}
                          {hotspot.frequency && (
                            <p className="text-xs text-gray-600">
                              Frequency: {hotspot.frequency}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            )}

            {/* Top Hotspots List */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Top Collection Hotspots</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {topHotspots.slice(0, 10).map((hotspot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-white text-sm">{hotspot.location || 'Unknown'}</p>
                        {hotspot.district && (
                          <p className="text-xs text-slate-400">{hotspot.district}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{hotspot.collectionCount}</p>
                      <p className="text-xs text-slate-400">collections</p>
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


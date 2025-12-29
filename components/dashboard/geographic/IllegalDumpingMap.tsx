'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import { apiGetIllegalDumpingZones } from '@/lib/api'

// Dynamically import map components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface IllegalDumpingMapProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function IllegalDumpingMap({
  startDate,
  endDate,
  className,
}: IllegalDumpingMapProps) {
  const [dumpingZones, setDumpingZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMapReady(true)
    }
  }, [])

  useEffect(() => {
    fetchDumpingZones()
  }, [startDate, endDate])

  const fetchDumpingZones = async () => {
    setLoading(true)
    try {
      const response = await apiGetIllegalDumpingZones({ startDate, endDate })
      setDumpingZones(response.data || [])
    } catch (error) {
      console.error('Failed to fetch illegal dumping zones:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalReports = dumpingZones.reduce((sum, zone) => sum + (zone.reportCount || 0), 0)
  const confirmedZones = dumpingZones.filter(z => z.status === 'confirmed').length
  const pendingZones = dumpingZones.filter(z => z.status === 'pending').length

  const centerLat = dumpingZones.length > 0
    ? dumpingZones.reduce((sum, z) => sum + (z.latitude || 0), 0) / dumpingZones.length
    : -1.9441
  const centerLng = dumpingZones.length > 0
    ? dumpingZones.reduce((sum, z) => sum + (z.longitude || 0), 0) / dumpingZones.length
    : 30.0619

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Illegal Dumping Zones
            </CardTitle>
            <CardDescription className="text-slate-400">
              Detected and reported illegal dumping locations
            </CardDescription>
          </div>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
            {dumpingZones.length} Zones
          </Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Total Reports</p>
            <p className="text-2xl font-bold text-white">{totalReports}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Confirmed</p>
            <p className="text-2xl font-bold text-red-400">{confirmedZones}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">{pendingZones}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : dumpingZones.length === 0 ? (
          <div className="h-[500px] flex items-center justify-center border border-slate-700 rounded-lg">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No illegal dumping zones detected</p>
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
                  {dumpingZones.map((zone, index) => (
                    <Marker
                      key={index}
                      position={[zone.latitude, zone.longitude]}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-sm mb-1">{zone.location || 'Unknown'}</h3>
                          <Badge className={`mb-2 ${
                            zone.status === 'confirmed' 
                              ? 'bg-red-500/20 text-red-400 border-red-500/50'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                          }`}>
                            {zone.status}
                          </Badge>
                          <p className="text-xs text-gray-600 mb-1">
                            Reports: {zone.reportCount || 0}
                          </p>
                          {zone.firstReported && (
                            <p className="text-xs text-gray-600 mb-1">
                              First Reported: {new Date(zone.firstReported).toLocaleDateString()}
                            </p>
                          )}
                          {zone.lastReported && (
                            <p className="text-xs text-gray-600 mb-1">
                              Last Reported: {new Date(zone.lastReported).toLocaleDateString()}
                            </p>
                          )}
                          {zone.severity && (
                            <p className="text-xs text-gray-600">
                              Severity: <span className="font-medium capitalize">{zone.severity}</span>
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            {/* Dumping Zones List */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Dumping Zones</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {dumpingZones.map((zone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-5 w-5 ${
                        zone.status === 'confirmed' ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                      <div>
                        <p className="font-medium text-white text-sm">{zone.location || 'Unknown'}</p>
                        {zone.district && (
                          <p className="text-xs text-slate-400">{zone.district}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-white">{zone.reportCount || 0}</p>
                        <p className="text-xs text-slate-400">reports</p>
                      </div>
                      <Badge className={
                        zone.status === 'confirmed'
                          ? 'bg-red-500/20 text-red-400 border-red-500/50'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                      }>
                        {zone.status}
                      </Badge>
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


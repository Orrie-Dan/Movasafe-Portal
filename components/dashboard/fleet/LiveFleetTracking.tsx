'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, MapPin, Truck, Navigation, Fuel, Clock } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { FleetStatus } from '@/lib/types/dashboard'
import { apiGetFleetStatus } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface LiveFleetTrackingProps {
  autoRefresh?: boolean
  refreshInterval?: number // seconds
  onVehicleClick?: (vehicle: FleetStatus) => void
  className?: string
}

export function LiveFleetTracking({
  autoRefresh = true,
  refreshInterval = 30,
  onVehicleClick,
  className,
}: LiveFleetTrackingProps) {
  const [fleetStatus, setFleetStatus] = useState<FleetStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMapReady(true)
    }
  }, [])

  const fetchFleetStatus = async () => {
    try {
      const response = await apiGetFleetStatus()
      setFleetStatus(response.data || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch fleet status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFleetStatus()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchFleetStatus()
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const getStatusColor = (status: FleetStatus['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'idle':
        return 'bg-yellow-500'
      case 'maintenance':
        return 'bg-red-500'
      case 'offline':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: FleetStatus['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'idle':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'maintenance':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'offline':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const activeVehicles = fleetStatus.filter(v => v.status === 'active')
  const centerLat = fleetStatus.length > 0
    ? fleetStatus.reduce((sum, v) => sum + v.location.latitude, 0) / fleetStatus.length
    : -1.9441 // Default to Kigali
  const centerLng = fleetStatus.length > 0
    ? fleetStatus.reduce((sum, v) => sum + v.location.longitude, 0) / fleetStatus.length
    : 30.0619

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-white">
            <Truck className="h-5 w-5 text-blue-400" />
            Live Fleet Tracking
          </CardTitle>
          <CardDescription className="text-slate-400">
            Real-time GPS tracking of collection vehicles
          </CardDescription>
          {lastUpdate && (
            <p className="text-xs text-slate-500 mt-1">
              Last updated: {formatDistanceToNow(lastUpdate, { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <div className="relative flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
              <div className="relative h-3 w-3 bg-green-500 rounded-full" />
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
              {activeVehicles.length} Active
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchFleetStatus}
            className="text-slate-400 hover:text-white transition-all duration-300 hover:scale-110"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-slate-900/50 h-[400px]">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <Skeleton className="h-full w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden rounded-lg bg-slate-900/50 h-20">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <Skeleton className="h-full w-full" />
              </div>
              <div className="relative overflow-hidden rounded-lg bg-slate-900/50 h-20">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>
        ) : fleetStatus.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center border border-slate-700 rounded-lg">
            <div className="text-center">
              <Truck className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No vehicles tracked</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {mapReady && (
              <div className="h-[400px] rounded-lg overflow-hidden border border-slate-700">
                <MapContainer
                  center={[centerLat, centerLng]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {fleetStatus.map((vehicle) => (
                    <Marker
                      key={vehicle.vehicleId}
                      position={[vehicle.location.latitude, vehicle.location.longitude]}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold text-sm mb-1">{vehicle.vehicleNumber}</h3>
                          {vehicle.driverName && (
                            <p className="text-xs text-gray-600 mb-1">Driver: {vehicle.driverName}</p>
                          )}
                          <Badge className={`text-xs ${getStatusBadge(vehicle.status)}`}>
                            {vehicle.status}
                          </Badge>
                          {vehicle.speed && (
                            <p className="text-xs mt-1">Speed: {vehicle.speed} km/h</p>
                          )}
                          {vehicle.fuelLevel !== undefined && (
                            <p className="text-xs mt-1">Fuel: {vehicle.fuelLevel}%</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            {/* Vehicle List */}
            <div className="grid gap-3 max-h-[300px] overflow-y-auto">
              {fleetStatus.map((vehicle) => (
                <div
                  key={vehicle.vehicleId}
                  className="group flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800/70 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
                  onClick={() => onVehicleClick?.(vehicle)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      {vehicle.status === 'active' && (
                        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50" />
                      )}
                      <div className={`relative w-3 h-3 rounded-full ${getStatusColor(vehicle.status)} shadow-[0_0_8px_rgba(34,197,94,0.5)]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">{vehicle.vehicleNumber}</span>
                        <Badge className={`text-xs ${getStatusBadge(vehicle.status)}`}>
                          {vehicle.status}
                        </Badge>
                      </div>
                      {vehicle.driverName && (
                        <p className="text-xs text-slate-400">Driver: {vehicle.driverName}</p>
                      )}
                      {vehicle.currentRoute && (
                        <p className="text-xs text-slate-400">Route: {vehicle.currentRoute}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    {vehicle.speed !== undefined && (
                      <div className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        {vehicle.speed} km/h
                      </div>
                    )}
                    {vehicle.fuelLevel !== undefined && (
                      <div className="flex items-center gap-1">
                        <Fuel className="h-3 w-3" />
                        {vehicle.fuelLevel}%
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(vehicle.location.lastUpdate), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


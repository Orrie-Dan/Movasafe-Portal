'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { apiGetBinStatus } from '@/lib/api'

// Dynamically import map components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface BinStatusMapProps {
  className?: string
}

export function BinStatusMap({ className }: BinStatusMapProps) {
  const [binData, setBinData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'overflowing' | 'full' | 'normal' | 'empty'>('all')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMapReady(true)
    }
  }, [])

  useEffect(() => {
    fetchBinStatus()
  }, [])

  const fetchBinStatus = async () => {
    setLoading(true)
    try {
      const response = await apiGetBinStatus()
      setBinData(response.data || [])
    } catch (error) {
      console.error('Failed to fetch bin status:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBins = statusFilter === 'all'
    ? binData
    : binData.filter(bin => bin.status === statusFilter)

  const overflowingBins = binData.filter(b => b.status === 'overflowing').length
  const fullBins = binData.filter(b => b.status === 'full').length
  const normalBins = binData.filter(b => b.status === 'normal').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overflowing':
        return '#ef4444' // red
      case 'full':
        return '#f59e0b' // orange
      case 'normal':
        return '#10b981' // green
      case 'empty':
        return '#6b7280' // gray
      default:
        return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overflowing':
        return AlertTriangle
      case 'full':
        return AlertTriangle
      case 'normal':
        return CheckCircle2
      default:
        return Trash2
    }
  }

  const centerLat = binData.length > 0
    ? binData.reduce((sum, b) => sum + (b.latitude || 0), 0) / binData.length
    : -1.9441
  const centerLng = binData.length > 0
    ? binData.reduce((sum, b) => sum + (b.longitude || 0), 0) / binData.length
    : 30.0619

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-blue-400" />
              Bin Status Map
            </CardTitle>
            <CardDescription className="text-slate-400">
              Real-time bin fill levels and status
            </CardDescription>
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="overflowing">Overflowing</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="empty">Empty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400">Overflowing</p>
            <p className="text-2xl font-bold text-red-400">{overflowingBins}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Full</p>
            <p className="text-2xl font-bold text-orange-400">{fullBins}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Normal</p>
            <p className="text-2xl font-bold text-green-400">{normalBins}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Bins</p>
            <p className="text-2xl font-bold text-white">{binData.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : filteredBins.length === 0 ? (
          <div className="h-[500px] flex items-center justify-center border border-slate-700 rounded-lg">
            <div className="text-center">
              <Trash2 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No bin data available</p>
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
                  {filteredBins.map((bin, index) => {
                    const StatusIcon = getStatusIcon(bin.status)
                    return (
                      <CircleMarker
                        key={index}
                        center={[bin.latitude, bin.longitude]}
                        radius={bin.status === 'overflowing' ? 12 : bin.status === 'full' ? 10 : 8}
                        pathOptions={{
                          fillColor: getStatusColor(bin.status),
                          fillOpacity: 0.7,
                          color: getStatusColor(bin.status),
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <div className="p-2">
                            <div className="flex items-center gap-2 mb-2">
                              <StatusIcon className={`h-4 w-4 ${getStatusColor(bin.status)}`} />
                              <h3 className="font-semibold text-sm">{bin.binId || 'Unknown'}</h3>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">
                              Status: <span className="font-medium capitalize">{bin.status}</span>
                            </p>
                            <p className="text-xs text-gray-600 mb-1">
                              Fill Level: {bin.fillLevel || 0}%
                            </p>
                            {bin.location && (
                              <p className="text-xs text-gray-600 mb-1">
                                Location: {bin.location}
                              </p>
                            )}
                            {bin.lastCollection && (
                              <p className="text-xs text-gray-600">
                                Last Collection: {new Date(bin.lastCollection).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </Popup>
                      </CircleMarker>
                    )
                  })}
                </MapContainer>
              </div>
            )}

            {/* Status Summary */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { status: 'overflowing', label: 'Overflowing', count: overflowingBins, color: 'text-red-400' },
                { status: 'full', label: 'Full', count: fullBins, color: 'text-orange-400' },
                { status: 'normal', label: 'Normal', count: normalBins, color: 'text-green-400' },
                { status: 'empty', label: 'Empty', count: binData.filter(b => b.status === 'empty').length, color: 'text-gray-400' },
              ].map((item) => (
                <div
                  key={item.status}
                  className="p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                >
                  <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


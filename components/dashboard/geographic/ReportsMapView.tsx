'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Eye } from 'lucide-react'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'
import type { AdminReport } from '@/lib/api'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// Create custom icons based on severity - lazy load Leaflet only on client
let leafletLoaded = false
let L: any = null

async function loadLeaflet() {
  if (typeof window === 'undefined' || leafletLoaded) return L
  
  L = await import('leaflet')
  // @ts-ignore - CSS import doesn't have type declarations
  await import('leaflet/dist/leaflet.css')
  
  // Fix for default Leaflet icons when bundling
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  })
  
  leafletLoaded = true
  return L
}

function createSeverityIcon(severity: string) {
  if (typeof window === 'undefined') {
    return null as any
  }
  
  if (!L && typeof window !== 'undefined') {
    return null as any
  }
  
  if (!L) return null as any
  
  const color = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f97316' : '#2563eb'
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export interface ReportsMapViewProps {
  reports: AdminReport[]
  mapCenter: [number, number]
  mapZoom: number
  onReportClick?: (report: AdminReport) => void
  getSeverityBadgeClassName?: (severity: string) => string
  getStatusBadgeClassName?: (status: string) => string
  className?: string
}

export function ReportsMapView({
  reports,
  mapCenter,
  mapZoom,
  onReportClick,
  getSeverityBadgeClassName = () => '',
  getStatusBadgeClassName = () => '',
  className,
}: ReportsMapViewProps) {
  const [mapReady, setMapReady] = useState(false)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && showMap) {
      loadLeaflet().then(() => {
        setMapReady(true)
      })
    }
  }, [showMap])

  const reportsWithLocation = reports.filter(r => r.latitude && r.longitude)

  if (reportsWithLocation.length === 0) {
    return null
  }

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle size="md">Reports Map View</CardTitle>
            <CardDescription className="text-slate-400">
              Visualize all reports on an interactive map
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMap(!showMap)}
            className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 transition-all"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </Button>
        </div>
      </CardHeader>
      {showMap && (
        <CardContent>
          <div className="h-[600px] w-full rounded-lg overflow-hidden border border-slate-800">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapReady && reportsWithLocation.map((report) => {
                const icon = createSeverityIcon(report.severity)
                if (!icon) return null
                return (
                  <Marker
                    key={report.id}
                    position={[report.latitude!, report.longitude!]}
                    icon={icon}
                  >
                    <Popup
                      autoPan={true}
                      autoPanPadding={[50, 50]}
                      autoPanPaddingTopLeft={[0, 150]}
                      autoPanPaddingBottomRight={[50, 50]}
                      maxWidth={300}
                      closeButton={true}
                      className="leaflet-popup-custom"
                    >
                      <div className="p-3 min-w-[200px] max-w-[280px]">
                        <h4 className="font-semibold mb-2 text-sm text-slate-900">{report.title}</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${getSeverityBadgeClassName(report.severity)} border text-xs px-2 py-1 min-w-[80px] text-center inline-block`}>
                              {report.severity}
                            </Badge>
                            <Badge className={`${getStatusBadgeClassName(report.status)} border text-xs px-2 py-1 min-w-[80px] text-center inline-block`}>
                              {report.status}
                            </Badge>
                          </div>
                          <p className="text-slate-600 line-clamp-2">{report.description}</p>
                          {report.district && (
                            <p className="text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {report.district}
                            </p>
                          )}
                          <p className="text-slate-500 text-xs">
                            {format(new Date(report.createdAt), 'MMM d, yyyy')}
                          </p>
                          {onReportClick && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => onReportClick(report)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              }).filter(Boolean)}
            </MapContainer>
          </div>
          <div className="mt-4 flex items-center gap-4 flex-wrap text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>High Severity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Medium Severity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Low Severity</span>
            </div>
            <span className="ml-auto">
              {reportsWithLocation.length} reports with location data
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  )
}


'use client'

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RefreshCw, Clock, MapPin, Truck } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

export interface Collection {
  id: string
  collectionNumber?: string
  location?: {
    address?: string
    sector?: string
  }
  status?: string
}

export interface RealTimeStatusProps {
  collections: Collection[]
  loading?: boolean
  autoRefresh?: boolean
  onRefresh?: () => void
  onAutoRefreshToggle?: () => void
  onCollectionClick?: (collection: Collection) => void
  maxVisible?: number
  title?: string
  description?: string
  className?: string
  lastUpdated?: Date
}

export function RealTimeStatus({
  collections,
  loading = false,
  autoRefresh = true,
  onRefresh,
  onAutoRefreshToggle,
  onCollectionClick,
  maxVisible = 5,
  title = 'Live Collection Status',
  description = 'Real-time collection updates',
  className,
  lastUpdated = new Date(),
}: RealTimeStatusProps) {
  const router = useRouter()
  const visibleCollections = collections.slice(0, maxVisible)

  return (
    <Card className={`bg-black border-slate-800 lg:col-span-2 ${className}`}>
      <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="relative z-10">
          <CardTitle size="md" className="flex items-center gap-2 text-white">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            {title}
          </CardTitle>
          <CardDescription className="text-slate-400">{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          {onAutoRefreshToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAutoRefreshToggle}
              className="text-slate-400 hover:text-white"
            >
              {autoRefresh ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Auto-refresh ON
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  Auto-refresh OFF
                </>
              )}
            </Button>
          )}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            title="No Active Collections"
            description="There are currently no collections in progress"
            icon={Truck}
          />
        ) : (
          <>
            <div className="space-y-3">
              {visibleCollections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-900/50 hover:border-slate-600 transition-all cursor-pointer"
                  onClick={() => {
                    if (onCollectionClick) {
                      onCollectionClick(collection)
                    } else {
                      router.push(`/admin/waste-collections?id=${collection.id}`)
                    }
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {collection.collectionNumber || `Collection ${collection.id.slice(0, 8)}`}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3" />
                        {collection.location?.address || collection.location?.sector || 'Location not specified'}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                    In Progress
                  </Badge>
                </div>
              ))}
            </div>
            {collections.length > maxVisible && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/admin/waste-collections')}
                  className="text-slate-400 hover:text-white"
                >
                  View all {collections.length} active collections
                </Button>
              </div>
            )}
          </>
        )}
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
          Last updated: {format(lastUpdated, 'HH:mm:ss')}
        </div>
      </CardContent>
    </Card>
  )
}


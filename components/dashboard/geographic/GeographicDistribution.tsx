'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

export interface GeographicData {
  location: string
  count: number
  [key: string]: string | number
}

export interface GeographicDistributionProps {
  data: GeographicData[]
  level: 'province' | 'district' | 'sector'
  view?: 'cards' | 'map'
  title?: string
  description?: string
  className?: string
}

export function GeographicDistribution({
  data,
  level,
  view = 'cards',
  title,
  description,
  className,
}: GeographicDistributionProps) {
  if (!data || data.length === 0) {
    return null
  }

  const content = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {data.map((item, index) => (
        <div
          key={index}
          className="p-4 rounded-lg border border-slate-700 bg-slate-900/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-blue-400" />
            <div className="text-sm font-medium text-white">{item.location}</div>
          </div>
          <div className="text-2xl font-bold text-white">{item.count}</div>
          <div className="text-xs text-slate-400 mt-1">Collections</div>
        </div>
      ))}
    </div>
  )

  if (title) {
    return (
      <Card className={`bg-black border-slate-800 ${className}`}>
        <CardHeader>
          {title && <CardTitle size="md">{title}</CardTitle>}
          {description && <CardDescription className="text-slate-400">{description}</CardDescription>}
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    )
  }

  return <div className={className}>{content}</div>
}


'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Recycle, TrendingUp, DollarSign } from 'lucide-react'
import { ProvinceDistributionChart } from '@/components/dashboard/charts/ProvinceDistributionChart'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { apiGetRecyclingRevenue } from '@/lib/api'

interface RecyclingRevenueProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function RecyclingRevenue({
  startDate,
  endDate,
  className,
}: RecyclingRevenueProps) {
  const [revenueData, setRevenueData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRevenue()
  }, [startDate, endDate])

  const fetchRevenue = async () => {
    setLoading(true)
    try {
      const response = await apiGetRecyclingRevenue({ startDate, endDate })
      setRevenueData(response)
    } catch (error) {
      console.error('Failed to fetch recycling revenue:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = revenueData?.totalRevenue || 0
  const byMaterial = revenueData?.byMaterial || []
  const byFacility = revenueData?.byFacility || []

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M RWF`
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K RWF`
    return `${amount.toFixed(0)} RWF`
  }

  return (
    <Card className={`bg-black border-slate-800 ${className}`}>
      <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="flex items-center justify-between relative z-10 flex-1">
          <div>
            <CardTitle size="md" className="text-white flex items-center gap-2">
              <Recycle className="h-5 w-5 text-green-400" />
              Recycling Revenue
            </CardTitle>
            <CardDescription className="text-slate-400">
              Revenue generated from recyclable materials
            </CardDescription>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
            <DollarSign className="h-3 w-3 mr-1" />
            {formatCurrency(totalRevenue)}
          </Badge>
        </div>
      </div>
      <CardContent className="pt-6">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400">Total Revenue</p>
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Materials</p>
            <p className="text-2xl font-bold text-white">{byMaterial.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Facilities</p>
            <p className="text-2xl font-bold text-white">{byFacility.length}</p>
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : totalRevenue === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-slate-400">No revenue data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Revenue by Material */}
            {byMaterial.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Revenue by Material Type</h3>
                <EnhancedBarChart
                  data={byMaterial}
                  dataKey="revenue"
                  xAxisKey="material"
                  height={300}
                  xAxisAngle={-45}
                  gradientColors={{ start: '#10b981', end: '#059669', startOpacity: 0.9, endOpacity: 1 }}
                  name="Revenue (RWF)"
                />
              </div>
            )}

            {/* Revenue Distribution Pie Chart */}
            {byMaterial.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Revenue Distribution</h3>
                <ProvinceDistributionChart
                  data={byMaterial.map((item: any) => ({ name: item.material, count: item.revenue }))}
                  height={300}
                  colors={COLORS}
                  centerLabel={{ total: 'Total Revenue', selected: undefined }}
                  ariaLabel="Revenue distribution chart"
                />
              </div>
            )}

            {/* Revenue by Facility */}
            {byFacility.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-4">Revenue by Facility</h3>
                <div className="space-y-2">
                  {byFacility.map((facility: any) => (
                    <div
                      key={facility.facilityId}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                    >
                      <div>
                        <p className="font-medium text-white">{facility.facilityName}</p>
                        <p className="text-xs text-slate-400">{facility.materialCount} materials</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">{formatCurrency(facility.revenue)}</p>
                        <p className="text-xs text-slate-400">
                          {((facility.revenue / totalRevenue) * 100).toFixed(1)}%
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


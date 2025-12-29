'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { MapPin, X, CheckCircle2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { ProvinceDistributionChart } from '@/components/dashboard/charts/ProvinceDistributionChart'
import type { GeographicData } from '@/lib/api'

const RWANDA_PROVINCES = [
  'Kigali City',
  'Eastern Province',
  'Northern Province',
  'Southern Province',
  'Western Province'
] as const
const TOTAL_RWANDA_PROVINCES = 5

export interface GeographicDistributionChartsProps {
  geographicData: GeographicData | null
  loading?: boolean
  selectedProvince?: string | null
  selectedDistrict?: string | null
  onProvinceSelect?: (province: string | null) => void
  onDistrictSelect?: (district: string | null) => void
  onClearFilters?: () => void
  filteredGeographicData?: {
    provinces: Array<{ name: string; count: number }>
    districts: Array<{ name: string; count: number; province?: string; district?: string }>
    sectors: Array<{ name: string; count: number; province?: string; district?: string }>
  } | null
  isMobile?: boolean
  className?: string
}

export function GeographicDistributionCharts({
  geographicData,
  loading = false,
  selectedProvince,
  selectedDistrict,
  onProvinceSelect,
  onDistrictSelect,
  onClearFilters,
  filteredGeographicData,
  isMobile = false,
  className,
}: GeographicDistributionChartsProps) {
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
              <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-900/50 bg-black">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <Skeleton className="h-6 w-32 mb-2 relative z-10" />
                <Skeleton className="h-4 w-48 relative z-10" />
              </div>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!geographicData) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-slate-400" />
          <h2 className="text-xl font-semibold text-white">Geographic Distribution</h2>
        </div>
        <div className="text-center py-12 text-slate-400">
          <p>No geographic data available</p>
        </div>
      </div>
    )
  }

  const handleProvinceClick = (province: string) => {
    onProvinceSelect?.(province)
    onDistrictSelect?.(null)
  }

  const handleDistrictClick = (district: string) => {
    onDistrictSelect?.(district)
  }

  // Calculate distribution analysis
  const totalCollections = geographicData.provinces.reduce((sum, p) => sum + p.count, 0)
  const provinceCountMap = new Map<string, number>()
  RWANDA_PROVINCES.forEach(province => {
    provinceCountMap.set(province, 0)
  })
  geographicData.provinces.forEach(p => {
    provinceCountMap.set(p.name, p.count)
  })
  
  const avgCollectionsPerProvince = totalCollections > 0 ? (totalCollections / TOTAL_RWANDA_PROVINCES).toFixed(1) : '0'
  const provinceCounts = Array.from(provinceCountMap.values())
  const mean = provinceCounts.reduce((a, b) => a + b, 0) / TOTAL_RWANDA_PROVINCES
  const variance = provinceCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / TOTAL_RWANDA_PROVINCES
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = mean > 0 ? ((stdDev / mean) * 100).toFixed(1) : '0'
  
  const sortedProvinces = Array.from(provinceCountMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  const mostConcentrated = sortedProvinces[0]
  const concentrationRatio = totalCollections > 0 
    ? ((mostConcentrated.count / totalCollections) * 100).toFixed(1) 
    : '0'
  const mostDispersed = sortedProvinces[sortedProvinces.length - 1]
  const significantShare = sortedProvinces.filter(p => totalCollections > 0 && (p.count / totalCollections) >= 0.1).length
  
  const isEvenlyDistributed = parseFloat(coefficientOfVariation) < 50
  const isModeratelyConcentrated = parseFloat(coefficientOfVariation) >= 50 && parseFloat(coefficientOfVariation) < 100
  const isHighlyConcentrated = parseFloat(coefficientOfVariation) >= 100

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-5 w-5 text-slate-400" />
        <h2 className="text-xl font-semibold text-white">Geographic Distribution</h2>
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Province Distribution */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all">
          <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle className="text-white">Province Distribution</CardTitle>
                <CardDescription className="text-slate-400">
                  {selectedProvince ? `Filtered: ${selectedProvince}` : 'Collections by province - Click to filter districts'}
                </CardDescription>
              </div>
              {selectedProvince && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onProvinceSelect?.(null)
                    onClearFilters?.()
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          <CardContent>
            <ProvinceDistributionChart
              data={geographicData?.provinces || []}
              selectedItem={selectedProvince}
              onItemClick={handleProvinceClick}
              isMobile={isMobile}
              height={300}
              centerLabel={{ total: 'Total Collections', selected: undefined }}
              emptyState={{
                title: "No Geographic Data Available",
                description: "Geographic distribution data will appear here once collections with location information are scheduled or completed.",
                icon: MapPin
              }}
              ariaLabel="Geographic province distribution chart"
            />
          </CardContent>
        </Card>

        {/* District Distribution */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all">
          <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle className="text-white">
                  {selectedProvince ? `Districts in ${selectedProvince}` : 'Top Districts'}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {selectedDistrict ? `Filtered: ${selectedDistrict}` : selectedProvince ? 'Click a district to filter sectors' : 'Top 10 districts by collection count'}
                </CardDescription>
              </div>
              {selectedDistrict && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onDistrictSelect?.(null)
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          <CardContent>
            <EnhancedBarChart
              data={(filteredGeographicData?.districts || [])
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map((d) => ({ name: d.name, count: d.count, district: d.name }))}
              dataKey="count"
              xAxisKey="name"
              height={300}
              gradientColors={{ start: '#6366f1', end: '#4f46e5', startOpacity: 0.9, endOpacity: 1 }}
              xAxisAngle={-45}
              xAxisHeight={100}
              onBarClick={(data: any) => {
                if (data && data.district) {
                  handleDistrictClick(data.district)
                }
              }}
              name="Collections"
            />
          </CardContent>
        </Card>

        {/* Sector Distribution */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all">
          <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle className="text-white">
                  {selectedDistrict ? `Sectors in ${selectedDistrict}` : selectedProvince ? `Sectors in ${selectedProvince}` : 'Top Sectors'}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {selectedDistrict || selectedProvince 
                    ? `${(filteredGeographicData?.sectors || []).length} sectors shown` 
                    : 'Top 10 sectors by collection count'}
                </CardDescription>
              </div>
              {(selectedDistrict || selectedProvince) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onProvinceSelect?.(null)
                    onDistrictSelect?.(null)
                    onClearFilters?.()
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
          <CardContent>
            <EnhancedBarChart
              data={(filteredGeographicData?.sectors || [])
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map((d) => ({ name: d.name, count: d.count }))}
              dataKey="count"
              xAxisKey="name"
              height={300}
              gradientColors={{ start: '#8b5cf6', end: '#7c3aed', startOpacity: 0.9, endOpacity: 1 }}
              xAxisAngle={-45}
              xAxisHeight={100}
              name="Collections"
            />
          </CardContent>
        </Card>

        {/* Collections Concentration Index */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all flex flex-col">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-900/50 bg-black flex-shrink-0">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="text-white relative z-10">Distribution Analysis</CardTitle>
            <CardDescription className="text-slate-400 relative z-10">How collections are spread across provinces</CardDescription>
          </div>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px] pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 #1e293b' }}>
            <div className="space-y-5 pb-2">
              {/* Summary Status */}
              <div className={`rounded-lg p-4 border-2 ${
                isEvenlyDistributed 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : isModeratelyConcentrated
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-orange-500/10 border-orange-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {isEvenlyDistributed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : isModeratelyConcentrated ? (
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-400" />
                  )}
                  <span className={`text-sm font-semibold ${
                    isEvenlyDistributed 
                      ? 'text-green-400' 
                      : isModeratelyConcentrated
                      ? 'text-yellow-400'
                      : 'text-orange-400'
                  }`}>
                    {isEvenlyDistributed 
                      ? 'Evenly Distributed' 
                      : isModeratelyConcentrated
                      ? 'Moderately Concentrated'
                      : 'Highly Concentrated'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isEvenlyDistributed 
                    ? 'Collections are well-balanced across all provinces, indicating good geographic coverage.'
                    : isModeratelyConcentrated
                    ? 'Collections show some concentration in certain provinces. Consider monitoring distribution.'
                    : 'Collections are heavily concentrated in specific provinces. May need resource reallocation.'}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Average Collections</div>
                  <div className="text-2xl font-bold text-white">{avgCollectionsPerProvince}</div>
                  <div className="text-xs text-slate-500 mt-1">per province</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Active Provinces</div>
                  <div className="text-2xl font-bold text-white">{significantShare}</div>
                  <div className="text-xs text-slate-500 mt-1">of {TOTAL_RWANDA_PROVINCES} total</div>
                </div>
              </div>

              {/* Top & Bottom Regions */}
              <div className="space-y-3 pt-2 border-t border-slate-700">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-400" />
                      Highest Activity
                    </span>
                    <span className="text-xs text-orange-400 font-semibold">{concentrationRatio}% of all collections</span>
                  </div>
                  <div className="flex items-center justify-between bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
                    <div>
                      <div className="text-sm text-white font-semibold">{mostConcentrated?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Most collections in this province</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-400">{mostConcentrated?.count || 0}</div>
                      <div className="text-xs text-slate-400">collections</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-blue-400" />
                      Lowest Activity
                    </span>
                    <span className="text-xs text-blue-400 font-semibold">
                      {totalCollections > 0 
                        ? `${((mostDispersed.count / totalCollections) * 100).toFixed(1)}% of all collections`
                        : mostDispersed.count === 0 
                        ? 'No collections'
                        : 'Minimal collections'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                    <div>
                      <div className="text-sm text-white font-semibold">{mostDispersed?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {mostDispersed.count === 0 
                          ? 'No collections in this province' 
                          : 'Fewest collections in this province'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-400">{mostDispersed?.count || 0}</div>
                      <div className="text-xs text-slate-400">collections</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Distribution Balance Indicator */}
              <div className="pt-2 border-t border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Distribution Balance</span>
                  <span className={`text-xs font-semibold ${
                    isEvenlyDistributed 
                      ? 'text-green-400' 
                      : isModeratelyConcentrated
                      ? 'text-yellow-400'
                      : 'text-orange-400'
                  }`}>
                    {coefficientOfVariation}% variance
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      isEvenlyDistributed 
                        ? 'bg-gradient-to-r from-green-500 to-green-400' 
                        : isModeratelyConcentrated
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                        : 'bg-gradient-to-r from-orange-500 to-orange-400'
                    }`}
                    style={{ width: `${Math.min(parseFloat(coefficientOfVariation), 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Even</span>
                  <span className="text-slate-400">Concentrated</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


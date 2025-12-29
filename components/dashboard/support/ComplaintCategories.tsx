'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, TrendingUp } from 'lucide-react'
import { EnhancedBarChart } from '@/components/dashboard/charts/enhanced-bar-chart'
import { ProvinceDistributionChart } from '@/components/dashboard/charts/ProvinceDistributionChart'
import { apiGetComplaintCategories } from '@/lib/api'

interface ComplaintCategoriesProps {
  startDate?: string
  endDate?: string
  className?: string
}

export function ComplaintCategories({
  startDate,
  endDate,
  className,
}: ComplaintCategoriesProps) {
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [startDate, endDate])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await apiGetComplaintCategories({ startDate, endDate })
      setCategoryData(response.data || [])
    } catch (error) {
      console.error('Failed to fetch complaint categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalComplaints = categoryData.reduce((sum, cat) => sum + (cat.count || 0), 0)
  const topCategory = categoryData.length > 0
    ? categoryData.reduce((max, cat) => (cat.count || 0) > (max.count || 0) ? cat : max)
    : null

  const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981']

  return (
    <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 ${className}`}>
      <div className="flex flex-row items-center justify-between p-6 pb-3 border-b border-slate-900/50 bg-black relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="relative z-10 flex-1">
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertCircle className="h-5 w-5 text-red-400" />
            Complaint Categories
          </CardTitle>
          <CardDescription className="text-slate-400">
            Top complaint categories and trends
          </CardDescription>
          <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">Total Complaints</p>
            <p className="text-2xl font-bold text-white">{totalComplaints}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Categories</p>
            <p className="text-2xl font-bold text-white">{categoryData.length}</p>
          </div>
        </div>
        </div>
        {topCategory && (
          <div className="relative z-10">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
              Top: {topCategory.category}
            </Badge>
          </div>
        )}
      </div>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : categoryData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-slate-400">No complaint data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Category Distribution Pie Chart */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Complaint Distribution</h3>
              <ProvinceDistributionChart
                data={categoryData.map(item => ({ name: item.category, count: item.count || 0 }))}
                height={300}
                colors={COLORS}
                centerLabel={{ total: 'Total Complaints', selected: undefined }}
                ariaLabel="Complaint categories distribution chart"
              />
            </div>

            {/* Category Bar Chart */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Complaints by Category</h3>
              <EnhancedBarChart
                data={categoryData}
                dataKey="count"
                xAxisKey="category"
                height={250}
                gradientColors={{ start: '#ef4444', end: '#dc2626', startOpacity: 1, endOpacity: 0.8 }}
                xAxisAngle={-45}
                xAxisHeight={80}
                yAxisLabel={{ value: 'Complaints', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
                name="Complaints"
              />
            </div>

            {/* Top Categories List */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-4">Top Complaint Categories</h3>
              <div className="space-y-2">
                {categoryData
                  .sort((a, b) => (b.count || 0) - (a.count || 0))
                  .slice(0, 5)
                  .map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                          #{index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-white text-sm capitalize">{category.category}</p>
                          {category.description && (
                            <p className="text-xs text-slate-400">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{category.count}</p>
                        <p className="text-xs text-slate-400">
                          {((category.count / totalComplaints) * 100).toFixed(1)}%
                        </p>
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


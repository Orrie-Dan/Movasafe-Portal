'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PieChart, PieChart as PieChartIcon, FileText } from 'lucide-react'
import { EnhancedBarChart } from './enhanced-bar-chart'
import { ProvinceDistributionChart } from './ProvinceDistributionChart'

export interface StatusData {
  name: string
  value: number
  color: string
}

export interface TypeData {
  name: string
  value: number
}

export interface DistributionChartsProps {
  statusData: StatusData[]
  typeData: TypeData[]
  loading?: boolean
  isMobile?: boolean
  className?: string
}

export function DistributionCharts({
  statusData,
  typeData,
  loading = false,
  isMobile = false,
  className,
}: DistributionChartsProps) {

  if (loading) {
    return null
  }

  if (statusData.length === 0 && typeData.length === 0) {
    return (
      <EmptyState
        title="No Reports Available"
        description="There are no reports to display. Reports will appear here once they are created."
        icon={FileText}
      />
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <PieChart className="h-5 w-5 text-slate-400" />
        <h2 className="text-xl font-semibold text-white">Distribution Analytics</h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reports by Status (Pie Chart) */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-900/50 bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="text-white relative z-10">Reports by Status</CardTitle>
            <CardDescription className="text-slate-400 relative z-10">Distribution of report statuses</CardDescription>
          </div>
          <CardContent>
            <ProvinceDistributionChart
              data={statusData.map(item => ({ name: item.name, count: item.value }))}
              isMobile={isMobile}
              height={300}
              colors={statusData.map(item => item.color)}
              centerLabel={{ total: 'Total Reports', selected: undefined }}
              emptyState={{
                title: "No status data available",
                description: "Reports will appear here once data is available",
                icon: PieChartIcon
              }}
              ariaLabel="Reports by status distribution chart"
            />
          </CardContent>
        </Card>

        {/* Reports by Type */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-slate-600 transition-all shadow-xl">
          <div className="flex flex-col space-y-1.5 p-6 pb-3 relative border-b border-slate-900/50 bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="font-bold text-white relative z-10">Reports by Type</CardTitle>
            <CardDescription className="text-slate-400 relative z-10">Waste type categories</CardDescription>
          </div>
          <CardContent>
            <EnhancedBarChart
              data={typeData}
              dataKey="value"
              xAxisKey="name"
              height={320}
              gradientColors={{ start: '#10b981', end: '#059669', startOpacity: 0.9, endOpacity: 1 }}
              orientation="horizontal"
              barRadius={[0, 8, 8, 0]}
              animationDuration={800}
              name="Reports"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


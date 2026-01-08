'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { Users } from 'lucide-react'
import type { UserAnalyticsDataPoint, CoreTrendsDataPoint } from '@/lib/utils/analytics'

interface UserAnalyticsSectionProps {
  userData: UserAnalyticsDataPoint[]
  coreTrendsData: CoreTrendsDataPoint[]
}

export function UserAnalyticsSection({ userData, coreTrendsData }: UserAnalyticsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" />
          User Analytics
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          User growth, engagement, and verification patterns
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* New vs Returning Users */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">New vs Returning Users</CardTitle>
            <CardDescription className="z-10 relative">Daily breakdown of new and returning users</CardDescription>
          </div>
          <CardContent>
            <EnhancedLineChart
              data={userData}
              dataKeys={[
                { key: 'newUsers', name: 'New Users', color: '#3b82f6' },
                { key: 'returningUsers', name: 'Returning Users', color: '#10b981' },
              ]}
              xAxisKey="date"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Active Users Over Time */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">Active Users Over Time</CardTitle>
            <CardDescription className="z-10 relative">Daily active user count</CardDescription>
          </div>
          <CardContent>
            <EnhancedLineChart
              data={userData}
              dataKeys={[{ key: 'activeUsers', name: 'Active Users', color: '#8b5cf6' }]}
              xAxisKey="date"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Verification Conversion Trend */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle size="md" className="z-10 relative text-slate-900 dark:text-white">User Engagement Trend</CardTitle>
          <CardDescription className="z-10 relative">Active users and transaction activity correlation</CardDescription>
        </div>
        <CardContent>
          <EnhancedLineChart
            data={userData.map((user, idx) => ({
              ...user,
              transactions: coreTrendsData[idx]?.count || 0,
            }))}
            dataKeys={[
              { key: 'activeUsers', name: 'Active Users', color: '#8b5cf6' },
              { key: 'transactions', name: 'Transactions', color: '#3b82f6' },
            ]}
            xAxisKey="date"
            height={300}
          />
        </CardContent>
      </Card>
    </div>
  )
}


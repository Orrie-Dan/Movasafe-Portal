'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TimePeriodFilter } from '@/components/dashboard/filters/TimePeriodFilter'
import { ClientLifecycleMetrics } from '@/components/dashboard/clients/ClientLifecycleMetrics'
import { ClientComplianceRate } from '@/components/dashboard/clients/ClientComplianceRate'
import { SubscriptionBreakdown } from '@/components/dashboard/clients/SubscriptionBreakdown'
import { CostPerClient } from '@/components/dashboard/clients/CostPerClient'
import { Users } from 'lucide-react'
import { apiMe } from '@/lib/api'

export default function ClientsPage() {
  const [authError, setAuthError] = useState(false)
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('month')
  const [customDateRange, setCustomDateRange] = useState<{from: Date | null, to: Date | null}>({from: null, to: null})

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiMe()
        setAuthError(false)
      } catch (error) {
        setAuthError(true)
      }
    }
    checkAuth()
  }, [])

  const getDateRange = () => {
    if (timePeriod === 'custom' && customDateRange.from && customDateRange.to) {
      return {
        startDate: customDateRange.from.toISOString().split('T')[0],
        endDate: customDateRange.to.toISOString().split('T')[0],
      }
    }
    const now = new Date()
    let startDate: Date
    switch (timePeriod) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1))
        break
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3))
        break
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1))
    }
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    }
  }

  const dateRange = getDateRange()

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">Please log in to view client data</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 bg-background">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Merchants & Vendors
                </h1>
                <p className="text-sm text-muted-foreground">Manage vendors and their escrow operations</p>
              </div>
            </div>
          </div>

          {/* Time Period Filter */}
          <TimePeriodFilter
            value={timePeriod}
            onChange={(period) => {
              if (period === 'custom') {
                setTimePeriod('custom')
              } else {
                setTimePeriod(period)
                setCustomDateRange({ from: null, to: null })
              }
            }}
            customDateRange={customDateRange}
            onCustomDateRangeChange={setCustomDateRange}
          />

          {/* Client Lifecycle Metrics */}
          <ClientLifecycleMetrics
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />

          {/* Client Compliance & Subscription Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ClientComplianceRate
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
            <SubscriptionBreakdown
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </div>

          {/* Cost Analysis */}
          <CostPerClient
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
    </div>
  )
}


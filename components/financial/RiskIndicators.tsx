'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertBadge } from '@/components/ui/alert-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { AlertTriangle, Shield } from 'lucide-react'
import type { RiskIndicators as RiskIndicatorsType } from '@/lib/types/financial'

export interface RiskIndicatorsProps {
  data: RiskIndicatorsType | null
  loading?: boolean
}

export function RiskIndicators({ data, loading = false }: RiskIndicatorsProps) {
  if (loading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (!data || data.indicators.length === 0) {
    return (
      <EmptyState
        title="No risk indicators detected"
        description="All systems operating normally. Risk indicators will appear here if any anomalies are detected."
        icon={Shield}
      />
    )
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  const sortedIndicators = [...data.indicators].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Risk Summary */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{data.totalRisks}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Risks</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-black border-red-600/50 dark:border-red-600/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">{data.criticalRisks}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Critical Risks</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-black border-red-500/50 dark:border-red-500/50">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-400">{data.highRisks}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">High Risks</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Last scan: {new Date(data.lastScan).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Indicators */}
      <div className="space-y-4">
        {sortedIndicators.map((indicator) => (
          <AlertBadge
            key={indicator.id}
            severity={indicator.severity}
            title={indicator.title}
            description={
              <div>
                <p className="mb-2 text-slate-700 dark:text-slate-300">{indicator.description}</p>
                {indicator.recommendation && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                    <strong>Recommendation:</strong> {indicator.recommendation}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>Value: {indicator.value.toLocaleString()}</span>
                  <span>Threshold: {indicator.threshold.toLocaleString()}</span>
                  <span>Detected: {new Date(indicator.detectedAt).toLocaleDateString()}</span>
                </div>
              </div>
            }
          />
        ))}
      </div>
    </div>
  )
}


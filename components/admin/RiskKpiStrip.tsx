'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useRiskOverview } from '@/hooks/useRiskOverview'

function formatPct(v: number): string {
  return `${v.toFixed(2)}%`
}

export function RiskKpiStrip() {
  const risk = useRiskOverview()

  return (
    <Card className="mx-6 mt-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-black">
      <CardContent className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
            <p className="text-xs text-muted-foreground">Fraud Rate</p>
            <p className="text-lg font-semibold">{formatPct(risk.fraudRate)}</p>
            {risk.fraudRate > 0.3 && <Badge variant="destructive">Above threshold</Badge>}
          </div>
          <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
            <p className="text-xs text-muted-foreground">Auto-blocked Txns</p>
            <p className="text-lg font-semibold">{risk.blockedTransactions}</p>
          </div>
          <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
            <p className="text-xs text-muted-foreground">False Positive Rate</p>
            <p className="text-lg font-semibold">{formatPct(risk.falsePositiveRate)}</p>
            {risk.falsePositiveRate > 5 && <Badge variant="destructive">High</Badge>}
          </div>
          <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
            <p className="text-xs text-muted-foreground">Avg Review Time</p>
            <p className="text-lg font-semibold">{risk.avgReviewTimeMinutes.toFixed(1)}m</p>
            {risk.avgReviewTimeMinutes > 15 && <Badge variant="destructive">SLA risk</Badge>}
          </div>
          <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
            <p className="text-xs text-muted-foreground">Accounts Frozen</p>
            <p className="text-lg font-semibold">{risk.accountsFrozen}</p>
          </div>
          <div className="rounded-md border border-slate-200 dark:border-slate-800 p-3">
            <p className="text-xs text-muted-foreground">Open Critical Alerts</p>
            <p className="text-lg font-semibold">{risk.openCriticalAlerts}</p>
            {risk.openCriticalAlerts > 0 && <Badge className="bg-red-600 text-white">Attention</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

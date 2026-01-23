'use client'

import React from 'react'

export function ClientLifecycleMetrics({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
      <h3 className="text-sm font-semibold text-foreground">Client Lifecycle Metrics</h3>
      <p className="text-xs text-muted-foreground">Placeholder: {startDate} — {endDate}</p>
    </div>
  )
}

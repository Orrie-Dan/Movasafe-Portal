'use client'

import React from 'react'

export function ClientComplianceRate({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
      <h3 className="text-sm font-semibold text-foreground">Client Compliance Rate</h3>
      <p className="text-xs text-muted-foreground">Placeholder: {startDate} — {endDate}</p>
    </div>
  )
}

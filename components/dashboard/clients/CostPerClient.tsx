'use client'

import React from 'react'

export function CostPerClient({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
      <h3 className="text-sm font-semibold text-foreground">Cost Per Client</h3>
      <p className="text-xs text-muted-foreground">Placeholder: {startDate} — {endDate}</p>
    </div>
  )
}

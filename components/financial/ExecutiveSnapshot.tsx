'use client'

import { useState } from 'react'
import { KpiCard } from '@/components/ui/kpi-card'
import { DollarSign, TrendingUp, TrendingDown, Wallet, Percent, Flame } from 'lucide-react'
import type { ExecutiveSnapshot as ExecutiveSnapshotType } from '@/lib/types/financial'
import { formatCurrency } from '@/lib/utils/financial'

export interface ExecutiveSnapshotProps {
  data: ExecutiveSnapshotType
  loading?: boolean
}

export function ExecutiveSnapshot({ data, loading = false }: ExecutiveSnapshotProps) {
  const [revenueView, setRevenueView] = useState<'mtd' | 'ytd'>('mtd')

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-900/50 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const revenueValue = revenueView === 'mtd' ? data.totalRevenue.mtd : data.totalRevenue.ytd
  const revenueLabel = revenueView === 'mtd' ? 'MTD' : 'YTD'

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-white">Executive Snapshot</h2>
        <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setRevenueView('mtd')}
            className={`px-2 sm:px-3 py-1 text-xs rounded ${
              revenueView === 'mtd'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MTD
          </button>
          <button
            onClick={() => setRevenueView('ytd')}
            className={`px-2 sm:px-3 py-1 text-xs rounded ${
              revenueView === 'ytd'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            YTD
          </button>
        </div>
      </div>
      
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title={`Total Revenue (${revenueLabel})`}
          value={formatCurrency(revenueValue)}
          change={data.totalRevenue.change}
          trend={data.totalRevenue.trend}
          icon={DollarSign}
          iconColor="text-green-400"
          tooltip={`Total revenue for ${revenueLabel.toLowerCase()}. Click MTD/YTD to toggle view.`}
          size="md"
        />
        
        <KpiCard
          title="Total Expenses"
          value={formatCurrency(data.totalExpenses.current)}
          change={data.totalExpenses.change}
          trend={data.totalExpenses.trend}
          icon={TrendingDown}
          iconColor="text-red-400"
          tooltip="Total operational expenses for the period"
          size="md"
        />
        
        <KpiCard
          title="Net Profit / Loss"
          value={formatCurrency(data.netProfit.current)}
          change={data.netProfit.change}
          trend={data.netProfit.trend}
          icon={data.netProfit.current >= 0 ? TrendingUp : TrendingDown}
          iconColor={data.netProfit.current >= 0 ? 'text-green-400' : 'text-red-400'}
          tooltip="Net profit after all expenses"
          size="md"
        />
        
        <KpiCard
          title="Cash Balance"
          value={formatCurrency(data.cashBalance)}
          icon={Wallet}
          iconColor="text-blue-400"
          tooltip="Current available cash balance"
          size="md"
        />
        
        <KpiCard
          title="Profit Margin"
          value={`${data.profitMargin.current.toFixed(1)}%`}
          change={data.profitMargin.change}
          trend={data.profitMargin.trend}
          icon={Percent}
          iconColor="text-purple-400"
          tooltip="Net profit margin percentage"
          size="md"
        />
        
        {data.burnRate !== undefined ? (
          <KpiCard
            title="Monthly Burn Rate"
            value={formatCurrency(data.burnRate)}
            icon={Flame}
            iconColor="text-orange-400"
            tooltip="Average monthly cash burn rate"
            size="md"
          />
        ) : (
          <div className="hidden xl:block" />
        )}
      </div>
      
      <div className="text-xs text-slate-400">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}


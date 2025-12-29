'use client'

import { useState, useEffect } from 'react'
import { apiMe, apiGetExecutiveSnapshot, apiGetRevenueAnalytics, apiGetExpenseAnalytics, apiGetProfitabilityAnalysis, apiGetCashFlow } from '@/lib/api'
import { AdminSidebar } from '@/components/admin-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { ExecutiveSnapshot } from '@/components/financial/ExecutiveSnapshot'
import { RevenueAnalytics } from '@/components/financial/RevenueAnalytics'
import { ExpenseAnalytics } from '@/components/financial/ExpenseAnalytics'
import { ProfitabilityAnalysis } from '@/components/financial/ProfitabilityAnalysis'
import { CashFlowAnalytics } from '@/components/financial/CashFlowAnalytics'
import { FinancialFilters } from '@/components/financial/FinancialFilters'
import { ExportControls } from '@/components/financial/ExportControls'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Skeleton } from '@/components/ui/skeleton'
import { DollarSign, TrendingUp, Receipt, Target, Wallet } from 'lucide-react'
import type { FinancialFilters as FinancialFiltersType } from '@/lib/types/financial'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function FinancialPage() {
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'year'>('month')
  
  // Financial data state (Records & Accounting)
  const [executiveSnapshot, setExecutiveSnapshot] = useState<any>(null)
  const [revenueAnalytics, setRevenueAnalytics] = useState<any>(null)
  const [expenseAnalytics, setExpenseAnalytics] = useState<any>(null)
  const [profitability, setProfitability] = useState<any>(null)
  const [cashFlow, setCashFlow] = useState<any>(null)
  
  // Filters
  const [filters, setFilters] = useState<FinancialFiltersType>({
    dateRange: {
      start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    },
    period: 'month',
    currency: 'RWF',
  })

  useEffect(() => {
    fetchAllData()
  }, [filters, timePeriod])

  const fetchAllData = async () => {
    try {
      await apiMe()
      setAuthError(false)
      setLoading(true)
      
      // Fetch financial records data (accounting/record-keeping focus)
      const [
        snapshot,
        revenue,
        expenses,
        profit,
        cash,
      ] = await Promise.all([
        apiGetExecutiveSnapshot(timePeriod),
        apiGetRevenueAnalytics(filters),
        apiGetExpenseAnalytics(filters),
        apiGetProfitabilityAnalysis(filters),
        apiGetCashFlow(filters),
      ])
      
      setExecutiveSnapshot(snapshot)
      setRevenueAnalytics(revenue)
      setExpenseAnalytics(expenses)
      setProfitability(profit)
      setCashFlow(cash)
    } catch (error) {
      console.error('Failed to fetch financial data:', error)
      setAuthError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: FinancialFiltersType) => {
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    setFilters({
      dateRange: {
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      },
      period: 'month',
      currency: 'RWF',
    })
  }

  if (authError) {
    return (
      <div className="flex h-screen bg-black">
        <AdminSidebar variant="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-slate-400">Please log in to view financial data</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <AdminSidebar variant="admin" />
      
      <div className="flex-1 overflow-y-auto">
        <DashboardHeader userName="Admin User" userRole="Administrator" />
        
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-black">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
                Financial Records & Accounting
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-1">What are the numbers? - Records, transactions, and accounting views</p>
            </div>
            <div className="w-full sm:w-auto">
              <ExportControls filters={filters} onRefresh={fetchAllData} />
            </div>
          </div>

          {/* Executive Snapshot */}
          <div className="pb-4 border-b border-slate-800">
            {loading ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-28 sm:h-32 w-full" />
                ))}
              </div>
            ) : (
              <ExecutiveSnapshot data={executiveSnapshot} />
            )}
          </div>

          {/* Filters */}
          <FinancialFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />

          {/* Revenue Records */}
          <CollapsibleSection
            title="Revenue Records"
            description="Full revenue totals, invoices, and transactions"
            defaultExpanded={true}
            icon={TrendingUp}
          >
            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <RevenueAnalytics data={revenueAnalytics} />
            )}
          </CollapsibleSection>

          {/* Expense Records */}
          <CollapsibleSection
            title="Expense Records"
            description="Full expense lists and detailed transactions"
            defaultExpanded={true}
            icon={Receipt}
          >
            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <ExpenseAnalytics data={expenseAnalytics} />
            )}
          </CollapsibleSection>

          {/* Profitability Totals */}
          <CollapsibleSection
            title="Profitability Totals"
            description="Net profit and basic profitability metrics"
            defaultExpanded={true}
            icon={Target}
          >
            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <ProfitabilityAnalysis data={profitability} />
            )}
          </CollapsibleSection>

          {/* Cash Flow Statement */}
          <CollapsibleSection
            title="Cash Flow Statement"
            description="Actual cash inflows and outflows (accounting view)"
            defaultExpanded={true}
            icon={Wallet}
          >
            {loading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <CashFlowAnalytics data={cashFlow} />
            )}
          </CollapsibleSection>
        </div>
      </div>
    </div>
  )
}

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ProvinceDistributionChart } from '@/components/dashboard/charts/ProvinceDistributionChart'
import { Users, CreditCard, AlertTriangle } from 'lucide-react'
import type { PaymentBehavior as PaymentBehaviorType } from '@/lib/types/financial'
import { formatCurrency } from '@/lib/utils/financial'

export interface PaymentBehaviorProps {
  data: PaymentBehaviorType | null
  loading?: boolean
}

export function PaymentBehavior({ data, loading = false }: PaymentBehaviorProps) {
  if (loading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  if (!data) {
    return (
      <EmptyState
        title="No payment behavior data available"
        description="Payment behavior analytics will appear here once data is available."
        icon={CreditCard}
      />
    )
  }

  const paymentStatusData = [
    { name: 'Successful', count: data.successfulPayments, color: '#10b981' },
    { name: 'Failed', count: data.failedPayments, color: '#ef4444' },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Payment Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">{data.paymentSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Payment Success Rate</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">{data.averagePaymentDelay.toFixed(1)} days</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Average Payment Delay</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-400">{formatCurrency(data.totalOutstanding)}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Outstanding</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.successfulPayments + data.failedPayments}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Payment Success/Failure */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="relative z-10 text-sm sm:text-base">Payment Status</CardTitle>
                <CardDescription className="relative z-10 text-xs sm:text-sm">Successful vs failed payments</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="w-full">
              <ProvinceDistributionChart
                data={paymentStatusData}
                height={250}
                isMobile={typeof window !== 'undefined' && window.innerWidth < 640}
                colors={paymentStatusData.map(item => item.color)}
                centerLabel={{ total: 'Total Payments', selected: undefined }}
                ariaLabel="Payment status distribution chart"
              />
            </div>
          </CardContent>
        </Card>

        {/* Top Paying Customers */}
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="relative z-10 text-sm sm:text-base">Top Paying Customers</CardTitle>
                <CardDescription className="relative z-10 text-xs sm:text-sm">Highest revenue customers</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              {data.topPayingCustomers.slice(0, 5).map((customer, idx) => (
                <div key={customer.customerId} className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900 dark:text-white">{customer.customerName}</span>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                      {formatCurrency(customer.totalPaid)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Reliability: {customer.paymentReliability.toFixed(0)}%</span>
                    <span>{customer.averagePaymentDelay} days delay</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Late Payments Table */}
      {data.latePayments.length > 0 && (
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="relative z-10 text-sm sm:text-base">Late Payments</CardTitle>
                <CardDescription className="relative z-10 text-xs sm:text-sm">Customers with overdue payments</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-0 sm:p-4 sm:p-6">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto bg-white dark:bg-black">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                    <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Customer</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Total Paid</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Outstanding</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Delay (days)</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.latePayments.map((customer) => (
                    <TableRow key={customer.customerId} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <TableCell className="font-medium text-slate-900 dark:text-white">{customer.customerName}</TableCell>
                      <TableCell className="text-slate-900 dark:text-white">{formatCurrency(customer.totalPaid)}</TableCell>
                      <TableCell className="text-red-400">{formatCurrency(customer.totalOwed)}</TableCell>
                      <TableCell className="text-orange-400">{customer.averagePaymentDelay}</TableCell>
                      <TableCell>
                        <Badge className={
                          customer.status === 'overdue' 
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }>
                          {customer.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Churned Customers */}
      {data.churnedCustomers.length > 0 && (
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex items-center justify-between relative z-10 flex-1">
              <div>
                <CardTitle size="md" className="relative z-10 text-sm sm:text-base">Churned Customers</CardTitle>
                <CardDescription className="relative z-10 text-xs sm:text-sm">Customers who have stopped using services</CardDescription>
              </div>
            </div>
          </div>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              {data.churnedCustomers.map((customer) => (
                <div key={customer.customerId} className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{customer.customerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Last payment: {new Date(customer.lastPaymentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                      Churned
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


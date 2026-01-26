'use client'

import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Construction } from 'lucide-react'

export default function RevenuePage() {
  return (
    <div className="p-6 lg:p-8 min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 max-w-lg w-full">
        <CardContent className="p-12 text-center">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-10 w-10 text-green-400" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Construction className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500 uppercase tracking-wider">Coming Soon</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Revenue Dashboard
          </h1>
          <p className="text-muted-foreground mb-6">
            Powerful revenue analytics and forecasting tools are in development. Track earnings, 
            analyze trends, and optimize your financial performance.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">Revenue Analytics</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">Forecasting</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">Commission Tracking</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Wallet, DollarSign, CreditCard, Lock } from 'lucide-react'
import { apiGetAllWallets } from '@/lib/api/wallets'
import type { Wallet as ApiWallet } from '@/lib/types/wallets'

type WalletStatus = 'active' | 'frozen' | 'suspended'

interface WalletMetrics {
  totalWallets: number
  totalAvailable: number
  totalReserved: number
  frozenWallets: number
}

export function WalletOverviewCards() {
  const [loading, setLoading] = useState(true)
  const [wallets, setWallets] = useState<ApiWallet[]>([])

  useEffect(() => {
    const loadWallets = async () => {
      try {
        setLoading(true)
        const apiWallets = await apiGetAllWallets({ page: 0, limit: 100 })
        if (Array.isArray(apiWallets)) {
          setWallets(apiWallets)
        } else {
          setWallets([])
        }
      } catch (error) {
        console.error('Failed to load wallets for analytics:', error)
        setWallets([])
      } finally {
        setLoading(false)
      }
    }

    loadWallets()
  }, [])

  const metrics: WalletMetrics = useMemo(() => {
    if (!wallets.length) {
      return {
        totalWallets: 0,
        totalAvailable: 0,
        totalReserved: 0,
        frozenWallets: 0,
      }
    }

    let totalAvailable = 0
    let totalReserved = 0
    let frozenWallets = 0

    wallets.forEach((wallet) => {
      const totalBalance = wallet.walletBalance ?? 0
      const reservedBalance = wallet.reservedBalance ?? 0
      const availableBalance =
        wallet.availableBalance ?? totalBalance - reservedBalance

      totalAvailable += availableBalance
      totalReserved += reservedBalance

      const status: WalletStatus = reservedBalance > 0 ? 'frozen' : 'active'
      if (status === 'frozen') {
        frozenWallets += 1
      }
    })

    return {
      totalWallets: wallets.length,
      totalAvailable,
      totalReserved,
      frozenWallets,
    }
  }, [wallets])

  const formatCurrency = (amount: number, currency: string = 'RWF'): string => {
    return `${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} ${currency}`
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Wallets</p>
              <div className="text-2xl font-bold text-foreground mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : metrics.totalWallets}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Available</p>
              <div className="text-2xl font-bold text-green-400 mt-1">
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  formatCurrency(metrics.totalAvailable)
                )}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Reserved</p>
              <div className="text-2xl font-bold text-yellow-400 mt-1">
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  formatCurrency(metrics.totalReserved)
                )}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Frozen Wallets</p>
              <div className="text-2xl font-bold text-red-400 mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : metrics.frozenWallets}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <Lock className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


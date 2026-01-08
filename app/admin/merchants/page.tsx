'use client'

import { useState, useEffect } from 'react'
import { apiGetUsers, apiGetEscrows, type User, EscrowStatus } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RefreshCw, Search, Store, TrendingUp, DollarSign, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from '@/hooks/use-toast'

function formatCurrency(amount: number, currency: string = 'RWF'): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M ${currency}`
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K ${currency}`
  return `${amount.toFixed(2)} ${currency}`
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [merchantStats, setMerchantStats] = useState<Record<string, {
    escrowCount: number
    totalReceived: number
    commissionPaid: number
    activeEscrows: number
  }>>({})

  useEffect(() => {
    fetchMerchants()
  }, [])

  const fetchMerchants = async () => {
    setLoading(true)
    setError(null)
    try {
      const usersResponse = await apiGetUsers({})
      const vendors = usersResponse.data.filter((user: User) => user.userType === 'VENDOR')
      setMerchants(vendors)

      // Fetch escrow stats for each vendor
      const escrowsResponse = await apiGetEscrows({})
      const stats: Record<string, any> = {}
      
      vendors.forEach((vendor: User) => {
        const vendorEscrows = escrowsResponse.filter((e: any) => e.vendorId === vendor.id)
        const activeEscrows = vendorEscrows.filter((e: any) => e.status === EscrowStatus.ACTIVE)
        const releasedEscrows = vendorEscrows.filter((e: any) => e.status === EscrowStatus.RELEASED)
        const totalReceived = releasedEscrows.reduce((sum: number, e: any) => sum + e.vendorAmount, 0)
        const commissionPaid = releasedEscrows.reduce((sum: number, e: any) => sum + e.commissionAmount, 0)

        stats[vendor.id] = {
          escrowCount: vendorEscrows.length,
          totalReceived,
          commissionPaid,
          activeEscrows: activeEscrows.length,
        }
      })

      setMerchantStats(stats)
    } catch (error) {
      console.error('Failed to fetch merchants:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch merchants')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch merchants',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredMerchants = merchants.filter(merchant => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = merchant.fullName?.toLowerCase().includes(query)
      const matchesEmail = merchant.email?.toLowerCase().includes(query)
      const matchesId = merchant.id.toLowerCase().includes(query)
      if (!matchesName && !matchesEmail && !matchesId) {
        return false
      }
    }
    return true
  })

  const totalStats = {
    totalMerchants: merchants.length,
    totalEscrows: Object.values(merchantStats).reduce((sum, s) => sum + s.escrowCount, 0),
    totalReceived: Object.values(merchantStats).reduce((sum, s) => sum + s.totalReceived, 0),
    totalCommission: Object.values(merchantStats).reduce((sum, s) => sum + s.commissionPaid, 0),
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Merchants & Vendors</h1>
              <p className="text-slate-400 mt-1">Manage vendors and monitor their escrow operations</p>
            </div>
            <Button onClick={fetchMerchants} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Merchants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalStats.totalMerchants}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Escrows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{totalStats.totalEscrows}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{formatCurrency(totalStats.totalReceived)}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Commission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">{formatCurrency(totalStats.totalCommission)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search merchants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </CardHeader>
          </Card>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full bg-slate-800" />
              ))}
            </div>
          ) : error ? (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-6">
                <p className="text-red-400">{error}</p>
              </CardContent>
            </Card>
          ) : filteredMerchants.length === 0 ? (
            <EmptyState icon={Store} title="No merchants found" description="No vendors match your search" />
          ) : (
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Merchants ({filteredMerchants.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <TableHead className="text-slate-600 dark:text-slate-400">Name</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Escrows</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Active</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Total Received</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Commission Paid</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">KYC Status</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMerchants.map((merchant) => {
                      const stats = merchantStats[merchant.id] || {
                        escrowCount: 0,
                        totalReceived: 0,
                        commissionPaid: 0,
                        activeEscrows: 0,
                      }
                      return (
                        <TableRow key={merchant.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <TableCell className="font-medium text-slate-900 dark:text-white">{merchant.fullName || 'N/A'}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">{merchant.email}</TableCell>
                          <TableCell className="text-slate-900 dark:text-white">{stats.escrowCount}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                              {stats.activeEscrows}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-green-400 font-medium">
                            {formatCurrency(stats.totalReceived)}
                          </TableCell>
                          <TableCell className="text-yellow-400 font-medium">
                            {formatCurrency(stats.commissionPaid)}
                          </TableCell>
                          <TableCell>
                            {merchant.kycVerified ? (
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                                Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              merchant.status === 'active'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }>
                              {merchant.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
  )
}




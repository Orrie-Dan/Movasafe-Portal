'use client'

import { useState, useEffect } from 'react'
import { apiGetAllWallets, apiGetWallet, type Wallet } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw, Search, Eye, Wallet as WalletIcon, TrendingUp, DollarSign, Lock, Unlock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from '@/hooks/use-toast'

function formatCurrency(amount: number, currency: string = 'RWF'): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M ${currency}`
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K ${currency}`
  return `${amount.toFixed(2)} ${currency}`
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterUserType, setFilterUserType] = useState<string>('')
  const [freezeModal, setFreezeModal] = useState<{ open: boolean; wallet: Wallet | null; reason: string }>({ 
    open: false, 
    wallet: null,
    reason: '',
  })
  const [stats, setStats] = useState({
    total: 0,
    totalBalance: 0,
    totalReserved: 0,
    totalSavings: 0,
    averageBalance: 0,
  })

  useEffect(() => {
    fetchWallets()
  }, [filterUserType])

  const fetchWallets = async () => {
    setLoading(true)
    setError(null)
    try {
      const filters: any = {}
      if (filterUserType && filterUserType !== 'all') {
        filters.userType = filterUserType
      }
      const response = await apiGetAllWallets(filters)
      setWallets(response)

      const totalBalance = response.reduce((sum, w) => sum + w.walletBalance, 0)
      const totalReserved = response.reduce((sum, w) => sum + w.reservedBalance, 0)
      const totalSavings = response.reduce((sum, w) => sum + w.savingsBalance, 0)
      const averageBalance = response.length > 0 ? totalBalance / response.length : 0

      setStats({
        total: response.length,
        totalBalance,
        totalReserved,
        totalSavings,
        averageBalance,
      })
    } catch (error) {
      console.error('Failed to fetch wallets:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch wallets')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch wallets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewWallet = async (wallet: Wallet) => {
    try {
      const fullWallet = await apiGetWallet(wallet.id)
      setSelectedWallet(fullWallet)
      setIsDetailOpen(true)
    } catch (error) {
      setSelectedWallet(wallet)
      setIsDetailOpen(true)
    }
  }

  const handleFreezeWallet = async () => {
    if (!freezeModal.wallet) return
    try {
      // TODO: Replace with actual API call
      // await apiFreezeWallet(freezeModal.wallet.id, freezeModal.reason)
      toast({
        title: 'Success',
        description: freezeModal.wallet.frozen ? 'Wallet unfrozen successfully' : 'Wallet frozen successfully',
      })
      fetchWallets()
      setFreezeModal({ open: false, wallet: null, reason: '' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to freeze/unfreeze wallet',
        variant: 'destructive',
      })
    }
  }

  const filteredWallets = wallets.filter(wallet => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesId = wallet.id.toLowerCase().includes(query)
      const matchesUserId = wallet.userId.toLowerCase().includes(query)
      if (!matchesId && !matchesUserId) {
        return false
      }
    }
    return true
  })

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Wallets</h1>
              <p className="text-muted-foreground mt-1">Monitor wallet balances and reserved funds</p>
            </div>
            <Button onClick={fetchWallets} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="z-10 relative">Total Wallets</CardTitle>
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="z-10 relative">Total Balance</CardTitle>
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalBalance)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="z-10 relative">Reserved</CardTitle>
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">{formatCurrency(stats.totalReserved)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="z-10 relative">Savings</CardTitle>
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{formatCurrency(stats.totalSavings)}</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex flex-row items-center justify-between p-6 pb-2 border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black relative">
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <CardTitle size="xs" className="z-10 relative">Avg Balance</CardTitle>
              </div>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.averageBalance)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search wallets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <Select value={filterUserType} onValueChange={setFilterUserType}>
                  <SelectTrigger className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue placeholder="All User Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All User Types</SelectItem>
                    <SelectItem value="CLIENT">Clients</SelectItem>
                    <SelectItem value="VENDOR">Vendors</SelectItem>
                  </SelectContent>
                </Select>
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
          ) : filteredWallets.length === 0 ? (
            <EmptyState icon={WalletIcon} title="No wallets found" description="No wallets match your filters" />
          ) : (
            <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Wallets ({filteredWallets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">User ID</TableHead>
                      <TableHead className="text-slate-400">Wallet Balance</TableHead>
                      <TableHead className="text-slate-400">Reserved</TableHead>
                      <TableHead className="text-slate-400">Savings</TableHead>
                      <TableHead className="text-slate-400">Available</TableHead>
                      <TableHead className="text-slate-400">Currency</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWallets.map((wallet) => (
                      <TableRow key={wallet.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell className="font-mono text-sm">{wallet.userId.slice(0, 8)}...</TableCell>
                        <TableCell className="font-medium text-green-400">
                          {formatCurrency(wallet.walletBalance, wallet.currency)}
                        </TableCell>
                        <TableCell className="text-yellow-400">
                          {formatCurrency(wallet.reservedBalance, wallet.currency)}
                        </TableCell>
                        <TableCell className="text-blue-400">
                          {formatCurrency(wallet.savingsBalance, wallet.currency)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(wallet.availableBalance, wallet.currency)}
                        </TableCell>
                        <TableCell>{wallet.currency}</TableCell>
                        <TableCell>
                          {(wallet as any).frozen ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              <Lock className="h-3 w-3 mr-1" />
                              Frozen
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewWallet(wallet)} title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFreezeModal({ open: true, wallet, reason: '' })}
                              className={(wallet as any).frozen ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}
                              title={(wallet as any).frozen ? 'Unfreeze Wallet' : 'Freeze Wallet'}
                            >
                              {(wallet as any).frozen ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white">
          {selectedWallet && (
            <>
              <DialogHeader>
                <DialogTitle>Wallet Details</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Wallet ID: {selectedWallet.id}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">User ID</label>
                    <div className="text-sm font-mono mt-1">{selectedWallet.userId}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Currency</label>
                    <div className="text-sm mt-1">{selectedWallet.currency}</div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Wallet Balance</label>
                    <div className="text-lg font-bold text-green-400 mt-1">
                      {formatCurrency(selectedWallet.walletBalance, selectedWallet.currency)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Reserved Balance</label>
                    <div className="text-lg font-bold text-yellow-400 mt-1">
                      {formatCurrency(selectedWallet.reservedBalance, selectedWallet.currency)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Savings Balance</label>
                    <div className="text-lg font-bold text-blue-400 mt-1">
                      {formatCurrency(selectedWallet.savingsBalance, selectedWallet.currency)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Available Balance</label>
                    <div className="text-lg font-bold mt-1">
                      {formatCurrency(selectedWallet.availableBalance, selectedWallet.currency)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Created At</label>
                    <div className="text-sm mt-1">
                      {format(parseISO(selectedWallet.createdAt), 'PPpp')}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Updated At</label>
                    <div className="text-sm mt-1">
                      {format(parseISO(selectedWallet.updatedAt), 'PPpp')}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Freeze/Unfreeze Wallet Dialog */}
      <Dialog open={freezeModal.open} onOpenChange={(open) => setFreezeModal({ open, wallet: freezeModal.wallet, reason: freezeModal.reason })}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>
              {freezeModal.wallet?.frozen ? 'Unfreeze Wallet' : 'Freeze Wallet'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Wallet ID: {freezeModal.wallet?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400">Reason</Label>
              <Textarea
                placeholder="Enter reason for freeze/unfreeze..."
                value={freezeModal.reason}
                onChange={(e) => setFreezeModal({ ...freezeModal, reason: e.target.value })}
                className="mt-2 bg-slate-800 border-slate-700 text-white"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setFreezeModal({ open: false, wallet: null, reason: '' })}
                className="border-slate-700 text-white hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFreezeWallet}
                className={freezeModal.wallet?.frozen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {freezeModal.wallet?.frozen ? 'Unfreeze' : 'Freeze'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}




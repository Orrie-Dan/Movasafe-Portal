'use client'

import { useState, useEffect } from 'react'
import { apiGetOrganizations, apiGetCollectionsStats, apiGetSubscriptions, apiGetComplianceData, type Organization } from '@/lib/api'
import { AdminSidebar } from '@/components/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Building2, RefreshCw, Search, Mail, Phone, TrendingUp, CheckCircle2, AlertTriangle, MapPin, Users, Truck, Eye, BarChart3 } from 'lucide-react'
import { MetricTooltip } from '@/components/ui/tooltip'
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [orgMetrics, setOrgMetrics] = useState<any>({})
  const [orgStats, setOrgStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    licensed: 0,
    cbo: 0,
    cooperative: 0,
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiGetOrganizations()
      setOrganizations(response.data)
      
      // Calculate stats
      const stats = {
        total: response.data.length,
        active: response.data.filter(o => (o as any).status === 'active' || !(o as any).status).length,
        inactive: response.data.filter(o => (o as any).status === 'inactive').length,
        licensed: response.data.filter(o => (o as any).ruraLicense).length,
        cbo: response.data.filter(o => (o as any).type === 'cbo').length,
        cooperative: response.data.filter(o => (o as any).type === 'cooperative').length,
      }
      setOrgStats(stats)
      
      // Fetch metrics for each organization
      const metrics: any = {}
      for (const org of response.data) {
        try {
          const [collections, subscriptions, compliance] = await Promise.all([
            apiGetCollectionsStats({ organizationId: org.id }).catch(() => ({ totalCollections: 0, completed: 0 })),
            apiGetSubscriptions({ organizationId: org.id }).catch(() => ({ data: [] })),
            apiGetComplianceData({ organizationId: org.id }).catch(() => ({ compliant: true, licenseValid: true })),
          ])
          metrics[org.id] = {
            collections: collections.totalCollections || 0,
            completed: collections.completed || 0,
            subscriptions: subscriptions.data?.length || 0,
            compliant: compliance.compliant !== false,
            licenseValid: compliance.licenseValid !== false,
          }
        } catch (err) {
          console.error(`Failed to fetch metrics for org ${org.id}:`, err)
        }
      }
      setOrgMetrics(metrics)
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch organizations'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  const handleViewOrg = (org: Organization) => {
    setSelectedOrg(org)
    setIsDetailOpen(true)
  }

  const filteredOrganizations = organizations.filter(org => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        org.name.toLowerCase().includes(query) ||
        (org.contactEmail && org.contactEmail.toLowerCase().includes(query)) ||
        (org.contactPhone && org.contactPhone.toLowerCase().includes(query))
      )
    }
    return true
  })

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <AdminSidebar variant="admin" userName="Admin User" userRole="admin" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-900/95 backdrop-blur-sm px-6 py-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Organizations Management
                </h1>
                <p className="text-sm text-slate-400">Manage organizations and their assignments</p>
              </div>
            </div>
            <Button 
              onClick={fetchOrganizations} 
              variant="outline" 
              size="sm" 
              className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 transition-all"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          {error && (
            <div className="rounded-lg border border-red-500 bg-red-500/10 p-4 mb-6">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <Card className="bg-black border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle size="md">Organizations ({filteredOrganizations.length})</CardTitle>
                  <CardDescription className="text-slate-400">View and manage all organizations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex items-center gap-2 p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
                />
              </div>

              {/* Organization Overview Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-white">{orgStats.total}</div>
                    <p className="text-xs text-slate-400 mt-1">Total Organizations</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-400">{orgStats.active}</div>
                    <p className="text-xs text-slate-400 mt-1">Active</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-slate-400">{orgStats.inactive}</div>
                    <p className="text-xs text-slate-400 mt-1">Inactive</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-400">{orgStats.licensed}</div>
                    <p className="text-xs text-slate-400 mt-1">RURA Licensed</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-400">{orgStats.cbo}</div>
                    <p className="text-xs text-slate-400 mt-1">CBOs</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-400">{orgStats.cooperative}</div>
                    <p className="text-xs text-slate-400 mt-1">Cooperatives</p>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-slate-800 overflow-hidden bg-black">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                      <TableRow className="border-slate-800 bg-slate-900 hover:bg-slate-900">
                        <TableHead className="text-slate-300 font-semibold">Organization</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Contact Email</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Contact Phone</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Collections</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Subscriptions</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Compliance</TableHead>
                        <TableHead className="text-slate-300 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <TableRow key={i} className="border-slate-800">
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                      </TableRow>
                          ))}
                        </>
                    ) : filteredOrganizations.length === 0 ? (
                        <TableRow className="border-slate-800 hover:bg-transparent">
                          <TableCell colSpan={7} className="p-0">
                            <EmptyState
                              title="No organizations found"
                              description={searchQuery ? "Try adjusting your search query." : "No organizations have been registered yet."}
                              icon={Building2}
                            />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrganizations.map((org) => {
                        const metrics = orgMetrics[org.id] || {}
                        return (
                          <TableRow key={org.id} className="border-slate-800 hover:bg-slate-800/60 transition-colors duration-150">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white">
                                {org.name[0].toUpperCase()}
                              </div>
                                <div>
                              <div className="font-medium text-white">{org.name}</div>
                                  {(org as any).type && (
                                    <div className="text-xs text-slate-400 capitalize">{(org as any).type}</div>
                                  )}
                                </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {org.contactEmail ? (
                              <div className="flex items-center gap-2 text-slate-300">
                                <Mail className="h-4 w-4 text-slate-400" />
                                {org.contactEmail}
                              </div>
                            ) : (
                              <span className="text-slate-500">No email</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {org.contactPhone ? (
                              <div className="flex items-center gap-2 text-slate-300">
                                <Phone className="h-4 w-4 text-slate-400" />
                                {org.contactPhone}
                              </div>
                            ) : (
                              <span className="text-slate-500">No phone</span>
                            )}
                          </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-slate-400" />
                                <span className="text-white">{metrics.collections || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-400" />
                                <span className="text-white">{metrics.subscriptions || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {metrics.compliant && metrics.licenseValid ? (
                                <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Compliant
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Issues
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <MetricTooltip content="View Organization">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewOrg(org)}
                                className="text-slate-400 hover:text-white"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              </MetricTooltip>
                            </TableCell>
                        </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Organization Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{selectedOrg?.name}</DialogTitle>
            <DialogDescription className="text-slate-400">Organization details and performance metrics</DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-6 mt-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Contact Email</div>
                    <div className="text-white">{selectedOrg.contactEmail || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Contact Phone</div>
                    <div className="text-white">{selectedOrg.contactPhone || 'N/A'}</div>
                  </div>
                  {(selectedOrg as any).ruraLicense && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">RURA License</div>
                      <div className="text-white">{(selectedOrg as any).ruraLicense}</div>
                    </div>
                  )}
                  {(selectedOrg as any).type && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Type</div>
                      <div className="text-white capitalize">{(selectedOrg as any).type}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              {orgMetrics[selectedOrg.id] && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-white">{orgMetrics[selectedOrg.id].collections}</div>
                        <div className="text-sm text-slate-400 mt-1">Collections Completed</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-white">{orgMetrics[selectedOrg.id].subscriptions}</div>
                        <div className="text-sm text-slate-400 mt-1">Active Subscriptions</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-white">
                          {orgMetrics[selectedOrg.id].collections > 0 
                            ? Math.round((orgMetrics[selectedOrg.id].completed / orgMetrics[selectedOrg.id].collections) * 100)
                            : 0}%
                        </div>
                        <div className="text-sm text-slate-400 mt-1">Completion Rate</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

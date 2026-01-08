'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Eye, Clock, AlertCircle, User, FileText, Users, TrendingUp } from 'lucide-react'
import type { SupportTicket } from '@/lib/types/fintech'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { useMemo } from 'react'

// Mock data - replace with actual API calls
const mockTickets: SupportTicket[] = [
  {
    id: 'ticket_1',
    userId: 'user_123',
    title: 'Transaction Failed',
    description: 'Unable to complete transaction',
    status: 'open',
    priority: 'high',
    slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    relatedTransactionId: 'tx_123',
  },
]

export default function SupportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  
  // Mock admin users for assignment
  const adminUsers = [
    { id: 'admin_1', name: 'Admin User 1' },
    { id: 'admin_2', name: 'Admin User 2' },
    { id: 'admin_3', name: 'Support Agent 1' },
  ]

  // Calculate support KPIs
  const supportKPIs = useMemo(() => {
    const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress')
    const closedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed')
    const avgResolutionTime = tickets.length > 0 
      ? tickets.reduce((sum, t) => {
          if (t.status === 'resolved' || t.status === 'closed') {
            const created = new Date(t.createdAt).getTime()
            const updated = new Date(t.updatedAt).getTime()
            return sum + (updated - created) / (1000 * 60 * 60) // hours
          }
          return sum
        }, 0) / closedTickets.length
      : 0

    return {
      open: openTickets.length,
      closed: closedTickets.length,
      avgResolutionTime: avgResolutionTime.toFixed(1),
    }
  }, [tickets])

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (filterStatus !== 'all' && ticket.status !== filterStatus) return false
      if (filterPriority !== 'all' && ticket.priority !== filterPriority) return false
      return true
    })
  }, [tickets, filterStatus, filterPriority])

  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchData = async () => {
    //   const data = await apiGetSupportTickets()
    //   setTickets(data)
    //   setLoading(false)
    // }
    // fetchData()
    setLoading(false)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'closed':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getSLABadge = (deadline?: string) => {
    if (!deadline) return null
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const hoursRemaining = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursRemaining < 0) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>
    } else if (hoursRemaining < 4) {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Due Soon</Badge>
    } else {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">On Track</Badge>
    }
  }

  const columns: Column<SupportTicket>[] = [
    {
      key: 'id',
      header: 'Ticket ID',
      accessor: (ticket) => <span className="font-mono text-sm">{ticket.id.slice(0, 8)}...</span>,
      sortable: true,
    },
    {
      key: 'userId',
      header: 'User',
      accessor: (ticket) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-slate-400" />
          <span className="font-mono text-xs text-slate-300">{ticket.userId.slice(0, 8)}...</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'title',
      header: 'Issue Type',
      accessor: (ticket) => <span className="font-medium text-white">{ticket.title}</span>,
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (ticket) => (
        <Badge className={getStatusBadge(ticket.status)}>
          {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.replace('_', ' ').slice(1)}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'priority',
      header: 'Priority',
      accessor: (ticket) => (
        <Badge className={getPriorityBadge(ticket.priority)}>
          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      accessor: (ticket) => (
        <span className="text-slate-400 text-sm">
          {ticket.assignedTo ? adminUsers.find(u => u.id === ticket.assignedTo)?.name || ticket.assignedTo : 'Unassigned'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'sla',
      header: 'SLA',
      accessor: (ticket) => getSLABadge(ticket.slaDeadline),
    },
    {
      key: 'createdAt',
      header: 'Created',
      accessor: (ticket) => (
        <span className="text-slate-400">
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (ticket) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedTicket(ticket)
            setIsDetailOpen(true)
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const handleAssignTicket = async (ticketId: string, userId: string) => {
    try {
      // TODO: Replace with actual API call
      // await apiAssignTicket(ticketId, userId)
      toast({
        title: 'Success',
        description: 'Ticket assigned successfully',
      })
      // Refresh tickets
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign ticket',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-black">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
          <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
          Support Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage support tickets and customer inquiries
        </p>
      </div>

      {/* Support KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="pb-2 px-6 pt-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="z-10 relative text-sm font-medium text-slate-600 dark:text-slate-400">Open Tickets</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{supportKPIs.open}</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="pb-2 px-6 pt-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="z-10 relative text-sm font-medium text-slate-600 dark:text-slate-400">Closed Tickets</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{supportKPIs.closed}</div>
            <p className="text-xs text-muted-foreground mt-1">Resolved</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
          <div className="pb-2 px-6 pt-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <CardTitle className="z-10 relative text-sm font-medium text-slate-600 dark:text-slate-400">Avg Resolution Time</CardTitle>
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{supportKPIs.avgResolutionTime}h</div>
            <p className="text-xs text-muted-foreground mt-1">Average hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-foreground">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card className="bg-white dark:bg-black border-slate-200 dark:border-slate-800">
        <div className="flex flex-col space-y-1.5 p-6 relative border-b border-slate-200 dark:border-slate-900/50 bg-white dark:bg-black">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardTitle className="z-10 relative text-slate-900 dark:text-white">Support Tickets</CardTitle>
          <CardDescription className="z-10 relative">Customer support tickets and SLA tracking</CardDescription>
        </div>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <DataTable
              data={filteredTickets}
              columns={columns}
              searchable
              searchPlaceholder="Search tickets..."
              pagination={{ pageSize: 25 }}
              emptyMessage="No tickets found"
            />
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.title}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Ticket ID: {selectedTicket.id}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusBadge(selectedTicket.status)}>
                        {selectedTicket.status.replace('_', ' ').charAt(0).toUpperCase() + selectedTicket.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Priority</label>
                    <div className="mt-1">
                      <Badge className={getPriorityBadge(selectedTicket.priority)}>
                        {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">User ID</label>
                    <div className="text-sm mt-1 font-mono">{selectedTicket.userId}</div>
                  </div>
                  {selectedTicket.relatedTransactionId && (
                    <div>
                      <label className="text-sm text-slate-400">Related Transaction</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-mono">{selectedTicket.relatedTransactionId}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/transactions?id=${selectedTicket.relatedTransactionId}`)}
                          className="h-6 text-xs"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-slate-400">User</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-mono">{selectedTicket.userId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${selectedTicket.userId}`)}
                        className="h-6 text-xs"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Assign To</label>
                    <Select
                      value={selectedTicket.assignedTo || ''}
                      onValueChange={(value) => handleAssignTicket(selectedTicket.id, value)}
                    >
                      <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white mt-2">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {adminUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedTicket.slaDeadline && (
                    <div>
                      <label className="text-sm text-slate-400">SLA Deadline</label>
                      <div className="mt-1">
                        {getSLABadge(selectedTicket.slaDeadline)}
                        <div className="text-sm text-slate-400 mt-1">
                          {new Date(selectedTicket.slaDeadline).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-400">Description</label>
                  <div className="mt-1 p-3 bg-slate-800 rounded text-sm">{selectedTicket.description}</div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


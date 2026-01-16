'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EnhancedLineChart } from '@/components/dashboard/charts/enhanced-line-chart'
import { toast } from '@/hooks/use-toast'
import {
  MessageSquare,
  Eye,
  Clock,
  AlertCircle,
  User,
  FileText,
  Users,
  TrendingUp,
  Search,
  Send,
  Paperclip,
  Tag,
  ArrowUp,
  CheckCircle2,
  XCircle,
  Bell,
  Copy,
  Shield,
  DollarSign,
  Wallet,
  UserCheck,
} from 'lucide-react'
import { format, subDays, subHours, parseISO } from 'date-fns'
import { useRouter } from 'next/navigation'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type TicketStatus = 'open' | 'in_progress' | 'waiting_on_user' | 'resolved' | 'closed'
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
type TicketCategory = 'Payments' | 'KYC' | 'Wallet' | 'Escrow' | 'Account'
type MessageType = 'user' | 'support' | 'internal'
type EscalationType = 'Compliance' | 'Finance' | null
type TicketTag = 'Fraud' | 'Urgent' | 'VIP User' | 'Refund' | 'Technical'

interface SupportMessage {
  id: string
  type: MessageType
  content: string
  sender: string
  timestamp: string
  attachments?: Array<{
    id: string
    name: string
    url: string
  }>
}

interface SupportTicket {
  id: string
  userId: string
  userName: string
  userEmail: string
  title: string
  description: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  slaDeadline?: string
  assignedTo?: string
  assignedToName?: string
  createdAt: string
  updatedAt: string
  relatedTransactionId?: string
  tags?: TicketTag[]
  escalatedTo?: EscalationType
  messages: SupportMessage[]
  unread: boolean
}

interface ActivityLogEntry {
  id: string
  ticketId: string
  action: string
  actor: string
  timestamp: string
  details?: string
}

interface Notification {
  id: string
  type: 'new_ticket' | 'ticket_assigned' | 'user_replied'
  ticketId: string
  ticketTitle: string
  message: string
  timestamp: string
  read: boolean
}

interface SupportMetrics {
  totalTickets: number
  openTickets: number
  pendingTickets: number
  resolvedTickets: number
  averageResponseTime: number // in hours
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateMockTickets = (): SupportTicket[] => {
  const categories: TicketCategory[] = ['Payments', 'KYC', 'Wallet', 'Escrow', 'Account']
  const statuses: TicketStatus[] = ['open', 'in_progress', 'waiting_on_user', 'resolved', 'closed']
  const priorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent']
  const tags: TicketTag[] = ['Fraud', 'Urgent', 'VIP User', 'Refund', 'Technical']
  const escalationTypes: EscalationType[] = [null, 'Compliance', 'Finance']
  
  const userNames = [
    'John Doe',
    'Jane Smith',
    'Michael Johnson',
    'Sarah Williams',
    'David Brown',
    'Emily Davis',
    'Robert Wilson',
    'Lisa Anderson',
  ]

  const issueTitles = [
    'Transaction Failed',
    'Unable to Access Wallet',
    'KYC Verification Issue',
    'Escrow Payment Dispute',
    'Account Locked',
    'Refund Request',
    'Password Reset Issue',
    'Transaction Not Showing',
    'Wallet Balance Incorrect',
    'Payment Method Not Working',
  ]

  const descriptions = [
    'I tried to make a payment but it failed. The error message said insufficient funds but I have money in my wallet.',
    'I cannot access my wallet. It keeps showing an error when I try to log in.',
    'My KYC verification has been pending for over a week. Can you please check?',
    'I made an escrow payment but the merchant is not responding. I need help.',
    'My account was locked and I cannot access any features. Please help unlock it.',
    'I need a refund for a transaction that was completed incorrectly.',
    'I forgot my password and the reset link is not working.',
    'I made a transaction yesterday but it is not showing in my history.',
    'My wallet balance shows incorrect amount. I should have more money.',
    'I cannot add my payment method. The form keeps rejecting my card.',
  ]

  return Array.from({ length: 25 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const createdDate = subDays(new Date(), Math.floor(Math.random() * 30))
    const userName = userNames[i % userNames.length]
    const userEmail = `user${i + 1}@example.com`
    
    // Generate conversation messages
    const messages: SupportMessage[] = [
      {
        id: `msg_${i}_1`,
        type: 'user',
        content: descriptions[i % descriptions.length],
        sender: userName,
        timestamp: createdDate.toISOString(),
      },
    ]

    // Add support replies for in-progress or resolved tickets
    if (status === 'in_progress' || status === 'resolved' || status === 'closed') {
      messages.push({
        id: `msg_${i}_2`,
        type: 'support',
        content: 'Thank you for contacting us. We are looking into your issue and will get back to you shortly.',
        sender: 'Support Agent',
        timestamp: subHours(createdDate, -2).toISOString(),
      })
    }

    // Add user reply for waiting_on_user status
    if (status === 'waiting_on_user') {
      messages.push(
        {
          id: `msg_${i}_2`,
          type: 'support',
          content: 'We need some additional information to help resolve your issue. Please provide the transaction ID.',
          sender: 'Support Agent',
          timestamp: subHours(createdDate, -1).toISOString(),
        },
        {
          id: `msg_${i}_3`,
          type: 'user',
          content: 'The transaction ID is tx_123456789. Thank you for your help.',
          sender: userName,
          timestamp: subHours(createdDate, -0.5).toISOString(),
        }
      )
    }

    // Add internal note for some tickets
    if (Math.random() > 0.7) {
      messages.push({
        id: `msg_${i}_internal`,
        type: 'internal',
        content: 'This user has been flagged for review. Handle with care.',
        sender: 'Admin',
        timestamp: subHours(createdDate, -1.5).toISOString(),
      })
    }

    return {
      id: `ticket_${i + 1}`,
      userId: `user_${i + 1}`,
      userName,
      userEmail,
      title: issueTitles[i % issueTitles.length],
      description: descriptions[i % descriptions.length],
      category: categories[Math.floor(Math.random() * categories.length)],
      status,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      slaDeadline:
        status === 'open' || status === 'in_progress'
          ? subHours(createdDate, -24).toISOString()
          : undefined,
      assignedTo: status !== 'open' ? `admin_${Math.floor(Math.random() * 3) + 1}` : undefined,
      assignedToName:
        status !== 'open'
          ? ['Admin User 1', 'Admin User 2', 'Support Agent 1'][Math.floor(Math.random() * 3)]
          : undefined,
      createdAt: createdDate.toISOString(),
      updatedAt: subHours(createdDate, -Math.floor(Math.random() * 5)).toISOString(),
      relatedTransactionId: Math.random() > 0.5 ? `tx_${Math.random().toString(36).substr(2, 9)}` : undefined,
      tags: Math.random() > 0.6 ? [tags[Math.floor(Math.random() * tags.length)]] : [],
      escalatedTo: escalationTypes[Math.floor(Math.random() * escalationTypes.length)],
      messages,
      unread: Math.random() > 0.5,
    }
  })
}

const generateMockNotifications = (): Notification[] => {
  return [
    {
      id: 'notif_1',
      type: 'new_ticket',
      ticketId: 'ticket_1',
      ticketTitle: 'Transaction Failed',
      message: 'New ticket created: Transaction Failed',
      timestamp: subHours(new Date(), 1).toISOString(),
      read: false,
    },
    {
      id: 'notif_2',
      type: 'ticket_assigned',
      ticketId: 'ticket_5',
      ticketTitle: 'Unable to Access Wallet',
      message: 'Ticket assigned to you: Unable to Access Wallet',
      timestamp: subHours(new Date(), 2).toISOString(),
      read: false,
    },
    {
      id: 'notif_3',
      type: 'user_replied',
      ticketId: 'ticket_8',
      ticketTitle: 'KYC Verification Issue',
      message: 'User replied to ticket: KYC Verification Issue',
      timestamp: subHours(new Date(), 3).toISOString(),
      read: true,
    },
  ]
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SupportPage() {
  const router = useRouter()
  
  // State
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([])
  const [metrics, setMetrics] = useState<SupportMetrics>({
    totalTickets: 0,
    openTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    averageResponseTime: 0,
  })

  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
    variant?: 'default' | 'destructive'
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  })

  // Filter states
  const [filters, setFilters] = useState<{
    status: string
    priority: string
    category: string
  }>({
    status: 'all',
    priority: 'all',
    category: 'all',
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Mock admin users
  const adminUsers = [
    { id: 'admin_1', name: 'Admin User 1' },
    { id: 'admin_2', name: 'Admin User 2' },
    { id: 'admin_3', name: 'Support Agent 1' },
  ]

  // Initialize data
  useEffect(() => {
    setTimeout(() => {
      const mockTickets = generateMockTickets()
      setTickets(mockTickets)
      setNotifications(generateMockNotifications())
      
      // Calculate metrics
      const openTickets = mockTickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length
      const pendingTickets = mockTickets.filter((t) => t.status === 'waiting_on_user').length
      const resolvedTickets = mockTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length
      
      // Calculate average response time (mock)
      const avgResponseTime = mockTickets
        .filter((t) => t.status === 'resolved' || t.status === 'closed')
        .reduce((sum, t) => {
          const created = new Date(t.createdAt).getTime()
          const updated = new Date(t.updatedAt).getTime()
          return sum + (updated - created) / (1000 * 60 * 60) // hours
        }, 0) / resolvedTickets || 0

      setMetrics({
        totalTickets: mockTickets.length,
        openTickets,
        pendingTickets,
        resolvedTickets,
        averageResponseTime: Math.round(avgResponseTime * 10) / 10,
      })
      
      setLoading(false)
    }, 1000)
  }, [])

  // Add activity log entry
  const addActivityLog = (ticketId: string, action: string, actor: string, details?: string) => {
    const log: ActivityLogEntry = {
      id: `log_${Date.now()}`,
      ticketId,
      action,
      actor,
      timestamp: new Date().toISOString(),
      details,
    }
    setActivityLogs((prev) => [log, ...prev].slice(0, 100)) // Keep last 100 entries
  }

  // Ticket actions
  const handleAssignToSelf = (ticket: SupportTicket) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              assignedTo: 'admin_1',
              assignedToName: 'Admin User 1',
              status: t.status === 'open' ? 'in_progress' : t.status,
            }
          : t
      )
    )
    addActivityLog(ticket.id, 'Assigned to self', 'Admin User 1', `Ticket assigned to Admin User 1`)
    toast({
      title: 'Ticket Assigned',
      description: `Ticket ${ticket.id} has been assigned to you`,
    })
  }

  const handleChangeStatus = (ticket: SupportTicket, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    )
    addActivityLog(ticket.id, `Status changed to ${status}`, 'Admin User 1')
    toast({
      title: 'Status Updated',
      description: `Ticket status updated to ${status.replace('_', ' ')}`,
    })
  }

  const handleChangePriority = (ticket: SupportTicket, priority: TicketPriority) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, priority, updatedAt: new Date().toISOString() } : t))
    )
    addActivityLog(ticket.id, `Priority changed to ${priority}`, 'Admin User 1')
    toast({
      title: 'Priority Updated',
      description: `Ticket priority updated to ${priority}`,
    })
  }

  const handleSendReply = (ticket: SupportTicket) => {
    if (!replyMessage.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message',
        variant: 'destructive',
      })
      return
    }

    const newMessage: SupportMessage = {
      id: `msg_${Date.now()}`,
      type: 'support',
      content: replyMessage,
      sender: 'Admin User 1',
      timestamp: new Date().toISOString(),
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              messages: [...t.messages, newMessage],
              status: t.status === 'open' ? 'in_progress' : t.status,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    )
    addActivityLog(ticket.id, 'Reply sent', 'Admin User 1', replyMessage)
    
    // Add notification
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      type: 'user_replied',
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      message: `Support replied to ticket: ${ticket.title}`,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setNotifications((prev) => [notification, ...prev])
    
    toast({
      title: 'Reply Sent',
      description: 'Your reply has been sent to the user',
    })
    setReplyMessage('')
  }

  const handleAddInternalNote = (ticket: SupportTicket) => {
    if (!internalNote.trim()) {
      toast({
        title: 'Note Required',
        description: 'Please enter an internal note',
        variant: 'destructive',
      })
      return
    }

    const newMessage: SupportMessage = {
      id: `msg_${Date.now()}`,
      type: 'internal',
      content: internalNote,
      sender: 'Admin User 1',
      timestamp: new Date().toISOString(),
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id ? { ...t, messages: [...t.messages, newMessage] } : t
      )
    )
    addActivityLog(ticket.id, 'Internal note added', 'Admin User 1', internalNote)
    toast({
      title: 'Internal Note Added',
      description: 'Internal note has been added to the ticket',
    })
    setInternalNote('')
  }

  const handleEscalate = (ticket: SupportTicket, escalationType: 'Compliance' | 'Finance') => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              escalatedTo: escalationType,
              priority: 'urgent' as TicketPriority,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    )
    addActivityLog(ticket.id, `Escalated to ${escalationType}`, 'Admin User 1')
    toast({
      title: 'Ticket Escalated',
      description: `Ticket has been escalated to ${escalationType}`,
    })
  }

  const handleAddTag = (ticket: SupportTicket, tag: TicketTag) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              tags: t.tags?.includes(tag) ? t.tags : [...(t.tags || []), tag],
            }
          : t
      )
    )
    addActivityLog(ticket.id, `Tag added: ${tag}`, 'Admin User 1')
    toast({
      title: 'Tag Added',
      description: `Tag "${tag}" has been added to the ticket`,
    })
  }

  const handleRemoveTag = (ticket: SupportTicket, tag: TicketTag) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              tags: t.tags?.filter((t) => t !== tag),
            }
          : t
      )
    )
    addActivityLog(ticket.id, `Tag removed: ${tag}`, 'Admin User 1')
  }

  const handleCloseTicket = (ticket: SupportTicket) => {
    setConfirmDialog({
      open: true,
      title: 'Close Ticket',
      description: `Are you sure you want to close ticket ${ticket.id}? This action cannot be undone.`,
      variant: 'destructive',
      onConfirm: () => {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticket.id
              ? {
                  ...t,
                  status: 'closed' as TicketStatus,
                  updatedAt: new Date().toISOString(),
                }
              : t
          )
        )
        addActivityLog(ticket.id, 'Ticket closed', 'Admin User 1')
        toast({
          title: 'Ticket Closed',
          description: `Ticket ${ticket.id} has been closed`,
        })
        setConfirmDialog({ ...confirmDialog, open: false })
      },
    })
  }

  // Filtered data
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (filters.status !== 'all' && ticket.status !== filters.status) return false
      if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false
      if (filters.category !== 'all' && ticket.category !== filters.category) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !ticket.id.toLowerCase().includes(query) &&
          !ticket.userId.toLowerCase().includes(query) &&
          !ticket.userName.toLowerCase().includes(query) &&
          !ticket.title.toLowerCase().includes(query)
        )
          return false
      }
      return true
    })
  }, [tickets, filters, searchQuery])

  // Chart data
  const ticketTrendsData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      return {
        date: format(date, 'MMM d'),
        opened: Math.floor(Math.random() * 10) + 2,
        resolved: Math.floor(Math.random() * 8) + 1,
      }
    })
  }, [])

  // Table columns
  const ticketColumns: Column<SupportTicket>[] = [
    {
      key: 'id',
      header: 'Ticket ID',
      accessor: (ticket) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{ticket.id}</span>
          {ticket.unread && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'user',
      header: 'User',
      accessor: (ticket) => (
        <div>
          <div className="font-medium text-foreground">{ticket.userName}</div>
          <div className="text-xs text-muted-foreground font-mono">{ticket.userId}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'title',
      header: 'Issue',
      accessor: (ticket) => (
        <div>
          <div className="font-medium text-foreground">{ticket.title}</div>
          <div className="text-xs text-muted-foreground">{ticket.category}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (ticket) => {
        const colors = {
          open: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          waiting_on_user: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
          closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        }
        return (
          <Badge className={colors[ticket.status]}>
            {ticket.status.replace('_', ' ').charAt(0).toUpperCase() +
              ticket.status.replace('_', ' ').slice(1)}
          </Badge>
        )
      },
      sortable: true,
    },
    {
      key: 'priority',
      header: 'Priority',
      accessor: (ticket) => {
        const colors = {
          urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
          high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        }
        return <Badge className={colors[ticket.priority]}>{ticket.priority.toUpperCase()}</Badge>
      },
      sortable: true,
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      accessor: (ticket) => (
        <span className="text-sm text-muted-foreground">
          {ticket.assignedToName || 'Unassigned'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'createdAt',
      header: 'Created',
      accessor: (ticket) => (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(ticket.createdAt), 'MMM d, yyyy')}
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
          onClick={() => setSelectedTicket(ticket)}
          className="h-8"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const activityLogColumns: Column<ActivityLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      accessor: (log) => (
        <span className="text-sm text-muted-foreground">
          {format(parseISO(log.timestamp), 'MMM d, HH:mm:ss')}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'ticketId',
      header: 'Ticket ID',
      accessor: (log) => <span className="font-mono text-sm">{log.ticketId}</span>,
      sortable: true,
    },
    {
      key: 'action',
      header: 'Action',
      accessor: (log) => <span className="font-medium">{log.action}</span>,
      sortable: true,
    },
    {
      key: 'actor',
      header: 'Actor',
      accessor: (log) => <span className="text-sm">{log.actor}</span>,
      sortable: true,
    },
    {
      key: 'details',
      header: 'Details',
      accessor: (log) => (
        <span className="text-sm text-muted-foreground">{log.details || '—'}</span>
      ),
    },
  ]

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

  const availableTags: TicketTag[] = ['Fraud', 'Urgent', 'VIP User', 'Refund', 'Technical']

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-black min-h-screen">
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

      {/* Support Overview Metrics */}
      <div className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.totalTickets}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.openTickets}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.pendingTickets}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : metrics.resolvedTickets}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {loading ? <Skeleton className="h-8 w-16" /> : `${metrics.averageResponseTime}h`}
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Ticket Trends Chart */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Ticket Activity Overview
          </CardTitle>
          <CardDescription>Daily ticket volume trends: opened vs resolved tickets over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-semibold text-foreground">Ticket Volume Trends</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Visual representation of daily ticket creation and resolution patterns over the past week
                </p>
              </div>
              <EnhancedLineChart
                data={ticketTrendsData}
                dataKeys={[
                  { key: 'opened', name: 'Opened', color: '#f59e0b' },
                  { key: 'resolved', name: 'Resolved', color: '#10b981' },
                ]}
                xAxisKey="date"
                height={300}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Queue */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                Support Ticket Management
              </CardTitle>
              <CardDescription>Complete list of customer support tickets with status, priority, and assignment details</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-48 bg-black border-slate-200 dark:border-slate-700"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-32 bg-black border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_on_user">Waiting on User</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger className="w-32 bg-black border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger className="w-36 bg-black border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Payments">Payments</SelectItem>
                  <SelectItem value="KYC">KYC</SelectItem>
                  <SelectItem value="Wallet">Wallet</SelectItem>
                  <SelectItem value="Escrow">Escrow</SelectItem>
                  <SelectItem value="Account">Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-semibold text-foreground">Support Ticket Registry</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Comprehensive view of all support tickets with filtering, sorting, and search capabilities
                </p>
              </div>
              <DataTable
                data={filteredTickets}
                columns={ticketColumns}
                pagination={{ pageSize: 10 }}
                emptyMessage="No tickets found"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-400" />
            Support Notifications
          </CardTitle>
          <CardDescription>Recent ticket updates and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-semibold text-foreground">Notification Feed</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time updates on ticket assignments, user replies, and new ticket creation
                </p>
              </div>
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`border rounded-lg p-3 flex items-start justify-between ${
                      notif.read
                        ? 'border-slate-200 dark:border-slate-800 bg-black'
                        : 'border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            notif.type === 'new_ticket'
                              ? 'default'
                              : notif.type === 'ticket_assigned'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {notif.type === 'new_ticket'
                            ? 'New Ticket'
                            : notif.type === 'ticket_assigned'
                            ? 'Assigned'
                            : 'User Replied'}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">{notif.message}</span>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(notif.timestamp), 'MMM d, HH:mm')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === notif.id ? { ...n, read: !n.read } : n))
                        )
                      }}
                      className="h-8"
                    >
                      {notif.read ? 'Mark Unread' : 'Mark Read'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-5xl bg-black border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                {selectedTicket.title} - {selectedTicket.id}
              </DialogTitle>
              <DialogDescription>Support ticket details and conversation</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <div className="mt-1">
                    <p className="font-medium">{selectedTicket.userName}</p>
                    <p className="text-sm text-muted-foreground font-mono">{selectedTicket.userId}</p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.userEmail}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedTicket.category}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1 flex gap-2">
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) =>
                        handleChangeStatus(selectedTicket, value as TicketStatus)
                      }
                    >
                      <SelectTrigger className="w-40 bg-black border-slate-200 dark:border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="waiting_on_user">Waiting on User</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <div className="mt-1 flex gap-2">
                    <Select
                      value={selectedTicket.priority}
                      onValueChange={(value) =>
                        handleChangePriority(selectedTicket, value as TicketPriority)
                      }
                    >
                      <SelectTrigger className="w-32 bg-black border-slate-200 dark:border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Assigned To</Label>
                  <div className="mt-1">
                    <p className="text-sm">
                      {selectedTicket.assignedToName || 'Unassigned'}
                    </p>
                    {!selectedTicket.assignedTo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignToSelf(selectedTicket)}
                        className="mt-2"
                      >
                        Assign to Self
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">SLA</Label>
                  <div className="mt-1">
                    {getSLABadge(selectedTicket.slaDeadline)}
                    {selectedTicket.slaDeadline && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(selectedTicket.slaDeadline), 'MMM d, HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
                {selectedTicket.escalatedTo && (
                  <div>
                    <Label className="text-muted-foreground">Escalated To</Label>
                    <Badge variant="destructive" className="mt-1">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      {selectedTicket.escalatedTo}
                    </Badge>
                  </div>
                )}
                {selectedTicket.relatedTransactionId && (
                  <div>
                    <Label className="text-muted-foreground">Related Transaction</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-mono">{selectedTicket.relatedTransactionId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/transactions?id=${selectedTicket.relatedTransactionId}`)
                        }
                        className="h-6"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <Label className="text-muted-foreground mb-2">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTicket.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(selectedTicket, tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter((tag) => !selectedTicket.tags?.includes(tag))
                    .map((tag) => (
                      <Button
                        key={tag}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTag(selectedTicket, tag)}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Button>
                    ))}
                </div>
              </div>

              {/* Escalation */}
              <div>
                <Label className="text-muted-foreground mb-2">Escalation</Label>
                <div className="flex gap-2">
                  {!selectedTicket.escalatedTo && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEscalate(selectedTicket, 'Compliance')}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Escalate to Compliance
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEscalate(selectedTicket, 'Finance')}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Escalate to Finance
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Conversation Thread */}
              <div>
                <Label className="text-muted-foreground mb-2">Conversation</Label>
                <div className="border rounded-lg p-4 bg-black max-h-96 overflow-y-auto space-y-4">
                  {selectedTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === 'user'
                          ? 'justify-start'
                          : message.type === 'support'
                          ? 'justify-end'
                          : 'justify-center'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-blue-500/10 border border-blue-500/20'
                            : message.type === 'support'
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-yellow-500/10 border border-yellow-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {message.type === 'user'
                              ? message.sender
                              : message.type === 'support'
                              ? message.sender
                              : 'Internal Note'}
                          </span>
                          {message.type === 'internal' && (
                            <Badge variant="outline" className="text-xs">
                              Internal
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(parseISO(message.timestamp), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Section */}
              <div>
                <Label className="text-muted-foreground mb-2">Reply to User</Label>
                <Textarea
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="bg-black border-slate-200 dark:border-slate-700 mb-2"
                  rows={3}
                />
                <Button onClick={() => handleSendReply(selectedTicket)}>
                  <Send className="h-4 w-4 mr-1" />
                  Send Reply
                </Button>
              </div>

              {/* Internal Note Section */}
              <div>
                <Label className="text-muted-foreground mb-2">Internal Note</Label>
                <Textarea
                  placeholder="Add an internal note (not visible to user)..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="bg-black border-slate-200 dark:border-slate-700 mb-2"
                  rows={2}
                />
                <Button variant="outline" onClick={() => handleAddInternalNote(selectedTicket)}>
                  <FileText className="h-4 w-4 mr-1" />
                  Add Internal Note
                </Button>
              </div>
            </div>
            <DialogFooter className="flex-wrap gap-2">
              <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                Close
              </Button>
              {selectedTicket.status !== 'closed' && (
                <Button variant="destructive" onClick={() => handleCloseTicket(selectedTicket)}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Close Ticket
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Support Activity Log */}
      <Card className="bg-black border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Support Activity Log
          </CardTitle>
          <CardDescription>Record of all support actions and changes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : activityLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p>No activity log entries yet</p>
              <p className="text-sm">Actions will be logged here as you interact with tickets</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-semibold text-foreground">Activity History</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete audit trail of all support actions, status changes, and ticket modifications
                </p>
              </div>
              <DataTable
                data={activityLogs}
                columns={activityLogColumns}
                pagination={{ pageSize: 10 }}
                emptyMessage="No activity log entries"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ActionButton } from '@/components/admin/ActionButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiGetNotifications, apiDeleteNotification, apiCancelNotification } from '@/lib/api/notifications'
import { PERMISSIONS } from '@/lib/auth/permissions'
import type { Notification } from '@/lib/types/notification'
import { Plus, Trash2, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await apiGetNotifications({ limit: 100 })
      setNotifications(response.data)
    } catch (error) {
      console.error('Failed to load notifications:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load notifications',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await apiDeleteNotification(notificationId)
      toast({
        title: 'Success',
        description: 'Notification deleted successfully',
      })
      loadNotifications()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete notification',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = async (notificationId: string) => {
    try {
      await apiCancelNotification(notificationId)
      toast({
        title: 'Success',
        description: 'Notification cancelled successfully',
      })
      loadNotifications()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel notification',
        variant: 'destructive',
      })
    }
  }

  const columns: Column<Notification>[] = [
    {
      key: 'title',
      header: 'Title',
      accessor: (notification) => (
        <div>
          <div className="font-medium text-white">{notification.title}</div>
          <div className="text-sm text-slate-400">{notification.message.substring(0, 50)}...</div>
        </div>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      accessor: (notification) => (
        <span className="text-slate-300 capitalize">{notification.channel}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (notification) => <StatusBadge status={notification.status} />,
    },
    {
      key: 'recipients',
      header: 'Recipients',
      accessor: (notification) => (
        <span className="text-slate-300">{notification.recipients.length} recipients</span>
      ),
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      accessor: (notification) => (
        <span className="text-slate-400">
          {notification.scheduledAt
            ? format(new Date(notification.scheduledAt), 'MMM d, yyyy HH:mm')
            : 'Immediate'}
        </span>
      ),
    },
    {
      key: 'sentAt',
      header: 'Sent',
      accessor: (notification) => (
        <span className="text-slate-400">
          {notification.sentAt
            ? format(new Date(notification.sentAt), 'MMM d, yyyy HH:mm')
            : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (notification) => (
        <div className="flex items-center gap-2">
          {notification.status === 'scheduled' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleCancel(notification.id)
              }}
              className="h-8 w-8 text-yellow-400 hover:text-yellow-300"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <ActionButton
            permission={PERMISSIONS.DELETE_NOTIFICATIONS}
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(notification.id)
            }}
            className="h-8 w-8 text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </ActionButton>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-900/50">
      <PageHeader
        title="Notifications"
        description="Manage and send notifications to users"
        action={{
          label: 'Send Notification',
          onClick: () => router.push('/admin/notifications/create'),
          icon: <Plus className="h-4 w-4 mr-2" />,
        }}
      />

      <Card className="bg-black border-slate-800">
        <CardContent className="p-6">
          <DataTable
            data={notifications}
            columns={columns}
            searchable
            searchPlaceholder="Search notifications..."
            pagination={{ pageSize: 25 }}
            emptyMessage="No notifications found"
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}


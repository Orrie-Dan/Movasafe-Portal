// Notification types

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app'

export type NotificationStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'

export interface Notification {
  id: string
  title: string
  message: string
  channel: NotificationChannel
  status: NotificationStatus
  recipients: NotificationRecipient[]
  templateId?: string
  scheduledAt?: string
  sentAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
}

export interface NotificationRecipient {
  userId?: string
  email?: string
  phone?: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  deliveredAt?: string
  errorMessage?: string
}

export interface CreateNotificationRequest {
  title: string
  message: string
  channel: NotificationChannel
  recipientIds?: string[]
  recipientEmails?: string[]
  recipientPhones?: string[]
  templateId?: string
  scheduledAt?: string
  metadata?: Record<string, any>
}

export interface NotificationTemplate {
  id: string
  name: string
  description?: string
  channel: NotificationChannel
  subject?: string
  body: string
  variables?: string[]
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateRequest {
  name: string
  description?: string
  channel: NotificationChannel
  subject?: string
  body: string
  variables?: string[]
}

export interface NotificationListParams {
  page?: number
  limit?: number
  status?: NotificationStatus
  channel?: NotificationChannel
  startDate?: string
  endDate?: string
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

export interface NotificationListResponse {
  data: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface NotificationStats {
  total: number
  byStatus: Record<NotificationStatus, number>
  byChannel: Record<NotificationChannel, number>
  deliveryRate: number
  failureRate: number
}


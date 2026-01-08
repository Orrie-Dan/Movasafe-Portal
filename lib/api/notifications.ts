// Notification API functions

import { getToken } from './auth'
import type {
  Notification,
  CreateNotificationRequest,
  NotificationTemplate,
  CreateTemplateRequest,
  NotificationListParams,
  NotificationListResponse,
  NotificationStats,
} from '@/lib/types/notification'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized')
    }
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export async function apiGetNotifications(params?: NotificationListParams): Promise<NotificationListResponse> {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })
  }
  const queryString = queryParams.toString()
  return apiRequest<NotificationListResponse>(`/admin/notifications${queryString ? `?${queryString}` : ''}`)
}

export async function apiGetNotification(notificationId: string): Promise<{ notification: Notification }> {
  return apiRequest<{ notification: Notification }>(`/admin/notifications/${notificationId}`)
}

export async function apiCreateNotification(data: CreateNotificationRequest): Promise<{ notification: Notification }> {
  return apiRequest<{ notification: Notification }>('/admin/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiDeleteNotification(notificationId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/admin/notifications/${notificationId}`, {
    method: 'DELETE',
  })
}

export async function apiCancelNotification(notificationId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/admin/notifications/${notificationId}/cancel`, {
    method: 'POST',
  })
}

export async function apiGetNotificationStats(params?: { startDate?: string; endDate?: string }): Promise<NotificationStats> {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
  }
  const queryString = queryParams.toString()
  return apiRequest<NotificationStats>(`/admin/notifications/stats${queryString ? `?${queryString}` : ''}`)
}

// Template management
export async function apiGetTemplates(): Promise<{ templates: NotificationTemplate[] }> {
  return apiRequest<{ templates: NotificationTemplate[] }>('/admin/notifications/templates')
}

export async function apiGetTemplate(templateId: string): Promise<{ template: NotificationTemplate }> {
  return apiRequest<{ template: NotificationTemplate }>(`/admin/notifications/templates/${templateId}`)
}

export async function apiCreateTemplate(data: CreateTemplateRequest): Promise<{ template: NotificationTemplate }> {
  return apiRequest<{ template: NotificationTemplate }>('/admin/notifications/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiUpdateTemplate(templateId: string, data: Partial<CreateTemplateRequest>): Promise<{ template: NotificationTemplate }> {
  return apiRequest<{ template: NotificationTemplate }>(`/admin/notifications/templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function apiDeleteTemplate(templateId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/admin/notifications/templates/${templateId}`, {
    method: 'DELETE',
  })
}


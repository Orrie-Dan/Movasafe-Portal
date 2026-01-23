'use client'

import { useState, useCallback } from 'react'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const refresh = useCallback(async () => {
    setLoading(true)
    // minimal placeholder: no-op fetch
    setTimeout(() => setLoading(false), 200)
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading,
    refresh,
  }
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getUserNotifications,
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
  deleteNotification as deleteNotificationAction,
  getUnreadCount
} from '@/actions/notifications'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Notification = Database['public']['Tables']['notifications']['Row']

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  // Mark as read - optimistic update
  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
    try {
      await markAsReadAction(id)
    } catch {
      // Revert on failure
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: null } : n)
      )
      setUnreadCount(prev => prev + 1)
    }
  }, [])

  // Mark all as read - optimistic update
  const markAllAsRead = useCallback(async () => {
    const previousNotifications = notifications
    const previousUnreadCount = unreadCount
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    )
    setUnreadCount(0)
    try {
      await markAllAsReadAction()
    } catch {
      // Revert on failure
      setNotifications(previousNotifications)
      setUnreadCount(previousUnreadCount)
    }
  }, [notifications, unreadCount])

  // Delete notification - optimistic update
  const deleteNotification = useCallback(async (id: string) => {
    const notification = notifications.find(n => n.id === id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (notification && !notification.read_at) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    try {
      await deleteNotificationAction(id)
    } catch {
      // Revert on failure
      if (notification) {
        setNotifications(prev => [...prev, notification].sort(
          (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        ))
        if (!notification.read_at) {
          setUnreadCount(prev => prev + 1)
        }
      }
    }
  }, [notifications])

  // Fetch more (pagination)
  const fetchMore = useCallback(async () => {
    const data = await getUserNotifications(20, notifications.length)
    if (data.length < 20) setHasMore(false)
    setNotifications(prev => [...prev, ...data])
  }, [notifications.length])

  // Initial fetch + realtime subscription
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        const [data, count] = await Promise.all([
          getUserNotifications(20, 0),
          getUnreadCount()
        ])
        setNotifications(data)
        setUnreadCount(count)
        if (data.length < 20) setHasMore(false)
      } finally {
        setIsLoading(false)
      }
    }

    init()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev =>
            prev.some(n => n.id === newNotification.id)
              ? prev
              : [newNotification, ...prev]
          )
          setUnreadCount(prev => prev + 1)
          toast(newNotification.title, {
            description: newNotification.body || undefined
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchMore
  }
}

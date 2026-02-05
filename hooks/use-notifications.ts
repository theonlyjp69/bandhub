'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const isFetchingMore = useRef(false)

  const supabase = useMemo(() => createClient(), [])

  // Mark as read - optimistic update (checks if already read)
  const markAsRead = useCallback(async (id: string) => {
    let wasUnread = false
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id && !n.read_at) {
          wasUnread = true
          return { ...n, read_at: new Date().toISOString() }
        }
        return n
      })
    )
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    try {
      await markAsReadAction(id)
    } catch {
      if (wasUnread) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read_at: null } : n)
        )
        setUnreadCount(prev => prev + 1)
      }
    }
  }, [])

  // Mark all as read - captures snapshot via functional updater to avoid stale closure
  const markAllAsRead = useCallback(async () => {
    let snapshot: Notification[] = []
    let prevUnread = 0
    setNotifications(prev => {
      snapshot = prev
      return prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    })
    setUnreadCount(prev => {
      prevUnread = prev
      return 0
    })
    try {
      await markAllAsReadAction()
    } catch {
      setNotifications(snapshot)
      setUnreadCount(prevUnread)
    }
  }, [])

  // Delete notification - captures removed item via functional updater
  const deleteNotification = useCallback(async (id: string) => {
    let removed: Notification | undefined
    setNotifications(prev => {
      removed = prev.find(n => n.id === id)
      return prev.filter(n => n.id !== id)
    })
    if (removed && !removed.read_at) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    try {
      await deleteNotificationAction(id)
    } catch {
      if (removed) {
        setNotifications(prev => [...prev, removed!].sort(
          (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        ))
        if (!removed.read_at) {
          setUnreadCount(prev => prev + 1)
        }
      }
    }
  }, [])

  // Track current length via ref to avoid stale closure in fetchMore
  const notificationsLengthRef = useRef(0)
  notificationsLengthRef.current = notifications.length

  // Fetch more (pagination) with concurrent call guard
  const fetchMore = useCallback(async () => {
    if (isFetchingMore.current) return
    isFetchingMore.current = true
    try {
      const data = await getUserNotifications(20, notificationsLengthRef.current)
      if (data.length < 20) setHasMore(false)
      setNotifications(prev => [...prev, ...data])
    } finally {
      isFetchingMore.current = false
    }
  }, [])

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
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const updated = payload.new as Notification
          setNotifications(prev => {
            const existing = prev.find(n => n.id === updated.id)
            // Decrement unread if this notification was unread and is now read
            if (existing && !existing.read_at && updated.read_at) {
              setUnreadCount(c => Math.max(0, c - 1))
            }
            return prev.map(n => n.id === updated.id ? updated : n)
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

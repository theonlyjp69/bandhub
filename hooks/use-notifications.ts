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

export type Notification = Database['public']['Tables']['notifications']['Row']

const PAGE_SIZE = 20

function sortByCreatedAtDesc(a: Notification, b: Notification): number {
  return new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime()
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const isFetchingMore = useRef(false)

  const supabase = useMemo(() => createClient(), [])

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

  const markAllAsRead = useCallback(async () => {
    let snapshot: Notification[] = []
    let prevUnread = 0
    setNotifications(prev => {
      snapshot = prev
      return prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
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
        setNotifications(prev => [...prev, removed!].sort(sortByCreatedAtDesc))
        if (!removed.read_at) {
          setUnreadCount(prev => prev + 1)
        }
      }
    }
  }, [])

  const notificationsLengthRef = useRef(0)
  notificationsLengthRef.current = notifications.length

  const fetchMore = useCallback(async () => {
    if (isFetchingMore.current) return
    isFetchingMore.current = true
    try {
      const data = await getUserNotifications(PAGE_SIZE, notificationsLengthRef.current)
      if (data.length < PAGE_SIZE) setHasMore(false)
      setNotifications(prev => [...prev, ...data])
    } finally {
      isFetchingMore.current = false
    }
  }, [])

  useEffect(() => {
    async function init() {
      setIsLoading(true)
      try {
        const [data, count] = await Promise.all([
          getUserNotifications(PAGE_SIZE, 0),
          getUnreadCount()
        ])
        setNotifications(data)
        setUnreadCount(count)
        if (data.length < PAGE_SIZE) setHasMore(false)
      } finally {
        setIsLoading(false)
      }
    }

    init()

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
          const incoming = payload.new as Notification
          setNotifications(prev =>
            prev.some(n => n.id === incoming.id)
              ? prev
              : [incoming, ...prev]
          )
          setUnreadCount(prev => prev + 1)
          toast(incoming.title, {
            description: incoming.body ?? undefined
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

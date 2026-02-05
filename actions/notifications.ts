'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

interface CreateNotificationInput {
  userId: string
  type: string
  title: string
  body?: string
  link?: string
  data?: Json
}

/**
 * Get paginated notifications for the current user.
 */
export async function getUserNotifications(limit = 20, offset = 0) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (limit < 1 || limit > 100) throw new Error('Invalid limit')
  if (offset < 0) throw new Error('Invalid offset')

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error('Failed to fetch notifications')
  return data
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!notificationId || typeof notificationId !== 'string') throw new Error('Invalid input')

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to mark as read')
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) throw new Error('Failed to mark all as read')
}

/**
 * Get the count of unread notifications for the current user.
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) throw new Error('Failed to get unread count')
  return count || 0
}

/**
 * Delete a notification.
 */
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!notificationId || typeof notificationId !== 'string') throw new Error('Invalid input')

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to delete notification')
}

/**
 * Create a notification for a user.
 * Uses service role client to bypass RLS.
 */
export async function createNotification(input: CreateNotificationInput) {
  if (!input.userId || !input.type || !input.title) {
    throw new Error('Invalid notification input')
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      data: input.data
    })
    .select()
    .single()

  if (error) throw new Error('Failed to create notification')
  return data
}

/**
 * Notify all band members about an event.
 * Respects visibility settings for private events.
 */
export async function notifyBandMembers(
  bandId: string,
  type: string,
  data: {
    title: string
    body?: string
    link?: string
    eventId?: string
    excludeUserId?: string
    visibility?: 'band' | 'private'
    visibleUserIds?: string[]
  }
) {
  if (!bandId || !type || !data.title) {
    throw new Error('Invalid notification input')
  }

  const supabase = createServiceClient()

  // Get band members
  const { data: members, error: membersError } = await supabase
    .from('band_members')
    .select('user_id')
    .eq('band_id', bandId)

  if (membersError) throw new Error('Failed to fetch band members')
  if (!members || members.length === 0) return

  // Filter by visibility if private
  let recipientIds = members.map(m => m.user_id).filter((id): id is string => id !== null)

  if (data.visibility === 'private' && data.visibleUserIds) {
    recipientIds = recipientIds.filter(id => data.visibleUserIds!.includes(id))
  }

  // Exclude the specified user (usually the creator)
  if (data.excludeUserId) {
    recipientIds = recipientIds.filter(id => id !== data.excludeUserId)
  }

  if (recipientIds.length === 0) return

  // Check preferences for each user
  const { data: preferences } = await supabase
    .from('notification_preferences')
    .select('user_id, event_created, event_updated')
    .in('user_id', recipientIds)

  const prefsMap = new Map(preferences?.map(p => [p.user_id, p]) || [])

  // Filter based on notification type and preferences
  const filteredRecipients = recipientIds.filter(userId => {
    const prefs = prefsMap.get(userId)
    if (!prefs) return true // Default to sending if no preferences set

    if (type === 'event_created') return prefs.event_created !== false
    if (type === 'event_updated' || type === 'event_cancelled') return prefs.event_updated !== false
    return true
  })

  if (filteredRecipients.length === 0) return

  // Create notifications for all recipients
  const notifications = filteredRecipients.map(userId => ({
    user_id: userId,
    type,
    title: data.title,
    body: data.body,
    link: data.link,
    data: data.eventId ? { eventId: data.eventId } as Json : null
  }))

  const { error: insertError } = await supabase
    .from('notifications')
    .insert(notifications)

  if (insertError) throw new Error('Failed to create notifications')
}

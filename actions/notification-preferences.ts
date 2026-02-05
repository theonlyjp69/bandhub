'use server'

import { createClient } from '@/lib/supabase/server'

export interface NotificationPreferences {
  eventCreated: boolean
  eventUpdated: boolean
  rsvpReminder: boolean
  pollReminder: boolean
  pushEnabled: boolean
}

/**
 * Get notification preferences for the current user.
 * Creates default preferences if none exist.
 */
export async function getPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Try to get existing preferences
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (data) {
    return {
      eventCreated: data.event_created ?? true,
      eventUpdated: data.event_updated ?? true,
      rsvpReminder: data.rsvp_reminder ?? true,
      pollReminder: data.poll_reminder ?? true,
      pushEnabled: data.push_enabled ?? false
    }
  }

  // Create default preferences
  const { error } = await supabase
    .from('notification_preferences')
    .insert({ user_id: user.id })

  if (error) throw new Error('Failed to create preferences')

  return {
    eventCreated: true,
    eventUpdated: true,
    rsvpReminder: true,
    pollReminder: true,
    pushEnabled: false
  }
}

/**
 * Update notification preferences for the current user.
 */
export async function updatePreferences(prefs: Partial<NotificationPreferences>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Validate input
  const validKeys = ['eventCreated', 'eventUpdated', 'rsvpReminder', 'pollReminder', 'pushEnabled']
  const invalidKeys = Object.keys(prefs).filter(k => !validKeys.includes(k))
  if (invalidKeys.length > 0) throw new Error('Invalid preference keys')

  // Convert to snake_case for database
  const updates: Record<string, boolean | string> = {
    updated_at: new Date().toISOString()
  }

  if (prefs.eventCreated !== undefined) updates.event_created = prefs.eventCreated
  if (prefs.eventUpdated !== undefined) updates.event_updated = prefs.eventUpdated
  if (prefs.rsvpReminder !== undefined) updates.rsvp_reminder = prefs.rsvpReminder
  if (prefs.pollReminder !== undefined) updates.poll_reminder = prefs.pollReminder
  if (prefs.pushEnabled !== undefined) updates.push_enabled = prefs.pushEnabled

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: user.id,
      ...updates
    }, {
      onConflict: 'user_id'
    })

  if (error) throw new Error('Failed to update preferences')
}

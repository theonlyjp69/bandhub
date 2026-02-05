import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushNotification } from '@/actions/push'
import type { Database } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cron job endpoint for sending RSVP and poll deadline reminders.
 * Runs every 6 hours via Vercel cron.
 * Protected by CRON_SECRET environment variable.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role client to bypass RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  let rsvpReminders = 0
  let pollReminders = 0

  // Query for RSVP deadlines approaching
  const { data: rsvpEvents } = await supabase
    .from('events')
    .select('id, band_id, title, rsvp_deadline')
    .eq('mode', 'fixed')
    .eq('status', 'open')
    .not('rsvp_deadline', 'is', null)
    .is('reminder_sent_at', null)
    .lte('rsvp_deadline', twentyFourHoursFromNow.toISOString())
    .gt('rsvp_deadline', now.toISOString())

  // Query for poll deadlines approaching
  const { data: pollEvents } = await supabase
    .from('events')
    .select('id, band_id, title, poll_closes_at')
    .eq('mode', 'poll')
    .eq('status', 'open')
    .not('poll_closes_at', 'is', null)
    .is('reminder_sent_at', null)
    .lte('poll_closes_at', twentyFourHoursFromNow.toISOString())
    .gt('poll_closes_at', now.toISOString())

  // Process RSVP reminders
  for (const event of rsvpEvents || []) {
    if (!event.band_id) continue

    // Get band members who haven't RSVPd
    const { data: members } = await supabase
      .from('band_members')
      .select('user_id')
      .eq('band_id', event.band_id)

    const { data: rsvps } = await supabase
      .from('event_rsvps')
      .select('user_id')
      .eq('event_id', event.id)

    const rsvpUserIds = new Set(rsvps?.map(r => r.user_id) || [])
    const nonResponders = members?.filter(m => m.user_id && !rsvpUserIds.has(m.user_id)) || []

    // Get preferences for non-responders
    const nonResponderIds = nonResponders.map(m => m.user_id).filter((id): id is string => id !== null)
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('user_id, rsvp_reminder')
      .in('user_id', nonResponderIds)

    const prefsMap = new Map(preferences?.map(p => [p.user_id, p.rsvp_reminder]) || [])

    // Create notifications for those who want reminders
    const notifications = nonResponderIds
      .filter(userId => prefsMap.get(userId) !== false)
      .map(userId => ({
        user_id: userId,
        type: 'rsvp_reminder',
        title: `RSVP deadline approaching: ${event.title}`,
        body: 'Please respond before the deadline',
        link: `/band/${event.band_id}/events/${event.id}`,
        data: { eventId: event.id }
      }))

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)
      rsvpReminders += notifications.length

      // Send push notifications for RSVP reminders
      for (const n of notifications) {
        try {
          await sendPushNotification(n.user_id, {
            title: n.title,
            body: n.body,
            data: { link: n.link, eventId: event.id, type: 'rsvp_reminder' }
          })
        } catch {
          // Push failures must not break the cron flow
        }
      }
    }

    // Mark reminder as sent
    await supabase
      .from('events')
      .update({ reminder_sent_at: now.toISOString() })
      .eq('id', event.id)
  }

  // Process poll reminders
  for (const event of pollEvents || []) {
    if (!event.band_id) continue

    // Get band members who haven't voted
    const { data: members } = await supabase
      .from('band_members')
      .select('user_id')
      .eq('band_id', event.band_id)

    const { data: votes } = await supabase
      .from('poll_votes')
      .select('user_id')
      .eq('event_id', event.id)

    const votedUserIds = new Set(votes?.map(v => v.user_id) || [])
    const nonVoters = members?.filter(m => m.user_id && !votedUserIds.has(m.user_id)) || []

    // Get preferences for non-voters
    const nonVoterIds = nonVoters.map(m => m.user_id).filter((id): id is string => id !== null)
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('user_id, poll_reminder')
      .in('user_id', nonVoterIds)

    const prefsMap = new Map(preferences?.map(p => [p.user_id, p.poll_reminder]) || [])

    // Create notifications for those who want reminders
    const notifications = nonVoterIds
      .filter(userId => prefsMap.get(userId) !== false)
      .map(userId => ({
        user_id: userId,
        type: 'poll_reminder',
        title: `Poll closing soon: ${event.title}`,
        body: 'Vote on your availability before the poll closes',
        link: `/band/${event.band_id}/events/${event.id}`,
        data: { eventId: event.id }
      }))

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)
      pollReminders += notifications.length

      // Send push notifications for poll reminders
      for (const n of notifications) {
        try {
          await sendPushNotification(n.user_id, {
            title: n.title,
            body: n.body,
            data: { link: n.link, eventId: event.id, type: 'poll_reminder' }
          })
        } catch {
          // Push failures must not break the cron flow
        }
      }
    }

    // Mark reminder as sent
    await supabase
      .from('events')
      .update({ reminder_sent_at: now.toISOString() })
      .eq('id', event.id)
  }

  return NextResponse.json({
    success: true,
    rsvpReminders,
    pollReminders,
    timestamp: now.toISOString()
  })
}

'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

interface PushSubscriptionKeys {
  p256dh: string
  auth: string
}

interface PushSubscriptionInput {
  endpoint: string
  keys: PushSubscriptionKeys
}

interface PushPayload {
  title: string
  body?: string
  icon?: string
  badge?: string
  data?: Record<string, unknown>
}

/**
 * Get the VAPID public key for the client to subscribe to push notifications.
 */
export async function getVapidPublicKey(): Promise<string | undefined> {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
}

/**
 * Save a push subscription for the current user.
 */
export async function subscribeToPush(subscription: PushSubscriptionInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error('Invalid subscription')
  }

  // Upsert the subscription (endpoint is unique)
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      keys: subscription.keys as unknown as Json
    }, {
      onConflict: 'endpoint'
    })

  if (error) throw new Error('Failed to save subscription')

  // Enable push in notification preferences
  await supabase
    .from('notification_preferences')
    .upsert({
      user_id: user.id,
      push_enabled: true
    }, {
      onConflict: 'user_id'
    })
}

/**
 * Remove a push subscription.
 */
export async function unsubscribeFromPush(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!endpoint || typeof endpoint !== 'string') throw new Error('Invalid endpoint')

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to remove subscription')
}

/**
 * Send a push notification to a user.
 * This function requires the web-push package and VAPID keys to be configured.
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!userId || !payload?.title) {
    throw new Error('Invalid push notification input')
  }

  // Check if VAPID keys are configured
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL

  if (!publicKey || !privateKey || !email) {
    // Push notifications not configured, skip silently
    console.log('Push notifications not configured, skipping')
    return
  }

  const supabase = createServiceClient()

  // Check if user has push enabled
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('push_enabled')
    .eq('user_id', userId)
    .single()

  if (!prefs?.push_enabled) return

  // Get user's push subscriptions
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys')
    .eq('user_id', userId)

  if (!subscriptions || subscriptions.length === 0) return

  // Import web-push
  const webPush = await import('web-push')

  // Configure VAPID details
  webPush.setVapidDetails(`mailto:${email}`, publicKey, privateKey)

  // Send to all subscriptions
  const sendPromises = subscriptions.map(async (sub) => {
    try {
      const keys = sub.keys as unknown as PushSubscriptionKeys
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: keys.p256dh,
            auth: keys.auth
          }
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icon-192.png',
          badge: payload.badge || '/badge.png',
          data: payload.data
        })
      )
    } catch (err) {
      // If subscription is expired or invalid, remove it
      if (err && typeof err === 'object' && 'statusCode' in err) {
        const statusCode = (err as { statusCode: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
      }
    }
  })

  await Promise.all(sendPromises)
}

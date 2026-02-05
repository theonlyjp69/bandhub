'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getVapidPublicKey, subscribeToPush, unsubscribeFromPush } from '@/actions/push'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const registering = useRef(false)

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)

    if (!supported) return

    // Register service worker
    if (!registering.current) {
      registering.current = true
      navigator.serviceWorker.register('/sw.js')
        .then(reg => setRegistration(reg))
        .catch(() => { /* SW registration failed, push won't work */ })
    }
  }, [])

  const registerPush = useCallback(async (): Promise<boolean> => {
    if (!registration) return false

    // Request notification permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    // Get VAPID public key
    const vapidKey = await getVapidPublicKey()
    if (!vapidKey) return false

    // Subscribe to push
    const applicationServerKey = urlBase64ToUint8Array(vapidKey)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer
    })

    // Extract keys and save to server
    const json = subscription.toJSON()
    if (!json.endpoint || !json.keys) return false

    await subscribeToPush({
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys.p256dh!,
        auth: json.keys.auth!
      }
    })

    return true
  }, [registration])

  const unregisterPush = useCallback(async (): Promise<void> => {
    if (!registration) return

    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await unsubscribeFromPush(subscription.endpoint)
      await subscription.unsubscribe()
    }
  }, [registration])

  return { registration, isSupported, registerPush, unregisterPush }
}

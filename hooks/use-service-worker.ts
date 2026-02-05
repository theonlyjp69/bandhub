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

const IS_PUSH_SUPPORTED =
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const didRegister = useRef(false)

  useEffect(() => {
    if (!IS_PUSH_SUPPORTED || didRegister.current) return
    didRegister.current = true

    navigator.serviceWorker.register('/sw.js')
      .then(setRegistration)
      .catch(() => {})
  }, [])

  const registerPush = useCallback(async (): Promise<boolean> => {
    if (!registration) return false

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const vapidKey = await getVapidPublicKey()
    if (!vapidKey) return false

    const applicationServerKey = urlBase64ToUint8Array(vapidKey)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer
    })

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

  return { registration, isSupported: IS_PUSH_SUPPORTED, registerPush, unregisterPush }
}

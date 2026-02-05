// Service Worker for BandHub push notifications

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}

  event.waitUntil(
    self.registration.showNotification(data.title || 'BandHub', {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/badge.png',
      data: data.data || {}
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.link || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Otherwise open a new window
      return clients.openWindow(url)
    })
  )
})

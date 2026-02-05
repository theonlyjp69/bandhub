'use client'

import { useCallback, useState } from 'react'
import { useServiceWorker } from '@/hooks/use-service-worker'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  getPreferences,
  updatePreferences,
  type NotificationPreferences as Preferences
} from '@/actions/notification-preferences'

const PREFERENCE_OPTIONS: { key: keyof Omit<Preferences, 'pushEnabled'>; label: string; description: string }[] = [
  { key: 'eventCreated', label: 'New Events', description: 'When a new event is created in your band' },
  { key: 'eventUpdated', label: 'Event Updates', description: 'When an event is modified or cancelled' },
  { key: 'rsvpReminder', label: 'RSVP Reminders', description: 'Reminders for upcoming RSVP deadlines' },
  { key: 'pollReminder', label: 'Poll Reminders', description: 'Reminders for open availability polls' },
]

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { isSupported, registerPush, unregisterPush } = useServiceWorker()

  const loadPreferences = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getPreferences()
      setPrefs(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  async function handleToggle(key: keyof Preferences, value: boolean) {
    if (!prefs) return

    setPrefs(prev => prev ? { ...prev, [key]: value } : null)
    try {
      await updatePreferences({ [key]: value })
    } catch {
      setPrefs(prev => prev ? { ...prev, [key]: !value } : null)
    }
  }

  async function handlePushToggle(checked: boolean) {
    if (!prefs) return

    if (checked) {
      const success = await registerPush()
      if (success) {
        setPrefs(prev => prev ? { ...prev, pushEnabled: true } : null)
        await updatePreferences({ pushEnabled: true })
      }
    } else {
      await unregisterPush()
      setPrefs(prev => prev ? { ...prev, pushEnabled: false } : null)
      await updatePreferences({ pushEnabled: false })
    }
  }

  return (
    <Dialog onOpenChange={(open) => { if (open) loadPreferences() }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Notification settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
        </DialogHeader>

        {isLoading || !prefs ? (
          <div className="space-y-6 py-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-6 w-10 bg-muted rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {PREFERENCE_OPTIONS.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  id={key}
                  checked={prefs[key]}
                  onCheckedChange={checked => handleToggle(key, checked)}
                />
              </div>
            ))}

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="pushEnabled" className="text-sm font-medium cursor-pointer">
                  Push Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive browser push notifications
                </p>
                {!isSupported && (
                  <p className="text-[11px] text-muted-foreground/70">
                    Push notifications are not supported in this browser
                  </p>
                )}
                {isSupported && prefs.pushEnabled && (
                  <p className="text-[11px] text-muted-foreground/70">
                    Browser permission: {Notification.permission}
                  </p>
                )}
              </div>
              <Switch
                id="pushEnabled"
                checked={prefs.pushEnabled}
                disabled={!isSupported}
                onCheckedChange={handlePushToggle}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

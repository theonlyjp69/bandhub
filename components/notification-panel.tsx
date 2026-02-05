'use client'

import { useRouter } from 'next/navigation'
import {
  Bell,
  CalendarPlus,
  CalendarClock,
  CalendarX,
  Clock,
  BarChart,
  Check,
  CheckCheck,
  Trash2,
  type LucideIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { NotificationPreferences } from './notification-preferences'
import type { Notification } from '@/hooks/use-notifications'

interface NotificationPanelProps {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  hasMore: boolean
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onFetchMore: () => void
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr).getTime()
  if (isNaN(date)) return ''
  const seconds = Math.floor((Date.now() - date) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  event_created: CalendarPlus,
  event_updated: CalendarClock,
  event_cancelled: CalendarX,
  rsvp_reminder: Clock,
  poll_reminder: BarChart,
}

export function NotificationPanel({
  notifications,
  unreadCount,
  isLoading,
  hasMore,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onFetchMore
}: NotificationPanelProps) {
  const router = useRouter()

  const handleClick = (notification: Notification) => {
    if (!notification.read_at) {
      onMarkAsRead(notification.id)
    }
    if (notification.link && notification.link.startsWith('/')) {
      router.push(notification.link)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">Notifications</h3>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={onMarkAllAsRead}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          <NotificationPreferences />
        </div>
      </div>
      <Separator />

      {/* Content */}
      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Bell className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No notifications</p>
          <p className="text-xs text-muted-foreground mt-1">
            You&apos;re all caught up!
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="divide-y divide-border">
            {notifications.map(notification => {
              const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell
              const isUnread = !notification.read_at

              return (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  className={`relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none group ${
                    isUnread ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleClick(notification)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleClick(notification)
                    }
                  }}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isUnread
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-tight ${
                        isUnread ? 'font-medium' : ''
                      }`}
                    >
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {formatRelativeTime(notification.created_at || '')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={e => {
                          e.stopPropagation()
                          onMarkAsRead(notification.id)
                        }}
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={e => {
                        e.stopPropagation()
                        onDelete(notification.id)
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Unread dot */}
                  {isUnread && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={onFetchMore}
              >
                Load more
              </Button>
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  )
}

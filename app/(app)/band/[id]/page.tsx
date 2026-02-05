import { getBand } from '@/actions/bands'
import { getUpcomingEvents } from '@/actions/events'
import { getBandAnnouncements } from '@/actions/announcements'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  MessageCircle,
  Megaphone,
  Users,
  FolderOpen,
  Clock,
  MapPin,
  ArrowRight
} from 'lucide-react'
import { MobileNav } from '@/components/layout/mobile-nav'
import { CreateEventModal } from '@/components/create-event-modal'

type Props = {
  params: Promise<{ id: string }>
}

const EVENT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
}

function getEventTypeClass(type: string | null): string {
  switch (type) {
    case 'show': return 'event-show'
    case 'rehearsal': return 'event-rehearsal'
    case 'deadline': return 'event-deadline'
    default: return 'event-other'
  }
}

export default async function BandPage({ params }: Props) {
  const { id } = await params

  let band, upcomingEvents, announcements

  try {
    [band, upcomingEvents, announcements] = await Promise.all([
      getBand(id),
      getUpcomingEvents(id, 3),
      getBandAnnouncements(id)
    ])
  } catch {
    notFound()
  }

  const recentAnnouncements = announcements.slice(0, 2)

  const navLinks = [
    { href: `/band/${id}/calendar`, label: 'Calendar', icon: Calendar },
    { href: `/band/${id}/chat`, label: 'Chat', icon: MessageSquare },
    { href: `/band/${id}/threads`, label: 'Threads', icon: MessageCircle },
    { href: `/band/${id}/announcements`, label: 'Announcements', icon: Megaphone },
    { href: `/band/${id}/members`, label: 'Members', icon: Users },
    { href: `/band/${id}/files`, label: 'Files', icon: FolderOpen },
    { href: `/band/${id}/availability`, label: 'Availability', icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-headline">{band.name}</h1>
        {band.description && (
          <p className="text-muted-foreground mt-2">{band.description}</p>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <nav className="flex flex-wrap gap-2">
            {navLinks.map((link) => (
              <Button key={link.href} variant="ghost" asChild className="h-auto py-2">
                <Link href={link.href} className="flex items-center gap-2">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-title">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/band/${id}/calendar`} className="text-primary">
                  View all
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events</p>
            ) : (
              upcomingEvents.map((event) => (
                <Link key={event.id} href={`/band/${id}/events/${event.id}`}>
                  <div className="card-interactive stagger-item p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{event.title}</span>
                      <Badge variant="outline" className={getEventTypeClass(event.event_type)}>
                        {event.event_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.start_time).toLocaleDateString('en-US', EVENT_DATE_FORMAT)}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
            <CreateEventModal bandId={id} trigger={
              <Button className="btn-gradient w-full">
                Create Event
              </Button>
            } />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-title">Announcements</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/band/${id}/announcements`} className="text-primary">
                  View all
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAnnouncements.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No announcements yet</p>
            ) : (
              recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="stagger-item p-3 rounded-lg bg-accent/50">
                  {announcement.title && (
                    <h3 className="font-medium">{announcement.title}</h3>
                  )}
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {announcement.content}
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {announcement.profiles?.display_name} · {announcement.created_at && new Date(announcement.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <MobileNav bandId={id} />
    </div>
  )
}

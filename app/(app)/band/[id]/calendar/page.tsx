import { getBand } from '@/actions/bands'
import { getBandEvents } from '@/actions/events'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react'
import { CreateEventModal } from '@/components/create-event-modal'

type Props = {
  params: Promise<{ id: string }>
}

const UPCOMING_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
}

const PAST_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
}

function getEventTypeClass(type: string | null): string {
  switch (type) {
    case 'show': return 'event-show'
    case 'rehearsal': return 'event-rehearsal'
    case 'deadline': return 'event-deadline'
    default: return 'event-other'
  }
}

export default async function CalendarPage({ params }: Props) {
  const { id } = await params

  let band, events

  try {
    [band, events] = await Promise.all([
      getBand(id),
      getBandEvents(id)
    ])
  } catch {
    notFound()
  }

  const now = new Date()
  const upcomingEvents = events.filter(e => e.start_time && new Date(e.start_time) >= now)
  const pastEvents = events.filter(e => e.start_time && new Date(e.start_time) < now)

  return (
    <div className="space-y-6">
      <Link
        href={`/band/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {band.name}
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-headline">Calendar</h1>
            <p className="text-muted-foreground text-sm">
              {upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <CreateEventModal bandId={id} />
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-title mb-4">Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-title mb-2">No upcoming events</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create an event to get started
                </p>
                <CreateEventModal bandId={id} />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <Link key={event.id} href={`/band/${id}/events/${event.id}`}>
                  <Card className="card-interactive stagger-item">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-title">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.start_time && new Date(event.start_time).toLocaleDateString('en-US', UPCOMING_DATE_FORMAT)}
                          </p>
                          {event.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={getEventTypeClass(event.event_type)}>
                            {event.event_type?.replace('_', ' ')}
                          </Badge>
                          {event.event_rsvps && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {event.event_rsvps.filter((r: { status: string | null }) => r.status === 'going').length}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-title text-muted-foreground mb-4">Past Events</h2>
            <div className="space-y-3 opacity-60">
              {pastEvents.slice(0, 10).map((event) => (
                <Link key={event.id} href={`/band/${id}/events/${event.id}`}>
                  <Card className="card-interactive stagger-item">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-title">{event.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.start_time && new Date(event.start_time).toLocaleDateString('en-US', PAST_DATE_FORMAT)}
                          </p>
                        </div>
                        <Badge variant="outline" className={getEventTypeClass(event.event_type)}>
                          {event.event_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

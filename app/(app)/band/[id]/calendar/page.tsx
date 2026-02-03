import { getBand } from '@/actions/bands'
import { getBandEvents } from '@/actions/events'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Plus, MapPin, Users } from 'lucide-react'

type Props = {
  params: Promise<{ id: string }>
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

  const getEventTypeClass = (type: string | null) => {
    switch (type) {
      case 'show': return 'event-show'
      case 'rehearsal': return 'event-rehearsal'
      case 'deadline': return 'event-deadline'
      default: return 'event-other'
    }
  }

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
        <Button asChild className="btn-gradient">
          <Link href={`/band/${id}/events/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
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
                <Button asChild className="btn-gradient">
                  <Link href={`/band/${id}/events/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Link>
                </Button>
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
                            {event.start_time && new Date(event.start_time).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
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
                            {event.start_time && new Date(event.start_time).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
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

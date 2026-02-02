import { getEvent } from '@/actions/events'
import { getUserRsvp } from '@/actions/rsvps'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Calendar, MapPin, Building2, DollarSign, User, Check, HelpCircle, X } from 'lucide-react'
import { RsvpButtons } from './rsvp-buttons'

type Props = {
  params: Promise<{ id: string; eventId: string }>
}

export default async function EventPage({ params }: Props) {
  const { id: bandId, eventId } = await params

  let event, userRsvp

  try {
    [event, userRsvp] = await Promise.all([
      getEvent(eventId),
      getUserRsvp(eventId)
    ])
  } catch {
    notFound()
  }

  const rsvps = event.event_rsvps || []
  const goingCount = rsvps.filter((r: { status: string | null }) => r.status === 'going').length
  const maybeCount = rsvps.filter((r: { status: string | null }) => r.status === 'maybe').length
  const notGoingCount = rsvps.filter((r: { status: string | null }) => r.status === 'not_going').length

  const metadata = event.metadata as Record<string, unknown> | null

  const getEventTypeClass = (type: string | null) => {
    switch (type) {
      case 'show': return 'event-show'
      case 'rehearsal': return 'event-rehearsal'
      case 'deadline': return 'event-deadline'
      default: return 'event-other'
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/band/${bandId}/calendar`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Calendar
      </Link>

      <div>
        <Badge variant="outline" className={`mb-3 ${getEventTypeClass(event.event_type)}`}>
          {event.event_type?.replace('_', ' ')}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">
                {event.start_time && new Date(event.start_time).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
              {event.end_time && (
                <p className="text-sm text-muted-foreground">
                  Until {new Date(event.end_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <p>{event.location}</p>
            </div>
          )}

          {metadata && typeof metadata.venue === 'string' && (
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <p>{metadata.venue}</p>
            </div>
          )}

          {metadata && typeof metadata.pay === 'string' && (
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <p>{metadata.pay}</p>
            </div>
          )}

          {event.description && (
            <div className="pt-2 border-t">
              <p className="whitespace-pre-wrap text-muted-foreground">{event.description}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t">
            <User className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Created by {event.profiles?.display_name || 'Unknown'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Your RSVP</CardTitle>
        </CardHeader>
        <CardContent>
          <RsvpButtons eventId={eventId} currentStatus={(userRsvp?.status as 'going' | 'maybe' | 'not_going') || null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
            Responses ({rsvps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="rsvp-going px-2 py-1 rounded-md text-sm font-medium">{goingCount}</div>
              <span className="text-muted-foreground text-sm">Going</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="rsvp-maybe px-2 py-1 rounded-md text-sm font-medium">{maybeCount}</div>
              <span className="text-muted-foreground text-sm">Maybe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="rsvp-not-going px-2 py-1 rounded-md text-sm font-medium">{notGoingCount}</div>
              <span className="text-muted-foreground text-sm">Can&apos;t Make It</span>
            </div>
          </div>

          {rsvps.length === 0 ? (
            <p className="text-muted-foreground text-sm">No responses yet</p>
          ) : (
            <div className="space-y-2">
              {rsvps.map((rsvp: { user_id: string | null; status: string | null; profiles: { display_name: string | null } | null }) => (
                <div key={rsvp.user_id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {rsvp.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{rsvp.profiles?.display_name || 'Unknown'}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    rsvp.status === 'going' ? 'text-green-400' :
                    rsvp.status === 'maybe' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {rsvp.status === 'going' && <Check className="h-4 w-4" />}
                    {rsvp.status === 'maybe' && <HelpCircle className="h-4 w-4" />}
                    {rsvp.status === 'not_going' && <X className="h-4 w-4" />}
                    <span className="capitalize">
                      {rsvp.status === 'not_going' ? "Can't Make It" : rsvp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import type { ReactElement, ReactNode } from 'react'
import { getEvent } from '@/actions/events'
import { getUserRsvp } from '@/actions/rsvps'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Calendar, MapPin, Building2, DollarSign, User, Check, HelpCircle, X, type LucideIcon } from 'lucide-react'
import { RsvpButtons } from './rsvp-buttons'
import { PollVoting } from './poll-voting'

interface PollOption {
  slotKey: string
  date: string
  startTime: string
  endTime: string
}

interface RsvpEntry {
  user_id: string | null
  status: string | null
  note?: string | null
  profiles: { display_name: string | null } | null
}

type Props = {
  params: Promise<{ id: string; eventId: string }>
}

function DetailRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }): ReactElement {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      {children}
    </div>
  )
}

function getEventTypeClass(type: string | null): string {
  switch (type) {
    case 'show': return 'event-show'
    case 'rehearsal': return 'event-rehearsal'
    case 'deadline': return 'event-deadline'
    default: return 'event-other'
  }
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case 'going': return 'text-green-400'
    case 'maybe': return 'text-yellow-400'
    default: return 'text-red-400'
  }
}

function getStatusIcon(status: string | null): ReactElement | null {
  switch (status) {
    case 'going': return <Check className="h-4 w-4" />
    case 'maybe': return <HelpCircle className="h-4 w-4" />
    case 'not_going': return <X className="h-4 w-4" />
    default: return null
  }
}

function getStatusLabel(status: string | null): string {
  if (status === 'not_going') return "Can't Make It"
  return status ?? ''
}

export default async function EventPage({ params }: Props) {
  const { id: bandId, eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  let event, userRsvp

  try {
    [event, userRsvp] = await Promise.all([
      getEvent(eventId),
      getUserRsvp(eventId)
    ])
  } catch {
    notFound()
  }

  const isCreator = event.created_by === user.id
  const isPoll = event.mode === 'poll'
  const isResolved = !!event.resolved_at
  const isCancelled = event.status === 'cancelled'
  const isClosed = event.status === 'closed'
  const showRsvp = !isCancelled && (!isPoll || isResolved)

  const rsvps = (event.event_rsvps || []) as RsvpEntry[]
  const goingCount = rsvps.filter(r => r.status === 'going').length
  const maybeCount = rsvps.filter(r => r.status === 'maybe').length
  const notGoingCount = rsvps.filter(r => r.status === 'not_going').length

  const metadata = event.metadata as Record<string, unknown> | null

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
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className={getEventTypeClass(event.event_type)}>
            {event.event_type?.replace('_', ' ')}
          </Badge>
          {isPoll && !isResolved && (
            <Badge variant="secondary">Availability Poll</Badge>
          )}
          {isPoll && isResolved && (
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Check className="mr-1 h-3 w-3" /> Time Confirmed
            </Badge>
          )}
          {isCancelled && <Badge variant="destructive">Cancelled</Badge>}
          {isClosed && <Badge variant="outline">Closed</Badge>}
        </div>
        <h1 className="text-headline">{event.title}</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-title text-muted-foreground uppercase tracking-wide">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.start_time && (
            <DetailRow icon={Calendar}>
              <div>
                <p className="font-medium">
                  {new Date(event.start_time).toLocaleDateString('en-US', {
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
            </DetailRow>
          )}

          {!event.start_time && isPoll && !isResolved && (
            <DetailRow icon={Calendar}>
              <p className="text-muted-foreground">Time to be determined by poll</p>
            </DetailRow>
          )}

          {event.location && (
            <DetailRow icon={MapPin}>
              <p>{event.location}</p>
            </DetailRow>
          )}

          {metadata && typeof metadata.venue === 'string' && (
            <DetailRow icon={Building2}>
              <p>{metadata.venue}</p>
            </DetailRow>
          )}

          {metadata && typeof metadata.pay === 'string' && (
            <DetailRow icon={DollarSign}>
              <p>{metadata.pay}</p>
            </DetailRow>
          )}

          {event.description && (
            <div className="pt-2 border-t">
              <p className="whitespace-pre-wrap text-muted-foreground">{event.description}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t">
            <User className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Created by {event.profiles?.display_name ?? 'Unknown'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Poll voting UI - active polls only */}
      {isPoll && event.poll_options && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-title text-muted-foreground uppercase tracking-wide">
              {isResolved ? 'Poll Results' : 'Vote on Available Times'}
            </CardTitle>
            {!isResolved && event.poll_closes_at && (
              <p className="text-sm text-muted-foreground">
                Voting closes {new Date(event.poll_closes_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <PollVoting
              eventId={eventId}
              pollOptions={event.poll_options as unknown as PollOption[]}
              isCreator={isCreator}
              resolvedAt={event.resolved_at}
              resolvedSlotKey={event.resolved_slot_key}
            />
          </CardContent>
        </Card>
      )}

      {/* RSVP section - show for fixed events and resolved polls, hide for cancelled */}
      {showRsvp && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-title text-muted-foreground uppercase tracking-wide">Your RSVP</CardTitle>
          </CardHeader>
          <CardContent>
            <RsvpButtons eventId={eventId} currentStatus={(userRsvp?.status as 'going' | 'maybe' | 'not_going') ?? null} currentNote={userRsvp?.note} />
          </CardContent>
        </Card>
      )}

      {/* Responses section - always show if there are responses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-title text-muted-foreground uppercase tracking-wide">
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
              {rsvps.map((rsvp) => (
                <div key={rsvp.user_id} className="stagger-item py-2 border-b last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {rsvp.profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{rsvp.profiles?.display_name ?? 'Unknown'}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${getStatusColor(rsvp.status)}`}>
                      {getStatusIcon(rsvp.status)}
                      <span className="capitalize">{getStatusLabel(rsvp.status)}</span>
                    </div>
                  </div>
                  {rsvp.note && (
                    <p className="text-sm text-muted-foreground mt-1 ml-11 italic">&ldquo;{rsvp.note}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { getEvent } from '@/actions/events'
import { getUserRsvp } from '@/actions/rsvps'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href={`/band/${bandId}/calendar`} className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to Calendar
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-300 rounded capitalize">
            {event.event_type?.replace('_', ' ')}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white">{event.title}</h1>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">Details</h2>

          <dl className="space-y-4">
            <div>
              <dt className="text-zinc-500 text-sm">When</dt>
              <dd className="text-white">
                {event.start_time && new Date(event.start_time).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
                {event.end_time && (
                  <span className="text-zinc-400">
                    {' '}&ndash;{' '}
                    {new Date(event.end_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </dd>
            </div>

            {event.location && (
              <div>
                <dt className="text-zinc-500 text-sm">Location</dt>
                <dd className="text-white">{event.location}</dd>
              </div>
            )}

            {metadata && typeof metadata.venue === 'string' && (
              <div>
                <dt className="text-zinc-500 text-sm">Venue</dt>
                <dd className="text-white">{metadata.venue}</dd>
              </div>
            )}

            {metadata && typeof metadata.pay === 'string' && (
              <div>
                <dt className="text-zinc-500 text-sm">Pay</dt>
                <dd className="text-white">{metadata.pay}</dd>
              </div>
            )}

            {event.description && (
              <div>
                <dt className="text-zinc-500 text-sm">Description</dt>
                <dd className="text-white whitespace-pre-wrap">{event.description}</dd>
              </div>
            )}

            <div>
              <dt className="text-zinc-500 text-sm">Created by</dt>
              <dd className="text-white">{event.profiles?.display_name || 'Unknown'}</dd>
            </div>
          </dl>
        </div>

        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">Your RSVP</h2>
          <RsvpButtons eventId={eventId} currentStatus={(userRsvp?.status as 'going' | 'maybe' | 'not_going') || null} />
        </div>

        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
            Responses ({rsvps.length})
          </h2>

          <div className="flex gap-6 mb-6 text-sm">
            <div>
              <span className="text-green-400 font-medium">{goingCount}</span>
              <span className="text-zinc-500 ml-1">Going</span>
            </div>
            <div>
              <span className="text-yellow-400 font-medium">{maybeCount}</span>
              <span className="text-zinc-500 ml-1">Maybe</span>
            </div>
            <div>
              <span className="text-red-400 font-medium">{notGoingCount}</span>
              <span className="text-zinc-500 ml-1">Can&apos;t Make It</span>
            </div>
          </div>

          {rsvps.length === 0 ? (
            <p className="text-zinc-500 text-sm">No responses yet</p>
          ) : (
            <ul className="space-y-2">
              {rsvps.map((rsvp: { user_id: string | null; status: string | null; profiles: { display_name: string | null } | null }) => (
                <li key={rsvp.user_id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-white">{rsvp.profiles?.display_name || 'Unknown'}</span>
                  <span className={`text-sm capitalize ${
                    rsvp.status === 'going' ? 'text-green-400' :
                    rsvp.status === 'maybe' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {rsvp.status === 'not_going' ? "Can't Make It" : rsvp.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

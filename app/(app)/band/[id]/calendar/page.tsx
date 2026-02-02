import { getBand } from '@/actions/bands'
import { getBandEvents } from '@/actions/events'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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

  return (
    <div>
      <div className="mb-6">
        <Link href={`/band/${id}`} className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to {band.name}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <Link
          href={`/band/${id}/events/new`}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
        >
          Create Event
        </Link>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <p className="text-zinc-500">No upcoming events</p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/band/${id}/events/${event.id}`}
                    className="block p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{event.title}</h3>
                        <p className="text-zinc-400 text-sm mt-1">
                          {event.start_time && new Date(event.start_time).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                        {event.location && (
                          <p className="text-zinc-500 text-sm">{event.location}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded capitalize">
                          {event.event_type?.replace('_', ' ')}
                        </span>
                        {event.event_rsvps && (
                          <span className="text-zinc-400 text-sm">
                            {event.event_rsvps.filter((r: { status: string | null }) => r.status === 'going').length} going
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-zinc-400 mb-4">Past Events</h2>
            <ul className="space-y-3 opacity-60">
              {pastEvents.slice(0, 10).map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/band/${id}/events/${event.id}`}
                    className="block p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-lg hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-zinc-300 font-medium">{event.title}</h3>
                        <p className="text-zinc-500 text-sm mt-1">
                          {event.start_time && new Date(event.start_time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-zinc-800/50 text-zinc-400 rounded capitalize">
                        {event.event_type?.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

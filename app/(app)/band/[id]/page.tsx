import { getBand } from '@/actions/bands'
import { getUpcomingEvents } from '@/actions/events'
import { getBandAnnouncements } from '@/actions/announcements'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
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
    { href: `/band/${id}/calendar`, label: 'Calendar' },
    { href: `/band/${id}/chat`, label: 'Chat' },
    { href: `/band/${id}/threads`, label: 'Threads' },
    { href: `/band/${id}/announcements`, label: 'Announcements' },
    { href: `/band/${id}/members`, label: 'Members' },
    { href: `/band/${id}/files`, label: 'Files' },
    { href: `/band/${id}/availability`, label: 'Availability' },
  ]

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{band.name}</h1>
        {band.description && (
          <p className="text-zinc-400 mt-2">{band.description}</p>
        )}
      </div>

      <nav className="flex flex-wrap gap-2 mb-8 p-4 bg-zinc-900 rounded-lg">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Upcoming Events</h2>
            <Link href={`/band/${id}/calendar`} className="text-purple-400 hover:text-purple-300 text-sm">
              View all
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-zinc-500 text-sm">No upcoming events</p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/band/${id}/events/${event.id}`}
                    className="block p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{event.title}</span>
                      <span className="text-xs px-2 py-1 bg-zinc-700 text-zinc-300 rounded">
                        {event.event_type}
                      </span>
                    </div>
                    <div className="text-zinc-400 text-sm mt-1">
                      {new Date(event.start_time).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                    {event.location && (
                      <div className="text-zinc-500 text-sm">{event.location}</div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/band/${id}/events/new`}
            className="block mt-4 text-center py-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 rounded-lg"
          >
            + Create Event
          </Link>
        </div>

        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Announcements</h2>
            <Link href={`/band/${id}/announcements`} className="text-purple-400 hover:text-purple-300 text-sm">
              View all
            </Link>
          </div>
          {recentAnnouncements.length === 0 ? (
            <p className="text-zinc-500 text-sm">No announcements yet</p>
          ) : (
            <ul className="space-y-3">
              {recentAnnouncements.map((announcement) => (
                <li key={announcement.id} className="p-3 bg-zinc-800 rounded-lg">
                  {announcement.title && (
                    <h3 className="text-white font-medium">{announcement.title}</h3>
                  )}
                  <p className="text-zinc-400 text-sm mt-1 line-clamp-2">
                    {announcement.content}
                  </p>
                  <div className="text-zinc-500 text-xs mt-2">
                    {announcement.profiles?.display_name} &middot;{' '}
                    {announcement.created_at && new Date(announcement.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

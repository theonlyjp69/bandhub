import { getBand } from '@/actions/bands'
import { getBandPolls } from '@/actions/availability'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AvailabilityPage({ params }: Props) {
  const { id } = await params

  let band, polls

  try {
    [band, polls] = await Promise.all([
      getBand(id),
      getBandPolls(id)
    ])
  } catch {
    notFound()
  }

  const now = new Date()

  return (
    <div>
      <div className="mb-6">
        <Link href={`/band/${id}`} className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to {band.name}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Availability Polls</h1>
        <Link
          href={`/band/${id}/availability/new`}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
        >
          Create Poll
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 mb-4">No availability polls yet.</p>
          <Link
            href={`/band/${id}/availability/new`}
            className="text-purple-400 hover:text-purple-300"
          >
            Create your first poll
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {polls.map((poll) => {
            const responseCount = poll.availability_responses?.length || 0
            const isClosed = poll.closes_at && new Date(poll.closes_at) < now

            return (
              <li key={poll.id}>
                <Link
                  href={`/band/${id}/availability/${poll.id}`}
                  className="block p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium">{poll.title}</h3>
                        {isClosed && (
                          <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">
                            Closed
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-500 text-sm mt-1">
                        Created by {poll.profiles?.display_name || 'Unknown'}
                        {poll.created_at && (
                          <> &middot; {new Date(poll.created_at).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <span className="text-zinc-400 text-sm">
                      {responseCount} {responseCount === 1 ? 'response' : 'responses'}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

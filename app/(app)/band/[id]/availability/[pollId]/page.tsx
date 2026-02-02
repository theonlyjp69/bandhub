import { getPoll, getUserAvailability, getBestTimeSlot } from '@/actions/availability'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PollVoting } from './poll-voting'

type Props = {
  params: Promise<{ id: string; pollId: string }>
}

type DateOption = {
  date: string
  start_time: string
  end_time: string
}

export default async function PollPage({ params }: Props) {
  const { id: bandId, pollId } = await params

  let poll, userResponse, bestTime

  try {
    [poll, userResponse, bestTime] = await Promise.all([
      getPoll(pollId),
      getUserAvailability(pollId),
      getBestTimeSlot(pollId)
    ])
  } catch {
    notFound()
  }

  const dateOptions = poll.date_options as unknown as DateOption[]
  const responses = poll.availability_responses || []
  const now = new Date()
  const isClosed = poll.closes_at && new Date(poll.closes_at) < now

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href={`/band/${bandId}/availability`} className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to Polls
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-white">{poll.title}</h1>
          {isClosed && (
            <span className="text-xs px-2 py-1 bg-zinc-700 text-zinc-400 rounded">Closed</span>
          )}
        </div>
        {poll.description && (
          <p className="text-zinc-400">{poll.description}</p>
        )}
        <p className="text-zinc-500 text-sm mt-2">
          Created by {poll.profiles?.display_name || 'Unknown'}
          {poll.closes_at && (
            <> &middot; Closes {new Date(poll.closes_at).toLocaleString()}</>
          )}
        </p>
      </div>

      {bestTime && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
          <h2 className="text-sm font-medium text-green-400 uppercase tracking-wide mb-2">Best Time</h2>
          <p className="text-white font-medium">
            {new Date(bestTime.dateOption.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}{' '}
            {bestTime.dateOption.start_time} - {bestTime.dateOption.end_time}
          </p>
          <p className="text-green-300 text-sm mt-1">
            {bestTime.respondentCount} of {bestTime.totalMembers} available
          </p>
        </div>
      )}

      {!isClosed && (
        <div className="mb-6">
          <PollVoting
            pollId={pollId}
            dateOptions={dateOptions}
            currentResponse={userResponse?.available_slots as number[] || []}
          />
        </div>
      )}

      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
          All Responses ({responses.length})
        </h2>

        {responses.length === 0 ? (
          <p className="text-zinc-500 text-sm">No responses yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 px-2 text-zinc-400 font-medium">Member</th>
                  {dateOptions.map((opt, i) => (
                    <th key={i} className="text-center py-2 px-2 text-zinc-400 font-medium min-w-[100px]">
                      <div>{new Date(opt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="text-xs font-normal">{opt.start_time}-{opt.end_time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((response: { user_id: string | null; available_slots: unknown; profiles: { display_name: string | null } | null }) => {
                  const slots = response.available_slots as number[] || []
                  return (
                    <tr key={response.user_id} className="border-b border-zinc-800/50">
                      <td className="py-2 px-2 text-white">
                        {response.profiles?.display_name || 'Unknown'}
                      </td>
                      {dateOptions.map((_, i) => (
                        <td key={i} className="text-center py-2 px-2">
                          {slots.includes(i) ? (
                            <span className="text-green-400">&#10003;</span>
                          ) : (
                            <span className="text-zinc-600">&ndash;</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

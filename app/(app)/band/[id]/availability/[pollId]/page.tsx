import { getPoll, getUserAvailability, getBestTimeSlot } from '@/actions/availability'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, Minus, Star } from 'lucide-react'
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
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/band/${bandId}/availability`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Polls
      </Link>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold tracking-tight">{poll.title}</h1>
          {isClosed && <Badge variant="secondary">Closed</Badge>}
        </div>
        {poll.description && (
          <p className="text-muted-foreground">{poll.description}</p>
        )}
        <p className="text-muted-foreground text-sm mt-2">
          Created by {poll.profiles?.display_name || 'Unknown'}
          {poll.closes_at && (
            <> · Closes {new Date(poll.closes_at).toLocaleString()}</>
          )}
        </p>
      </div>

      {bestTime && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-400 uppercase tracking-wide flex items-center gap-2">
              <Star className="h-4 w-4" />
              Best Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">
              {new Date(bestTime.dateOption.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}{' '}
              {bestTime.dateOption.start_time} - {bestTime.dateOption.end_time}
            </p>
            <p className="text-green-400 text-sm mt-1">
              {bestTime.respondentCount} of {bestTime.totalMembers} available
            </p>
          </CardContent>
        </Card>
      )}

      {!isClosed && (
        <PollVoting
          pollId={pollId}
          dateOptions={dateOptions}
          currentResponse={userResponse?.available_slots as number[] || []}
        />
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
            All Responses ({responses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <p className="text-muted-foreground text-sm">No responses yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Member</th>
                    {dateOptions.map((opt, i) => (
                      <th key={i} className="text-center py-2 px-2 text-muted-foreground font-medium min-w-[100px]">
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
                      <tr key={response.user_id} className="border-b last:border-0">
                        <td className="py-2 px-2 font-medium">
                          {response.profiles?.display_name || 'Unknown'}
                        </td>
                        {dateOptions.map((_, i) => (
                          <td key={i} className="text-center py-2 px-2">
                            {slots.includes(i) ? (
                              <Check className="h-4 w-4 text-green-400 mx-auto" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />
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
        </CardContent>
      </Card>
    </div>
  )
}

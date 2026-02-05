'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, HelpCircle, X } from 'lucide-react'
import { submitVote, getUserVotes, getPollResults } from '@/actions/poll-votes'
import { resolvePoll } from '@/actions/events'
import { toast } from 'sonner'

interface PollOption {
  slotKey: string
  date: string
  startTime: string
  endTime: string
}

type VoteResponse = 'available' | 'maybe' | 'unavailable'

type Props = {
  eventId: string
  pollOptions: PollOption[]
  isCreator: boolean
  resolvedAt: string | null
  resolvedSlotKey: string | null
}

interface UserVote {
  slot_key: string
  response: string
}

interface SlotResult {
  slotKey: string
  counts: { available: number; maybe: number; unavailable: number; total: number }
}

const voteButtons = [
  { response: 'available' as const, label: 'Available', icon: Check, activeClass: 'bg-green-600 hover:bg-green-700' },
  { response: 'maybe' as const, label: 'Maybe', icon: HelpCircle, activeClass: 'bg-yellow-600 hover:bg-yellow-700' },
  { response: 'unavailable' as const, label: 'Unavailable', icon: X, activeClass: 'bg-red-600 hover:bg-red-700' },
]

export function PollVoting({
  eventId,
  pollOptions,
  isCreator,
  resolvedAt,
  resolvedSlotKey,
}: Props) {
  const router = useRouter()
  const [userVotes, setUserVotes] = useState<UserVote[]>([])
  const [pollResults, setPollResults] = useState<SlotResult[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  const refreshPollData = useCallback(async (): Promise<void> => {
    const [votes, results] = await Promise.all([
      getUserVotes(eventId),
      getPollResults(eventId),
    ])
    setUserVotes(votes ?? [])
    setPollResults(results)
  }, [eventId])

  useEffect(() => {
    refreshPollData()
      .catch((err) => console.error('Failed to load poll data:', err))
      .finally(() => setDataLoading(false))
  }, [refreshPollData])

  async function handleVote(slotKey: string, response: VoteResponse): Promise<void> {
    setLoading(true)
    try {
      await submitVote(eventId, slotKey, response)
      await refreshPollData()
      toast.success('Vote recorded')
    } catch {
      toast.error('Failed to submit vote')
    } finally {
      setLoading(false)
    }
  }

  async function handleResolve(slotKey: string): Promise<void> {
    if (!confirm('Confirm this time? This will notify all band members.')) return

    setLoading(true)
    try {
      await resolvePoll(eventId, slotKey)
      toast.success('Time confirmed!')
      router.refresh()
    } catch {
      toast.error('Failed to confirm time')
    } finally {
      setLoading(false)
    }
  }

  const bestSlotKey = useMemo((): string | null => {
    let best: string | null = null
    let bestAvail = 0
    for (const option of pollOptions) {
      const avail = pollResults.find(r => r.slotKey === option.slotKey)?.counts.available ?? 0
      if (avail > bestAvail) {
        bestAvail = avail
        best = option.slotKey
      }
    }
    return best
  }, [pollOptions, pollResults])

  if (dataLoading) {
    return <p className="text-sm text-muted-foreground">Loading poll results...</p>
  }

  const isResolved = !!resolvedAt

  return (
    <div className="space-y-3">
      {pollOptions.map((option) => {
        const userVote = userVotes.find(v => v.slot_key === option.slotKey)
        const result = pollResults.find(r => r.slotKey === option.slotKey)
        const isBest = option.slotKey === bestSlotKey && !isResolved
        const isConfirmed = option.slotKey === resolvedSlotKey
        const slotLabel = `${new Date(option.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${option.startTime}-${option.endTime}`

        let cardClass = ''
        if (isConfirmed) cardClass = 'border-primary'
        else if (isBest) cardClass = 'ring-1 ring-primary/50'

        return (
          <Card key={option.slotKey} className={cardClass}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">
                    {new Date(option.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {option.startTime} &ndash; {option.endTime}
                  </p>
                </div>
                {isConfirmed && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Check className="mr-1 h-3 w-3" /> Confirmed
                  </Badge>
                )}
                {isBest && !isConfirmed && (
                  <Badge variant="secondary">Most Available</Badge>
                )}
              </div>

              {/* Vote counts */}
              {result && (
                <div className="flex gap-4 text-sm mb-3">
                  <span className="text-green-400">{result.counts.available} available</span>
                  <span className="text-yellow-400">{result.counts.maybe} maybe</span>
                  <span className="text-red-400">{result.counts.unavailable} unavailable</span>
                </div>
              )}

              {!isResolved && (
                <div className="flex flex-wrap gap-2">
                  {voteButtons.map((btn) => {
                    const isSelected = userVote?.response === btn.response
                    return (
                      <Button
                        key={btn.response}
                        size="sm"
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => handleVote(option.slotKey, btn.response)}
                        disabled={loading}
                        aria-label={`${btn.label} for ${slotLabel}`}
                        className={isSelected ? btn.activeClass : ''}
                      >
                        <btn.icon className="mr-1 h-4 w-4" /> {btn.label}
                      </Button>
                    )
                  })}

                  {isCreator && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleResolve(option.slotKey)}
                      disabled={loading}
                      aria-label={`Confirm ${slotLabel} as the event time`}
                      className="ml-auto"
                    >
                      Confirm This Time
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

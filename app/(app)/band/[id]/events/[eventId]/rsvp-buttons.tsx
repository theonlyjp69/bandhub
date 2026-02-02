'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setRsvp } from '@/actions/rsvps'

type Props = {
  eventId: string
  currentStatus: 'going' | 'maybe' | 'not_going' | null
}

export function RsvpButtons({ eventId, currentStatus }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRsvp = async (newStatus: 'going' | 'maybe' | 'not_going') => {
    setLoading(true)
    setError('')

    try {
      await setRsvp(eventId, newStatus)
      setStatus(newStatus)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RSVP')
    } finally {
      setLoading(false)
    }
  }

  const buttons = [
    { value: 'going' as const, label: 'Going', activeClass: 'bg-green-600 border-green-600' },
    { value: 'maybe' as const, label: 'Maybe', activeClass: 'bg-yellow-600 border-yellow-600' },
    { value: 'not_going' as const, label: "Can't Make It", activeClass: 'bg-red-600 border-red-600' },
  ]

  return (
    <div>
      {error && (
        <p className="text-red-400 text-sm mb-3">{error}</p>
      )}
      <div className="flex gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => handleRsvp(btn.value)}
            disabled={loading}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
              status === btn.value
                ? `${btn.activeClass} text-white`
                : 'border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white'
            } disabled:opacity-50`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}

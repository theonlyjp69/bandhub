'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setRsvp } from '@/actions/rsvps'
import { Button } from '@/components/ui/button'
import { Check, HelpCircle, X } from 'lucide-react'

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
    {
      value: 'going' as const,
      label: 'Going',
      icon: Check,
      activeClass: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
    },
    {
      value: 'maybe' as const,
      label: 'Maybe',
      icon: HelpCircle,
      activeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
    },
    {
      value: 'not_going' as const,
      label: "Can't Make It",
      icon: X,
      activeClass: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
    },
  ]

  return (
    <div>
      {error && (
        <p className="text-destructive text-sm mb-3">{error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {buttons.map((btn) => (
          <Button
            key={btn.value}
            onClick={() => handleRsvp(btn.value)}
            disabled={loading}
            variant="outline"
            className={status === btn.value ? btn.activeClass : ''}
          >
            <btn.icon className="mr-2 h-4 w-4" />
            {btn.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

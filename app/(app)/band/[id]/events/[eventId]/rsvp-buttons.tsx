'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setRsvp } from '@/actions/rsvps'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, HelpCircle, X, Save } from 'lucide-react'

type Props = {
  eventId: string
  currentStatus: 'going' | 'maybe' | 'not_going' | null
  currentNote?: string | null
}

export function RsvpButtons({ eventId, currentStatus, currentNote }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [note, setNote] = useState(currentNote ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [noteChanged, setNoteChanged] = useState(false)

  const handleRsvp = async (newStatus: 'going' | 'maybe' | 'not_going') => {
    setLoading(true)
    setError('')

    try {
      await setRsvp(eventId, newStatus, note || undefined)
      setStatus(newStatus)
      setNoteChanged(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RSVP')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!status) return
    setLoading(true)
    setError('')

    try {
      await setRsvp(eventId, status, note || undefined)
      setNoteChanged(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setLoading(false)
    }
  }

  const buttons = [
    {
      value: 'going' as const,
      label: 'Going',
      icon: Check,
      activeClass: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 btn-gradient',
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

  const isActive = (value: string): boolean => status === value

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
            className={isActive(btn.value) ? btn.activeClass : ''}
          >
            <btn.icon className="mr-2 h-4 w-4" />
            {btn.label}
          </Button>
        ))}
      </div>
      <Textarea
        placeholder="Add a note (e.g., arriving late, bringing equipment)"
        value={note}
        onChange={(e) => {
          setNote(e.target.value)
          setNoteChanged(e.target.value !== (currentNote ?? ''))
        }}
        maxLength={500}
        className="mt-3"
        rows={2}
      />
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-muted-foreground">{note.length}/500</p>
        {status && noteChanged && (
          <Button
            onClick={handleSaveNote}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <Save className="mr-1 h-3 w-3" />
            Save Note
          </Button>
        )}
      </div>
    </div>
  )
}

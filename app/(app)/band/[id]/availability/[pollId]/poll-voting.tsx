'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitAvailability } from '@/actions/availability'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

type DateOption = {
  date: string
  start_time: string
  end_time: string
}

type Props = {
  pollId: string
  dateOptions: DateOption[]
  currentResponse: number[]
}

export function PollVoting({ pollId, dateOptions, currentResponse }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<number[]>(currentResponse)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const toggleSlot = (index: number) => {
    setSelected(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
    setSaved(false)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      await submitAvailability(pollId, selected)
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save availability')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
          Select Your Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          {dateOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => toggleSlot(index)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selected.includes(index)
                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                  : 'bg-accent/50 border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {new Date(option.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                {selected.includes(index) && <Check className="h-4 w-4" />}
              </div>
              <div className="text-sm text-muted-foreground">
                {option.start_time} - {option.end_time}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-destructive text-sm mb-3">{error}</p>
        )}

        {saved && (
          <p className="text-green-400 text-sm mb-3">Availability saved!</p>
        )}

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save Availability'}
        </Button>
      </CardContent>
    </Card>
  )
}

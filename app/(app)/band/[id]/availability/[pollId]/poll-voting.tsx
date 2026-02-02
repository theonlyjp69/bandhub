'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitAvailability } from '@/actions/availability'

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
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
      <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-4">
        Select Your Availability
      </h2>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        {dateOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => toggleSlot(index)}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selected.includes(index)
                ? 'bg-green-900/30 border-green-700 text-green-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
            }`}
          >
            <div className="font-medium">
              {new Date(option.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <div className="text-sm opacity-80">
              {option.start_time} - {option.end_time}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-3">{error}</p>
      )}

      {saved && (
        <p className="text-green-400 text-sm mb-3">Availability saved!</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg"
      >
        {loading ? 'Saving...' : 'Save Availability'}
      </button>
    </div>
  )
}

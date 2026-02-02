'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createAvailabilityPoll } from '@/actions/availability'
import Link from 'next/link'

type DateOption = {
  date: string
  start_time: string
  end_time: string
}

export default function NewPollPage() {
  const router = useRouter()
  const params = useParams()
  const bandId = params.id as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dateOptions, setDateOptions] = useState<DateOption[]>([
    { date: '', start_time: '', end_time: '' }
  ])
  const [closesAt, setClosesAt] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const addDateOption = () => {
    setDateOptions([...dateOptions, { date: '', start_time: '', end_time: '' }])
  }

  const removeDateOption = (index: number) => {
    if (dateOptions.length > 1) {
      setDateOptions(dateOptions.filter((_, i) => i !== index))
    }
  }

  const updateDateOption = (index: number, field: keyof DateOption, value: string) => {
    const updated = [...dateOptions]
    updated[index][field] = value
    setDateOptions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate at least one complete date option
    const validOptions = dateOptions.filter(opt => opt.date && opt.start_time && opt.end_time)
    if (validOptions.length === 0) {
      setError('Please add at least one complete time option')
      return
    }

    setLoading(true)

    try {
      const poll = await createAvailabilityPoll({
        bandId,
        title,
        description: description || undefined,
        dateOptions: validOptions,
        closesAt: closesAt ? new Date(closesAt).toISOString() : undefined
      })

      router.push(`/band/${bandId}/availability/${poll.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href={`/band/${bandId}/availability`} className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to Polls
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Create Availability Poll</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1">
            Poll Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            placeholder="e.g., Best time for next rehearsal?"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={2}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
            placeholder="Optional description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Time Options *
          </label>
          <div className="space-y-3">
            {dateOptions.map((option, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-zinc-500 mb-1">Date</label>
                  <input
                    type="date"
                    value={option.date}
                    onChange={(e) => updateDateOption(index, 'date', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-zinc-500 mb-1">Start</label>
                  <input
                    type="time"
                    value={option.start_time}
                    onChange={(e) => updateDateOption(index, 'start_time', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-zinc-500 mb-1">End</label>
                  <input
                    type="time"
                    value={option.end_time}
                    onChange={(e) => updateDateOption(index, 'end_time', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                {dateOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDateOption(index)}
                    className="px-3 py-2 text-zinc-500 hover:text-red-400"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addDateOption}
            className="mt-3 text-sm text-purple-400 hover:text-purple-300"
          >
            + Add another time option
          </button>
        </div>

        <div>
          <label htmlFor="closesAt" className="block text-sm font-medium text-zinc-300 mb-1">
            Closes At (optional)
          </label>
          <input
            type="datetime-local"
            id="closesAt"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white rounded-lg"
        >
          {loading ? 'Creating...' : 'Create Poll'}
        </button>
      </form>
    </div>
  )
}

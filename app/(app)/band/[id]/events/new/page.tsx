'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createEvent } from '@/actions/events'
import Link from 'next/link'

export default function NewEventPage() {
  const router = useRouter()
  const params = useParams()
  const bandId = params.id as string

  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<'show' | 'rehearsal' | 'deadline' | 'other'>('rehearsal')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [venue, setVenue] = useState('')
  const [pay, setPay] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const startDateTime = `${startDate}T${startTime}:00`
      const endDateTime = endDate && endTime ? `${endDate}T${endTime}:00` : undefined

      const metadata: Record<string, unknown> = {}
      if (eventType === 'show') {
        if (venue) metadata.venue = venue
        if (pay) metadata.pay = pay
      }

      const event = await createEvent({
        bandId,
        title,
        eventType,
        startTime: startDateTime,
        endTime: endDateTime,
        location: location || undefined,
        description: description || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      })

      router.push(`/band/${bandId}/events/${event.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href={`/band/${bandId}/calendar`} className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to Calendar
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Create Event</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1">
            Event Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            placeholder="e.g., Band Practice, Summer Gig"
          />
        </div>

        <div>
          <label htmlFor="eventType" className="block text-sm font-medium text-zinc-300 mb-1">
            Event Type *
          </label>
          <select
            id="eventType"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as typeof eventType)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="rehearsal">Rehearsal</option>
            <option value="show">Show / Gig</option>
            <option value="deadline">Deadline</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-zinc-300 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-zinc-300 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-zinc-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-zinc-300 mb-1">
              End Time
            </label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-zinc-300 mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={500}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            placeholder="e.g., Practice space, venue address"
          />
        </div>

        {eventType === 'show' && (
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-4">
            <h3 className="text-sm font-medium text-zinc-300">Show Details</h3>
            <div>
              <label htmlFor="venue" className="block text-sm text-zinc-400 mb-1">
                Venue Name
              </label>
              <input
                type="text"
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="e.g., The Blue Note"
              />
            </div>
            <div>
              <label htmlFor="pay" className="block text-sm text-zinc-400 mb-1">
                Pay / Compensation
              </label>
              <input
                type="text"
                id="pay"
                value={pay}
                onChange={(e) => setPay(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="e.g., $500, Door split"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            rows={4}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
            placeholder="Add any additional details..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim() || !startDate || !startTime}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white rounded-lg"
        >
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  )
}

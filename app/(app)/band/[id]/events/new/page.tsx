'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createEvent } from '@/actions/events'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, CalendarPlus } from 'lucide-react'

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
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/band/${bandId}/calendar`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Calendar
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-headline">Create Event</CardTitle>
              <CardDescription>Add a new event to the calendar</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="e.g., Band Practice, Summer Gig"
                className="focus-ring-enhanced"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as typeof eventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rehearsal">Rehearsal</SelectItem>
                  <SelectItem value="show">Show / Gig</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="focus-ring-enhanced"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="focus-ring-enhanced"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="focus-ring-enhanced"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="focus-ring-enhanced"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={500}
                placeholder="e.g., Practice space, venue address"
                className="focus-ring-enhanced"
              />
            </div>

            {eventType === 'show' && (
              <Card className="bg-accent/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-title">Show Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue Name</Label>
                    <Input
                      type="text"
                      id="venue"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g., The Blue Note"
                      className="focus-ring-enhanced"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pay">Pay / Compensation</Label>
                    <Input
                      type="text"
                      id="pay"
                      value={pay}
                      onChange={(e) => setPay(e.target.value)}
                      placeholder="e.g., $500, Door split"
                      className="focus-ring-enhanced"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                rows={4}
                placeholder="Add any additional details..."
                className="focus-ring-enhanced"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !title.trim() || !startDate || !startTime}
              className="w-full btn-gradient"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

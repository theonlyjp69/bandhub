'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createAvailabilityPoll } from '@/actions/availability'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Clock, Plus, X } from 'lucide-react'

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
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/band/${bandId}/availability`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Polls
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Create Availability Poll</CardTitle>
              <CardDescription>Find the best time for your band</CardDescription>
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
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                placeholder="e.g., Best time for next rehearsal?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={2}
                placeholder="Optional description..."
              />
            </div>

            <div className="space-y-3">
              <Label>Time Options *</Label>
              {dateOptions.map((option, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <Input
                      type="date"
                      value={option.date}
                      onChange={(e) => updateDateOption(index, 'date', e.target.value)}
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs text-muted-foreground">Start</Label>
                    <Input
                      type="time"
                      value={option.start_time}
                      onChange={(e) => updateDateOption(index, 'start_time', e.target.value)}
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs text-muted-foreground">End</Label>
                    <Input
                      type="time"
                      value={option.end_time}
                      onChange={(e) => updateDateOption(index, 'end_time', e.target.value)}
                    />
                  </div>
                  {dateOptions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDateOption(index)}
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                onClick={addDateOption}
                className="text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add another time option
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closesAt">Closes At (optional)</Label>
              <Input
                type="datetime-local"
                id="closesAt"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

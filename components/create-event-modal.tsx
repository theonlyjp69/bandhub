'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { TimeSlotInput } from '@/components/time-slot-input'
import { MemberSelector } from '@/components/member-selector'
import { createEvent } from '@/actions/events'
import { toast } from 'sonner'
import { CalendarPlus } from 'lucide-react'

interface CreateEventModalProps {
  bandId: string
  trigger?: React.ReactNode
}

const EVENT_TYPES = [
  { value: 'show', label: 'Show/Gig' },
  { value: 'rehearsal', label: 'Rehearsal' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'recording', label: 'Recording' },
  { value: 'photoshoot', label: 'Photoshoot' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'other', label: 'Other' },
] as const

type EventType = typeof EVENT_TYPES[number]['value']

export function CreateEventModal({ bandId, trigger }: CreateEventModalProps): React.ReactElement {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [mode, setMode] = useState<'fixed' | 'poll'>('fixed')
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<EventType>('rehearsal')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  // Fixed mode fields
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [rsvpDeadline, setRsvpDeadline] = useState('')
  const [requireRsvp, setRequireRsvp] = useState(false)

  // Poll mode fields
  const [pollOptions, setPollOptions] = useState([
    { slotKey: crypto.randomUUID(), date: '', startTime: '', endTime: '' }
  ])
  const [pollClosesAt, setPollClosesAt] = useState('')

  // Visibility
  const [visibility, setVisibility] = useState<'band' | 'private'>('band')
  const [visibleUserIds, setVisibleUserIds] = useState<string[]>([])

  function resetForm(): void {
    setMode('fixed')
    setTitle('')
    setEventType('rehearsal')
    setLocation('')
    setDescription('')
    setStartDate('')
    setStartTime('')
    setEndDate('')
    setEndTime('')
    setRsvpDeadline('')
    setRequireRsvp(false)
    setPollOptions([{ slotKey: crypto.randomUUID(), date: '', startTime: '', endTime: '' }])
    setPollClosesAt('')
    setVisibility('band')
    setVisibleUserIds([])
  }

  function toISO(date: string, time: string): string {
    return new Date(`${date}T${time}`).toISOString()
  }

  function toISOIfPresent(value: string): string | undefined {
    return value ? new Date(value).toISOString() : undefined
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setLoading(true)

    const isFixed = mode === 'fixed'
    const isPrivate = visibility === 'private'

    try {
      await createEvent({
        bandId,
        title,
        eventType,
        startTime: isFixed && startDate && startTime
          ? toISO(startDate, startTime)
          : new Date().toISOString(),
        endTime: isFixed && endDate && endTime
          ? toISO(endDate, endTime)
          : undefined,
        location: location || undefined,
        description: description || undefined,
        mode,
        pollOptions: isFixed ? undefined : pollOptions,
        pollClosesAt: isFixed ? undefined : toISOIfPresent(pollClosesAt),
        rsvpDeadline: isFixed ? toISOIfPresent(rsvpDeadline) : undefined,
        requireRsvp: isFixed ? requireRsvp : false,
        visibility,
        visibleUserIds: isPrivate ? visibleUserIds : undefined,
      })

      toast.success(
        isFixed ? 'Event created successfully!' : 'Availability poll created!'
      )

      setOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      toast.error('Failed to create event')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function getSubmitLabel(): string {
    if (loading) return 'Creating...'
    if (mode === 'fixed') return 'Create Event'
    return 'Create Poll'
  }

  function isFormValid(): boolean {
    if (!title.trim()) return false
    if (mode === 'fixed') return Boolean(startDate && startTime)
    return pollOptions.some(opt => opt.date && opt.startTime)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="btn-gradient">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-headline">Create Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <SegmentedControl
              value={mode}
              onValueChange={(v) => setMode(v as 'fixed' | 'poll')}
              options={[
                { value: 'fixed', label: 'Fixed Time' },
                { value: 'poll', label: 'Find a Time' },
              ]}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Band practice, Studio session..."
                required
                maxLength={200}
                className="focus-ring-enhanced"
              />
            </div>

            <div>
              <Label htmlFor="eventType">Type</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                <SelectTrigger className="focus-ring-enhanced">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Studio, venue, address..."
                maxLength={500}
                className="focus-ring-enhanced"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What to bring, parking info..."
                maxLength={5000}
                className="focus-ring-enhanced"
              />
            </div>
          </div>

          {/* Mode-specific Fields */}
          {mode === 'fixed' ? (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="focus-ring-enhanced"
                  />
                </div>
                <div>
                  <Label>Start Time *</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="focus-ring-enhanced"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="focus-ring-enhanced"
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="focus-ring-enhanced"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="requireRsvp">Require RSVP</Label>
                <Switch
                  id="requireRsvp"
                  checked={requireRsvp}
                  onCheckedChange={setRequireRsvp}
                />
              </div>

              {requireRsvp && (
                <div>
                  <Label>RSVP Deadline</Label>
                  <Input
                    type="datetime-local"
                    value={rsvpDeadline}
                    onChange={(e) => setRsvpDeadline(e.target.value)}
                    className="focus-ring-enhanced"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 border-t pt-4">
              <div>
                <Label>Time Options *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Add multiple time slots for people to vote on
                </p>
                <TimeSlotInput
                  slots={pollOptions}
                  onChange={setPollOptions}
                />
              </div>

              <div>
                <Label>Voting Deadline</Label>
                <Input
                  type="datetime-local"
                  value={pollClosesAt}
                  onChange={(e) => setPollClosesAt(e.target.value)}
                  className="focus-ring-enhanced"
                />
              </div>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <div>
              <Label>Send to</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as 'band' | 'private')}
              >
                <SelectTrigger className="focus-ring-enhanced">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="band">All band members</SelectItem>
                  <SelectItem value="private">Specific members</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {visibility === 'private' && (
              <MemberSelector
                bandId={bandId}
                selectedIds={visibleUserIds}
                onChange={setVisibleUserIds}
              />
            )}
          </div>

          <Button
            type="submit"
            className="w-full btn-gradient"
            disabled={loading || !isFormValid()}
          >
            {getSubmitLabel()}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

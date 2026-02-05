'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus } from 'lucide-react'

interface TimeSlot {
  slotKey: string
  date: string
  startTime: string
  endTime: string
}

interface TimeSlotInputProps {
  slots: TimeSlot[]
  onChange: (slots: TimeSlot[]) => void
  maxSlots?: number
}

export function TimeSlotInput({
  slots,
  onChange,
  maxSlots = 10
}: TimeSlotInputProps): React.ReactElement {
  function addSlot(): void {
    if (slots.length >= maxSlots) return
    onChange([
      ...slots,
      { slotKey: crypto.randomUUID(), date: '', startTime: '', endTime: '' }
    ])
  }

  function removeSlot(slotKey: string): void {
    onChange(slots.filter(s => s.slotKey !== slotKey))
  }

  type EditableField = 'date' | 'startTime' | 'endTime'

  function updateSlot(slotKey: string, field: EditableField, value: string): void {
    onChange(slots.map(s =>
      s.slotKey === slotKey ? { ...s, [field]: value } : s
    ))
  }

  return (
    <div className="space-y-3">
      {slots.map((slot) => (
        <div key={slot.slotKey} className="flex items-end gap-2">
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={slot.date}
                onChange={(e) => updateSlot(slot.slotKey, 'date', e.target.value)}
                className="focus-ring-enhanced"
              />
            </div>
            <div>
              <Label className="text-xs">Start</Label>
              <Input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateSlot(slot.slotKey, 'startTime', e.target.value)}
                className="focus-ring-enhanced"
              />
            </div>
            <div>
              <Label className="text-xs">End</Label>
              <Input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateSlot(slot.slotKey, 'endTime', e.target.value)}
                className="focus-ring-enhanced"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeSlot(slot.slotKey)}
            disabled={slots.length === 1}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {slots.length < maxSlots && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSlot}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Time Option
        </Button>
      )}
    </div>
  )
}

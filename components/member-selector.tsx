'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { getBandMembers } from '@/actions/members'

interface Member {
  user_id: string
  display_name: string
}

interface MemberSelectorProps {
  bandId: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function MemberSelector({
  bandId,
  selectedIds,
  onChange
}: MemberSelectorProps): React.ReactElement {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMembers(): Promise<void> {
      try {
        const data = await getBandMembers(bandId)
        const validMembers = data
          .filter((m): m is typeof m & { user_id: string } => m.user_id !== null)
          .map(m => ({
            user_id: m.user_id,
            display_name: m.profiles?.display_name ?? 'Unknown member'
          }))
        setMembers(validMembers)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadMembers()
  }, [bandId])

  function toggleMember(userId: string): void {
    const isSelected = selectedIds.includes(userId)
    onChange(
      isSelected
        ? selectedIds.filter(id => id !== userId)
        : [...selectedIds, userId]
    )
  }

  function selectAll(): void {
    onChange(members.map(m => m.user_id))
  }

  function selectNone(): void {
    onChange([])
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground py-2">Loading members...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-xs">
        <button type="button" onClick={selectAll} className="text-primary hover:underline">
          Select all
        </button>
        <span className="text-muted-foreground">|</span>
        <button type="button" onClick={selectNone} className="text-primary hover:underline">
          Select none
        </button>
      </div>

      <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
        {members.map((member) => (
          <div key={member.user_id} className="flex items-center gap-2">
            <Checkbox
              id={member.user_id}
              checked={selectedIds.includes(member.user_id)}
              onCheckedChange={() => toggleMember(member.user_id)}
            />
            <Label htmlFor={member.user_id} className="text-sm cursor-pointer">
              {member.display_name}
            </Label>
          </div>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} member{selectedIds.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}

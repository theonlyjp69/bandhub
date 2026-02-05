'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createInvitation } from '@/actions/invitations'
import { removeMember, updateMemberRole } from '@/actions/members'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Trash2, Shield, User } from 'lucide-react'

type Member = {
  id: string
  user_id: string | null
  role: string | null
  profiles: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

type Props = {
  bandId: string
  members: Member[]
  isAdmin: boolean
  currentUserId: string
}

export function MembersList({ bandId, members, isAdmin, currentUserId }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setInviteLoading(true)

    try {
      await createInvitation(bandId, email)
      setSuccess(`Invitation created for ${email}. They can accept it after signing up.`)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    setProcessingId(memberId)
    setError('')

    try {
      await removeMember(memberId)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    setProcessingId(memberId)
    setError('')

    try {
      await updateMemberRole(memberId, newRole)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-title flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite New Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                className="flex-1 focus-ring-enhanced"
              />
              <Button type="submit" disabled={inviteLoading} className="btn-gradient">
                {inviteLoading ? 'Sending...' : 'Invite'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-green-400 bg-green-500/10 rounded-md border border-green-500/20">
          {success}
        </div>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <Card key={member.id} className="card-interactive stagger-item">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {member.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {member.profiles?.display_name || 'Unknown'}
                    </span>
                    {member.user_id === currentUserId && (
                      <Badge variant="outline" className="text-xs">you</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {member.role === 'admin' ? (
                      <>
                        <Shield className="h-3 w-3" />
                        Admin
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" />
                        Member
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isAdmin && member.user_id !== currentUserId && (
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role || 'member'}
                    onValueChange={(value) => handleRoleChange(member.id, value as 'admin' | 'member')}
                    disabled={processingId === member.id}
                  >
                    <SelectTrigger className="w-[110px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleRemove(member.id)}
                    disabled={processingId === member.id}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

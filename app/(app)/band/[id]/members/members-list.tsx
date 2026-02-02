'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createInvitation } from '@/actions/invitations'
import { removeMember, updateMemberRole } from '@/actions/members'

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
      setSuccess(`Invitation sent to ${email}`)
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
    <div>
      {isAdmin && (
        <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h2 className="text-lg font-medium text-white mb-4">Invite New Member</h2>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={inviteLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg"
            >
              {inviteLoading ? 'Sending...' : 'Invite'}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300 text-sm">
          {success}
        </div>
      )}

      <ul className="space-y-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-zinc-300">
                {member.profiles?.display_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-white font-medium">
                  {member.profiles?.display_name || 'Unknown'}
                  {member.user_id === currentUserId && (
                    <span className="text-zinc-500 text-sm ml-2">(you)</span>
                  )}
                </p>
                <p className="text-zinc-400 text-sm capitalize">{member.role}</p>
              </div>
            </div>

            {isAdmin && member.user_id !== currentUserId && (
              <div className="flex items-center gap-2">
                <select
                  value={member.role || 'member'}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'member')}
                  disabled={processingId === member.id}
                  className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 text-sm"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => handleRemove(member.id)}
                  disabled={processingId === member.id}
                  className="px-3 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

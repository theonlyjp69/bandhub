'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserInvitations, acceptInvitation, declineInvitation } from '@/actions/invitations'
import Link from 'next/link'

type Invitation = {
  id: string
  bands: { id: string; name: string } | null
  profiles: { display_name: string } | null
}

export default function InvitationsPage() {
  const router = useRouter()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    try {
      const data = await getUserInvitations()
      setInvitations(data as Invitation[])
    } catch (err) {
      setError('Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (id: string) => {
    setProcessingId(id)
    setError('')
    try {
      await acceptInvitation(id)
      setInvitations(prev => prev.filter(inv => inv.id !== id))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (id: string) => {
    setProcessingId(id)
    setError('')
    try {
      await declineInvitation(id)
      setInvitations(prev => prev.filter(inv => inv.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invitation')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return <div className="text-zinc-400">Loading invitations...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Pending Invitations</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-400">No pending invitations.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {invitations.map((invitation) => (
            <li
              key={invitation.id}
              className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-white">
                    {invitation.bands?.name || 'Unknown Band'}
                  </h2>
                  <p className="text-zinc-400 text-sm">
                    Invited by {invitation.profiles?.display_name || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white text-sm rounded-lg"
                  >
                    {processingId === invitation.id ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleDecline(invitation.id)}
                    disabled={processingId === invitation.id}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-700/50 text-white text-sm rounded-lg"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

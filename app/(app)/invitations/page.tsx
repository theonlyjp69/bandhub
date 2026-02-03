'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUserInvitations, acceptInvitation, declineInvitation } from '@/actions/invitations'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Music, Check, X } from 'lucide-react'

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
    } catch {
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading invitations...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-primary/10 p-2">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-headline">Pending Invitations</h1>
          <p className="text-muted-foreground text-sm">
            {invitations.length === 0
              ? 'No pending invitations'
              : `${invitations.length} invitation${invitations.length !== 1 ? 's' : ''} waiting`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      {invitations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-title mb-2">No pending invitations</h3>
            <p className="text-muted-foreground text-center mb-4">
              When someone invites you to join their band, it will appear here.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <Card key={invitation.id} className="card-interactive stagger-item">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Music className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-medium">
                      {invitation.bands?.name || 'Unknown Band'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Invited by {invitation.profiles?.display_name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleAccept(invitation.id)}
                    disabled={processingId === invitation.id}
                    size="sm"
                    className="btn-gradient"
                  >
                    <Check className="mr-1 h-4 w-4" />
                    {processingId === invitation.id ? 'Processing...' : 'Accept'}
                  </Button>
                  <Button
                    onClick={() => handleDecline(invitation.id)}
                    disabled={processingId === invitation.id}
                    variant="outline"
                    size="sm"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

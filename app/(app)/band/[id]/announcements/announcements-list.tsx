'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAnnouncement, deleteAnnouncement } from '@/actions/announcements'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Megaphone, Trash2 } from 'lucide-react'

type Announcement = {
  id: string
  title: string | null
  content: string | null
  created_at: string | null
  created_by: string | null
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

type Props = {
  bandId: string
  announcements: Announcement[]
  isAdmin: boolean
  currentUserId: string
}

export function AnnouncementsList({ bandId, announcements, isAdmin, currentUserId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await createAnnouncement(bandId, title, content)
      setTitle('')
      setContent('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create announcement')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    setDeletingId(id)

    try {
      await deleteAnnouncement(id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-title">Create Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  placeholder="Announcement title (optional)"
                  className="focus-ring-enhanced"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  maxLength={5000}
                  rows={4}
                  placeholder="Write your announcement..."
                  className="focus-ring-enhanced"
                />
              </div>
              <Button type="submit" disabled={loading || !content.trim()} className="btn-gradient">
                {loading ? 'Posting...' : 'Post Announcement'}
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

      {announcements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-title mb-2">No announcements yet</h3>
            <p className="text-muted-foreground text-center">
              {isAdmin ? 'Create your first announcement above.' : 'Check back later for updates.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={announcement.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {announcement.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {announcement.title && (
                          <h3 className="text-title mb-1">{announcement.title}</h3>
                        )}
                        <p className="text-muted-foreground text-sm">
                          {announcement.profiles?.display_name || 'Unknown'}
                          {announcement.created_at && (
                            <> · {new Date(announcement.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}</>
                          )}
                        </p>
                      </div>
                      {(isAdmin || announcement.created_by === currentUserId) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(announcement.id)}
                          disabled={deletingId === announcement.id}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap">{announcement.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createThread } from '@/actions/threads'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, MessagesSquare, Plus } from 'lucide-react'

type Thread = {
  id: string
  title: string | null
  created_at: string | null
  profiles: { display_name: string | null } | null
  messages: { count: number }[] | null
}

type Props = {
  bandId: string
  threads: Thread[]
}

export function ThreadsList({ bandId, threads }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setError('')
    setLoading(true)

    try {
      const thread = await createThread(bandId, title.trim())
      setTitle('')
      router.push(`/band/${bandId}/threads/${thread.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thread')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Start a New Thread</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thread title..."
              maxLength={200}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !title.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </form>
          {error && (
            <p className="mt-2 text-destructive text-sm">{error}</p>
          )}
        </CardContent>
      </Card>

      {threads.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <MessagesSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No threads yet</h3>
            <p className="text-muted-foreground text-center">
              Start a discussion with your band above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const messageCount = thread.messages?.[0]?.count || 0
            return (
              <Link key={thread.id} href={`/band/${bandId}/threads/${thread.id}`}>
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                          <MessageCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{thread.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            Started by {thread.profiles?.display_name || 'Unknown'}
                            {thread.created_at && (
                              <> · {new Date(thread.created_at).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {messageCount} {messageCount === 1 ? 'reply' : 'replies'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

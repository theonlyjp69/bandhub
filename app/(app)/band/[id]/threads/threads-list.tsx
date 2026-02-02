'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createThread } from '@/actions/threads'
import Link from 'next/link'

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
    <div>
      <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
        <h2 className="text-lg font-medium text-white mb-4">Start a New Thread</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Thread title..."
            maxLength={200}
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
        {error && (
          <p className="mt-2 text-red-400 text-sm">{error}</p>
        )}
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500">No threads yet. Start a discussion!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => {
            const messageCount = thread.messages?.[0]?.count || 0
            return (
              <li key={thread.id}>
                <Link
                  href={`/band/${bandId}/threads/${thread.id}`}
                  className="block p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{thread.title}</h3>
                      <p className="text-zinc-500 text-sm mt-1">
                        Started by {thread.profiles?.display_name || 'Unknown'}
                        {thread.created_at && (
                          <> &middot; {new Date(thread.created_at).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <span className="text-zinc-400 text-sm">
                      {messageCount} {messageCount === 1 ? 'reply' : 'replies'}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

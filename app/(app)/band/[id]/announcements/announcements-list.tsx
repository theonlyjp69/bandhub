'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAnnouncement, deleteAnnouncement } from '@/actions/announcements'

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
    <div>
      {isAdmin && (
        <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h2 className="text-lg font-medium text-white mb-4">Create Announcement</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm text-zinc-400 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                placeholder="Announcement title (optional)"
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm text-zinc-400 mb-1">
                Content *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                maxLength={5000}
                rows={4}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                placeholder="Write your announcement..."
              />
            </div>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-lg"
            >
              {loading ? 'Posting...' : 'Post Announcement'}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500">No announcements yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {announcements.map((announcement) => (
            <li
              key={announcement.id}
              className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {announcement.title && (
                    <h3 className="text-lg font-medium text-white mb-2">{announcement.title}</h3>
                  )}
                  <p className="text-zinc-300 whitespace-pre-wrap">{announcement.content}</p>
                  <div className="mt-4 text-zinc-500 text-sm">
                    Posted by {announcement.profiles?.display_name || 'Unknown'}
                    {announcement.created_at && (
                      <> &middot; {new Date(announcement.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}</>
                    )}
                  </div>
                </div>
                {(isAdmin || announcement.created_by === currentUserId) && (
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    disabled={deletingId === announcement.id}
                    className="text-zinc-500 hover:text-red-400 text-sm"
                  >
                    {deletingId === announcement.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

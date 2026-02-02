import { getBand } from '@/actions/bands'
import { getThread } from '@/actions/threads'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChatRoom } from '../../chat/chat-room'

type Props = {
  params: Promise<{ id: string; threadId: string }>
}

export default async function ThreadPage({ params }: Props) {
  const { id: bandId, threadId } = await params

  let band, thread

  try {
    [band, thread] = await Promise.all([
      getBand(bandId),
      getThread(threadId)
    ])
  } catch {
    notFound()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="mb-4">
        <Link href={`/band/${bandId}/threads`} className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to Threads
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">{thread.title}</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Started by {thread.profiles?.display_name || 'Unknown'}
          {thread.created_at && (
            <> &middot; {new Date(thread.created_at).toLocaleDateString()}</>
          )}
        </p>
      </div>

      <ChatRoom bandId={bandId} threadId={threadId} />
    </div>
  )
}

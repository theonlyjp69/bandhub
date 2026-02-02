import { getBand } from '@/actions/bands'
import { getThread } from '@/actions/threads'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
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
      <Link
        href={`/band/${bandId}/threads`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Threads
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-primary/10 p-2">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{thread.title}</h1>
          <p className="text-muted-foreground text-sm">
            Started by {thread.profiles?.display_name || 'Unknown'}
            {thread.created_at && (
              <> · {new Date(thread.created_at).toLocaleDateString()}</>
            )}
          </p>
        </div>
      </div>

      <ChatRoom bandId={bandId} threadId={threadId} />
    </div>
  )
}

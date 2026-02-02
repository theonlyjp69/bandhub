import { getBand } from '@/actions/bands'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { ChatRoom } from './chat-room'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params

  let band

  try {
    band = await getBand(id)
  } catch {
    notFound()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <Link
        href={`/band/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {band.name}
      </Link>

      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-primary/10 p-2">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Chat</h1>
      </div>

      <ChatRoom bandId={id} />
    </div>
  )
}

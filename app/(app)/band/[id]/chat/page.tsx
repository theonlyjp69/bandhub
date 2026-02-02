import { getBand } from '@/actions/bands'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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
      <div className="mb-4">
        <Link href={`/band/${id}`} className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to {band.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-4">Chat</h1>

      <ChatRoom bandId={id} />
    </div>
  )
}

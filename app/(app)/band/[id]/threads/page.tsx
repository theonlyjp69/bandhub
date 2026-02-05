import { getBand } from '@/actions/bands'
import { getBandThreads } from '@/actions/threads'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { ThreadsList } from './threads-list'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ThreadsPage({ params }: Props) {
  const { id } = await params

  let band, threads

  try {
    [band, threads] = await Promise.all([
      getBand(id),
      getBandThreads(id)
    ])
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/band/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {band.name}
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-headline">Discussion Threads</h1>
          <p className="text-muted-foreground text-sm">
            {threads.length} thread{threads.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <ThreadsList bandId={id} threads={threads} />
    </div>
  )
}

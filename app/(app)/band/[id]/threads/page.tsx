import { getBand } from '@/actions/bands'
import { getBandThreads } from '@/actions/threads'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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
    <div>
      <div className="mb-6">
        <Link href={`/band/${id}`} className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to {band.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Discussion Threads</h1>

      <ThreadsList bandId={id} threads={threads} />
    </div>
  )
}

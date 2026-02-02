import { getBand } from '@/actions/bands'
import { getBandFiles } from '@/actions/files'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FilesList } from './files-list'

type Props = {
  params: Promise<{ id: string }>
}

export default async function FilesPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  let band, files

  try {
    [band, files] = await Promise.all([
      getBand(id),
      getBandFiles(id)
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

      <h1 className="text-2xl font-bold text-white mb-6">Files</h1>

      <FilesList bandId={id} files={files} currentUserId={user.id} />
    </div>
  )
}

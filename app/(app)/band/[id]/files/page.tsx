import { getBand } from '@/actions/bands'
import { getBandFiles } from '@/actions/files'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FolderOpen } from 'lucide-react'
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
          <FolderOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground text-sm">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <FilesList bandId={id} files={files} currentUserId={user.id} />
    </div>
  )
}

import { getBand } from '@/actions/bands'
import { getBandAnnouncements } from '@/actions/announcements'
import { getBandMembers } from '@/actions/members'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Megaphone } from 'lucide-react'
import { AnnouncementsList } from './announcements-list'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AnnouncementsPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  let band, announcements, members

  try {
    [band, announcements, members] = await Promise.all([
      getBand(id),
      getBandAnnouncements(id),
      getBandMembers(id)
    ])
  } catch {
    notFound()
  }

  const currentMember = members.find(m => m.user_id === user.id)
  const isAdmin = currentMember?.role === 'admin'

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
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground text-sm">
            {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <AnnouncementsList
        bandId={id}
        announcements={announcements}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />
    </div>
  )
}

import { getBand } from '@/actions/bands'
import { getBandAnnouncements } from '@/actions/announcements'
import { getBandMembers } from '@/actions/members'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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
    <div>
      <div className="mb-6">
        <Link href={`/band/${id}`} className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to {band.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Announcements</h1>

      <AnnouncementsList
        bandId={id}
        announcements={announcements}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />
    </div>
  )
}

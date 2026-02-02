import { getBand } from '@/actions/bands'
import { getBandMembers } from '@/actions/members'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MembersList } from './members-list'

type Props = {
  params: Promise<{ id: string }>
}

export default async function MembersPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  let band, members

  try {
    [band, members] = await Promise.all([
      getBand(id),
      getBandMembers(id)
    ])
  } catch {
    notFound()
  }

  const currentUserMember = members.find(m => m.user_id === user.id)
  const isAdmin = currentUserMember?.role === 'admin'

  return (
    <div>
      <div className="mb-6">
        <Link href={`/band/${id}`} className="text-zinc-400 hover:text-white text-sm">
          &larr; Back to {band.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Members</h1>

      <MembersList
        bandId={id}
        members={members}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />
    </div>
  )
}

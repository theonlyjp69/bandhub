import { getBand } from '@/actions/bands'
import { getBandMembers } from '@/actions/members'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MembersList } from './members-list'
import { ArrowLeft, Users } from 'lucide-react'

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
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/band/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {band.name}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-primary/10 p-2">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground text-sm">
            {members.length} member{members.length !== 1 ? 's' : ''} in {band.name}
          </p>
        </div>
      </div>

      <MembersList
        bandId={id}
        members={members}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />
    </div>
  )
}

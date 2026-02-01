import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6">
          <h2 className="text-lg font-medium text-white mb-4">Your Profile</h2>
          <div className="flex items-center gap-4">
            {profile?.avatar_url && (
              <Image
                src={profile.avatar_url}
                alt="Avatar"
                width={64}
                height={64}
                className="rounded-full"
              />
            )}
            <div>
              <p className="text-white font-medium">{profile?.display_name}</p>
              <p className="text-zinc-400 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <p className="text-zinc-500 text-sm text-center">
            Authentication complete. Band management coming in Stage 3.
          </p>
        </div>
      </div>
    </div>
  )
}

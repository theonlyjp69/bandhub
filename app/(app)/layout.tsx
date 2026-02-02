import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold text-white">
              BandHub
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-zinc-400 hover:text-white">
                Dashboard
              </Link>
              <Link href="/invitations" className="text-zinc-400 hover:text-white">
                Invitations
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm">
              {profile?.display_name || user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded hover:border-zinc-600"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

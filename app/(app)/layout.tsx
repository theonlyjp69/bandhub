import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'

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
    <div className="relative min-h-screen bg-background">
      <Navbar
        user={{ email: user.email || '' }}
        profile={profile}
      />
      <main className="container max-w-screen-xl mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  )
}

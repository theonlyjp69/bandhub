'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Music } from 'lucide-react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.15),transparent)]" />

      <Card className="w-full max-w-sm border-border/50 bg-card/50 backdrop-blur elevation-3 animate-scale-in">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Music className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-headline text-gradient-primary">BandHub</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your band&apos;s home base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
              Authentication failed. Please try again.
            </div>
          )}

          <Button
            onClick={handleLogin}
            variant="outline"
            className="w-full h-11 gap-3 border-border hover:bg-accent hover:text-accent-foreground focus-ring-enhanced"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Manage events, communicate, and collaborate with your band
          </p>
        </CardContent>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground">
        Coordinate rehearsals, shows, and everything in between
      </p>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.15),transparent)]" />
      <Card className="w-full max-w-sm border-border/50 bg-card/50 backdrop-blur elevation-3">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Music className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-headline text-gradient-primary">BandHub</CardTitle>
          <CardDescription className="text-muted-foreground">
            Loading...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  )
}

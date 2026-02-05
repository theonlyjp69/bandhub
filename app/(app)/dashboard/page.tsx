import { getUserBands } from '@/actions/bands'
import { getUserInvitations } from '@/actions/invitations'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Music, Mail, Users, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const [bands, invitations] = await Promise.all([
    getUserBands(),
    getUserInvitations()
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline">My Bands</h1>
          <p className="text-muted-foreground">
            Manage your bands and collaborations
          </p>
        </div>
        <Button asChild className="btn-gradient">
          <Link href="/create-band">
            <Plus className="mr-2 h-4 w-4" />
            Create Band
          </Link>
        </Button>
      </div>

      {/* Invitations alert */}
      {invitations.length > 0 && (
        <Link href="/invitations">
          <Card className="border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Pending Invitations</p>
                  <p className="text-sm text-muted-foreground">
                    You have {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} waiting
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
                {invitations.length}
              </Badge>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Bands grid */}
      {bands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="empty-state">
            <div className="empty-state-icon">
              <Music className="h-8 w-8 text-muted-foreground" />
              <span className="empty-state-ring" />
            </div>
            <h3 className="text-title mb-2">No bands yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first band or accepting an invitation.
            </p>
            <Button asChild className="btn-gradient">
              <Link href="/create-band">
                <Plus className="mr-2 h-4 w-4" />
                Create your first band
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bands.map((band) => (
            <Link key={band.id} href={`/band/${band.id}`}>
              <Card className="h-full card-interactive stagger-item group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Music className="h-4 w-4 text-primary" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="text-title mt-3">{band.name}</CardTitle>
                  {band.description && (
                    <CardDescription className="line-clamp-2">
                      {band.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {band.band_members?.length || 1} member{(band.band_members?.length || 1) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

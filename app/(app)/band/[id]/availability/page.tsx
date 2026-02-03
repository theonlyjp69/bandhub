import { getBand } from '@/actions/bands'
import { getBandPolls } from '@/actions/availability'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, Plus, Users } from 'lucide-react'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AvailabilityPage({ params }: Props) {
  const { id } = await params

  let band, polls

  try {
    [band, polls] = await Promise.all([
      getBand(id),
      getBandPolls(id)
    ])
  } catch {
    notFound()
  }

  const now = new Date()

  return (
    <div className="space-y-6">
      <Link
        href={`/band/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {band.name}
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-headline">Availability Polls</h1>
            <p className="text-muted-foreground text-sm">
              {polls.length} poll{polls.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button asChild className="btn-gradient">
          <Link href={`/band/${id}/availability/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Poll
          </Link>
        </Button>
      </div>

      {polls.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-title mb-2">No availability polls yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create a poll to find the best time for your band
            </p>
            <Button asChild className="btn-gradient">
              <Link href={`/band/${id}/availability/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first poll
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => {
            const responseCount = poll.availability_responses?.length || 0
            const isClosed = poll.closes_at && new Date(poll.closes_at) < now

            return (
              <Link key={poll.id} href={`/band/${id}/availability/${poll.id}`}>
                <Card className="card-interactive stagger-item">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-title">{poll.title}</h3>
                          {isClosed && (
                            <Badge variant="secondary">Closed</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                          Created by {poll.profiles?.display_name || 'Unknown'}
                          {poll.created_at && (
                            <> · {new Date(poll.created_at).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Users className="h-4 w-4" />
                        {responseCount}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

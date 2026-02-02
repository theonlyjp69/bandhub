import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function EventLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link skeleton */}
      <Skeleton className="h-4 w-32" />

      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Event details skeleton */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* RSVP section skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

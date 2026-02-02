import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function PollLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link skeleton */}
      <Skeleton className="h-4 w-24" />

      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Best time skeleton */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardContent>
      </Card>

      {/* Voting options skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
          <Skeleton className="h-10 w-full mt-4" />
        </CardContent>
      </Card>

      {/* Responses table skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-24" />
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-4 w-4" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

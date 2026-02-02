import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Back link skeleton */}
      <Skeleton className="h-4 w-32 mb-4" />

      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-16" />
      </div>

      {/* Chat room skeleton */}
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardContent className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          ))}
        </CardContent>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </Card>
    </div>
  )
}

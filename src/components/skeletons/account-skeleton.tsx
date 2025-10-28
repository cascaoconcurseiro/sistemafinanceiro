import { Skeleton } from "@/components/ui/skeleton"

export function AccountCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-[150px]" />
          <Skeleton className="h-3 w-[100px]" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-[180px]" />
        <Skeleton className="h-3 w-[120px]" />
      </div>
    </div>
  )
}

export function AccountListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <AccountCardSkeleton key={i} />
      ))}
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton"

export function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-5 w-[100px] ml-auto" />
        <Skeleton className="h-3 w-[80px] ml-auto" />
      </div>
    </div>
  )
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }).map((_, i) => (
        <TransactionSkeleton key={i} />
      ))}
    </div>
  )
}

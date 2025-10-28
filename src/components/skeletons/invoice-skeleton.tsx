import { Skeleton } from "@/components/ui/skeleton"

export function InvoiceCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-[120px]" />
          <Skeleton className="h-3 w-[80px]" />
        </div>
        <Skeleton className="h-6 w-[60px] rounded-full" />
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      </div>

      <Skeleton className="h-2 w-full rounded-full" />

      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  )
}

export function InvoiceListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <InvoiceCardSkeleton key={i} />
      ))}
    </div>
  )
}

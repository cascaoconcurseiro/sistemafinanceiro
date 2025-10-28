import { Skeleton } from "@/components/ui/skeleton"

export function DashboardCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-[150px]" />
      <Skeleton className="h-3 w-[120px]" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>

      {/* Gráfico */}
      <div className="p-6 border rounded-lg space-y-4">
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-[300px] w-full" />
      </div>

      {/* Transações recentes */}
      <div className="p-6 border rounded-lg space-y-4">
        <Skeleton className="h-6 w-[180px]" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
              <Skeleton className="h-5 w-[80px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

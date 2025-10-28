'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ModernAppLayout } from '@/components/modern-app-layout';
import {
  LazyInvestmentDashboard,
  LazyWrapper,
} from '@/components/optimization/lazy-loader';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvestmentsPage() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return (
      <ModernAppLayout
        title="Investimentos"
        subtitle="Acompanhe e gerencie seus investimentos"
      >
        <div className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </ModernAppLayout>
    );
  }
  
  if (!session) {
    redirect('/login');
  }
  
  return (
    <ModernAppLayout
      title="Investimentos"
      subtitle="Acompanhe e gerencie seus investimentos"
    >
      <div className="p-4 md:p-6 space-y-6">
        <LazyWrapper height="500px">
          <LazyInvestmentDashboard userId={session.user.id} />
        </LazyWrapper>
      </div>
    </ModernAppLayout>
  );
}

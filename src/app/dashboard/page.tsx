'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModernAppLayout } from '@/components/modern-app-layout';
import { DashboardContent } from '@/components/dashboard-content';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store'
        });

        if (!response.ok) {
          router.replace('/auth/login');
        }
      } catch (error) {
        router.replace('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <ModernAppLayout 
      title="Dashboard"
      subtitle="Visão geral das suas finanças"
    >
      <DashboardContent />
    </ModernAppLayout>
  );
}

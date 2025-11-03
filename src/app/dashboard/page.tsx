'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModernAppLayout } from '@/components/layout/modern-app-layout';
import { DashboardContent } from '@/components/layout/dashboard-content';

export default function DashboardPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store'
        });

        const data = await response.json();

        if (!isMounted) return;

        if (response.ok && data.success) {
          setIsAuthenticated(true);
          setIsChecking(false);
        } else {
          router.replace('/auth/login');
        }
      } catch (error) {
        if (isMounted) {
          router.replace('/auth/login');
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ModernAppLayout
      title="Dashboard"
      subtitle="Visão geral das suas finanças"
    >
      <DashboardContent />
    </ModernAppLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModernAppLayout } from '@/components/modern-app-layout';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AdminAuth } from '@/components/admin/admin-auth';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificação de sessão admin agora via banco de dados
    console.warn('Admin session check - localStorage removido, implementar via banco de dados');
    
    // TODO: Implementar verificação via banco de dados
    // const checkAdminSession = async () => {
    //   try {
    //     const session = await databaseAdapter.getAdminSession();
    //     if (!session || !session.isValid) {
    //       setIsAuthenticated(false);
    //     } else {
    //       setIsAuthenticated(true);
    //     }
    //   } catch (error) {
    //     console.error('Error checking admin session:', error);
    //     setIsAuthenticated(false);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // checkAdminSession();
    
    setLoading(false);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Log de logout via API
    const logData = {
      id: `log_${Date.now()}`,
      action: 'logout',
      timestamp: new Date().toISOString(),
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      ip: 'localhost',
    };

    // Salvar log via API
    fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    }).catch(error => {
      console.warn('Erro ao salvar log de logout:', error);
    });

    setIsAuthenticated(false);
    router.push('/');
  };

  if (loading) {
    return (
      <ModernAppLayout title="Admin" subtitle="Área Administrativa">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ModernAppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <ModernAppLayout title="Admin" subtitle="Área Administrativa">
        <AdminAuth onAuthSuccess={handleAuthSuccess} />
      </ModernAppLayout>
    );
  }

  return (
    <ModernAppLayout title="Admin" subtitle="Painel Administrativo">
      <AdminDashboard onLogout={handleLogout} />
    </ModernAppLayout>
  );
}

'use client';

import { useState } from 'react';
import { ModernAppLayout } from '@/components/layout/modern-app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Database,
  UserCheck,
  Bell,
  Palette,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: 'Perfil & Conta',
      description: 'Gerencie seus dados pessoais e informações da conta',
      icon: UserCheck,
      href: '/settings/profile',
      badge: null,
    },
    {
      title: 'Notificações',
      description: 'Configure alertas, lembretes e avisos do sistema',
      icon: Bell,
      href: '/settings/notifications',
      badge: null,
    },
    {
      title: 'Aparência',
      description: 'Tema, cores e personalização da interface',
      icon: Palette,
      href: '/settings/appearance',
      badge: null,
    },
    {
      title: 'Segurança',
      description: 'Senha, autenticação e configurações de segurança',
      icon: Shield,
      href: '/settings/security',
      badge: null,
    },
    {
      title: 'Backup & Dados',
      description: 'Exportar, importar e gerenciar seus dados',
      icon: Database,
      href: '/settings/backup',
      badge: null,
    },
  ];

  return (
    <ModernAppLayout
      title="Configurações"
      subtitle="Personalize e gerencie suas preferências"
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Settings Categories */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Categorias de Configuracao
          </h2>
          <div className="grid gap-4">
            {settingsCategories.map((category) => (
              <Link key={category.title} href={category.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <category.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold flex items-center gap-2 text-foreground">
                            {category.title}
                            {category.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {category.badge}
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-gray-400 dark:text-gray-500">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>


      </div>
    </ModernAppLayout>
  );
}

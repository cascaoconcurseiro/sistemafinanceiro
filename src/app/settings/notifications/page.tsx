'use client';

import { useState, useEffect } from 'react';
import { ModernAppLayout } from '@/components/modern-app-layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
// import { storage, type NotificationPreferences } from '@/lib/storage'; // Removido - usar API

// Definição temporária do tipo
interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}
import { toast } from 'sonner';
import { BackButton } from '@/components/back-button';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';

export default function NotificationSettingsPage() {
  const { data } = useUnifiedFinancial();
  const accounts = data?.accounts || [];
  const transactions = data?.transactions || [];
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    billing: true,
    goal: true,
    investments: true,
    general: true,
  });

  useEffect(() => {
    try {
      // TODO: Implementar carregamento de preferências via API
      // const savedPreferences = storage.getNotificationPreferences();
      // setPreferences(savedPreferences);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }, []);

  const handlePreferenceChange = (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    try {
      // TODO: Implementar salvamento de preferências via API
      // storage.setNotificationPreferences(newPreferences);
      toast.success('Preferências de notificação atualizadas!');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Erro ao salvar as preferências.');
    }
  };

  return (
    <ModernAppLayout
      title="Configurações de Notificações"
    >
      <div className="p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Configurar Notificações
              </h1>
              <p className="text-muted-foreground">
                Escolha quais notificações você deseja receber.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Ative ou desative os tipos de notificação que você quer ver. As
                alterações são salvas automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label
                    htmlFor="billing-notifications"
                    className="font-medium"
                  >
                    Notificações de Faturamento
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas sobre contas a vencer, faturas fechadas e pagamentos
                    confirmados.
                  </p>
                </div>
                <Switch
                  id="billing-notifications"
                  checked={preferences.billing}
                  onCheckedChange={(value) =>
                    handlePreferenceChange('billing', value)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="goals-notifications" className="font-medium">
                    Notificações de Metas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Avisos sobre o progresso, metas atingidas e sugestões para
                    alcançá-las.
                  </p>
                </div>
                <Switch
                  id="goals-notifications"
                  checked={preferences.goal}
                  onCheckedChange={(value) =>
                    handlePreferenceChange('goal', value)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label
                    htmlFor="investments-notifications"
                    className="font-medium"
                  >
                    Notificações de Investimentos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Relatórios de desempenho, novas oportunidades e alertas de
                    mercado.
                  </p>
                </div>
                <Switch
                  id="investments-notifications"
                  checked={preferences.investments}
                  onCheckedChange={(value) =>
                    handlePreferenceChange('investments', value)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label
                    htmlFor="general-notifications"
                    className="font-medium"
                  >
                    Notificações Gerais
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Dicas de uso, novidades sobre o aplicativo e outras
                    informações úteis.
                  </p>
                </div>
                <Switch
                  id="general-notifications"
                  checked={preferences.general}
                  onCheckedChange={(value) =>
                    handlePreferenceChange('general', value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernAppLayout>
  );
}



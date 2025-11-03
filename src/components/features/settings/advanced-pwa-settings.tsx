'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Smartphone,
  Wifi,
  Download,
  Settings,
  Clock,
  Shield,
  Zap,
  Database,
  RefreshCw as Sync,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
// import {
//   pushNotificationService,
//   type ScheduledNotification,
// } from '@/lib/push-notification-service'; // Removido

// Tipos temporários até implementar o serviço
type ScheduledNotification = {
  id: string;
  title: string;
  body: string;
  scheduledFor: Date;
  type: string;
};

interface PWASettings {
  notifications: {
    enabled: boolean;
    billReminders: boolean;
    goalMilestones: boolean;
    investmentAlerts: boolean;
    budgetWarnings: boolean;
    weeklyReports: boolean;
    reminderTime: string;
  };
  offline: {
    cacheSize: 'small' | 'medium' | 'large';
    autoSync: boolean;
    backgroundSync: boolean;
  };
  installation: {
    showPrompt: boolean;
    autoInstall: boolean;
  };
}

export function AdvancedPWASettings() {
  const [settings, setSettings] = useState<PWASettings>({
    notifications: {
      enabled: false,
      billReminders: true,
      goalMilestones: true,
      investmentAlerts: false,
      budgetWarnings: true,
      weeklyReports: false,
      reminderTime: '09:00',
    },
    offline: {
      cacheSize: 'medium',
      autoSync: true,
      backgroundSync: true,
    },
    installation: {
      showPrompt: true,
      autoInstall: false,
    },
  });

  const [pwaStatus, setPwaStatus] = useState({
    installed: false,
    serviceWorkerActive: false,
    notificationPermission: 'default' as NotificationPermission,
    online: true,
    cacheSize: 0,
  });

  const [scheduledNotifications, setScheduledNotifications] = useState<
    ScheduledNotification[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPWAStatus();
    loadScheduledNotifications();
  }, []);

  const loadSettings = () => {
    try {
      // Dados agora vêm do banco de dados, não do localStorage
      console.warn('advanced-pwa-settings - localStorage removido, use banco de dados');
      if (typeof window === 'undefined') return;
      // Usar configurações padrão até implementar banco de dados
    } catch (error) {
      console.error('Failed to load PWA settings:', error);
    }
  };

  const saveSettings = (newSettings: PWASettings) => {
    try {
      // Dados agora são salvos no banco de dados, não do localStorage
      console.warn('advanced-pwa-settings save - localStorage removido, use banco de dados');
      setSettings(newSettings);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Failed to save PWA settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const checkPWAStatus = async () => {
    const status = {
      installed: window.matchMedia('(display-mode: standalone)').matches,
      serviceWorkerActive:
        typeof navigator !== 'undefined' &&
        'serviceWorker' in navigator &&
        !!(await navigator.serviceWorker.getRegistration()),
      notificationPermission:
        'Notification' in window
          ? Notification.permission
          : ('denied' as NotificationPermission),
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      cacheSize: 0,
    };

    // Estimate cache size
    if (
      typeof navigator !== 'undefined' &&
      'storage' in navigator &&
      'estimate' in navigator.storage
    ) {
      try {
        const estimate = await navigator.storage.estimate();
        status.cacheSize = estimate.usage || 0;
      } catch (error) {
        console.error('Failed to estimate cache size:', error);
      }
    }

    setPwaStatus(status);
  };

  const loadScheduledNotifications = () => {
    const notifications = pushNotificationService.getScheduledNotifications();
    setScheduledNotifications(notifications);
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      setLoading(true);
      try {
        const permission = await pushNotificationService.requestPermission();
        if (permission === 'granted') {
          const newSettings = {
            ...settings,
            notifications: { ...settings.notifications, enabled: true },
          };
          saveSettings(newSettings);
          setPwaStatus((prev) => ({
            ...prev,
            notificationPermission: permission,
          }));
        } else {
          toast.error('Permissão de notificação negada');
        }
      } catch (error) {
        console.error('Failed to enable notifications:', error);
        toast.error('Erro ao ativar notificações');
      } finally {
        setLoading(false);
      }
    } else {
      const newSettings = {
        ...settings,
        notifications: { ...settings.notifications, enabled: false },
      };
      saveSettings(newSettings);
    }
  };

  const scheduleTestNotification = () => {
    const testTime = new Date();
    testTime.setMinutes(testTime.getMinutes() + 1);

    const notificationId = pushNotificationService.scheduleNotification({
      payload: {
        title: '🧪 Notificação de Teste',
        body: 'Esta é uma notificação de teste do SuaGrana!',
        icon: '/icon-192.png',
        tag: 'test-notification',
        data: { type: 'test' },
      },
      scheduledFor: testTime,
    });

    toast.success('Notificação de teste agendada para 1 minuto');
    loadScheduledNotifications();
  };

  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        toast.success('Cache limpo com sucesso!');
        checkPWAStatus();
      } catch (error) {
        console.error('Failed to clear cache:', error);
        toast.error('Erro ao limpar cache');
      }
    }
  };

  const registerBackgroundSync = () => {
    if (
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      'sync' in window.ServiceWorkerRegistration.prototype
    ) {
      navigator.serviceWorker.ready
        .then((registration) => {
          return registration.sync.register('financial-data-sync');
        })
        .then(() => {
          toast.success('Sincronização em background ativada!');
        })
        .catch((error) => {
          console.error('Background sync registration failed:', error);
          toast.error('Erro ao ativar sincronização em background');
        });
    } else {
      toast.error('Sincronização em background não suportada');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    );
  };

  const getPermissionBadge = (permission: NotificationPermission) => {
    const variants = {
      granted: 'default',
      denied: 'destructive',
      default: 'secondary',
    } as const;

    const labels = {
      granted: 'Permitido',
      denied: 'Negado',
      default: 'Pendente',
    };

    return <Badge variant={variants[permission]}>{labels[permission]}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* PWA Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Status do PWA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(pwaStatus.installed)}
                <span className="text-sm font-medium">App Instalado</span>
              </div>
              <Badge variant={pwaStatus.installed ? 'default' : 'secondary'}>
                {pwaStatus.installed ? 'Sim' : 'Não'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(pwaStatus.serviceWorkerActive)}
                <span className="text-sm font-medium">Service Worker</span>
              </div>
              <Badge
                variant={
                  pwaStatus.serviceWorkerActive ? 'default' : 'secondary'
                }
              >
                {pwaStatus.serviceWorkerActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">Notificações</span>
              </div>
              {getPermissionBadge(pwaStatus.notificationPermission)}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {pwaStatus.online ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <Wifi className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge variant={pwaStatus.online ? 'default' : 'destructive'}>
                {pwaStatus.online ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Tamanho do Cache</span>
            </div>
            <span className="text-sm font-mono">
              {formatBytes(pwaStatus.cacheSize)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="notifications-enabled"
                    className="text-base font-medium"
                  >
                    Ativar Notificações
                  </Label>
                  <p className="text-sm text-gray-600">
                    Receba lembretes e alertas importantes
                  </p>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={settings.notifications.enabled}
                  onCheckedChange={handleNotificationToggle}
                  disabled={loading}
                />
              </div>

              {settings.notifications.enabled && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bill-reminders">Lembretes de Contas</Label>
                    <Switch
                      id="bill-reminders"
                      checked={settings.notifications.billReminders}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            billReminders: checked,
                          },
                        };
                        saveSettings(newSettings);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="goal-milestones">Marcos de Metas</Label>
                    <Switch
                      id="goal-milestones"
                      checked={settings.notifications.goalMilestones}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            goalMilestones: checked,
                          },
                        };
                        saveSettings(newSettings);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="investment-alerts">
                      Alertas de Investimento
                    </Label>
                    <Switch
                      id="investment-alerts"
                      checked={settings.notifications.investmentAlerts}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            investmentAlerts: checked,
                          },
                        };
                        saveSettings(newSettings);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="budget-warnings">Avisos de Orçamento</Label>
                    <Switch
                      id="budget-warnings"
                      checked={settings.notifications.budgetWarnings}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            budgetWarnings: checked,
                          },
                        };
                        saveSettings(newSettings);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder-time">Horário dos Lembretes</Label>
                    <Input
                      id="reminder-time"
                      type="time"
                      value={settings.notifications.reminderTime}
                      onChange={(e) => {
                        const newSettings = {
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            reminderTime: e.target.value,
                          },
                        };
                        saveSettings(newSettings);
                      }}
                      className="w-32"
                    />
                  </div>

                  <Button
                    onClick={scheduleTestNotification}
                    variant="outline"
                    size="sm"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Testar Notificação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduled Notifications */}
          {scheduledNotifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Notificações Agendadas ({scheduledNotifications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scheduledNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {notification.payload.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {notification.scheduledFor.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          pushNotificationService.cancelScheduledNotification(
                            notification.id
                          );
                          loadScheduledNotifications();
                          toast.success('Notificação cancelada');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Offline Tab */}
        <TabsContent value="offline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configurações Offline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cache-size">Tamanho do Cache</Label>
                <Select
                  value={settings.offline.cacheSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') => {
                    const newSettings = {
                      ...settings,
                      offline: { ...settings.offline, cacheSize: value },
                    };
                    saveSettings(newSettings);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno (10MB)</SelectItem>
                    <SelectItem value="medium">Médio (50MB)</SelectItem>
                    <SelectItem value="large">Grande (100MB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-sync">Sincronização Automática</Label>
                  <p className="text-sm text-gray-600">
                    Sincronizar dados quando voltar online
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={settings.offline.autoSync}
                  onCheckedChange={(checked) => {
                    const newSettings = {
                      ...settings,
                      offline: { ...settings.offline, autoSync: checked },
                    };
                    saveSettings(newSettings);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="background-sync">
                    Sincronização em Background
                  </Label>
                  <p className="text-sm text-gray-600">
                    Sincronizar dados em segundo plano
                  </p>
                </div>
                <Switch
                  id="background-sync"
                  checked={settings.offline.backgroundSync}
                  onCheckedChange={(checked) => {
                    const newSettings = {
                      ...settings,
                      offline: { ...settings.offline, backgroundSync: checked },
                    };
                    saveSettings(newSettings);
                    if (checked) {
                      registerBackgroundSync();
                    }
                  }}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={clearCache} variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Cache
                </Button>
                <Button
                  onClick={registerBackgroundSync}
                  variant="outline"
                  size="sm"
                >
                  <Sync className="h-4 w-4 mr-2" />
                  Ativar Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Estas configurações são para usuários avançados. Altere apenas
                  se souber o que está fazendo.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-install-prompt">
                    Mostrar Prompt de Instalação
                  </Label>
                  <p className="text-sm text-gray-600">
                    Exibir banner para instalar o app
                  </p>
                </div>
                <Switch
                  id="show-install-prompt"
                  checked={settings.installation.showPrompt}
                  onCheckedChange={(checked) => {
                    const newSettings = {
                      ...settings,
                      installation: {
                        ...settings.installation,
                        showPrompt: checked,
                      },
                    };
                    saveSettings(newSettings);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Button onClick={checkPWAStatus} variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Verificar Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


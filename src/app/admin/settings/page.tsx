'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Settings,
  Database,
  Shield,
  Bell,
  Mail,
  Clock,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettings {
  // Geral
  systemName: string;
  systemUrl: string;
  maintenanceMode: boolean;

  // Segurança
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireStrongPassword: boolean;

  // Notificações
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationEmail: string;

  // Backup
  autoBackup: boolean;
  backupFrequency: string;
  backupRetentionDays: number;

  // Performance
  cacheEnabled: boolean;
  cacheTTL: number;
  logLevel: string;
}

export default function SettingsManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    systemName: 'SuaGrana',
    systemUrl: 'http://localhost:3000',
    maintenanceMode: false,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordMinLength: 6,
    requireStrongPassword: true,
    emailNotifications: true,
    pushNotifications: false,
    notificationEmail: 'admin@suagrana.com',
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetentionDays: 30,
    cacheEnabled: true,
    cacheTTL: 300,
    logLevel: 'info',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simular salvamento (implementar API depois)
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar as configurações padrão?')) {
      setSettings({
        systemName: 'SuaGrana',
        systemUrl: 'http://localhost:3000',
        maintenanceMode: false,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        passwordMinLength: 6,
        requireStrongPassword: true,
        emailNotifications: true,
        pushNotifications: false,
        notificationEmail: 'admin@suagrana.com',
        autoBackup: true,
        backupFrequency: 'daily',
        backupRetentionDays: 30,
        cacheEnabled: true,
        cacheTTL: 300,
        logLevel: 'info',
      });
      toast.success('Configurações restauradas!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie as configurações gerais da aplicação
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Restaurar Padrão
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>
              Informações básicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">Nome do Sistema</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemUrl">URL do Sistema</Label>
              <Input
                id="systemUrl"
                type="url"
                value={settings.systemUrl}
                onChange={(e) => setSettings({ ...settings, systemUrl: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Modo de Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Bloqueia acesso de usuários não-admin
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configurações de segurança e autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout de Sessão (horas)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="1"
                max="168"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Máximo de Tentativas de Login</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                min="3"
                max="10"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">Tamanho Mínimo da Senha</Label>
              <Input
                id="passwordMinLength"
                type="number"
                min="6"
                max="20"
                value={settings.passwordMinLength}
                onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exigir Senha Forte</Label>
                <p className="text-sm text-muted-foreground">
                  Requer letras, números e símbolos
                </p>
              </div>
              <Switch
                checked={settings.requireStrongPassword}
                onCheckedChange={(checked) => setSettings({ ...settings, requireStrongPassword: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como o sistema envia notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar alertas importantes por email
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Notificações no navegador
                </p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notificationEmail">Email para Notificações</Label>
              <Input
                id="notificationEmail"
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup Automático
            </CardTitle>
            <CardDescription>
              Configurações de backup do banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Backup Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Criar backups automaticamente
                </p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => setSettings({ ...settings, autoBackup: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backupRetentionDays">Retenção de Backups (dias)</Label>
              <Input
                id="backupRetentionDays"
                type="number"
                min="7"
                max="365"
                value={settings.backupRetentionDays}
                onChange={(e) => setSettings({ ...settings, backupRetentionDays: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Performance
            </CardTitle>
            <CardDescription>
              Otimizações e cache do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cache Habilitado</Label>
                <p className="text-sm text-muted-foreground">
                  Melhorar performance com cache
                </p>
              </div>
              <Switch
                checked={settings.cacheEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, cacheEnabled: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cacheTTL">Tempo de Vida do Cache (segundos)</Label>
              <Input
                id="cacheTTL"
                type="number"
                min="60"
                max="3600"
                value={settings.cacheTTL}
                onChange={(e) => setSettings({ ...settings, cacheTTL: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Versão:</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ambiente:</span>
              <span className="font-mono">Development</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Node.js:</span>
              <span className="font-mono">{process.version}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Banco de Dados:</span>
              <span className="font-mono">SQLite</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

'use client';

import { BackupManager } from '@/components/features/backup/backup-manager';
import { PWAManager } from '@/components/features/pwa/pwa-manager';
import { BackButton } from '@/components/shared/back-button';

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Backup e Sincronizacao
          </h1>
          <p className="text-muted-foreground">
            Mantenha seus dados seguros com backup automatico e funcionalidades
            PWA
          </p>
        </div>
      </div>

      <BackupManager />
      <PWAManager />
    </div>
  );
}

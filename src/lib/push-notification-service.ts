export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationOptions extends NotificationPayload {
  actions?: NotificationAction[];
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
  renotify?: boolean;
  vibrate?: number[];
}

export interface SubscriptionInfo {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeServiceWorker();
    }
  }

  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  // Request permission for notifications
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Get current permission status
  getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<SubscriptionInfo | null> {
    if (!this.swRegistration) {
      await this.initializeServiceWorker();
    }

    if (!this.swRegistration) {
      throw new Error('Service Worker not available');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      const subscriptionInfo: SubscriptionInfo = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      // Store subscription info in database (não usa mais localStorage)
      console.log('Push subscription criada - localStorage removido, use banco de dados para persistir');

      return subscriptionInfo;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push subscription removida - localStorage removido, use banco de dados');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Get current subscription
  async getSubscription(): Promise<SubscriptionInfo | null> {
    if (!this.swRegistration) {
      return null;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (!subscription) {
        return null;
      }

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  // Show local notification
  async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported');
    }

    const permission = this.getPermission();
    if (permission !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }

    if (this.swRegistration) {
      await this.swRegistration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/badge-72x72.png',
        image: options.image,
        data: options.data,
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        actions: options.actions,
        dir: options.dir || 'auto',
        lang: options.lang || 'pt-BR',
        renotify: options.renotify || false,
        vibrate: options.vibrate || [200, 100, 200],
        timestamp: options.timestamp || Date.now(),
      });
    } else {
      // Fallback to browser notification
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192x192.png',
        data: options.data,
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      });
    }
  }

  // Schedule a notification (using setTimeout for demo purposes)
  scheduleNotification(options: NotificationOptions, delay: number): number {
    const timeoutId = window.setTimeout(() => {
      this.showNotification(options);
    }, delay);

    return timeoutId;
  }

  // Cancel a scheduled notification
  cancelScheduledNotification(timeoutId: number): void {
    clearTimeout(timeoutId);
  }

  // Predefined notification types for financial app
  async showBudgetAlert(category: string, amount: number, limit: number): Promise<void> {
    await this.showNotification({
      title: '⚠️ Alerta de Orçamento',
      body: `Você gastou R$ ${amount.toFixed(2)} em ${category}, ultrapassando o limite de R$ ${limit.toFixed(2)}`,
      icon: '/icons/budget-alert.png',
      tag: 'budget-alert',
      requireInteraction: true,
      data: { type: 'budget_alert', category, amount, limit },
      actions: [
        { action: 'view', title: 'Ver Detalhes' },
        { action: 'adjust', title: 'Ajustar Orçamento' },
      ],
    });
  }

  async showTransactionReminder(description: string, amount: number): Promise<void> {
    await this.showNotification({
      title: '💰 Lembrete de Transação',
      body: `Não esqueça: ${description} - R$ ${amount.toFixed(2)}`,
      icon: '/icons/transaction-reminder.png',
      tag: 'transaction-reminder',
      data: { type: 'transaction_reminder', description, amount },
      actions: [
        { action: 'add', title: 'Adicionar Agora' },
        { action: 'snooze', title: 'Lembrar Depois' },
      ],
    });
  }

  async showGoalAchievement(goalName: string, amount: number): Promise<void> {
    await this.showNotification({
      title: '🎉 Meta Alcançada!',
      body: `Parabéns! Você atingiu sua meta "${goalName}" de R$ ${amount.toFixed(2)}`,
      icon: '/icons/goal-achievement.png',
      tag: 'goal-achievement',
      requireInteraction: true,
      data: { type: 'goal_achievement', goalName, amount },
      actions: [
        { action: 'celebrate', title: 'Ver Conquista' },
        { action: 'new_goal', title: 'Nova Meta' },
      ],
    });
  }

  async showInvestmentAlert(message: string, type: 'opportunity' | 'warning'): Promise<void> {
    const icon = type === 'opportunity' ? '📈' : '⚠️';
    await this.showNotification({
      title: `${icon} ${type === 'opportunity' ? 'Oportunidade' : 'Alerta'} de Investimento`,
      body: message,
      icon: `/icons/investment-${type}.png`,
      tag: 'investment-alert',
      data: { type: 'investment_alert', alertType: type, message },
      actions: [
        { action: 'view', title: 'Ver Detalhes' },
        { action: 'dismiss', title: 'Dispensar' },
      ],
    });
  }

  async showBackupReminder(): Promise<void> {
    await this.showNotification({
      title: '💾 Backup dos Dados',
      body: 'Que tal fazer um backup dos seus dados financeiros?',
      icon: '/icons/backup-reminder.png',
      tag: 'backup-reminder',
      data: { type: 'backup_reminder' },
      actions: [
        { action: 'backup', title: 'Fazer Backup' },
        { action: 'later', title: 'Mais Tarde' },
      ],
    });
  }

  // Utility methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Check if user has enabled notifications for specific types
  getNotificationPreferences(): Record<string, boolean> {
    // Preferências agora vêm do banco de dados, não do localStorage
    console.warn('getNotificationPreferences() - localStorage removido, use banco de dados');
    
    return {
      budgetAlerts: true,
      transactionReminders: true,
      goalAchievements: true,
      investmentAlerts: true,
      backupReminders: true,
    };
  }

  // Update notification preferences
  updateNotificationPreferences(preferences: Record<string, boolean>): void {
    // Preferências agora são salvas no banco de dados, não no localStorage
    console.warn('updateNotificationPreferences() - localStorage removido, use banco de dados');
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    if (this.swRegistration) {
      const notifications = await this.swRegistration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
  }

  // Get active notifications
  async getActiveNotifications(): Promise<Notification[]> {
    if (this.swRegistration) {
      return await this.swRegistration.getNotifications();
    }
    return [];
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

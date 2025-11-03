'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  isRead?: boolean;
  createdAt?: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  toggleNotificationPanel: () => void;
  closeNotificationPanel: () => void;
  isNotificationPanelOpen: boolean;
}

// Context
const NotificationContext = createContext<NotificationContextType | null>(null);

// Provider
interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Carregar notificações do banco de dados ao inicializar
  useEffect(() => {
    loadNotificationsFromDatabase();
  }, []);

  const loadNotificationsFromDatabase = async () => {
    try {
      // Verificar se já mostrou a notificação de boas-vindas
      const hasShownWelcome = localStorage.getItem('hasShownWelcomeNotification');

      // TODO: Implementar chamada para API de notificações
      const response = await fetch('/api/notifications', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const apiNotifications = data.notifications || [];

        // Adicionar notificação de boas-vindas apenas na primeira vez
        if (!hasShownWelcome) {
          const welcomeNotification: Notification = {
            id: 'welcome-notification',
            title: '👋 Bem-vindo!',
            message: 'Sistema de notificações ativo. Você receberá alertas sobre contas, metas e orçamentos.',
            type: 'info',
            isRead: false,
            createdAt: new Date(),
          };
          setNotifications([welcomeNotification, ...apiNotifications]);
          localStorage.setItem('hasShownWelcomeNotification', 'true');
        } else {
          setNotifications(apiNotifications);
        }
      } else {
        // Fallback: criar notificação de boas-vindas apenas na primeira vez
        if (!hasShownWelcome) {
          const welcomeNotification: Notification = {
            id: 'welcome-notification',
            title: '👋 Bem-vindo!',
            message: 'Sistema de notificações ativo. Você receberá alertas sobre contas, metas e orçamentos.',
            type: 'info',
            isRead: false,
            createdAt: new Date(),
          };
          setNotifications([welcomeNotification]);
          localStorage.setItem('hasShownWelcomeNotification', 'true');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      // Verificar se já mostrou a notificação de boas-vindas
      const hasShownWelcome = localStorage.getItem('hasShownWelcomeNotification');

      // Fallback: criar notificação de boas-vindas apenas na primeira vez
      if (!hasShownWelcome) {
        const welcomeNotification: Notification = {
          id: 'welcome-notification',
          title: '👋 Bem-vindo!',
          message: 'Sistema de notificações ativo. Você receberá alertas sobre contas, metas e orçamentos.',
          type: 'info',
          isRead: false,
          createdAt: new Date(),
        };
        setNotifications([welcomeNotification]);
        localStorage.setItem('hasShownWelcomeNotification', 'true');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = async (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000,
      isRead: false,
      createdAt: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Salvar no banco de dados
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNotification),
      });
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
    }

    // Auto remove notification after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  };

  const removeNotification = async (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));

    // Remover do banco de dados
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );

    // Atualizar no banco de dados
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );

    // Atualizar todas no banco de dados
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);

    // Limpar do banco de dados
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const toggleNotificationPanel = () => {
    setIsNotificationPanelOpen(prev => !prev);
  };

  const closeNotificationPanel = () => {
    setIsNotificationPanelOpen(false);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        toggleNotificationPanel,
        closeNotificationPanel,
        isNotificationPanelOpen,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Hook
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

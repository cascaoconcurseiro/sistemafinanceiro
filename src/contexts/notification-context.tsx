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
      // TODO: Implementar chamada para API de notificações
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        // Fallback: criar algumas notificações de exemplo
        const exampleNotifications: Notification[] = [
          {
            id: '1',
            title: 'Orçamento Mensal',
            message: 'Você gastou 80% do seu orçamento mensal',
            type: 'warning',
            isRead: false,
            createdAt: new Date(),
          },
          {
            id: '2',
            title: 'Meta Atingida',
            message: 'Parabéns! Você atingiu sua meta de economia',
            type: 'success',
            isRead: false,
            createdAt: new Date(),
          },
        ];
        setNotifications(exampleNotifications);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      // Fallback: criar algumas notificações de exemplo
      const exampleNotifications: Notification[] = [
        {
          id: '1',
          title: 'Orçamento Mensal',
          message: 'Você gastou 80% do seu orçamento mensal',
          type: 'warning',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Meta Atingida',
          message: 'Parabéns! Você atingiu sua meta de economia',
          type: 'success',
          isRead: false,
          createdAt: new Date(),
        },
      ];
      setNotifications(exampleNotifications);
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

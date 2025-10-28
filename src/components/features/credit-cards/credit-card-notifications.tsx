'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  AlertTriangle,
  Clock,
  CreditCard,
  X,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CreditCardNotification {
  type: 'overdue' | 'due_soon';
  title: string;
  message: string;
  invoiceId: string;
  cardName: string;
  amount: number;
  dueDate: string;
  daysOverdue?: number;
  daysUntilDue?: number;
  priority: 'high' | 'medium' | 'low';
}

interface NotificationSummary {
  total: number;
  overdue: number;
  dueSoon: number;
}

export function CreditCardNotifications() {
  const [notifications, setNotifications] = useState<CreditCardNotification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>({ total: 0, overdue: 0, dueSoon: 0 });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNotifications();
    // Recarregar notificações a cada 5 minutos
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/credit-cards/notifications', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotifications(result.data.notifications || []);
          setSummary(result.data.summary || { total: 0, overdue: 0, dueSoon: 0 });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = (invoiceId: string) => {
    setDismissed(prev => new Set([...prev, invoiceId]));
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getNotificationIcon = (type: string, priority: string) => {
    if (type === 'overdue') {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
    if (priority === 'high') {
      return <Clock className="w-5 h-5 text-orange-600" />;
    }
    return <Bell className="w-5 h-5 text-blue-600" />;
  };

  const getNotificationStyle = (type: string, priority: string) => {
    if (type === 'overdue') {
      return 'border-red-200 bg-red-50 dark:bg-red-950/20';
    }
    if (priority === 'high') {
      return 'border-orange-200 bg-orange-50 dark:bg-orange-950/20';
    }
    return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20';
  };

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.invoiceId));

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">Carregando notificações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleNotifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Notificações de Cartão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              🎉 Todas as suas faturas estão em dia!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações de Cartão
          </CardTitle>
          <div className="flex gap-2">
            {summary.overdue > 0 && (
              <Badge variant="destructive">
                {summary.overdue} em atraso
              </Badge>
            )}
            {summary.dueSoon > 0 && (
              <Badge variant="secondary">
                {summary.dueSoon} vencendo
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {visibleNotifications.map((notification) => (
            <Card
              key={notification.invoiceId}
              className={getNotificationStyle(notification.type, notification.priority)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type, notification.priority)}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {notification.cardName}
                        </span>
                        <span>
                          Valor: {formatCurrency(notification.amount)}
                        </span>
                        <span>
                          Vencimento: {formatDate(notification.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/credit-card-bills'}
                    >
                      Ver Fatura
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.invoiceId)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {visibleNotifications.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Dica:</strong> Mantenha suas faturas em dia para evitar juros e multas. 
              Configure lembretes no seu celular para não esquecer dos vencimentos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
'use client';

import React, { useState } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';
import { useNotifications } from '@/contexts/notification-context';

export function PWAInstallPrompt() {
  const { canInstall, install, isStandalone } = usePWA();
  const { addNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  // Não mostrar se já está instalado ou não pode instalar
  if (!canInstall || isStandalone || !isVisible) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
      addNotification({
        title: 'App Instalado!',
        message: 'SuaGrana foi instalado com sucesso no seu dispositivo',
        type: 'success',
      });
      setIsVisible(false);
    } catch (error) {
      console.error('Erro na instalação:', error);
      addNotification({
        title: 'Erro na Instalação',
        message: 'Não foi possível instalar o app. Tente novamente.',
        type: 'error',
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Removido localStorage - preferência de instalação não será mais persistida
    console.warn('⚠️ localStorage removido - preferência de instalação PWA não será mais persistida');
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Instalar SuaGrana
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Acesse rapidamente do seu dispositivo
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Monitor className="h-4 w-4" />
            <span>Funciona offline</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Download className="h-4 w-4" />
            <span>Acesso rápido</span>
          </div>
        </div>

        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {isInstalling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Instalando...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Instalar</span>
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

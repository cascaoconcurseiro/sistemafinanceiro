/**
 * Utilitário para limpar completamente as notificações do banco de dados
 * Execute no console do navegador para limpar dados antigos
 */

export const clearAllNotificationData = () => {
  // Notificações agora são armazenadas no banco de dados, não no localStorage
  console.warn('clearAllNotificationData - localStorage removido, use banco de dados para limpar notificações');
};

// Função para inspecionar o que está no banco de dados
export const inspectNotificationData = () => {
  // Dados agora vêm do banco de dados, não do localStorage
  console.warn('inspectNotificationData - localStorage removido, use banco de dados para inspecionar notificações');
  return {};
};

// Função para forçar regeneração apenas com dados reais
export const forceRealNotifications = () => {
  // Primeiro, limpar tudo
  clearAllNotificationData();

  // Recarregar a página para garantir estado limpo
  setTimeout(() => {
    window.location.reload();
  }, 500);
};

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
  (window as any).clearAllNotificationData = clearAllNotificationData;
  (window as any).inspectNotificationData = inspectNotificationData;
  (window as any).forceRealNotifications = forceRealNotifications;
}

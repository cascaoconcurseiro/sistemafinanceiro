/**
 * HOOK - ROTAÇÃO DE LOGS
 * 
 * Hook React para gerenciar o sistema de rotação automática de logs
 * Fornece interface para configurar, monitorar e controlar a rotação
 */

import { useState, useEffect, useCallback } from 'react';
import type { LogRotationConfig } from '@/services/log-rotation-service';

interface LogStats {
  totalFiles: number;
  totalSize: number;
  oldestFile: string | null;
  newestFile: string | null;
  compressedFiles: number;
}

interface RotationResult {
  success: boolean;
  rotatedFiles: string[];
  compressedFiles: string[];
  deletedFiles: string[];
  errors: string[];
}

interface LogRotationState {
  config: LogRotationConfig | null;
  stats: LogStats | null;
  isLoading: boolean;
  error: string | null;
  lastRotation: Date | null;
}

interface LogRotationActions {
  loadConfig: () => Promise<void>;
  updateConfig: (newConfig: Partial<LogRotationConfig>) => Promise<void>;
  performRotation: () => Promise<RotationResult>;
  cleanupLogs: (days?: number, force?: boolean) => Promise<{ deletedFiles: string[]; count: number }>;
  refreshStats: () => Promise<void>;
}

export function useLogRotation(): LogRotationState & LogRotationActions {
  const [state, setState] = useState<LogRotationState>({
    config: null,
    stats: null,
    isLoading: false,
    error: null,
    lastRotation: null
  });

  // Carregar configuração e estatísticas
  const loadConfig = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/logs/rotation');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar configuração');
      }
      
      setState(prev => ({
        ...prev,
        config: data.data.config,
        stats: data.data.stats,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false
      }));
    }
  }, []);

  // Atualizar configuração
  const updateConfig = useCallback(async (newConfig: Partial<LogRotationConfig>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/logs/rotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'configure',
          config: newConfig
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar configuração');
      }
      
      setState(prev => ({
        ...prev,
        config: data.data.config,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false
      }));
      throw error;
    }
  }, []);

  // Executar rotação manual
  const performRotation = useCallback(async (): Promise<RotationResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/logs/rotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'rotate'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao executar rotação');
      }
      
      setState(prev => ({
        ...prev,
        lastRotation: new Date(),
        isLoading: false
      }));
      
      // Atualizar estatísticas após rotação
      await refreshStats();
      
      return data.data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false
      }));
      throw error;
    }
  }, []);

  // Limpar logs antigos
  const cleanupLogs = useCallback(async (days?: number, force = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const params = new URLSearchParams();
      if (days !== undefined) params.append('days', days.toString());
      if (force) params.append('force', 'true');
      
      const response = await fetch(`/api/logs/rotation?${params.toString()}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao limpar logs');
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Atualizar estatísticas após limpeza
      await refreshStats();
      
      return data.data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        isLoading: false
      }));
      throw error;
    }
  }, []);

  // Atualizar estatísticas
  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch('/api/logs/rotation');
      const data = await response.json();
      
      if (response.ok) {
        setState(prev => ({
          ...prev,
          stats: data.data.stats
        }));
      }
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Atualizar estatísticas periodicamente (a cada 5 minutos)
  useEffect(() => {
    const interval = setInterval(refreshStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    ...state,
    loadConfig,
    updateConfig,
    performRotation,
    cleanupLogs,
    refreshStats
  };
}

// Hook para formatação de dados
export function useLogRotationFormatters() {
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  const formatDuration = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }, []);

  const formatCronExpression = useCallback((cron: string): string => {
    // Conversões básicas de expressões cron comuns
    const patterns: Record<string, string> = {
      '0 0 * * *': 'Diariamente à meia-noite',
      '0 2 * * *': 'Diariamente às 2h',
      '0 */6 * * *': 'A cada 6 horas',
      '0 */12 * * *': 'A cada 12 horas',
      '0 0 */7 * *': 'Semanalmente',
      '0 0 1 * *': 'Mensalmente'
    };

    return patterns[cron] || `Personalizado: ${cron}`;
  }, []);

  return {
    formatFileSize,
    formatDuration,
    formatCronExpression
  };
}
'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Trash2, RefreshCw, Bug, AlertTriangle, Info, Zap } from 'lucide-react';

interface LoggerDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoggerDebugPanel({ isOpen, onClose }: LoggerDebugPanelProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'debug'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshLogs = () => {
    // Stubbed out - no logger access
    setLogs([]);
  };

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (autoRefresh && isOpen) {
      const interval = setInterval(refreshLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isOpen]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const downloadLogs = () => {
    // Stubbed out - no logger access
    const logsData = '[]';
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suagrana-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    // Stubbed out - no logger access
    setLogs([]);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warn': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug': return <Bug className="w-4 h-4 text-gray-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'warn': return 'border-l-yellow-500 bg-yellow-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      case 'debug': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Sistema de Logs - Debug Panel</h2>
            <span className="text-sm text-gray-500">({logs.length} logs)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded text-sm ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={refreshLogs}
              className="p-2 hover:bg-gray-100 rounded"
              title="Atualizar logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={downloadLogs}
              className="p-2 hover:bg-gray-100 rounded"
              title="Baixar logs"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={clearLogs}
              className="p-2 hover:bg-gray-100 rounded text-red-600"
              title="Limpar logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-4 border-b bg-gray-50">
          {['all', 'error', 'warn', 'info', 'debug'].map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level as any)}
              className={`px-3 py-1 rounded text-sm capitalize ${
                filter === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {level} {level !== 'all' && `(${logs.filter(l => l.level === level).length})`}
            </button>
          ))}
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bug className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum log encontrado</p>
              <p className="text-sm">Os logs aparecerão aqui conforme a aplicação for usada</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div
                key={index}
                className={`border-l-4 p-3 rounded-r ${getLogColor(log.level)}`}
              >
                <div className="flex items-start gap-2">
                  {getLogIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{log.component}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      {log.userId && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          User: {log.userId}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{log.message}</p>
                    {log.data && Object.keys(log.data).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Dados adicionais
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.stack && (
                      <details className="text-xs mt-2">
                        <summary className="cursor-pointer text-red-600 hover:text-red-800">
                          Stack trace
                        </summary>
                        <pre className="mt-2 p-2 bg-red-50 rounded overflow-auto text-red-700">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div>
              Session ID: <code className="bg-gray-200 px-1 rounded">debug-session</code>
            </div>
            <div>
              Logs em memória: {logs.length} | Erros recentes: {logs.filter(l => l.level === 'error').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

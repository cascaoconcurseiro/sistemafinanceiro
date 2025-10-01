'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Bug, Copy, Download, RefreshCw, X } from 'lucide-react';
import logger, { loggerUtils, LogEntry } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

interface ErrorReporterProps {
  error?: Error;
  errorInfo?: any;
  onClose?: () => void;
  onRetry?: () => void;
}

export function ErrorReporter({ error, errorInfo, onClose, onRetry }: ErrorReporterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userDescription, setUserDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [recentErrors, setRecentErrors] = useState<LogEntry[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Get recent errors for context
    const getErrors = async () => {
      try {
        const errors = await loggerUtils.getRecentErrors();
        setRecentErrors(errors);
      } catch (error) {
        console.warn('Erro ao obter erros recentes:', error);
      }
    };
    
    getErrors();
  }, []);

  const errorDetails = {
    message: error?.message || 'Unknown error',
    stack: error?.stack || 'No stack trace available',
    name: error?.name || 'Error',
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Unknown',
    sessionId: loggerUtils.getSessionId(),
    recentErrors: recentErrors.slice(0, 5), // Last 5 errors for context
    errorInfo,
  };

  const copyErrorDetails = async () => {
    try {
      const errorReport = JSON.stringify(errorDetails, null, 2);
      await navigator.clipboard.writeText(errorReport);
      toast({
        title: "Detalhes copiados",
        description: "Os detalhes do erro foram copiados para a área de transferência.",
      });
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const downloadErrorReport = () => {
    const errorReport = JSON.stringify(errorDetails, null, 2);
    const blob = new Blob([errorReport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const submitErrorReport = async () => {
    const report = {
      ...errorDetails,
      userDescription,
      userEmail,
    };

    // Log the error report
    logger.errorWithContext(
      'User submitted error report',
      error || new Error('Manual error report'),
      'ErrorReporter',
      report
    );

    // In a real application, you would send this to your error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    
    toast({
      title: "Relatório enviado",
      description: "Obrigado pelo relatório. Nossa equipe irá investigar o problema.",
    });

    onClose?.();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Erro Detectado</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Ocorreu um erro inesperado. Você pode nos ajudar a corrigi-lo enviando um relatório.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Summary */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            <span className="font-medium">Resumo do Erro:</span>
          </div>
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-mono">{errorDetails.message}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{errorDetails.name}</Badge>
              <Badge variant="secondary">
                {new Date(errorDetails.timestamp).toLocaleString()}
              </Badge>
            </div>
          </div>
        </div>

        {/* User Input */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="user-description">
              O que você estava fazendo quando o erro ocorreu? (Opcional)
            </Label>
            <Textarea
              id="user-description"
              placeholder="Descreva os passos que levaram ao erro..."
              value={userDescription}
              onChange={(e) => setUserDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="user-email">
              Email para contato (Opcional)
            </Label>
            <Input
              id="user-email"
              type="email"
              placeholder="seu@email.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Technical Details */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'} Detalhes Técnicos
          </Button>

          {isExpanded && (
            <div className="bg-muted p-3 rounded-md space-y-2">
              <div className="text-xs space-y-1">
                <p><strong>URL:</strong> {errorDetails.url}</p>
                <p><strong>Sessão:</strong> {errorDetails.sessionId}</p>
                <p><strong>Erros Recentes:</strong> {recentErrors.length}</p>
              </div>
              
              {errorDetails.stack && (
                <div>
                  <p className="text-xs font-medium mb-1">Stack Trace:</p>
                  <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                    {errorDetails.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4">
          <Button onClick={submitErrorReport} className="flex-1">
            Enviar Relatório
          </Button>
          
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
          
          <Button variant="outline" onClick={copyErrorDetails}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
          
          <Button variant="outline" onClick={downloadErrorReport}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for using the error reporter
export function useErrorReporter() {
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const reportError = (error: Error, errorInfo?: any) => {
    setError(error);
    setErrorInfo(errorInfo);
    setIsOpen(true);
    
    // Also log to our logging system
    logger.errorWithContext(
      'Error reported via useErrorReporter',
      error,
      'ErrorReporter',
      errorInfo
    );
  };

  const closeReporter = () => {
    setIsOpen(false);
    setError(null);
    setErrorInfo(null);
  };

  return {
    error,
    errorInfo,
    isOpen,
    reportError,
    closeReporter,
  };
}

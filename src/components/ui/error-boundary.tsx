'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logger from '@/lib/logger';
import { ErrorReporter } from './error-reporter';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showReporter: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showReporter: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with enhanced context
    logger.errorWithContext(
      'React Error Boundary caught an error',
      error,
      'ErrorBoundary',
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
        props: this.props,
      }
    );

    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In development, log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showReporter: false,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleShowReporter = () => {
    this.setState({ showReporter: true });
  };

  handleCloseReporter = () => {
    this.setState({ showReporter: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.state.showReporter) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <ErrorReporter
              error={this.state.error || undefined}
              errorInfo={this.state.errorInfo}
              onClose={this.handleCloseReporter}
              onRetry={this.handleRetry}
            />
          </div>
        );
      }

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Oops! Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado. Você pode tentar novamente ou voltar à página inicial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao Início
                </Button>
                <Button variant="ghost" onClick={this.handleShowReporter} className="w-full">
                  Reportar Problema
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Detalhes do erro (desenvolvimento)
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: React.ErrorInfo) => {
    logError.ui('Error caught by useErrorHandler:', error, errorInfo);

    // In production, send to error reporting service
    // Example: Sentry.captureException(error)
  };

  return { handleError };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<T extends {}>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Specific error boundaries for different parts of the app
export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Erro no Dashboard</h3>
              <p className="text-muted-foreground mb-4">
                Não foi possível carregar o dashboard. Tente recarregar a
                página.
              </p>
              <Button onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function ModalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
          <h3 className="font-semibold mb-2">Erro no Modal</h3>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar este modal.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}



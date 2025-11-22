'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Enviar para Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Algo deu errado</h1>
              <p className="text-muted-foreground">
                Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="font-mono text-sm text-red-900">
                  {this.state.error.message}
                </p>
                <pre className="mt-2 text-xs text-red-800 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para capturar erros manualmente
export function useCaptureError() {
  return (error: Error, context?: Record<string, any>) => {
    console.error('Error captured:', error)
    
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    })
  }
}

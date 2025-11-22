// Analytics wrapper para múltiplos providers

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
}

class Analytics {
  private enabled: boolean

  constructor() {
    this.enabled = process.env.NODE_ENV === 'production'
  }

  // Track custom event
  track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) {
      if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics]', event, properties)
      }
      return
    }

    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, properties)
    }

    // Mixpanel (se configurado)
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(event, properties)
    }
  }

  // Track page view
  page(name: string, properties?: Record<string, any>) {
    if (!this.enabled) {
      if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics] Page:', name, properties)
      }
      return
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: name,
        ...properties,
      })
    }
  }

  // Identify user
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.enabled) {
      if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics] Identify:', userId, traits)
      }
      return
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('set', 'user_properties', {
        user_id: userId,
        ...traits,
      })
    }

    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.identify(userId)
      if (traits) {
        (window as any).mixpanel.people.set(traits)
      }
    }
  }

  // Track timing
  timing(category: string, variable: string, value: number) {
    if (!this.enabled) {
      if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics] Timing:', category, variable, value)
      }
      return
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        name: variable,
        value: value,
        event_category: category,
      })
    }
  }
}

export const analytics = new Analytics()

// Eventos pré-definidos para o app
export const AnalyticsEvents = {
  // Transações
  TRANSACTION_CREATED: 'transaction_created',
  TRANSACTION_UPDATED: 'transaction_updated',
  TRANSACTION_DELETED: 'transaction_deleted',
  
  // Contas
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_UPDATED: 'account_updated',
  ACCOUNT_DELETED: 'account_deleted',
  
  // Cartões
  CARD_CREATED: 'card_created',
  CARD_UPDATED: 'card_updated',
  
  // Faturas
  INVOICE_PAID: 'invoice_paid',
  INVOICE_VIEWED: 'invoice_viewed',
  
  // Viagens
  TRIP_CREATED: 'trip_created',
  EXPENSE_SHARED: 'expense_shared',
  DEBT_SETTLED: 'debt_settled',
  
  // Auditoria
  AUDIT_RUN: 'audit_run',
  AUDIT_ERROR_FOUND: 'audit_error_found',
  
  // Navegação
  PAGE_VIEW: 'page_view',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  
  // Erros
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
}

// Hook para usar analytics em componentes
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    page: analytics.page.bind(analytics),
    identify: analytics.identify.bind(analytics),
    timing: analytics.timing.bind(analytics),
  }
}

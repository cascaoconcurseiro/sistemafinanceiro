/**
 * Performance Monitor
 * Monitora métricas de performance da aplicação
 */

import { analytics } from '../analytics'

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private enabled: boolean

  constructor() {
    this.enabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
    
    if (this.enabled) {
      this.initWebVitals()
      this.initCustomMetrics()
    }
  }

  /**
   * Inicializa monitoramento de Web Vitals
   */
  private initWebVitals() {
    if (typeof window === 'undefined') return

    // LCP - Largest Contentful Paint
    this.observeLCP()
    
    // FID - First Input Delay
    this.observeFID()
    
    // CLS - Cumulative Layout Shift
    this.observeCLS()
    
    // FCP - First Contentful Paint
    this.observeFCP()
    
    // TTFB - Time to First Byte
    this.observeTTFB()
  }

  /**
   * Observa LCP (Largest Contentful Paint)
   */
  private observeLCP() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        
        this.recordMetric({
          name: 'LCP',
          value: lastEntry.renderTime || lastEntry.loadTime,
          rating: this.rateLCP(lastEntry.renderTime || lastEntry.loadTime),
          timestamp: Date.now(),
        })
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
      console.warn('LCP observation failed:', e)
      }
    }
  }

  /**
   * Observa FID (First Input Delay)
   */
  private observeFID() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.recordMetric({
            name: 'FID',
            value: entry.processingStart - entry.startTime,
            rating: this.rateFID(entry.processingStart - entry.startTime),
            timestamp: Date.now(),
          })
        })
      })

      observer.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
      console.warn('FID observation failed:', e)
      }
    }
  }

  /**
   * Observa CLS (Cumulative Layout Shift)
   */
  private observeCLS() {
    if (!('PerformanceObserver' in window)) return

    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        
        this.recordMetric({
          name: 'CLS',
          value: clsValue,
          rating: this.rateCLS(clsValue),
          timestamp: Date.now(),
        })
      })

      observer.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
      console.warn('CLS observation failed:', e)
      }
    }
  }

  /**
   * Observa FCP (First Contentful Paint)
   */
  private observeFCP() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.recordMetric({
            name: 'FCP',
            value: entry.startTime,
            rating: this.rateFCP(entry.startTime),
            timestamp: Date.now(),
          })
        })
      })

      observer.observe({ entryTypes: ['paint'] })
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
      console.warn('FCP observation failed:', e)
      }
    }
  }

  /**
   * Observa TTFB (Time to First Byte)
   */
  private observeTTFB() {
    if (typeof window === 'undefined') return

    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as any
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart
        
        this.recordMetric({
          name: 'TTFB',
          value: ttfb,
          rating: this.rateTTFB(ttfb),
          timestamp: Date.now(),
        })
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
      console.warn('TTFB observation failed:', e)
      }
    }
  }

  /**
   * Inicializa métricas customizadas
   */
  private initCustomMetrics() {
    if (typeof window === 'undefined') return

    // Tempo de carregamento da página
    window.addEventListener('load', () => {
      const loadTime = performance.now()
      this.recordMetric({
        name: 'PageLoad',
        value: loadTime,
        rating: loadTime < 3000 ? 'good' : loadTime < 5000 ? 'needs-improvement' : 'poor',
        timestamp: Date.now(),
      })
    })
  }

  /**
   * Registra métrica
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Enviar para analytics
    analytics.timing('performance', metric.name, metric.value)
    
    // Log em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`)
    }
  }

  /**
   * Ratings baseados em thresholds do Google
   */
  private rateLCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  }

  private rateFID(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good'
    if (value <= 300) return 'needs-improvement'
    return 'poor'
  }

  private rateCLS(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good'
    if (value <= 0.25) return 'needs-improvement'
    return 'poor'
  }

  private rateFCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good'
    if (value <= 3000) return 'needs-improvement'
    return 'poor'
  }

  private rateTTFB(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 800) return 'good'
    if (value <= 1800) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Mede tempo de execução de uma função
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    this.recordMetric({
      name: `Custom:${name}`,
      value: duration,
      rating: duration < 100 ? 'good' : duration < 500 ? 'needs-improvement' : 'poor',
      timestamp: Date.now(),
    })
    
    return result
  }

  /**
   * Mede tempo de execução de uma função async
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    this.recordMetric({
      name: `Custom:${name}`,
      value: duration,
      rating: duration < 100 ? 'good' : duration < 500 ? 'needs-improvement' : 'poor',
      timestamp: Date.now(),
    })
    
    return result
  }

  /**
   * Retorna todas as métricas
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Retorna resumo das métricas
   */
  getSummary() {
    const summary: Record<string, { avg: number; min: number; max: number; rating: string }> = {}
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          avg: 0,
          min: Infinity,
          max: -Infinity,
          rating: metric.rating,
        }
      }
      
      summary[metric.name].avg += metric.value
      summary[metric.name].min = Math.min(summary[metric.name].min, metric.value)
      summary[metric.name].max = Math.max(summary[metric.name].max, metric.value)
    })
    
    Object.keys(summary).forEach(key => {
      const count = this.metrics.filter(m => m.name === key).length
      summary[key].avg /= count
    })
    
    return summary
  }
}

// Instância global
export const performanceMonitor = new PerformanceMonitor()

// Hook para usar em componentes
export function usePerformanceMonitor() {
  return {
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
  }
}

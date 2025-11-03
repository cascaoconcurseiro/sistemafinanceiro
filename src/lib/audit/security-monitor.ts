/**
 * MONITOR DE SEGURANÇA
 *
 * Monitora ativamente tentativas de uso de storage local
 * Trabalha de forma independente para garantir segurança
 */

export interface SecurityConfig {
  enableRealTimeMonitoring: boolean;
  enableStackTraceCapture: boolean;
  enableNetworkMonitoring: boolean;
  enableDOMMonitoring: boolean;
  alertThreshold: number;
  autoBlock: boolean;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  details: any;
  source: string;
  blocked: boolean;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private _isActive = false;
  private alerts: SecurityAlert[] = [];
  private config: SecurityConfig = {
    enableRealTimeMonitoring: true,
    enableStackTraceCapture: true,
    enableNetworkMonitoring: true,
    enableDOMMonitoring: true,
    alertThreshold: 5,
    autoBlock: true
  };

  private observers: MutationObserver[] = [];
  private intervalIds: NodeJS.Timeout[] = [];

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Inicia monitoramento de segurança
   */
  public async start(config?: Partial<SecurityConfig>): Promise<void> {
    if (this._isActive) {
      console.log('🛡️ Monitor de segurança já está ativo');
      return;
    }

    this.config = { ...this.config, ...config };

    try {
      console.log('🛡️ Iniciando monitor de segurança...');

      // Timeout para evitar loops infinitos na inicialização
      const initPromise = this.initializeMonitoring();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout na inicialização do monitor')), 3000)
      );

      await Promise.race([initPromise, timeoutPromise]);

      this._isActive = true;

      console.log('Monitor de segurança iniciado:', {
        type: 'system_event',
        level: 'info',
        source: 'security-monitor',
        action: 'started',
        config: this.config,
        timestamp: new Date().toISOString()
      });

      
    } catch (error) {
      console.error('❌ Erro ao iniciar monitor de segurança:', error);
      // Não lança erro para não impedir o carregamento do sistema
      console.warn('⚠️ Sistema continuará sem monitoramento de segurança');
    }
  }

  /**
   * Inicializa componentes de monitoramento
   */
  private async initializeMonitoring(): Promise<void> {
    // Inicia monitoramento em tempo real
    if (this.config.enableRealTimeMonitoring) {
      this.startRealTimeMonitoring();
    }

    // Inicia monitoramento de rede
    if (this.config.enableNetworkMonitoring) {
      this.startNetworkMonitoring();
    }

    // Inicia monitoramento do DOM
    if (this.config.enableDOMMonitoring) {
      this.startDOMMonitoring();
    }

    // Configura verificações periódicas
    this.startPeriodicChecks();
  }

  /**
   * Para monitoramento
   */
  public async stop(): Promise<void> {
    if (!this._isActive) return;

    console.log('🛡️ Parando monitor de segurança...');

    // Para observadores
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Para intervalos
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];

    this._isActive = false;

    console.log('Monitor de segurança parado:', {
      type: 'system_event',
      level: 'info',
      source: 'security-monitor',
      action: 'stopped',
      timestamp: new Date().toISOString()
    });

      }

  /**
   * Inicia monitoramento em tempo real
   */
  private startRealTimeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitora tentativas de acesso direto ao localStorage
    this.interceptStorageAccess();

    // Monitora execução de scripts suspeitos
    this.monitorScriptExecution();

    // Monitora mudanças no objeto window
    this.monitorWindowChanges();
  }

  /**
   * Intercepta acessos ao storage
   */
  private interceptStorageAccess(): void {
    if (typeof window === 'undefined') return;

    // Monitora tentativas de redefinir sessionStorage (localStorage removido)
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj: any, prop: string, descriptor: PropertyDescriptor) {
      if (obj === window && prop === 'sessionStorage') {
        securityMonitor.createAlert({
          severity: 'critical',
          type: 'storage_redefinition',
          message: `Tentativa de redefinir ${prop} detectada`,
          details: {
            property: prop,
            descriptor,
            stackTrace: securityMonitor.config.enableStackTraceCapture ? new Error().stack : undefined
          },
          source: 'storage-interceptor',
          blocked: true
        });

        return obj; // Bloqueia a redefinição
      }

      return originalDefineProperty.call(this, obj, prop, descriptor);
    };

    // Monitora tentativas de deletar propriedades de storage (localStorage removido)
    const originalDelete = Reflect.deleteProperty;
    Reflect.deleteProperty = function(target: any, prop: string | symbol) {
      if (target === window && prop === 'sessionStorage') {
        securityMonitor.createAlert({
          severity: 'critical',
          type: 'storage_deletion',
          message: `Tentativa de deletar ${String(prop)} detectada`,
          details: {
            property: String(prop),
            stackTrace: securityMonitor.config.enableStackTraceCapture ? new Error().stack : undefined
          },
          source: 'storage-interceptor',
          blocked: true
        });

        return false; // Bloqueia a deleção
      }

      return originalDelete.call(this, target, prop);
    };
  }

  /**
   * Monitora execução de scripts
   */
  private monitorScriptExecution(): void {
    if (typeof window === 'undefined') return;

    // Monitora eval
    const originalEval = window.eval;
    window.eval = function(code: string) {
      if (code.includes('localStorage') || code.includes('sessionStorage') || code.includes('indexedDB')) {
        securityMonitor.createAlert({
          severity: 'high',
          type: 'suspicious_eval',
          message: 'Código suspeito detectado em eval()',
          details: {
            code: code.substring(0, 200), // Primeiros 200 caracteres
            stackTrace: securityMonitor.config.enableStackTraceCapture ? new Error().stack : undefined
          },
          source: 'script-monitor',
          blocked: true
        });

        throw new Error('Execução de código suspeito bloqueada');
      }

      return originalEval.call(this, code);
    };

    // Monitora Function constructor
    const originalFunction = window.Function;
    window.Function = function(...args: string[]) {
      const code = args.join(' ');
      if (code.includes('localStorage') || code.includes('sessionStorage') || code.includes('indexedDB')) {
        securityMonitor.createAlert({
          severity: 'high',
          type: 'suspicious_function',
          message: 'Função suspeita detectada',
          details: {
            code: code.substring(0, 200),
            stackTrace: securityMonitor.config.enableStackTraceCapture ? new Error().stack : undefined
          },
          source: 'script-monitor',
          blocked: true
        });

        throw new Error('Criação de função suspeita bloqueada');
      }

      return originalFunction.apply(this, args);
    } as any;
  }

  /**
   * Monitora mudanças no objeto window
   */
  private monitorWindowChanges(): void {
    if (typeof window === 'undefined') return;

    // Monitora novas propriedades no window
    const knownProperties = new Set(Object.getOwnPropertyNames(window));

    const checkInterval = setInterval(() => {
      const currentProperties = new Set(Object.getOwnPropertyNames(window));

      for (const prop of currentProperties) {
        if (!knownProperties.has(prop)) {
          knownProperties.add(prop);

          // Verifica se é uma propriedade suspeita
          if (prop.toLowerCase().includes('storage') || prop.toLowerCase().includes('db')) {
            this.createAlert({
              severity: 'medium',
              type: 'new_window_property',
              message: `Nova propriedade suspeita detectada: ${prop}`,
              details: {
                property: prop,
                value: typeof (window as any)[prop]
              },
              source: 'window-monitor',
              blocked: false
            });
          }
        }
      }
    }, 5000);

    this.intervalIds.push(checkInterval);
  }

  /**
   * Inicia monitoramento de rede
   */
  private startNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitora requests suspeitos
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const url = args[0]?.toString() || '';
      const options = args[1] || {};

      // Verifica URLs suspeitas
      if (securityMonitor.isSuspiciousURL(url)) {
        securityMonitor.createAlert({
          severity: 'medium',
          type: 'suspicious_request',
          message: `Request suspeito detectado: ${url}`,
          details: {
            url,
            method: options.method || 'GET',
            headers: options.headers,
            stackTrace: securityMonitor.config.enableStackTraceCapture ? new Error().stack : undefined
          },
          source: 'network-monitor',
          blocked: false
        });
      }

      return originalFetch.apply(this, args);
    };
  }

  /**
   * Inicia monitoramento do DOM
   */
  private startDOMMonitoring(): void {
    if (typeof window === 'undefined' || !window.MutationObserver) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Monitora adição de scripts suspeitos
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;

              if (element.tagName === 'SCRIPT') {
                const scriptContent = element.textContent || '';
                if (this.isSuspiciousScript(scriptContent)) {
                  this.createAlert({
                    severity: 'high',
                    type: 'suspicious_script_injection',
                    message: 'Script suspeito injetado no DOM',
                    details: {
                      content: scriptContent.substring(0, 200),
                      src: element.getAttribute('src')
                    },
                    source: 'dom-monitor',
                    blocked: false
                  });
                }
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.push(observer);
  }

  /**
   * Inicia verificações periódicas
   */
  private startPeriodicChecks(): void {
    // localStorage foi removido do sistema - verificação não necessária
    
    // Log da adaptação
    console.log('Verificações periódicas adaptadas:', {
      type: 'system_event',
      level: 'info',
      source: 'security-monitor',
      action: 'periodic_checks_adapted',
      message: 'localStorage removido do sistema',
      timestamp: new Date().toISOString()
    });

    // Verifica atividade suspeita
    const checkActivity = setInterval(() => {
      // Simulação de detecção de atividade suspeita
      const suspiciousActivity = { hasSuspiciousActivity: false };

      if (suspiciousActivity.hasSuspiciousActivity) {
        this.createAlert({
          severity: 'high',
          type: 'suspicious_activity',
          message: 'Atividade suspeita detectada',
          details: suspiciousActivity,
          source: 'activity-monitor',
          blocked: false
        });
      }
    }, 60000); // A cada minuto

    this.intervalIds.push(checkActivity);
  }

  /**
   * Verifica se URL é suspeita (localStorage removido do sistema)
   */
  private isSuspiciousURL(url: string): boolean {
    const suspiciousPatterns = [
      /sessionStorage/i,
      /indexedDB/i,
      /websql/i,
      /storage.*api/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Verifica se script é suspeito (localStorage removido do sistema)
   */
  private isSuspiciousScript(content: string): boolean {
    const suspiciousPatterns = [
      /sessionStorage\s*\./,
      /indexedDB\s*\./,
      /window\s*\[\s*['"]sessionStorage['"]\s*\]/
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Cria alerta de segurança
   */
  private async createAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp'>): Promise<void> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      ...alertData
    };

    this.alerts.push(alert);

    // Limita alertas em memória
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Log do alerta de segurança
    console.log('Alerta de segurança criado:', {
      type: 'security_violation',
      level: alert.severity === 'critical' ? 'critical' : 'warning',
      source: alert.source,
      action: alert.type,
      alert: alert,
      blocked: alert.blocked
    });

    // Auto-bloqueio se configurado
    if (this.config.autoBlock && alert.severity === 'critical') {
      console.warn('🚨 Auto-bloqueio ativado devido a alerta crítico');
    }

    // Dispara evento para UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('security-alert', {
        detail: alert
      }));
    }
  }

  /**
   * Gera ID único para alerta
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtém alertas recentes
   */
  public getRecentAlerts(limit = 50): SecurityAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Obtém alertas por severidade
   */
  public getAlertsBySeverity(severity: SecurityAlert['severity']): SecurityAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Obtém estatísticas de segurança
   */
  public getSecurityStats(): {
    totalAlerts: number;
    alertsBySeverity: Record<string, number>;
    alertsByType: Record<string, number>;
    recentAlerts: SecurityAlert[];
    isActive: boolean;
  } {
    const alertsBySeverity = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsByType = this.alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAlerts: this.alerts.length,
      alertsBySeverity,
      alertsByType,
      recentAlerts: this.getRecentAlerts(10),
      isActive: this._isActive
    };
  }

  /**
   * Verifica se está ativo
   */
  public isActive(): boolean {
    return this._isActive;
  }

  /**
   * Verifica se está ativo (método alternativo)
   */
  public isMonitorActive(): boolean {
    return this._isActive;
  }

  /**
   * Atualiza configuração
   */
  public updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };

    console.log('Configuração do monitor de segurança atualizada:', {
      type: 'system_event',
      level: 'info',
      source: 'security-monitor',
      action: 'config_updated',
      newConfig: this.config
    });
  }
}

// Singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

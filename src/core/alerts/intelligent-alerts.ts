/**
 * SISTEMA DE ALERTAS INTELIGENTES
 * Monitora padrões e envia alertas proativos
 */

export interface IntelligentAlert {
  id: string;
  type: 'budget_warning' | 'unusual_spending' | 'bill_reminder' | 'savings_opportunity' | 'goal_progress';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  category?: string;
  amount?: number;
  actionRequired: boolean;
  suggestedActions: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  type: string;
  condition: (data: any) => boolean;
  generateAlert: (data: any) => IntelligentAlert;
  isActive: boolean;
}

export class IntelligentAlertSystem {
  private rules: AlertRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Inicializa regras padrão de alertas
   */
  private initializeDefaultRules(): void {
    this.rules = [
      // Alerta de orçamento próximo do limite
      {
        id: 'budget-80-percent',
        name: 'Orçamento 80%',
        type: 'budget_warning',
        condition: (data) => {
          const { spent, budget } = data;
          return (spent / budget) >= 0.8 && (spent / budget) < 1.0;
        },
        generateAlert: (data) => ({
          id: `budget-warning-${Date.now()}`,
          type: 'budget_warning',
          severity: 'warning',
          title: `Orçamento de ${data.category} em 80%`,
          message: `Você já gastou R$ ${data.spent.toFixed(2)} de R$ ${data.budget.toFixed(2)} (${((data.spent/data.budget)*100).toFixed(1)}%)`,
          category: data.category,
          amount: data.budget - data.spent,
          actionRequired: true,
          suggestedActions: [
            'Revisar gastos restantes do mês',
            'Evitar despesas não essenciais',
            'Considerar ajustar orçamento',
          ],
          createdAt: new Date(),
        }),
        isActive: true,
      },

      // Alerta de orçamento estourado
      {
        id: 'budget-exceeded',
        name: 'Orçamento Excedido',
        type: 'budget_warning',
        condition: (data) => {
          const { spent, budget } = data;
          return spent > budget;
        },
        generateAlert: (data) => ({
          id: `budget-exceeded-${Date.now()}`,
          type: 'budget_warning',
          severity: 'critical',
          title: `Orçamento de ${data.category} excedido!`,
          message: `Você gastou R$ ${data.spent.toFixed(2)}, ultrapassando o orçamento de R$ ${data.budget.toFixed(2)} em R$ ${(data.spent - data.budget).toFixed(2)}`,
          category: data.category,
          amount: data.spent - data.budget,
          actionRequired: true,
          suggestedActions: [
            'Parar gastos nesta categoria',
            'Revisar necessidade de cada despesa',
            'Ajustar orçamento para próximo mês',
          ],
          createdAt: new Date(),
        }),
        isActive: true,
      },

      // Alerta de gasto incomum
      {
        id: 'unusual-spending',
        name: 'Gasto Incomum',
        type: 'unusual_spending',
        condition: (data) => {
          const { currentAmount, averageAmount } = data;
          return currentAmount > averageAmount * 1.5;
        },
        generateAlert: (data) => ({
          id: `unusual-${Date.now()}`,
          type: 'unusual_spending',
          severity: 'warning',
          title: 'Gasto acima do normal detectado',
          message: `Gasto de R$ ${data.currentAmount.toFixed(2)} em ${data.category} está 50% acima da média (R$ ${data.averageAmount.toFixed(2)})`,
          category: data.category,
          amount: data.currentAmount,
          actionRequired: false,
          suggestedActions: [
            'Verificar se o gasto foi necessário',
            'Identificar causa do aumento',
            'Ajustar gastos futuros se necessário',
          ],
          createdAt: new Date(),
        }),
        isActive: true,
      },

      // Alerta de conta a vencer
      {
        id: 'bill-due-soon',
        name: 'Conta a Vencer',
        type: 'bill_reminder',
        condition: (data) => {
          const { dueDate } = data;
          const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return daysUntilDue <= 3 && daysUntilDue > 0;
        },
        generateAlert: (data) => {
          const daysUntilDue = Math.ceil((new Date(data.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return {
            id: `bill-due-${Date.now()}`,
            type: 'bill_reminder',
            severity: daysUntilDue === 1 ? 'critical' : 'warning',
            title: `Conta vence em ${daysUntilDue} dia${daysUntilDue > 1 ? 's' : ''}`,
            message: `${data.description} - R$ ${data.amount.toFixed(2)} vence em ${new Date(data.dueDate).toLocaleDateString('pt-BR')}`,
            amount: data.amount,
            actionRequired: true,
            suggestedActions: [
              'Pagar conta antes do vencimento',
              'Verificar saldo disponível',
              'Agendar pagamento',
            ],
            createdAt: new Date(),
            expiresAt: new Date(data.dueDate),
          };
        },
        isActive: true,
      },

      // Alerta de oportunidade de economia
      {
        id: 'savings-opportunity',
        name: 'Oportunidade de Economia',
        type: 'savings_opportunity',
        condition: (data) => {
          const { category, currentSpending, potentialSavings } = data;
          return potentialSavings > currentSpending * 0.15;
        },
        generateAlert: (data) => ({
          id: `savings-${Date.now()}`,
          type: 'savings_opportunity',
          severity: 'info',
          title: 'Oportunidade de economizar',
          message: `Você pode economizar até R$ ${data.potentialSavings.toFixed(2)}/mês em ${data.category}`,
          category: data.category,
          amount: data.potentialSavings,
          actionRequired: false,
          suggestedActions: data.suggestions || [
            'Ver sugestões detalhadas',
            'Comparar alternativas',
            'Estabelecer meta de economia',
          ],
          createdAt: new Date(),
        }),
        isActive: true,
      },

      // Alerta de progresso de meta
      {
        id: 'goal-milestone',
        name: 'Marco de Meta',
        type: 'goal_progress',
        condition: (data) => {
          const { current, target } = data;
          const progress = (current / target) * 100;
          return progress >= 25 && progress % 25 < 5; // 25%, 50%, 75%, 100%
        },
        generateAlert: (data) => {
          const progress = Math.floor((data.current / data.target) * 100);
          return {
            id: `goal-${Date.now()}`,
            type: 'goal_progress',
            severity: 'info',
            title: `Meta ${data.goalName} em ${progress}%`,
            message: `Parabéns! Você já alcançou ${progress}% da sua meta. Continue assim!`,
            amount: data.current,
            actionRequired: false,
            suggestedActions: [
              'Manter o ritmo de economia',
              'Revisar estratégia se necessário',
              'Comemorar o progresso',
            ],
            createdAt: new Date(),
          };
        },
        isActive: true,
      },
    ];
  }

  /**
   * Verifica e gera alertas baseados nos dados
   */
  checkAndGenerateAlerts(data: {
    budgets?: Array<{ category: string; spent: number; budget: number }>;
    spending?: Array<{ category: string; currentAmount: number; averageAmount: number }>;
    bills?: Array<{ description: string; amount: number; dueDate: Date }>;
    savingsOpportunities?: Array<{ category: string; currentSpending: number; potentialSavings: number; suggestions?: string[] }>;
    goals?: Array<{ goalName: string; current: number; target: number }>;
  }): IntelligentAlert[] {
    const alerts: IntelligentAlert[] = [];

    // Verificar orçamentos
    if (data.budgets) {
      for (const budget of data.budgets) {
        for (const rule of this.rules.filter(r => r.type === 'budget_warning' && r.isActive)) {
          if (rule.condition(budget)) {
            alerts.push(rule.generateAlert(budget));
          }
        }
      }
    }

    // Verificar gastos incomuns
    if (data.spending) {
      for (const spending of data.spending) {
        for (const rule of this.rules.filter(r => r.type === 'unusual_spending' && r.isActive)) {
          if (rule.condition(spending)) {
            alerts.push(rule.generateAlert(spending));
          }
        }
      }
    }

    // Verificar contas a vencer
    if (data.bills) {
      for (const bill of data.bills) {
        for (const rule of this.rules.filter(r => r.type === 'bill_reminder' && r.isActive)) {
          if (rule.condition(bill)) {
            alerts.push(rule.generateAlert(bill));
          }
        }
      }
    }

    // Verificar oportunidades de economia
    if (data.savingsOpportunities) {
      for (const opportunity of data.savingsOpportunities) {
        for (const rule of this.rules.filter(r => r.type === 'savings_opportunity' && r.isActive)) {
          if (rule.condition(opportunity)) {
            alerts.push(rule.generateAlert(opportunity));
          }
        }
      }
    }

    // Verificar progresso de metas
    if (data.goals) {
      for (const goal of data.goals) {
        for (const rule of this.rules.filter(r => r.type === 'goal_progress' && r.isActive)) {
          if (rule.condition(goal)) {
            alerts.push(rule.generateAlert(goal));
          }
        }
      }
    }

    // Ordenar por severidade
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Adiciona regra customizada
   */
  addCustomRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove regra
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /**
   * Ativa/desativa regra
   */
  toggleRule(ruleId: string, isActive: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.isActive = isActive;
    }
  }
}

'use client';

// =====================================================
// SISTEMA DE CATEGORIZAÇÃO AUTOMÁTICA INTELIGENTE
// =====================================================

export interface CategoryPrediction {
  category: string;
  confidence: number;
  subcategory?: string;
  reasoning: string[];
  alternativeCategories: AlternativeCategory[];
}

export interface AlternativeCategory {
  category: string;
  confidence: number;
  subcategory?: string;
}

export interface TransactionFeatures {
  amount: number;
  description: string;
  merchant?: string;
  location?: string;
  dayOfWeek: number;
  hourOfDay: number;
  isWeekend: boolean;
  accountType: string;
  transactionType: 'income' | 'expense' | 'transfer';
  previousCategory?: string;
  userPattern?: UserCategoryPattern;
}

export interface UserCategoryPattern {
  userId: string;
  merchantCategories: Record<string, string>;
  descriptionPatterns: CategoryPattern[];
  amountRanges: AmountCategoryRange[];
  timePatterns: TimeCategoryPattern[];
  locationPatterns: LocationCategoryPattern[];
  lastUpdated: Date;
}

export interface CategoryPattern {
  pattern: string;
  category: string;
  confidence: number;
  frequency: number;
}

export interface AmountCategoryRange {
  minAmount: number;
  maxAmount: number;
  category: string;
  frequency: number;
}

export interface TimeCategoryPattern {
  dayOfWeek?: number;
  hourRange?: { start: number; end: number };
  category: string;
  frequency: number;
}

export interface LocationCategoryPattern {
  location: string;
  category: string;
  frequency: number;
}

export interface CategoryRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: CategoryCondition[];
  targetCategory: string;
  targetSubcategory?: string;
  isActive: boolean;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryCondition {
  field: string;
  operator: CategoryOperator;
  value: any;
  weight: number;
}

export interface LearningData {
  transactionId: string;
  features: TransactionFeatures;
  actualCategory: string;
  predictedCategory: string;
  confidence: number;
  wasCorrect: boolean;
  userCorrected: boolean;
  timestamp: Date;
}

export interface CategoryMetrics {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  confidenceDistribution: Record<string, number>;
  categoryAccuracy: Record<string, number>;
  improvementTrends: MetricTrend[];
  userFeedbackStats: UserFeedbackStats;
}

export interface MetricTrend {
  date: string;
  accuracy: number;
  totalPredictions: number;
}

export interface UserFeedbackStats {
  totalFeedback: number;
  acceptedPredictions: number;
  rejectedPredictions: number;
  mostCorrectedCategories: string[];
}

export enum CategoryOperator {
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  EQUALS = 'equals',
  REGEX_MATCH = 'regex_match',
  AMOUNT_RANGE = 'amount_range',
  TIME_RANGE = 'time_range',
  SIMILARITY = 'similarity',
}

// Categorias padrão brasileiras
export const BRAZILIAN_CATEGORIES = {
  // Receitas
  RECEITAS: {
    SALARIO: 'Salário',
    FREELANCE: 'Freelance',
    INVESTIMENTOS: 'Rendimentos de Investimentos',
    ALUGUEL_RECEBIDO: 'Aluguel Recebido',
    VENDAS: 'Vendas',
    OUTROS_RENDIMENTOS: 'Outros Rendimentos',
  },
  
  // Despesas Essenciais
  MORADIA: {
    ALUGUEL: 'Aluguel',
    FINANCIAMENTO: 'Financiamento Imobiliário',
    CONDOMINIO: 'Condomínio',
    IPTU: 'IPTU',
    ENERGIA: 'Energia Elétrica',
    AGUA: 'Água e Esgoto',
    GAS: 'Gás',
    INTERNET: 'Internet',
    TELEFONE: 'Telefone',
  },
  
  ALIMENTACAO: {
    SUPERMERCADO: 'Supermercado',
    RESTAURANTE: 'Restaurante',
    LANCHONETE: 'Lanchonete',
    DELIVERY: 'Delivery',
    PADARIA: 'Padaria',
    FEIRA: 'Feira',
  },
  
  TRANSPORTE: {
    COMBUSTIVEL: 'Combustível',
    TRANSPORTE_PUBLICO: 'Transporte Público',
    UBER_TAXI: 'Uber/Taxi',
    ESTACIONAMENTO: 'Estacionamento',
    MANUTENCAO_VEICULO: 'Manutenção do Veículo',
    IPVA: 'IPVA',
    SEGURO_VEICULO: 'Seguro do Veículo',
  },
  
  SAUDE: {
    PLANO_SAUDE: 'Plano de Saúde',
    MEDICO: 'Consulta Médica',
    DENTISTA: 'Dentista',
    FARMACIA: 'Farmácia',
    EXAMES: 'Exames',
    HOSPITAL: 'Hospital',
  },
  
  // Despesas Pessoais
  EDUCACAO: {
    ESCOLA: 'Escola',
    FACULDADE: 'Faculdade',
    CURSO: 'Curso',
    LIVROS: 'Livros',
    MATERIAL_ESCOLAR: 'Material Escolar',
  },
  
  LAZER: {
    CINEMA: 'Cinema',
    TEATRO: 'Teatro',
    SHOW: 'Show',
    VIAGEM: 'Viagem',
    ACADEMIA: 'Academia',
    ESPORTES: 'Esportes',
  },
  
  COMPRAS: {
    ROUPAS: 'Roupas',
    CALCADOS: 'Calçados',
    ELETRONICOS: 'Eletrônicos',
    CASA_DECORACAO: 'Casa e Decoração',
    BELEZA: 'Beleza e Cuidados',
  },
  
  // Despesas Financeiras
  FINANCEIRO: {
    CARTAO_CREDITO: 'Cartão de Crédito',
    EMPRESTIMO: 'Empréstimo',
    FINANCIAMENTO: 'Financiamento',
    INVESTIMENTOS: 'Investimentos',
    TAXA_BANCARIA: 'Taxa Bancária',
    SEGUROS: 'Seguros',
  },
};

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category?: string;
  subcategory?: string;
  description: string;
  merchant?: string;
  location?: string;
  date: Date;
  createdAt: Date;
}

export class IntelligentCategorization {
  private categoryRules: CategoryRule[] = [];
  private userPatterns: Map<string, UserCategoryPattern> = new Map();
  private learningData: LearningData[] = [];
  private merchantDatabase: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeMerchantDatabase();
  }

  // =====================================================
  // INICIALIZAÇÃO E CONFIGURAÇÃO
  // =====================================================

  private initializeDefaultRules(): void {
    this.categoryRules = [
      // Regras para Supermercado
      {
        id: 'supermarket-1',
        name: 'Supermercados',
        description: 'Identifica transações em supermercados',
        priority: 90,
        conditions: [
          {
            field: 'merchant',
            operator: CategoryOperator.CONTAINS,
            value: ['SUPERMERCADO', 'EXTRA', 'CARREFOUR', 'PÃO DE AÇÚCAR', 'BIG', 'WALMART'],
            weight: 0.8,
          },
          {
            field: 'description',
            operator: CategoryOperator.CONTAINS,
            value: ['SUPERMERCADO', 'MERCADO', 'HIPERMERCADO'],
            weight: 0.7,
          },
        ],
        targetCategory: BRAZILIAN_CATEGORIES.ALIMENTACAO.SUPERMERCADO,
        isActive: true,
        confidence: 0.9,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Regras para Combustível
      {
        id: 'fuel-1',
        name: 'Postos de Combustível',
        description: 'Identifica gastos com combustível',
        priority: 85,
        conditions: [
          {
            field: 'merchant',
            operator: CategoryOperator.CONTAINS,
            value: ['POSTO', 'SHELL', 'PETROBRAS', 'IPIRANGA', 'BR DISTRIBUIDORA'],
            weight: 0.9,
          },
          {
            field: 'description',
            operator: CategoryOperator.CONTAINS,
            value: ['COMBUSTIVEL', 'GASOLINA', 'ETANOL', 'DIESEL', 'POSTO'],
            weight: 0.8,
          },
        ],
        targetCategory: BRAZILIAN_CATEGORIES.TRANSPORTE.COMBUSTIVEL,
        isActive: true,
        confidence: 0.95,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Regras para Farmácia
      {
        id: 'pharmacy-1',
        name: 'Farmácias',
        description: 'Identifica gastos em farmácias',
        priority: 88,
        conditions: [
          {
            field: 'merchant',
            operator: CategoryOperator.CONTAINS,
            value: ['FARMACIA', 'DROGARIA', 'DROGA RAIA', 'PACHECO', 'DROGASIL'],
            weight: 0.9,
          },
          {
            field: 'description',
            operator: CategoryOperator.CONTAINS,
            value: ['FARMACIA', 'DROGARIA', 'MEDICAMENTO'],
            weight: 0.8,
          },
        ],
        targetCategory: BRAZILIAN_CATEGORIES.SAUDE.FARMACIA,
        isActive: true,
        confidence: 0.92,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Regras para Restaurantes
      {
        id: 'restaurant-1',
        name: 'Restaurantes',
        description: 'Identifica gastos em restaurantes',
        priority: 75,
        conditions: [
          {
            field: 'merchant',
            operator: CategoryOperator.CONTAINS,
            value: ['RESTAURANTE', 'LANCHONETE', 'PIZZARIA', 'HAMBURGUERIA'],
            weight: 0.8,
          },
          {
            field: 'description',
            operator: CategoryOperator.CONTAINS,
            value: ['RESTAURANTE', 'LANCHE', 'PIZZA', 'HAMBURGUER', 'COMIDA'],
            weight: 0.7,
          },
          {
            field: 'amount',
            operator: CategoryOperator.AMOUNT_RANGE,
            value: { min: 15, max: 200 },
            weight: 0.3,
          },
        ],
        targetCategory: BRAZILIAN_CATEGORIES.ALIMENTACAO.RESTAURANTE,
        isActive: true,
        confidence: 0.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Regras para Transporte Público
      {
        id: 'transport-1',
        name: 'Transporte Público',
        description: 'Identifica gastos com transporte público',
        priority: 80,
        conditions: [
          {
            field: 'description',
            operator: CategoryOperator.CONTAINS,
            value: ['METRO', 'ONIBUS', 'TREM', 'VLT', 'BILHETE UNICO', 'CARTAO TRANSPORTE'],
            weight: 0.9,
          },
          {
            field: 'amount',
            operator: CategoryOperator.AMOUNT_RANGE,
            value: { min: 3, max: 50 },
            weight: 0.5,
          },
        ],
        targetCategory: BRAZILIAN_CATEGORIES.TRANSPORTE.TRANSPORTE_PUBLICO,
        isActive: true,
        confidence: 0.85,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Regras para Salário
      {
        id: 'salary-1',
        name: 'Salário',
        description: 'Identifica recebimento de salário',
        priority: 95,
        conditions: [
          {
            field: 'type',
            operator: CategoryOperator.EQUALS,
            value: 'income',
            weight: 0.5,
          },
          {
            field: 'description',
            operator: CategoryOperator.CONTAINS,
            value: ['SALARIO', 'VENCIMENTO', 'PAGAMENTO', 'EMPRESA'],
            weight: 0.8,
          },
          {
            field: 'amount',
            operator: CategoryOperator.AMOUNT_RANGE,
            value: { min: 1000, max: 50000 },
            weight: 0.4,
          },
        ],
        targetCategory: BRAZILIAN_CATEGORIES.RECEITAS.SALARIO,
        isActive: true,
        confidence: 0.9,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Regras para Uber/Taxi
      {
        id: 'rideshare-1',
        name: 'Uber/Taxi',
        description: 'Identifica gastos com Uber e táxi',
        priority: 85,
        conditions: [
          {
            field: 'merchant',
            operator: CategoryOperator.CONTAINS,
            value: ['UBER', '99', 'TAXI', 'CABIFY'],
            weight: 0.9,
          },
          {
            field: 'description',
            operator: CategoryOperator.CONTAINS,
            value: ['UBER', 'TAXI', 'CORRIDA', 'VIAGEM'],
            weight: 0.8,
          },
        ],
        targetCategory: BRAZILIAN_CATEGORIES.TRANSPORTE.UBER_TAXI,
        isActive: true,
        confidence: 0.95,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Regras para Streaming/Assinaturas
      {
        id: 'streaming-1',
        name: 'Streaming e Assinaturas',
        description: 'Identifica assinaturas de streaming',
        priority: 90,
        conditions: [
          {
            field: 'merchant',
            operator: CategoryOperator.CONTAINS,
            value: ['NETFLIX', 'SPOTIFY', 'AMAZON PRIME', 'DISNEY', 'GLOBOPLAY'],
            weight: 0.9,
          },
          {
            field: 'description',
            operator: CategoryOperator.CONTAINS,
            value: ['ASSINATURA', 'STREAMING', 'MENSALIDADE'],
            weight: 0.7,
          },
          {
            field: 'amount',
            operator: CategoryOperator.AMOUNT_RANGE,
            value: { min: 10, max: 100 },
            weight: 0.4,
          },
        ],
        targetCategory: BRAZILIAN_CATEGORIES.LAZER.CINEMA, // Pode ser ajustado
        isActive: true,
        confidence: 0.88,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  private initializeMerchantDatabase(): void {
    // Base de dados de merchants conhecidos
    const merchants = [
      // Supermercados
      ['EXTRA', BRAZILIAN_CATEGORIES.ALIMENTACAO.SUPERMERCADO],
      ['CARREFOUR', BRAZILIAN_CATEGORIES.ALIMENTACAO.SUPERMERCADO],
      ['PÃO DE AÇÚCAR', BRAZILIAN_CATEGORIES.ALIMENTACAO.SUPERMERCADO],
      ['BIG', BRAZILIAN_CATEGORIES.ALIMENTACAO.SUPERMERCADO],
      ['WALMART', BRAZILIAN_CATEGORIES.ALIMENTACAO.SUPERMERCADO],
      
      // Postos de Combustível
      ['SHELL', BRAZILIAN_CATEGORIES.TRANSPORTE.COMBUSTIVEL],
      ['PETROBRAS', BRAZILIAN_CATEGORIES.TRANSPORTE.COMBUSTIVEL],
      ['IPIRANGA', BRAZILIAN_CATEGORIES.TRANSPORTE.COMBUSTIVEL],
      ['BR DISTRIBUIDORA', BRAZILIAN_CATEGORIES.TRANSPORTE.COMBUSTIVEL],
      
      // Farmácias
      ['DROGA RAIA', BRAZILIAN_CATEGORIES.SAUDE.FARMACIA],
      ['DROGASIL', BRAZILIAN_CATEGORIES.SAUDE.FARMACIA],
      ['PACHECO', BRAZILIAN_CATEGORIES.SAUDE.FARMACIA],
      
      // Transporte
      ['UBER', BRAZILIAN_CATEGORIES.TRANSPORTE.UBER_TAXI],
      ['99', BRAZILIAN_CATEGORIES.TRANSPORTE.UBER_TAXI],
      
      // Fast Food
      ['MCDONALDS', BRAZILIAN_CATEGORIES.ALIMENTACAO.LANCHONETE],
      ['BURGER KING', BRAZILIAN_CATEGORIES.ALIMENTACAO.LANCHONETE],
      ['SUBWAY', BRAZILIAN_CATEGORIES.ALIMENTACAO.LANCHONETE],
    ];

    merchants.forEach(([merchant, category]) => {
      this.merchantDatabase.set(merchant, category);
    });
  }

  // =====================================================
  // PREDIÇÃO DE CATEGORIA PRINCIPAL
  // =====================================================

  predictCategory(transaction: Transaction): CategoryPrediction {
    const features = this.extractFeatures(transaction);
    const userPattern = this.getUserPattern(transaction.userId);
    
    // Aplicar diferentes métodos de predição
    const ruleBased = this.predictByRules(features);
    const patternBased = this.predictByUserPatterns(features, userPattern);
    const merchantBased = this.predictByMerchant(features);
    const similarityBased = this.predictBySimilarity(features, userPattern);

    // Combinar predições com pesos
    const predictions = [
      { ...ruleBased, weight: 0.4 },
      { ...patternBased, weight: 0.3 },
      { ...merchantBased, weight: 0.2 },
      { ...similarityBased, weight: 0.1 },
    ].filter(p => p.category);

    // Calcular predição final
    const finalPrediction = this.combinePredictions(predictions);
    
    // Gerar alternativas
    const alternatives = this.generateAlternatives(predictions, finalPrediction.category);

    return {
      category: finalPrediction.category,
      confidence: finalPrediction.confidence,
      subcategory: finalPrediction.subcategory,
      reasoning: finalPrediction.reasoning,
      alternativeCategories: alternatives,
    };
  }

  private extractFeatures(transaction: Transaction): TransactionFeatures {
    const date = new Date(transaction.date);
    
    return {
      amount: Math.abs(transaction.amount),
      description: transaction.description.toLowerCase(),
      merchant: transaction.merchant?.toLowerCase(),
      location: transaction.location?.toLowerCase(),
      dayOfWeek: date.getDay(),
      hourOfDay: date.getHours(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      accountType: 'checking', // Placeholder
      transactionType: transaction.type,
      previousCategory: transaction.category,
      userPattern: this.getUserPattern(transaction.userId),
    };
  }

  private predictByRules(features: TransactionFeatures): CategoryPrediction {
    let bestMatch: { rule: CategoryRule; score: number } | null = null;

    for (const rule of this.categoryRules.filter(r => r.isActive)) {
      const score = this.calculateRuleScore(rule, features);
      
      if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { rule, score };
      }
    }

    if (bestMatch) {
      return {
        category: bestMatch.rule.targetCategory,
        confidence: bestMatch.score * bestMatch.rule.confidence,
        subcategory: bestMatch.rule.targetSubcategory,
        reasoning: [`Regra: ${bestMatch.rule.name}`],
        alternativeCategories: [],
      };
    }

    return {
      category: '',
      confidence: 0,
      reasoning: ['Nenhuma regra aplicável'],
      alternativeCategories: [],
    };
  }

  private calculateRuleScore(rule: CategoryRule, features: TransactionFeatures): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const condition of rule.conditions) {
      const conditionScore = this.evaluateCondition(condition, features);
      totalScore += conditionScore * condition.weight;
      totalWeight += condition.weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private evaluateCondition(condition: CategoryCondition, features: TransactionFeatures): number {
    const fieldValue = this.getFieldValue(condition.field, features);
    
    switch (condition.operator) {
      case CategoryOperator.CONTAINS:
        return this.evaluateContains(fieldValue, condition.value);
      case CategoryOperator.STARTS_WITH:
        return this.evaluateStartsWith(fieldValue, condition.value);
      case CategoryOperator.ENDS_WITH:
        return this.evaluateEndsWith(fieldValue, condition.value);
      case CategoryOperator.EQUALS:
        return fieldValue === condition.value ? 1 : 0;
      case CategoryOperator.AMOUNT_RANGE:
        return this.evaluateAmountRange(fieldValue, condition.value);
      case CategoryOperator.TIME_RANGE:
        return this.evaluateTimeRange(fieldValue, condition.value);
      case CategoryOperator.SIMILARITY:
        return this.calculateStringSimilarity(String(fieldValue), String(condition.value));
      default:
        return 0;
    }
  }

  private getFieldValue(field: string, features: TransactionFeatures): any {
    switch (field) {
      case 'amount': return features.amount;
      case 'description': return features.description;
      case 'merchant': return features.merchant || '';
      case 'location': return features.location || '';
      case 'dayOfWeek': return features.dayOfWeek;
      case 'hourOfDay': return features.hourOfDay;
      case 'type': return features.transactionType;
      default: return '';
    }
  }

  private evaluateContains(fieldValue: any, conditionValue: any): number {
    const text = String(fieldValue).toLowerCase();
    const patterns = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
    
    for (const pattern of patterns) {
      if (text.includes(String(pattern).toLowerCase())) {
        return 1;
      }
    }
    return 0;
  }

  private evaluateStartsWith(fieldValue: any, conditionValue: any): number {
    const text = String(fieldValue).toLowerCase();
    const patterns = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
    
    for (const pattern of patterns) {
      if (text.startsWith(String(pattern).toLowerCase())) {
        return 1;
      }
    }
    return 0;
  }

  private evaluateEndsWith(fieldValue: any, conditionValue: any): number {
    const text = String(fieldValue).toLowerCase();
    const patterns = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
    
    for (const pattern of patterns) {
      if (text.endsWith(String(pattern).toLowerCase())) {
        return 1;
      }
    }
    return 0;
  }

  private evaluateAmountRange(amount: number, range: { min: number; max: number }): number {
    if (amount >= range.min && amount <= range.max) {
      return 1;
    }
    
    // Pontuação parcial para valores próximos
    const distance = Math.min(
      Math.abs(amount - range.min),
      Math.abs(amount - range.max)
    );
    const rangeSize = range.max - range.min;
    
    return Math.max(0, 1 - (distance / rangeSize));
  }

  private evaluateTimeRange(hour: number, range: { start: number; end: number }): number {
    return (hour >= range.start && hour <= range.end) ? 1 : 0;
  }

  private predictByUserPatterns(features: TransactionFeatures, userPattern?: UserCategoryPattern): CategoryPrediction {
    if (!userPattern) {
      return {
        category: '',
        confidence: 0,
        reasoning: ['Sem padrão do usuário'],
        alternativeCategories: [],
      };
    }

    // Verificar merchant conhecido
    if (features.merchant && userPattern.merchantCategories[features.merchant]) {
      return {
        category: userPattern.merchantCategories[features.merchant],
        confidence: 0.9,
        reasoning: ['Merchant conhecido do usuário'],
        alternativeCategories: [],
      };
    }

    // Verificar padrões de descrição
    for (const pattern of userPattern.descriptionPatterns) {
      if (features.description.includes(pattern.pattern.toLowerCase())) {
        return {
          category: pattern.category,
          confidence: pattern.confidence,
          reasoning: [`Padrão de descrição: ${pattern.pattern}`],
          alternativeCategories: [],
        };
      }
    }

    // Verificar faixas de valor
    for (const range of userPattern.amountRanges) {
      if (features.amount >= range.minAmount && features.amount <= range.maxAmount) {
        return {
          category: range.category,
          confidence: 0.6,
          reasoning: [`Faixa de valor conhecida: R$ ${range.minAmount} - R$ ${range.maxAmount}`],
          alternativeCategories: [],
        };
      }
    }

    return {
      category: '',
      confidence: 0,
      reasoning: ['Nenhum padrão do usuário aplicável'],
      alternativeCategories: [],
    };
  }

  private predictByMerchant(features: TransactionFeatures): CategoryPrediction {
    if (!features.merchant) {
      return {
        category: '',
        confidence: 0,
        reasoning: ['Sem informação de merchant'],
        alternativeCategories: [],
      };
    }

    // Busca exata
    const exactMatch = this.merchantDatabase.get(features.merchant.toUpperCase());
    if (exactMatch) {
      return {
        category: exactMatch,
        confidence: 0.95,
        reasoning: [`Merchant conhecido: ${features.merchant}`],
        alternativeCategories: [],
      };
    }

    // Busca por similaridade
    for (const [merchant, category] of this.merchantDatabase.entries()) {
      if (features.merchant.toUpperCase().includes(merchant) || 
          merchant.includes(features.merchant.toUpperCase())) {
        return {
          category,
          confidence: 0.8,
          reasoning: [`Merchant similar: ${merchant}`],
          alternativeCategories: [],
        };
      }
    }

    return {
      category: '',
      confidence: 0,
      reasoning: ['Merchant não reconhecido'],
      alternativeCategories: [],
    };
  }

  private predictBySimilarity(features: TransactionFeatures, userPattern?: UserCategoryPattern): CategoryPrediction {
    if (!userPattern) {
      return {
        category: '',
        confidence: 0,
        reasoning: ['Sem dados para comparação'],
        alternativeCategories: [],
      };
    }

    let bestMatch: { category: string; similarity: number } | null = null;

    // Comparar com padrões de descrição
    for (const pattern of userPattern.descriptionPatterns) {
      const similarity = this.calculateStringSimilarity(features.description, pattern.pattern);
      
      if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { category: pattern.category, similarity };
      }
    }

    if (bestMatch) {
      return {
        category: bestMatch.category,
        confidence: bestMatch.similarity * 0.8,
        reasoning: [`Similaridade com transações anteriores: ${Math.round(bestMatch.similarity * 100)}%`],
        alternativeCategories: [],
      };
    }

    return {
      category: '',
      confidence: 0,
      reasoning: ['Nenhuma similaridade encontrada'],
      alternativeCategories: [],
    };
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private combinePredictions(predictions: Array<CategoryPrediction & { weight: number }>): CategoryPrediction {
    if (predictions.length === 0) {
      return {
        category: 'Outros',
        confidence: 0.1,
        reasoning: ['Categoria padrão - nenhuma predição disponível'],
        alternativeCategories: [],
      };
    }

    // Agrupar por categoria
    const categoryScores: Record<string, { score: number; reasoning: string[]; subcategory?: string }> = {};
    
    for (const prediction of predictions) {
      if (!prediction.category) continue;
      
      if (!categoryScores[prediction.category]) {
        categoryScores[prediction.category] = {
          score: 0,
          reasoning: [],
          subcategory: prediction.subcategory,
        };
      }
      
      categoryScores[prediction.category].score += prediction.confidence * prediction.weight;
      categoryScores[prediction.category].reasoning.push(...prediction.reasoning);
    }

    // Encontrar melhor categoria
    const bestCategory = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b.score - a.score)[0];

    if (!bestCategory) {
      return {
        category: 'Outros',
        confidence: 0.1,
        reasoning: ['Categoria padrão'],
        alternativeCategories: [],
      };
    }

    return {
      category: bestCategory[0],
      confidence: Math.min(1, bestCategory[1].score),
      subcategory: bestCategory[1].subcategory,
      reasoning: [...new Set(bestCategory[1].reasoning)], // Remove duplicatas
      alternativeCategories: [],
    };
  }

  private generateAlternatives(
    predictions: Array<CategoryPrediction & { weight: number }>,
    selectedCategory: string
  ): AlternativeCategory[] {
    const alternatives: AlternativeCategory[] = [];
    
    for (const prediction of predictions) {
      if (prediction.category && prediction.category !== selectedCategory) {
        alternatives.push({
          category: prediction.category,
          confidence: prediction.confidence * prediction.weight,
          subcategory: prediction.subcategory,
        });
      }
    }

    return alternatives
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Top 3 alternativas
  }

  // =====================================================
  // APRENDIZADO E MELHORIA
  // =====================================================

  learnFromUserFeedback(
    transactionId: string,
    predictedCategory: string,
    actualCategory: string,
    features: TransactionFeatures
  ): void {
    const wasCorrect = predictedCategory === actualCategory;
    
    // Registrar dados de aprendizado
    const learningData: LearningData = {
      transactionId,
      features,
      actualCategory,
      predictedCategory,
      confidence: 0, // Será preenchido pela predição original
      wasCorrect,
      userCorrected: !wasCorrect,
      timestamp: new Date(),
    };
    
    this.learningData.push(learningData);
    
    // Atualizar padrões do usuário
    this.updateUserPattern(features.userPattern?.userId || '', features, actualCategory);
    
    // Ajustar regras se necessário
    if (!wasCorrect) {
      this.adjustRulesBasedOnFeedback(features, actualCategory);
    }
  }

  private updateUserPattern(userId: string, features: TransactionFeatures, category: string): void {
    let pattern = this.userPatterns.get(userId);
    
    if (!pattern) {
      pattern = {
        userId,
        merchantCategories: {},
        descriptionPatterns: [],
        amountRanges: [],
        timePatterns: [],
        locationPatterns: [],
        lastUpdated: new Date(),
      };
    }

    // Atualizar merchant
    if (features.merchant) {
      pattern.merchantCategories[features.merchant] = category;
    }

    // Atualizar padrões de descrição
    const existingPattern = pattern.descriptionPatterns.find(p => 
      features.description.includes(p.pattern.toLowerCase())
    );
    
    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.confidence = Math.min(1, existingPattern.confidence + 0.1);
    } else {
      // Extrair palavras-chave da descrição
      const keywords = this.extractKeywords(features.description);
      for (const keyword of keywords) {
        pattern.descriptionPatterns.push({
          pattern: keyword,
          category,
          confidence: 0.7,
          frequency: 1,
        });
      }
    }

    // Atualizar faixas de valor
    const existingRange = pattern.amountRanges.find(r => 
      features.amount >= r.minAmount && features.amount <= r.maxAmount
    );
    
    if (existingRange && existingRange.category === category) {
      existingRange.frequency++;
    } else {
      pattern.amountRanges.push({
        minAmount: features.amount * 0.8,
        maxAmount: features.amount * 1.2,
        category,
        frequency: 1,
      });
    }

    pattern.lastUpdated = new Date();
    this.userPatterns.set(userId, pattern);
  }

  private extractKeywords(description: string): string[] {
    // Palavras comuns a ignorar
    const stopWords = new Set([
      'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos',
      'para', 'por', 'com', 'sem', 'sob', 'sobre', 'entre', 'ate',
      'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
      'e', 'ou', 'mas', 'porem', 'contudo', 'todavia',
      'que', 'qual', 'quais', 'quando', 'onde', 'como', 'porque',
    ]);

    return description
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 3); // Top 3 palavras-chave
  }

  private adjustRulesBasedOnFeedback(features: TransactionFeatures, correctCategory: string): void {
    // Implementar ajuste automático de regras baseado no feedback
    // Por exemplo, reduzir confiança de regras que erraram
    // ou criar novas regras baseadas em padrões identificados
  }

  private getUserPattern(userId: string): UserCategoryPattern | undefined {
    return this.userPatterns.get(userId);
  }

  // =====================================================
  // MÉTRICAS E ANÁLISES
  // =====================================================

  getCategoryMetrics(): CategoryMetrics {
    const totalPredictions = this.learningData.length;
    const correctPredictions = this.learningData.filter(d => d.wasCorrect).length;
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;

    // Distribuição de confiança
    const confidenceDistribution: Record<string, number> = {
      'baixa (0-0.5)': 0,
      'média (0.5-0.8)': 0,
      'alta (0.8-1.0)': 0,
    };

    this.learningData.forEach(d => {
      if (d.confidence < 0.5) confidenceDistribution['baixa (0-0.5)']++;
      else if (d.confidence < 0.8) confidenceDistribution['média (0.5-0.8)']++;
      else confidenceDistribution['alta (0.8-1.0)']++;
    });

    // Precisão por categoria
    const categoryAccuracy: Record<string, number> = {};
    const categoryStats: Record<string, { correct: number; total: number }> = {};

    this.learningData.forEach(d => {
      if (!categoryStats[d.actualCategory]) {
        categoryStats[d.actualCategory] = { correct: 0, total: 0 };
      }
      categoryStats[d.actualCategory].total++;
      if (d.wasCorrect) {
        categoryStats[d.actualCategory].correct++;
      }
    });

    Object.entries(categoryStats).forEach(([category, stats]) => {
      categoryAccuracy[category] = stats.total > 0 ? stats.correct / stats.total : 0;
    });

    return {
      totalPredictions,
      correctPredictions,
      accuracy,
      confidenceDistribution,
      categoryAccuracy,
      improvementTrends: [], // Implementar análise de tendências
      userFeedbackStats: {
        totalFeedback: this.learningData.filter(d => d.userCorrected).length,
        acceptedPredictions: correctPredictions,
        rejectedPredictions: totalPredictions - correctPredictions,
        mostCorrectedCategories: [], // Implementar análise
      },
    };
  }

  // =====================================================
  // CONFIGURAÇÃO E MANUTENÇÃO
  // =====================================================

  addCategoryRule(rule: Omit<CategoryRule, 'id' | 'createdAt' | 'updatedAt'>): string {
    const newRule: CategoryRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.categoryRules.push(newRule);
    return newRule.id;
  }

  updateCategoryRule(ruleId: string, updates: Partial<CategoryRule>): boolean {
    const ruleIndex = this.categoryRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) return false;

    this.categoryRules[ruleIndex] = {
      ...this.categoryRules[ruleIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return true;
  }

  getCategoryRules(): CategoryRule[] {
    return [...this.categoryRules];
  }

  addMerchantMapping(merchant: string, category: string): void {
    this.merchantDatabase.set(merchant.toUpperCase(), category);
  }

  getMerchantMappings(): Record<string, string> {
    return Object.fromEntries(this.merchantDatabase.entries());
  }
}

// =====================================================
// FACTORY E UTILITÁRIOS
// =====================================================

export class CategorizationFactory {
  static createCategorizationEngine(): IntelligentCategorization {
    return new IntelligentCategorization();
  }

  static createCustomRule(
    name: string,
    conditions: CategoryCondition[],
    targetCategory: string,
    priority: number = 50
  ): Omit<CategoryRule, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name,
      description: `Regra personalizada: ${name}`,
      priority,
      conditions,
      targetCategory,
      isActive: true,
      confidence: 0.8,
    };
  }

  static getBrazilianCategories(): typeof BRAZILIAN_CATEGORIES {
    return BRAZILIAN_CATEGORIES;
  }
}
/**
 * Sistema de Categorização Automática de Transações
 * Usa regras e padrões para sugerir categorias
 */

interface CategorizationRule {
  pattern: RegExp
  category: string
  confidence: number
}

// Regras de categorização baseadas em padrões comuns
const categorizationRules: CategorizationRule[] = [
  // Transporte
  { pattern: /uber|99|taxi|cabify/i, category: 'transporte', confidence: 0.95 },
  { pattern: /posto|gasolina|combustivel|shell|ipiranga/i, category: 'transporte', confidence: 0.9 },
  { pattern: /estacionamento|parking/i, category: 'transporte', confidence: 0.85 },
  
  // Alimentação
  { pattern: /ifood|rappi|uber\s*eats|restaurante|lanchonete/i, category: 'alimentacao', confidence: 0.95 },
  { pattern: /mercado|supermercado|padaria|acougue/i, category: 'alimentacao', confidence: 0.9 },
  { pattern: /bar|pub|cafe|cafeteria/i, category: 'alimentacao', confidence: 0.85 },
  
  // Assinaturas
  { pattern: /netflix|spotify|amazon\s*prime|disney\s*plus/i, category: 'assinaturas', confidence: 0.95 },
  { pattern: /youtube\s*premium|apple\s*music|deezer/i, category: 'assinaturas', confidence: 0.95 },
  { pattern: /assinatura|subscription/i, category: 'assinaturas', confidence: 0.8 },
  
  // Saúde
  { pattern: /farmacia|drogaria|drogasil|pacheco/i, category: 'saude', confidence: 0.95 },
  { pattern: /hospital|clinica|medico|consulta/i, category: 'saude', confidence: 0.9 },
  { pattern: /laboratorio|exame/i, category: 'saude', confidence: 0.85 },
  
  // Educação
  { pattern: /escola|faculdade|universidade|curso/i, category: 'educacao', confidence: 0.9 },
  { pattern: /livro|livraria|apostila/i, category: 'educacao', confidence: 0.8 },
  
  // Moradia
  { pattern: /aluguel|condominio|iptu/i, category: 'moradia', confidence: 0.95 },
  { pattern: /luz|energia|eletrica|cemig|enel/i, category: 'moradia', confidence: 0.9 },
  { pattern: /agua|saneamento|sabesp/i, category: 'moradia', confidence: 0.9 },
  { pattern: /internet|telefone|vivo|claro|tim|oi/i, category: 'moradia', confidence: 0.85 },
  
  // Lazer
  { pattern: /cinema|teatro|show|ingresso/i, category: 'lazer', confidence: 0.9 },
  { pattern: /viagem|hotel|passagem|airbnb/i, category: 'lazer', confidence: 0.85 },
  { pattern: /academia|gym|fitness/i, category: 'lazer', confidence: 0.8 },
  
  // Vestuário
  { pattern: /roupa|vestuario|calcado|sapato/i, category: 'vestuario', confidence: 0.85 },
  { pattern: /loja|magazine|renner|c&a|zara/i, category: 'vestuario', confidence: 0.7 },
  
  // Salário (Receita)
  { pattern: /salario|pagamento|remuneracao/i, category: 'salario', confidence: 0.95 },
  { pattern: /freelance|freela|bico/i, category: 'freelance', confidence: 0.85 },
]

export interface CategorizationSuggestion {
  category: string
  confidence: number
  reason: string
}

/**
 * Sugere categoria baseada na descrição
 */
export function suggestCategory(description: string): CategorizationSuggestion | null {
  if (!description || description.length < 3) {
    return null
  }

  // Procurar por padrões
  for (const rule of categorizationRules) {
    if (rule.pattern.test(description)) {
      return {
        category: rule.category,
        confidence: rule.confidence,
        reason: `Padrão detectado: "${description.match(rule.pattern)?.[0]}"`,
      }
    }
  }

  return null
}

/**
 * Sugere múltiplas categorias com scores
 */
export function suggestMultipleCategories(
  description: string,
  limit: number = 3
): CategorizationSuggestion[] {
  const suggestions: CategorizationSuggestion[] = []

  for (const rule of categorizationRules) {
    if (rule.pattern.test(description)) {
      suggestions.push({
        category: rule.category,
        confidence: rule.confidence,
        reason: `Padrão: "${description.match(rule.pattern)?.[0]}"`,
      })
    }
  }

  // Ordenar por confiança e retornar top N
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit)
}

/**
 * Aprende com categorizações do usuário
 */
export class CategorizationLearner {
  private userPatterns: Map<string, string> = new Map()

  /**
   * Registra uma categorização feita pelo usuário
   */
  learn(description: string, category: string) {
    const normalized = description.toLowerCase().trim()
    this.userPatterns.set(normalized, category)
  }

  /**
   * Sugere categoria baseada em aprendizado
   */
  suggest(description: string): CategorizationSuggestion | null {
    const normalized = description.toLowerCase().trim()
    
    // Busca exata
    if (this.userPatterns.has(normalized)) {
      return {
        category: this.userPatterns.get(normalized)!,
        confidence: 1.0,
        reason: 'Aprendizado anterior (exato)',
      }
    }

    // Busca por similaridade
    for (const [pattern, category] of this.userPatterns.entries()) {
      if (normalized.includes(pattern) || pattern.includes(normalized)) {
        return {
          category,
          confidence: 0.8,
          reason: `Aprendizado anterior (similar: "${pattern}")`,
        }
      }
    }

    return null
  }

  /**
   * Exporta padrões aprendidos
   */
  export(): Record<string, string> {
    return Object.fromEntries(this.userPatterns)
  }

  /**
   * Importa padrões aprendidos
   */
  import(patterns: Record<string, string>) {
    this.userPatterns = new Map(Object.entries(patterns))
  }
}

// Instância global do learner
export const categorizationLearner = new CategorizationLearner()

/**
 * Sugere categoria combinando regras e aprendizado
 */
export function smartSuggestCategory(description: string): CategorizationSuggestion | null {
  // Primeiro tenta aprendizado do usuário
  const learned = categorizationLearner.suggest(description)
  if (learned && learned.confidence > 0.9) {
    return learned
  }

  // Depois tenta regras padrão
  const rule = suggestCategory(description)
  if (rule && rule.confidence > 0.85) {
    return rule
  }

  // Retorna o melhor dos dois
  if (learned && rule) {
    return learned.confidence > rule.confidence ? learned : rule
  }

  return learned || rule
}

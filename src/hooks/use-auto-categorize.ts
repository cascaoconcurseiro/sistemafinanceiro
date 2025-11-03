/**
 * Hook para categorização automática baseada na descrição
 */

import { useEffect, useState } from 'react';

interface CategoryRule {
  keywords: string[];
  category: string;
  confidence: number;
}

const CATEGORY_RULES: CategoryRule[] = [
  // Alimentação
  {
    keywords: ['supermercado', 'mercado', 'padaria', 'açougue', 'feira', 'hortifruti'],
    category: 'Supermercado',
    confidence: 0.9,
  },
  {
    keywords: ['restaurante', 'lanchonete', 'pizzaria', 'hamburgueria', 'bar', 'café', 'cafeteria'],
    category: 'Restaurante',
    confidence: 0.9,
  },
  {
    keywords: ['almoço', 'jantar', 'lanche', 'café da manhã', 'comida'],
    category: 'Alimentação',
    confidence: 0.8,
  },
  
  // Transporte
  {
    keywords: ['uber', 'taxi', '99', 'cabify', 'transporte'],
    category: 'Uber/Taxi',
    confidence: 0.95,
  },
  {
    keywords: ['gasolina', 'combustível', 'posto', 'etanol', 'diesel'],
    category: 'Combustível',
    confidence: 0.9,
  },
  {
    keywords: ['ônibus', 'metrô', 'trem', 'bilhete único', 'vale transporte'],
    category: 'Transporte Público',
    confidence: 0.9,
  },
  {
    keywords: ['estacionamento', 'parking', 'vaga'],
    category: 'Transporte',
    confidence: 0.8,
  },
  
  // Moradia
  {
    keywords: ['aluguel', 'rent'],
    category: 'Aluguel',
    confidence: 0.95,
  },
  {
    keywords: ['condomínio', 'condominio'],
    category: 'Condomínio',
    confidence: 0.95,
  },
  {
    keywords: ['luz', 'energia', 'eletricidade', 'cemig', 'copel', 'light'],
    category: 'Energia Elétrica',
    confidence: 0.9,
  },
  {
    keywords: ['água', 'saneamento', 'sabesp', 'cedae'],
    category: 'Água',
    confidence: 0.9,
  },
  {
    keywords: ['internet', 'wifi', 'banda larga', 'fibra'],
    category: 'Internet',
    confidence: 0.9,
  },
  
  // Saúde
  {
    keywords: ['farmácia', 'drogaria', 'remédio', 'medicamento'],
    category: 'Farmácia',
    confidence: 0.9,
  },
  {
    keywords: ['médico', 'consulta', 'hospital', 'clínica'],
    category: 'Médico',
    confidence: 0.9,
  },
  {
    keywords: ['plano de saúde', 'convênio', 'unimed', 'amil'],
    category: 'Plano de Saúde',
    confidence: 0.95,
  },
  
  // Educação
  {
    keywords: ['escola', 'colégio', 'faculdade', 'universidade', 'curso'],
    category: 'Curso',
    confidence: 0.9,
  },
  {
    keywords: ['livro', 'livraria'],
    category: 'Livros',
    confidence: 0.9,
  },
  
  // Lazer
  {
    keywords: ['cinema', 'filme', 'ingresso'],
    category: 'Cinema',
    confidence: 0.95,
  },
  {
    keywords: ['netflix', 'spotify', 'amazon prime', 'disney', 'streaming'],
    category: 'Streaming',
    confidence: 0.95,
  },
  {
    keywords: ['viagem', 'hotel', 'pousada', 'hospedagem', 'passagem', 'avião'],
    category: 'Viagem',
    confidence: 0.9,
  },
  {
    keywords: ['academia', 'gym', 'fitness', 'esporte'],
    category: 'Esportes',
    confidence: 0.9,
  },
  
  // Compras
  {
    keywords: ['amazon', 'mercado livre', 'shopee', 'aliexpress', 'magazine luiza', 'casas bahia'],
    category: 'Compras Online',
    confidence: 0.9,
  },
  {
    keywords: ['roupa', 'vestuário', 'calça', 'camisa', 'sapato'],
    category: 'Vestuário',
    confidence: 0.8,
  },
];

export function useAutoCategorizecription: string) {
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  useEffect(() => {
    if (!description || description.length < 3) {
      setSuggestedCategory(null);
      setConfidence(0);
      return;
    }

    const descLower = description.toLowerCase();
    let bestMatch: CategoryRule | null = null;
    let bestScore = 0;

    // Procurar melhor match
    for (const rule of CATEGORY_RULES) {
      for (const keyword of rule.keywords) {
        if (descLower.includes(keyword)) {
          const score = rule.confidence * (keyword.length / descLower.length);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = rule;
          }
        }
      }
    }

    if (bestMatch && bestScore > 0.3) {
      setSuggestedCategory(bestMatch.category);
      setConfidence(bestMatch.confidence);
    } else {
      setSuggestedCategory(null);
      setConfidence(0);
    }
  }, [description]);

  return {
    suggestedCategory,
    confidence,
    hassuggestion: !!suggestedCategory,
  };
}

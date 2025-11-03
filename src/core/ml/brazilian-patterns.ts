/**
 * PADRÕES BRASILEIROS PARA CATEGORIZAÇÃO AUTOMÁTICA
 * Palavras-chave e variações que brasileiros usam
 */

export const BRAZILIAN_PATTERNS = {
  // SUPERMERCADO - Todas as variações + erros comuns
  SUPERMERCADO: [
    'mercado', 'supermercado', 'hipermercado', 'minimercado',
    'mecado', 'supermecado', 'mercadao', 'mercadão', // erros comuns
    'extra', 'carrefour', 'carrefur', 'carefour', // erros de digitação
    'pao de acucar', 'pão de açúcar', 'pao de acucar',
    'big', 'walmart', 'atacadao', 'atacadão', 'assai', 'assaí',
    'makro', 'sam', 'sams', 'tenda', 'dia', 'epa',
    'compras', 'compra', 'feira', 'hortifruti', 'sacolao', 'sacolão',
    'quitanda', 'verdureiro', 'açougue', 'acougue', 'acougue',
    'padaria', 'padria', 'panificadora', 'confeitaria' // erros comuns
  ],

  // RESTAURANTE/ALIMENTAÇÃO + erros comuns
  RESTAURANTE: [
    'restaurante', 'resturante', 'restarante', 'restaurate', // erros comuns
    'lanchonete', 'lanchonte', 'lanches', 'lanche', 'lanxe',
    'pizzaria', 'pizaria', 'pizza', 'piza',
    'hamburgueria', 'hamburgeria', 'burguer', 'burger', 'hamburguer',
    'churrascaria', 'churascaria', 'churrasco', 'churasco',
    'rodizio', 'rodízio', 'rodisio',
    'comida', 'cumida', 'almoço', 'almoco', 'almoço', 'almoso',
    'jantar', 'janta', 'jatar',
    'refeicao', 'refeição', 'refeiçao', 'prato', 'marmita', 'marmitex',
    'self service', 'self-service', 'selfservice', 'buffet', 'bufê', 'bufet',
    'pastel', 'pastelaria', 'coxinha', 'salgado', 'salgados',
    'ifood', 'ifud', 'rappi', 'rapi', 'uber eats', 'ubereats', 'delivery', 'deliveri'
  ],

  // TRANSPORTE
  TRANSPORTE: [
    'uber', '99', 'taxi', 'táxi', 'corrida', 'viagem',
    'onibus', 'ônibus', 'metro', 'metrô', 'trem',
    'bilhete', 'passagem', 'recarga', 'cartao transporte',
    'estacionamento', 'parking', 'vaga', 'zona azul',
    'pedagio', 'pedágio', 'sem parar'
  ],

  // COMBUSTÍVEL
  COMBUSTIVEL: [
    'posto', 'gasolina', 'etanol', 'alcool', 'álcool',
    'diesel', 'combustivel', 'combustível', 'abastecimento',
    'shell', 'ipiranga', 'petrobras', 'br', 'ale',
    'raizen', 'raízen', 'texaco'
  ],

  // FARMÁCIA/SAÚDE
  FARMACIA: [
    'farmacia', 'farmácia', 'drogaria', 'remedio', 'remédio',
    'medicamento', 'droga raia', 'drogasil', 'pacheco',
    'sao paulo', 'são paulo', 'pague menos', 'ultrafarma',
    'onofre', 'drogao', 'drogão', 'nissei'
  ],

  // SAÚDE
  SAUDE: [
    'medico', 'médico', 'consulta', 'clinica', 'clínica',
    'hospital', 'pronto socorro', 'ps', 'upa',
    'dentista', 'odonto', 'ortodontia', 'aparelho',
    'exame', 'laboratorio', 'laboratório', 'raio x',
    'ultrassom', 'tomografia', 'ressonancia', 'ressonância',
    'plano de saude', 'plano de saúde', 'convenio', 'convênio',
    'unimed', 'amil', 'sulamerica', 'sul américa', 'bradesco saude'
  ],

  // EDUCAÇÃO
  EDUCACAO: [
    'escola', 'colegio', 'colégio', 'faculdade', 'universidade',
    'curso', 'aula', 'mensalidade', 'matricula', 'matrícula',
    'material escolar', 'livro', 'apostila', 'caderno',
    'uniforme', 'mochila', 'estojo'
  ],

  // LAZER/ENTRETENIMENTO
  LAZER: [
    'cinema', 'filme', 'ingresso', 'teatro', 'show',
    'netflix', 'spotify', 'amazon prime', 'disney', 'globoplay',
    'hbo', 'paramount', 'apple tv', 'youtube premium',
    'academia', 'gym', 'smart fit', 'bio ritmo', 'bodytech',
    'natacao', 'natação', 'pilates', 'yoga', 'crossfit',
    'futebol', 'pelada', 'quadra', 'jogo', 'partida'
  ],

  // MORADIA
  MORADIA: [
    'aluguel', 'condominio', 'condomínio', 'iptu',
    'luz', 'energia', 'eletrica', 'elétrica', 'cemig', 'copel', 'light',
    'agua', 'água', 'saneamento', 'sabesp', 'cedae',
    'gas', 'gás', 'botijao', 'botijão', 'ultragaz', 'liquigas',
    'internet', 'wifi', 'banda larga', 'fibra',
    'vivo', 'claro', 'tim', 'oi', 'net', 'sky'
  ],

  // COMPRAS/VAREJO
  COMPRAS: [
    'loja', 'magazine', 'shopping', 'americanas', 'submarino',
    'mercado livre', 'shopee', 'aliexpress', 'shein',
    'renner', 'c&a', 'riachuelo', 'marisa', 'pernambucanas',
    'casas bahia', 'magazine luiza', 'magalu', 'ponto frio',
    'roupa', 'calcado', 'calçado', 'tenis', 'tênis', 'sapato',
    'bolsa', 'mochila', 'acessorio', 'acessório'
  ],

  // BELEZA/CUIDADOS
  BELEZA: [
    'salao', 'salão', 'cabeleireiro', 'barbeiro', 'barber',
    'manicure', 'pedicure', 'unha', 'esmalte',
    'estetica', 'estética', 'spa', 'massagem',
    'perfumaria', 'perfume', 'maquiagem', 'cosmetico', 'cosmético',
    'boticario', 'boticário', 'natura', 'avon', 'sephora'
  ],

  // PETS
  PETS: [
    'pet', 'petshop', 'veterinario', 'veterinário', 'vet',
    'racao', 'ração', 'cachorro', 'gato', 'animal',
    'banho', 'tosa', 'vacina', 'vermifugo', 'vermífugo'
  ],

  // SERVIÇOS
  SERVICOS: [
    'lavanderia', 'lavagem', 'lava rapido', 'lava rápido',
    'costureira', 'conserto', 'reparo', 'manutencao', 'manutenção',
    'encanador', 'eletricista', 'pintor', 'pedreiro',
    'diarista', 'faxina', 'limpeza'
  ],

  // ELETRÔNICOS
  ELETRONICOS: [
    'celular', 'smartphone', 'iphone', 'samsung', 'xiaomi',
    'notebook', 'computador', 'pc', 'tablet', 'ipad',
    'tv', 'televisao', 'televisão', 'monitor',
    'fone', 'headphone', 'airpods', 'jbl',
    'carregador', 'cabo', 'bateria', 'pelicula', 'película',
    'capinha', 'case', 'suporte'
  ],

  // CASA/DECORAÇÃO
  CASA: [
    'moveis', 'móveis', 'sofa', 'sofá', 'cama', 'mesa',
    'cadeira', 'armario', 'armário', 'guarda roupa',
    'decoracao', 'decoração', 'quadro', 'cortina',
    'tapete', 'almofada', 'lencol', 'lençol', 'toalha',
    'panela', 'prato', 'copo', 'talher', 'utensilio', 'utensílio'
  ],

  // BEBIDAS/BAR
  BAR: [
    'bar', 'boteco', 'cerveja', 'chopp', 'chope',
    'drink', 'caipirinha', 'vodka', 'whisky',
    'balada', 'festa', 'night', 'pub'
  ],

  // VIAGEM
  VIAGEM: [
    'hotel', 'pousada', 'hostel', 'airbnb', 'booking',
    'passagem', 'aviao', 'avião', 'voo', 'gol', 'latam', 'azul',
    'rodoviaria', 'rodoviária', 'onibus', 'ônibus',
    'turismo', 'passeio', 'excursao', 'excursão', 'tour'
  ]
};

/**
 * Normaliza texto para comparação
 * Remove acentos, converte para minúsculas
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Remove espaços extras
    .trim();
}

/**
 * Calcula distância de Levenshtein entre duas strings
 * Usado para detectar erros de digitação
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Inicializar matriz
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Preencher matriz
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Deleção
        matrix[i][j - 1] + 1,      // Inserção
        matrix[i - 1][j - 1] + cost // Substituição
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcula similaridade entre duas strings (0 a 1)
 * 1 = idênticas, 0 = completamente diferentes
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Verifica se o texto contém algum dos padrões
 * ✅ AGORA COM CORREÇÃO DE ERROS DE DIGITAÇÃO!
 */
export function matchesPattern(text: string, patterns: string[]): boolean {
  const normalized = normalizeText(text);
  const words = normalized.split(' ');

  return patterns.some(pattern => {
    const normalizedPattern = normalizeText(pattern);
    
    // 1. Verificar match exato
    if (normalized.includes(normalizedPattern)) {
      return true;
    }

    // 2. Verificar match com erro de digitação (fuzzy matching)
    // Para cada palavra do texto
    for (const word of words) {
      // Ignorar palavras muito curtas
      if (word.length < 3) continue;

      // Calcular similaridade com o padrão
      const similarity = calculateSimilarity(word, normalizedPattern);

      // Se similaridade > 80%, considerar match
      // Exemplos: "mecado" vs "mercado" = 85%
      //          "resturante" vs "restaurante" = 81%
      //          "uber" vs "uber" = 100%
      if (similarity >= 0.80) {
        return true;
      }

      // Para padrões mais longos, verificar se palavra está contida
      if (normalizedPattern.length > 5) {
        const patternWords = normalizedPattern.split(' ');
        for (const patternWord of patternWords) {
          if (patternWord.length >= 4) {
            const wordSimilarity = calculateSimilarity(word, patternWord);
            if (wordSimilarity >= 0.80) {
              return true;
            }
          }
        }
      }
    }

    return false;
  });
}

/**
 * Encontra a melhor categoria baseada em padrões brasileiros
 */
export function findBestCategoryByPattern(description: string): {
  category: string;
  confidence: number;
  reason: string;
} | null {
  const normalized = normalizeText(description);

  // Verificar cada categoria
  if (matchesPattern(description, BRAZILIAN_PATTERNS.SUPERMERCADO)) {
    return {
      category: 'Supermercado',
      confidence: 0.9,
      reason: 'Palavra-chave de supermercado identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.RESTAURANTE)) {
    return {
      category: 'Restaurante',
      confidence: 0.85,
      reason: 'Palavra-chave de restaurante/alimentação identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.TRANSPORTE)) {
    return {
      category: 'Transporte - Uber/Taxi',
      confidence: 0.9,
      reason: 'Palavra-chave de transporte identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.COMBUSTIVEL)) {
    return {
      category: 'Combustível',
      confidence: 0.95,
      reason: 'Palavra-chave de combustível identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.FARMACIA)) {
    return {
      category: 'Farmácia',
      confidence: 0.92,
      reason: 'Palavra-chave de farmácia identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.SAUDE)) {
    return {
      category: 'Saúde',
      confidence: 0.88,
      reason: 'Palavra-chave de saúde identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.EDUCACAO)) {
    return {
      category: 'Educação',
      confidence: 0.87,
      reason: 'Palavra-chave de educação identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.LAZER)) {
    return {
      category: 'Lazer',
      confidence: 0.85,
      reason: 'Palavra-chave de lazer/entretenimento identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.MORADIA)) {
    return {
      category: 'Moradia',
      confidence: 0.9,
      reason: 'Palavra-chave de moradia identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.COMPRAS)) {
    return {
      category: 'Compras',
      confidence: 0.8,
      reason: 'Palavra-chave de compras identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.BELEZA)) {
    return {
      category: 'Beleza e Cuidados',
      confidence: 0.85,
      reason: 'Palavra-chave de beleza identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.PETS)) {
    return {
      category: 'Pets',
      confidence: 0.9,
      reason: 'Palavra-chave de pets identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.SERVICOS)) {
    return {
      category: 'Serviços',
      confidence: 0.82,
      reason: 'Palavra-chave de serviços identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.ELETRONICOS)) {
    return {
      category: 'Eletrônicos',
      confidence: 0.85,
      reason: 'Palavra-chave de eletrônicos identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.CASA)) {
    return {
      category: 'Casa e Decoração',
      confidence: 0.83,
      reason: 'Palavra-chave de casa/decoração identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.BAR)) {
    return {
      category: 'Lazer - Bar',
      confidence: 0.88,
      reason: 'Palavra-chave de bar/bebidas identificada'
    };
  }

  if (matchesPattern(description, BRAZILIAN_PATTERNS.VIAGEM)) {
    return {
      category: 'Viagem',
      confidence: 0.9,
      reason: 'Palavra-chave de viagem identificada'
    };
  }

  return null;
}

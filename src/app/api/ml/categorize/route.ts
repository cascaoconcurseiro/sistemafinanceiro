import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

// Regras de categorização inteligente - MAPEADAS PARA AS CATEGORIAS REAIS DO BANCO
const categorizationRules = {
  // ALIMENTAÇÃO
  'Alimentação': [
    'restaurante', 'lanchonete', 'bar', 'boteco', 'churrascaria', 'buffet', 'comida',
    'almoço', 'almoco', 'jantar', 'café da manhã', 'cafe da manha', 'refeição', 'refeicao',
    'sushi', 'japonês', 'japones', 'italiano', 'churrasco', 'fast food', 'hamburguer',
    'pizza', 'lanche', 'café', 'cafe', 'pastel', 'coxinha', 'açaí', 'acai'
  ],
  'Supermercado': [
    'supermercado', 'mercado', 'hortifruti', 'quitanda', 'feira', 'açougue', 'acougue',
    'compras', 'carrefour', 'extra', 'pão de açúcar', 'pao de acucar', 'walmart'
  ],
  'Delivery': [
    'ifood', 'rappi', 'uber eats', 'delivery', 'entrega', 'pedido'
  ],
  'Padaria': [
    'padaria', 'pão', 'pao', 'bolo', 'confeitaria', 'doce', 'salgado'
  ],

  // TRANSPORTE
  'Transporte': [
    'ônibus', 'onibus', 'metrô', 'metro', 'trem', 'brt', 'van', 'transporte público',
    'transporte publico', 'bilhete único', 'bilhete unico', 'passagem'
  ],
  'Combustível': [
    'gasolina', 'combustível', 'combustivel', 'posto', 'etanol', 'diesel', 'gnv',
    'shell', 'ipiranga', 'petrobras', 'br', 'abastecimento'
  ],
  'Uber/Taxi': [
    'uber', 'taxi', '99', 'cabify', 'corrida', 'app transporte'
  ],
  'Estacionamento': [
    'estacionamento', 'parking', 'vaga', 'zona azul', 'pedágio', 'pedagio'
  ],
  'Manutenção Veículo': [
    'mecânico', 'mecanico', 'oficina', 'revisão', 'revisao', 'manutenção', 'manutencao',
    'pneu', 'óleo', 'oleo', 'troca de óleo', 'troca de oleo', 'alinhamento',
    'balanceamento', 'freio', 'bateria', 'farol', 'retrovisor', 'para-brisa', 'parabrisa',
    'lavagem', 'lava-jato', 'lava jato', 'carro', 'moto', 'veículo', 'veiculo'
  ],

  // MORADIA
  'Aluguel': [
    'aluguel', 'locação', 'locacao', 'rent', 'imobiliária', 'imobiliaria'
  ],
  'Condomínio': [
    'condomínio', 'condominio', 'taxa condominial', 'síndico', 'sindico'
  ],
  'Energia': [
    'luz', 'energia', 'eletricidade', 'enel', 'cemig', 'copel', 'celpe', 'conta de luz'
  ],
  'Água': [
    'água', 'agua', 'saneamento', 'sabesp', 'cedae', 'conta de água', 'conta de agua'
  ],
  'Internet/TV': [
    'internet', 'wifi', 'banda larga', 'fibra', 'tv', 'televisão', 'televisao',
    'cabo', 'sky', 'claro', 'vivo', 'oi', 'tim', 'net', 'telefone fixo'
  ],

  // SAÚDE
  'Saúde': [
    'médico', 'medico', 'hospital', 'clínica', 'clinica', 'consulta', 'exame',
    'laboratório', 'laboratorio', 'raio-x', 'raio x', 'ultrassom', 'tomografia',
    'ressonância', 'ressonancia', 'cirurgia', 'internação', 'internacao'
  ],
  'Farmácia': [
    'farmácia', 'farmacia', 'remédio', 'remedio', 'medicamento', 'droga raia',
    'drogasil', 'pague menos', 'panvel', 'ultrafarma', 'medicação', 'medicacao'
  ],
  'Plano de Saúde': [
    'plano de saúde', 'plano de saude', 'convênio', 'convenio', 'unimed', 'amil',
    'sulamerica', 'bradesco saúde', 'bradesco saude', 'hapvida', 'notredame'
  ],
  'Academia': [
    'academia', 'gym', 'fitness', 'musculação', 'musculacao', 'personal', 'treino',
    'smartfit', 'bodytech', 'bluefit', 'crossfit', 'pilates', 'yoga'
  ],

  // EDUCAÇÃO
  'Educação': [
    'escola', 'faculdade', 'universidade', 'curso', 'aula', 'mensalidade',
    'matrícula', 'matricula', 'colégio', 'colegio', 'ensino', 'educação', 'educacao'
  ],
  'Material Escolar': [
    'material escolar', 'livro', 'apostila', 'caderno', 'caneta', 'lápis', 'lapis',
    'mochila', 'estojo', 'régua', 'regua', 'borracha', 'apontador', 'uniforme'
  ],
  'Cursos Online': [
    'curso online', 'udemy', 'coursera', 'alura', 'rocketseat', 'dio', 'treinamento',
    'workshop', 'seminário', 'seminario', 'webinar', 'ead', 'ensino a distância'
  ],

  // LAZER
  'Lazer': [
    'lazer', 'diversão', 'diversao', 'entretenimento', 'passeio', 'parque',
    'zoológico', 'zoologico', 'museu', 'exposição', 'exposicao', 'evento', 'festa'
  ],
  'Cinema/Teatro': [
    'cinema', 'filme', 'ingresso', 'teatro', 'peça', 'peca', 'show', 'concerto',
    'espetáculo', 'espetaculo', 'cinemark', 'kinoplex', 'uci'
  ],
  'Streaming': [
    'streaming', 'netflix', 'spotify', 'amazon prime', 'disney', 'disney+', 'hbo',
    'hbo max', 'paramount', 'apple tv', 'youtube premium', 'deezer', 'globoplay'
  ],
  'Viagens': [
    'viagem', 'hotel', 'pousada', 'airbnb', 'hospedagem', 'passagem', 'voo',
    'avião', 'aviao', 'turismo', 'férias', 'ferias', 'resort', 'cruzeiro'
  ],
  'Hobbies': [
    'hobby', 'passatempo', 'coleção', 'colecao', 'artesanato', 'pintura',
    'fotografia', 'música', 'musica', 'instrumento', 'jogo', 'game', 'console'
  ],

  // VESTUÁRIO
  'Roupas': [
    'roupa', 'camisa', 'calça', 'calca', 'bermuda', 'short', 'vestido', 'saia',
    'blusa', 'casaco', 'jaqueta', 'loja', 'shopping', 'renner', 'c&a', 'riachuelo',
    'zara', 'h&m', 'forever 21', 'marisa', 'pernambucanas'
  ],
  'Calçados': [
    'sapato', 'tênis', 'tenis', 'sandália', 'sandalia', 'chinelo', 'bota',
    'sapatênis', 'sapatenis', 'nike', 'adidas', 'puma', 'mizuno', 'olympikus'
  ],
  'Beleza': [
    'cabeleireiro', 'salão', 'salao', 'barbeiro', 'manicure', 'pedicure',
    'depilação', 'depilacao', 'estética', 'estetica', 'spa', 'massagem',
    'maquiagem', 'cosméticos', 'cosmeticos', 'perfume', 'unha', 'cabelo'
  ],

  // OUTROS
  'Telefone': [
    'telefone', 'celular', 'conta de celular', 'recarga', 'crédito', 'credito',
    'tim', 'vivo', 'claro', 'oi', 'algar', 'operadora'
  ],
  'Seguros': [
    'seguro', 'seguradora', 'apólice', 'apolice', 'prêmio', 'premio',
    'seguro de vida', 'seguro residencial', 'seguro auto', 'seguro carro'
  ],
  'Impostos': [
    'imposto', 'taxa', 'ipva', 'iptu', 'ir', 'imposto de renda', 'inss',
    'tributo', 'contribuição', 'contribuicao', 'multa', 'anuidade',
    'cartório', 'cartorio', 'despachante', 'detran', 'cnh'
  ],
  'Pets': [
    'pet', 'cachorro', 'gato', 'ração', 'racao', 'veterinário', 'veterinario',
    'vacina', 'banho', 'tosa', 'petshop', 'animal', 'bicho'
  ],
  'Doações': [
    'doação', 'doacao', 'presente', 'gift', 'caridade', 'ong', 'igreja',
    'dízimo', 'dizimo', 'oferta', 'ajuda', 'solidariedade'
  ],
  'Outros Gastos': [
    'outros', 'diversos', 'variados', 'geral', 'despesa', 'gasto'
  ],

  // RECEITAS
  'Salário': [
    'salário', 'salario', 'ordenado', 'vencimento', 'pagamento', 'holerite',
    'contracheque', 'folha de pagamento'
  ],
  'Freelance': [
    'freelance', 'freela', 'autônomo', 'autonomo', 'bico', 'extra',
    'trabalho extra', 'serviço', 'servico'
  ],
  'Investimentos': [
    'investimento', 'rendimento', 'dividendo', 'juros', 'ação', 'acao',
    'fundo', 'cdb', 'lci', 'lca', 'tesouro', 'poupança', 'poupanca',
    'bitcoin', 'cripto', 'corretora'
  ],
};

// Função para calcular score de similaridade - MELHORADA
function calculateScore(description: string, keywords: string[]): number {
  const descLower = description.toLowerCase().trim();
  let score = 0;
  let matchedKeywords = 0;
  
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    
    if (descLower.includes(keywordLower)) {
      matchedKeywords++;
      
      // Palavra exata = score máximo
      if (descLower === keywordLower) {
        score += 20;
      }
      // Palavra no início = muito relevante
      else if (descLower.startsWith(keywordLower)) {
        score += 15;
      }
      // Palavra no final = relevante
      else if (descLower.endsWith(keywordLower)) {
        score += 12;
      }
      // Palavra isolada (com espaços ao redor) = muito relevante
      else if (descLower.includes(` ${keywordLower} `)) {
        score += 10;
      }
      // Palavra contida = menos relevante
      else {
        score += 5;
      }
      
      // Bônus por tamanho da palavra-chave (palavras maiores são mais específicas)
      if (keywordLower.length > 5) {
        score += 2;
      }
      if (keywordLower.length > 10) {
        score += 3;
      }
    }
  }
  
  // Bônus por múltiplas correspondências
  if (matchedKeywords > 1) {
    score += matchedKeywords * 2;
  }
  
  return score;
}

// Função para categorizar descrição
function categorizeDescription(description: string, transactionType: string): {
  category: string;
  confidence: number;
  reasoning: string[];
  alternatives: Array<{ category: string; confidence: number }>;
} {
  const scores: Record<string, number> = {};
  
  // Calcular scores para cada categoria
  for (const [category, keywords] of Object.entries(categorizationRules)) {
    scores[category] = calculateScore(description, keywords);
  }
  
  // Ordenar por score
  const sortedCategories = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort(([_, a], [__, b]) => b - a);
  
  if (sortedCategories.length === 0) {
    // Sem correspondência - retornar categoria padrão
    return {
      category: 'Outros',
      confidence: 0.3,
      reasoning: ['Nenhuma correspondência encontrada com as categorias conhecidas'],
      alternatives: [],
    };
  }
  
  const [bestCategory, bestScore] = sortedCategories[0];
  const maxScore = 30; // Score máximo possível (ajustado para o novo algoritmo)
  let confidence = Math.min(bestScore / maxScore, 1);
  
  // Ajustar confiança baseado na diferença entre primeira e segunda opção
  if (sortedCategories.length > 1) {
    const [_, secondScore] = sortedCategories[1];
    const scoreDiff = bestScore - secondScore;
    
    // Se a diferença for grande, aumentar confiança
    if (scoreDiff > 10) {
      confidence = Math.min(confidence + 0.1, 1);
    }
    // Se a diferença for pequena, reduzir confiança
    else if (scoreDiff < 3) {
      confidence = Math.max(confidence - 0.1, 0.3);
    }
  }
  
  const alternatives = sortedCategories
    .slice(1, 4)
    .map(([cat, score]) => ({
      category: cat,
      confidence: Math.min(score / maxScore, 1),
    }));
  
  return {
    category: bestCategory,
    confidence,
    reasoning: [
      `Identificado como ${bestCategory} com ${Math.round(confidence * 100)}% de confiança`,
      `Baseado em palavras-chave encontradas na descrição`,
    ],
    alternatives,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { description, amount, transactionType } = await request.json();

    if (!description || description.trim().length < 3) {
      return NextResponse.json(
        { error: 'Descrição muito curta' },
        { status: 400 }
      );
    }

    // Categorizar descrição
    const prediction = categorizeDescription(description, transactionType || 'DESPESA');

    return NextResponse.json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error('❌ Erro ao categorizar:', error);
    return NextResponse.json(
      { error: 'Erro ao categorizar transação' },
      { status: 500 }
    );
  }
}

export interface SmartSuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
}

// Mapeamento inteligente de palavras-chave para categorias
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Transporte
  'Transporte': [
    'uber', 'taxi', 'ônibus', 'onibus', 'metro', 'metrô', 'trem', 'brt',
    'combustível', 'combustivel', 'gasolina', 'etanol', 'diesel', 'alcool', 'álcool',
    'estacionamento', 'pedágio', 'pedagio', 'valet', 'garagem',
    'carro', 'moto', 'bicicleta', 'bike', 'patinete', 'scooter',
    'viagem', 'passagem', 'bilhete', 'ticket', 'transporte', 'mobilidade',
    '99', 'cabify', 'indriver', 'blablacar', 'waze', 'carpool'
  ],
  
  // Alimentação
  'Alimentação': [
    'restaurante', 'lanchonete', 'padaria', 'cafeteria', 'café', 'bar',
    'ifood', 'rappi', 'uber eats', 'delivery', 'entrega',
    'pizza', 'hamburguer', 'hamburger', 'lanche', 'sanduíche', 'sanduiche',
    'almoço', 'almoco', 'jantar', 'café da manhã', 'cafe da manha', 'brunch',
    'comida', 'refeição', 'refeicao', 'prato', 'menu',
    'mcdonald', 'burger king', 'subway', 'bobs', 'giraffas',
    'sushi', 'japonês', 'japones', 'churrasco', 'rodízio', 'rodizio'
  ],
  
  // Mercado
  'Mercado': [
    'mercado', 'supermercado', 'hipermercado', 'atacado', 'atacadão', 'atacadao',
    'compras', 'feira', 'hortifruti', 'açougue', 'acougue', 'padaria',
    'carrefour', 'extra', 'pão de açúcar', 'pao de acucar', 'walmart',
    'assaí', 'assai', 'makro', 'sam\'s', 'sams', 'costco',
    'alimentos', 'mantimentos', 'despensa', 'cesta básica', 'cesta basica'
  ],
  
  // Saúde
  'Saúde': [
    'farmácia', 'farmacia', 'drogaria', 'remédio', 'remedio', 'medicamento',
    'médico', 'medico', 'consulta', 'exame', 'laboratório', 'laboratorio',
    'hospital', 'clínica', 'clinica', 'dentista', 'odontológico', 'odontologico',
    'plano de saúde', 'plano de saude', 'convênio', 'convenio', 'unimed', 'amil',
    'drogasil', 'droga raia', 'pague menos', 'ultrafarma', 'panvel',
    'fisioterapia', 'psicólogo', 'psicologo', 'terapia', 'academia', 'personal'
  ],
  
  // Educação
  'Educação': [
    'escola', 'faculdade', 'universidade', 'curso', 'aula',
    'mensalidade', 'matrícula', 'matricula', 'material escolar', 'livro',
    'apostila', 'caderno', 'caneta', 'lápis', 'lapis', 'mochila',
    'uniforme', 'educação', 'educacao', 'ensino', 'estudo',
    'udemy', 'coursera', 'alura', 'rocketseat', 'dio', 'treinamento'
  ],
  
  // Lazer
  'Lazer': [
    'cinema', 'teatro', 'show', 'concerto', 'festival', 'evento',
    'ingresso', 'ticket', 'entrada', 'bilhete',
    'netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'streaming',
    'jogo', 'game', 'playstation', 'xbox', 'nintendo', 'steam',
    'parque', 'diversão', 'diversao', 'entretenimento', 'hobby',
    'viagem', 'turismo', 'passeio', 'excursão', 'excursao'
  ],
  
  // Casa
  'Casa': [
    'aluguel', 'condomínio', 'condominio', 'iptu', 'água', 'agua', 'luz',
    'energia', 'gás', 'gas', 'internet', 'telefone', 'celular',
    'móveis', 'moveis', 'decoração', 'decoracao', 'reforma', 'manutenção', 'manutencao',
    'limpeza', 'faxina', 'diarista', 'empregada', 'zelador',
    'conserto', 'reparo', 'pintura', 'encanador', 'eletricista'
  ],
  
  // Vestuário
  'Vestuário': [
    'roupa', 'calça', 'calca', 'camisa', 'camiseta', 'blusa', 'vestido',
    'sapato', 'tênis', 'tenis', 'sandália', 'sandalia', 'chinelo', 'bota',
    'loja', 'shopping', 'boutique', 'brechó', 'brecho',
    'zara', 'c&a', 'renner', 'riachuelo', 'marisa', 'pernambucanas',
    'moda', 'fashion', 'look', 'outfit', 'estilo'
  ],
  
  // Beleza
  'Beleza e Cuidados Pessoais': [
    'salão', 'salao', 'cabeleireiro', 'barbeiro', 'manicure', 'pedicure',
    'estética', 'estetica', 'spa', 'massagem', 'depilação', 'depilacao',
    'maquiagem', 'cosméticos', 'cosmeticos', 'perfume', 'shampoo', 'condicionador',
    'sephora', 'boticário', 'boticario', 'natura', 'avon', 'mary kay',
    'cabelo', 'unha', 'pele', 'rosto', 'corpo'
  ],
  
  // Eletrônicos
  'Eletrônicos': [
    'celular', 'smartphone', 'iphone', 'samsung', 'xiaomi', 'motorola',
    'notebook', 'computador', 'pc', 'mac', 'tablet', 'ipad',
    'tv', 'televisão', 'televisao', 'monitor', 'tela',
    'fone', 'headphone', 'airpods', 'jbl', 'sony',
    'magazine luiza', 'casas bahia', 'americanas', 'submarino', 'mercado livre',
    'eletrônico', 'eletronico', 'tecnologia', 'gadget', 'acessório', 'acessorio'
  ],
  
  // Pets
  'Pets': [
    'pet', 'cachorro', 'gato', 'animal', 'veterinário', 'veterinario',
    'ração', 'racao', 'petisco', 'brinquedo', 'coleira', 'caminha',
    'banho', 'tosa', 'vacina', 'vermífugo', 'vermifugo',
    'petz', 'cobasi', 'petlove', 'petshop'
  ],
  
  // Assinaturas
  'Assinaturas e Serviços': [
    'assinatura', 'mensalidade', 'plano', 'serviço', 'servico',
    'netflix', 'spotify', 'amazon', 'youtube', 'disney', 'hbo', 'globoplay',
    'academia', 'gym', 'smartfit', 'bluefit', 'bodytech',
    'cloud', 'storage', 'dropbox', 'google drive', 'icloud',
    'software', 'app', 'aplicativo', 'licença', 'licenca'
  ]
};

// Função para sugerir categoria baseada na descrição
export function suggestCategoryFromDescription(description: string): string | null {
  if (!description || description.trim().length < 3) {
    return null;
  }

  const normalizedDesc = description.toLowerCase().trim();
  
  // Procurar por palavras-chave
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedDesc.includes(keyword.toLowerCase())) {
        console.log(`🎯 Sugestão inteligente: "${description}" → "${category}" (palavra-chave: "${keyword}")`);
        return category;
      }
    }
  }
  
  return null;
}

export const smartSuggestions = {
  getSuggestions: async (): Promise<SmartSuggestion[]> => {
    return [];
  }
};

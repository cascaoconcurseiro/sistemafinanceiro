// Dados dos principais bancos brasileiros
// Logos SVG do repositório: https://github.com/Tgentil/Bancos-em-SVG

export interface BankData {
  code: string;
  name: string;
  fullName: string;
  color: string;
  logoUrl: string;
}

export const BRAZILIAN_BANKS: BankData[] = [
  {
    code: '001',
    name: 'Banco do Brasil',
    fullName: 'Banco do Brasil S.A.',
    color: '#FFF200',
    logoUrl: '/banks/001-banco-do-brasil.svg',
  },
  {
    code: '033',
    name: 'Santander',
    fullName: 'Banco Santander Brasil S.A.',
    color: '#EC0000',
    logoUrl: '/banks/033-santander.svg',
  },
  {
    code: '104',
    name: 'Caixa',
    fullName: 'Caixa Econômica Federal',
    color: '#0066A1',
    logoUrl: '/banks/104-caixa.svg',
  },
  {
    code: '237',
    name: 'Bradesco',
    fullName: 'Banco Bradesco S.A.',
    color: '#CC092F',
    logoUrl: '/banks/237-bradesco.svg',
  },
  {
    code: '341',
    name: 'Itaú',
    fullName: 'Itaú Unibanco S.A.',
    color: '#EC7000',
    logoUrl: '/banks/341-itau.svg',
  },
  {
    code: '260',
    name: 'Nubank',
    fullName: 'Nu Pagamentos S.A.',
    color: '#820AD1',
    logoUrl: '/banks/260-nubank.svg',
  },
  {
    code: '077',
    name: 'Inter',
    fullName: 'Banco Inter S.A.',
    color: '#FF7A00',
    logoUrl: '/banks/077-inter.svg',
  },
  {
    code: '290',
    name: 'PagSeguro',
    fullName: 'PagSeguro Internet S.A.',
    color: '#00A868',
    logoUrl: '/banks/290-pagseguro.svg',
  },
  {
    code: '323',
    name: 'Mercado Pago',
    fullName: 'Mercado Pago',
    color: '#009EE3',
    logoUrl: '/banks/323-mercado-pago.svg',
  },
  {
    code: '212',
    name: 'Original',
    fullName: 'Banco Original S.A.',
    color: '#00A859',
    logoUrl: '/banks/212-original.svg',
  },
  {
    code: '336',
    name: 'C6 Bank',
    fullName: 'Banco C6 S.A.',
    color: '#000000',
    logoUrl: '/banks/336-c6.svg',
  },
  {
    code: '422',
    name: 'Safra',
    fullName: 'Banco Safra S.A.',
    color: '#0047BB',
    logoUrl: '/banks/422-safra.svg',
  },
  {
    code: '756',
    name: 'Sicoob',
    fullName: 'Banco Cooperativo do Brasil S.A.',
    color: '#00923F',
    logoUrl: '/banks/756-sicoob.svg',
  },
  {
    code: '748',
    name: 'Sicredi',
    fullName: 'Banco Cooperativo Sicredi S.A.',
    color: '#00A859',
    logoUrl: '/banks/748-sicredi.svg',
  },
  {
    code: '655',
    name: 'Neon',
    fullName: 'Banco Neon S.A.',
    color: '#00D9E1',
    logoUrl: '/banks/655-neon.svg',
  },
  {
    code: '380',
    name: 'PicPay',
    fullName: 'PicPay Serviços S.A.',
    color: '#21C25E',
    logoUrl: '/banks/380-picpay.svg',
  },
  {
    code: '403',
    name: 'Cora',
    fullName: 'Cora Sociedade de Crédito Direto S.A.',
    color: '#FE3E6D',
    logoUrl: '/banks/403-cora.svg',
  },
  {
    code: '197',
    name: 'Stone',
    fullName: 'Stone Pagamentos S.A.',
    color: '#00A868',
    logoUrl: '/banks/197-stone.svg',
  },
  {
    code: '389',
    name: 'Banco Mercantil',
    fullName: 'Banco Mercantil do Brasil S.A.',
    color: '#0066A1',
    logoUrl: '/banks/389-mercantil.svg',
  },
  {
    code: '623',
    name: 'Pan',
    fullName: 'Banco Pan S.A.',
    color: '#00A859',
    logoUrl: '/banks/623-pan.svg',
  },
];

// Função para buscar banco por código
export function getBankByCode(code: string): BankData | undefined {
  return BRAZILIAN_BANKS.find(bank => bank.code === code);
}

// Função para buscar banco por nome (busca parcial)
export function getBankByName(name: string): BankData | undefined {
  const searchTerm = name.toLowerCase();
  return BRAZILIAN_BANKS.find(bank => 
    bank.name.toLowerCase().includes(searchTerm) ||
    bank.fullName.toLowerCase().includes(searchTerm)
  );
}

// Função para obter todos os bancos ordenados por nome
export function getAllBanks(): BankData[] {
  return [...BRAZILIAN_BANKS].sort((a, b) => a.name.localeCompare(b.name));
}

// Banco genérico para quando não encontrar o banco específico
export const GENERIC_BANK: BankData = {
  code: '000',
  name: 'Outro Banco',
  fullName: 'Outro Banco',
  color: '#6B7280',
  logoUrl: '',
};

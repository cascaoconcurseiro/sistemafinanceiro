'use client';

import { AssetType } from '@/lib/types/investments';

export interface AssetData {
  id: string;
  ticker: string;
  name: string;
  assetType: AssetType;
  sector?: string;
  defaultBrokerId?: string;
  isActive: boolean;
}

// Base de dados completa de ativos brasileiros da B3
export const ASSETS_DATABASE: AssetData[] = [
  // Ações - Ibovespa e principais da B3
  // Bancos
  {
    id: 'ITUB4',
    ticker: 'ITUB4',
    name: 'Itaú Unibanco Holding S.A.',
    assetType: 'stock',
    sector: 'Bancos',
    isActive: true,
  },
  {
    id: 'ITUBF',
    ticker: 'ITUBF',
    name: 'Itaú Unibanco Holding S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Bancos',
    isActive: true,
  },
  {
    id: 'BBDC4',
    ticker: 'BBDC4',
    name: 'Banco Bradesco S.A.',
    assetType: 'stock',
    sector: 'Bancos',
    isActive: true,
  },
  {
    id: 'BBDCF',
    ticker: 'BBDCF',
    name: 'Banco Bradesco S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Bancos',
    isActive: true,
  },
  {
    id: 'BBAS3',
    ticker: 'BBAS3',
    name: 'Banco do Brasil S.A.',
    assetType: 'stock',
    sector: 'Bancos',
    isActive: true,
  },
  {
    id: 'BBAS3F',
    ticker: 'BBAS3F',
    name: 'Banco do Brasil S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Bancos',
    isActive: true,
  },
  {
    id: 'SANB11',
    ticker: 'SANB11',
    name: 'Banco Santander (Brasil) S.A.',
    assetType: 'stock',
    sector: 'Bancos',
    isActive: true,
  },
  {
    id: 'SANB11F',
    ticker: 'SANB11F',
    name: 'Banco Santander (Brasil) S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Bancos',
    isActive: true,
  },
  {
    id: 'BPAC11',
    ticker: 'BPAC11',
    name: 'BTG Pactual S.A.',
    assetType: 'stock',
    sector: 'Bancos',
    isActive: true,
  },
  {
    id: 'BPAC11F',
    ticker: 'BPAC11F',
    name: 'BTG Pactual S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Bancos',
    isActive: true,
  },

  // Energia
  {
    id: 'PETR4',
    ticker: 'PETR4',
    name: 'Petróleo Brasileiro S.A. - Petrobras',
    assetType: 'stock',
    sector: 'Energia',
    isActive: true,
  },
  {
    id: 'PETRF',
    ticker: 'PETRF',
    name: 'Petróleo Brasileiro S.A. - Petrobras (Fracionária)',
    assetType: 'stock',
    sector: 'Energia',
    isActive: true,
  },
  {
    id: 'PETR3',
    ticker: 'PETR3',
    name: 'Petróleo Brasileiro S.A. - Petrobras ON',
    assetType: 'stock',
    sector: 'Energia',
    isActive: true,
  },
  {
    id: 'PETR3F',
    ticker: 'PETR3F',
    name: 'Petróleo Brasileiro S.A. - Petrobras ON (Fracionária)',
    assetType: 'stock',
    sector: 'Energia',
    isActive: true,
  },
  {
    id: 'ELET3',
    ticker: 'ELET3',
    name: 'Centrais Elétricas Brasileiras S.A. - Eletrobras',
    assetType: 'stock',
    sector: 'Energia',
    isActive: true,
  },
  {
    id: 'ELET3F',
    ticker: 'ELET3F',
    name: 'Centrais Elétricas Brasileiras S.A. - Eletrobras (Fracionária)',
    assetType: 'stock',
    sector: 'Energia',
    isActive: true,
  },
  {
    id: 'ELET6',
    ticker: 'ELET6',
    name: 'Centrais Elétricas Brasileiras S.A. - Eletrobras PNB',
    assetType: 'stock',
    sector: 'Energia',
    isActive: true,
  },
  {
    id: 'ELET6F',
    ticker: 'ELET6F',
    name: 'Centrais Elétricas Brasileiras S.A. - Eletrobras PNB (Fracionária)',
    assetType: 'stock',
    sector: 'Energia',
    isActive: true,
  },

  // Mineração
  {
    id: 'VALE3',
    ticker: 'VALE3',
    name: 'Vale S.A.',
    assetType: 'stock',
    sector: 'Mineração',
    isActive: true,
  },
  {
    id: 'VALE3F',
    ticker: 'VALE3F',
    name: 'Vale S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Mineração',
    isActive: true,
  },
  {
    id: 'CSNA3',
    ticker: 'CSNA3',
    name: 'Companhia Siderúrgica Nacional',
    assetType: 'stock',
    sector: 'Mineração',
    isActive: true,
  },
  {
    id: 'CSNA3F',
    ticker: 'CSNA3F',
    name: 'Companhia Siderúrgica Nacional (Fracionária)',
    assetType: 'stock',
    sector: 'Mineração',
    isActive: true,
  },
  {
    id: 'USIM5',
    ticker: 'USIM5',
    name: 'Usinas Siderúrgicas de Minas Gerais S.A.',
    assetType: 'stock',
    sector: 'Mineração',
    isActive: true,
  },
  {
    id: 'USIM5F',
    ticker: 'USIM5F',
    name: 'Usinas Siderúrgicas de Minas Gerais S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Mineração',
    isActive: true,
  },

  // Varejo
  {
    id: 'MGLU3',
    ticker: 'MGLU3',
    name: 'Magazine Luiza S.A.',
    assetType: 'stock',
    sector: 'Varejo',
    isActive: true,
  },
  {
    id: 'MGLU3F',
    ticker: 'MGLU3F',
    name: 'Magazine Luiza S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Varejo',
    isActive: true,
  },
  {
    id: 'LREN3',
    ticker: 'LREN3',
    name: 'Lojas Renner S.A.',
    assetType: 'stock',
    sector: 'Varejo',
    isActive: true,
  },
  {
    id: 'LREN3F',
    ticker: 'LREN3F',
    name: 'Lojas Renner S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Varejo',
    isActive: true,
  },
  {
    id: 'LAME4',
    ticker: 'LAME4',
    name: 'Lojas Americanas S.A.',
    assetType: 'stock',
    sector: 'Varejo',
    isActive: true,
  },
  {
    id: 'LAMEF',
    ticker: 'LAMEF',
    name: 'Lojas Americanas S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Varejo',
    isActive: true,
  },
  {
    id: 'VIIA3',
    ticker: 'VIIA3',
    name: 'Via S.A.',
    assetType: 'stock',
    sector: 'Varejo',
    isActive: true,
  },
  {
    id: 'VIIA3F',
    ticker: 'VIIA3F',
    name: 'Via S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Varejo',
    isActive: true,
  },
  {
    id: 'PCAR3',
    ticker: 'PCAR3',
    name: 'P.A.C. - Participações em Complexos Automotivos',
    assetType: 'stock',
    sector: 'Varejo',
    isActive: true,
  },
  {
    id: 'PCAR3F',
    ticker: 'PCAR3F',
    name: 'P.A.C. - Participações em Complexos Automotivos (Fracionária)',
    assetType: 'stock',
    sector: 'Varejo',
    isActive: true,
  },

  // Bebidas e Alimentos
  {
    id: 'ABEV3',
    ticker: 'ABEV3',
    name: 'Ambev S.A.',
    assetType: 'stock',
    sector: 'Bebidas',
    isActive: true,
  },
  {
    id: 'ABEV3F',
    ticker: 'ABEV3F',
    name: 'Ambev S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Bebidas',
    isActive: true,
  },
  {
    id: 'JBSS3',
    ticker: 'JBSS3',
    name: 'JBS S.A.',
    assetType: 'stock',
    sector: 'Alimentos',
    isActive: true,
  },
  {
    id: 'JBSS3F',
    ticker: 'JBSS3F',
    name: 'JBS S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Alimentos',
    isActive: true,
  },
  {
    id: 'BRFS3',
    ticker: 'BRFS3',
    name: 'BRF S.A.',
    assetType: 'stock',
    sector: 'Alimentos',
    isActive: true,
  },
  {
    id: 'BRFS3F',
    ticker: 'BRFS3F',
    name: 'BRF S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Alimentos',
    isActive: true,
  },
  {
    id: 'MRFG3',
    ticker: 'MRFG3',
    name: 'Marfrig Global Foods S.A.',
    assetType: 'stock',
    sector: 'Alimentos',
    isActive: true,
  },
  {
    id: 'MRFG3F',
    ticker: 'MRFG3F',
    name: 'Marfrig Global Foods S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Alimentos',
    isActive: true,
  },

  // Máquinas e Equipamentos
  {
    id: 'WEGE3',
    ticker: 'WEGE3',
    name: 'WEG S.A.',
    assetType: 'stock',
    sector: 'Máquinas e Equipamentos',
    isActive: true,
  },
  {
    id: 'WEGE3F',
    ticker: 'WEGE3F',
    name: 'WEG S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Máquinas e Equipamentos',
    isActive: true,
  },
  {
    id: 'RAIZ4',
    ticker: 'RAIZ4',
    name: 'Raízen S.A.',
    assetType: 'stock',
    sector: 'Máquinas e Equipamentos',
    isActive: true,
  },
  {
    id: 'RAIZF',
    ticker: 'RAIZF',
    name: 'Raízen S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Máquinas e Equipamentos',
    isActive: true,
  },

  // Papel e Celulose
  {
    id: 'SUZB3',
    ticker: 'SUZB3',
    name: 'Suzano S.A.',
    assetType: 'stock',
    sector: 'Papel e Celulose',
    isActive: true,
  },
  {
    id: 'SUZB3F',
    ticker: 'SUZB3F',
    name: 'Suzano S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Papel e Celulose',
    isActive: true,
  },
  {
    id: 'KLBN11',
    ticker: 'KLBN11',
    name: 'Klabin S.A.',
    assetType: 'stock',
    sector: 'Papel e Celulose',
    isActive: true,
  },
  {
    id: 'KLBN11F',
    ticker: 'KLBN11F',
    name: 'Klabin S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Papel e Celulose',
    isActive: true,
  },

  // Serviços
  {
    id: 'RENT3',
    ticker: 'RENT3',
    name: 'Localiza Rent a Car S.A.',
    assetType: 'stock',
    sector: 'Aluguel de Carros',
    isActive: true,
  },
  {
    id: 'RENT3F',
    ticker: 'RENT3F',
    name: 'Localiza Rent a Car S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Aluguel de Carros',
    isActive: true,
  },
  {
    id: 'RAIL3',
    ticker: 'RAIL3',
    name: 'Rumo S.A.',
    assetType: 'stock',
    sector: 'Transporte',
    isActive: true,
  },
  {
    id: 'RAIL3F',
    ticker: 'RAIL3F',
    name: 'Rumo S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Transporte',
    isActive: true,
  },
  {
    id: 'CCRO3',
    ticker: 'CCRO3',
    name: 'CCR S.A.',
    assetType: 'stock',
    sector: 'Transporte',
    isActive: true,
  },
  {
    id: 'CCRO3F',
    ticker: 'CCRO3F',
    name: 'CCR S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Transporte',
    isActive: true,
  },

  // Telecomunicações
  {
    id: 'VIVT3',
    ticker: 'VIVT3',
    name: 'Telefônica Brasil S.A.',
    assetType: 'stock',
    sector: 'Telecomunicações',
    isActive: true,
  },
  {
    id: 'VIVT3F',
    ticker: 'VIVT3F',
    name: 'Telefônica Brasil S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Telecomunicações',
    isActive: true,
  },
  {
    id: 'TIMS3',
    ticker: 'TIMS3',
    name: 'TIM S.A.',
    assetType: 'stock',
    sector: 'Telecomunicações',
    isActive: true,
  },
  {
    id: 'TIMS3F',
    ticker: 'TIMS3F',
    name: 'TIM S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Telecomunicações',
    isActive: true,
  },

  // Construção Civil
  {
    id: 'MRVE3',
    ticker: 'MRVE3',
    name: 'MRV Engenharia e Participações S.A.',
    assetType: 'stock',
    sector: 'Construção Civil',
    isActive: true,
  },
  {
    id: 'MRVE3F',
    ticker: 'MRVE3F',
    name: 'MRV Engenharia e Participações S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Construção Civil',
    isActive: true,
  },
  {
    id: 'CYRE3',
    ticker: 'CYRE3',
    name: 'Cyrela Brazil Realty S.A.',
    assetType: 'stock',
    sector: 'Construção Civil',
    isActive: true,
  },
  {
    id: 'CYRE3F',
    ticker: 'CYRE3F',
    name: 'Cyrela Brazil Realty S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Construção Civil',
    isActive: true,
  },
  {
    id: 'EZTC3',
    ticker: 'EZTC3',
    name: 'EZTEC Empreendimentos e Participações S.A.',
    assetType: 'stock',
    sector: 'Construção Civil',
    isActive: true,
  },
  {
    id: 'EZTC3F',
    ticker: 'EZTC3F',
    name: 'EZTEC Empreendimentos e Participações S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Construção Civil',
    isActive: true,
  },

  // Saúde
  {
    id: 'RDOR3',
    ticker: 'RDOR3',
    name: "Rede D'Or São Luiz S.A.",
    assetType: 'stock',
    sector: 'Saúde',
    isActive: true,
  },
  {
    id: 'RDOR3F',
    ticker: 'RDOR3F',
    name: "Rede D'Or São Luiz S.A. (Fracionária)",
    assetType: 'stock',
    sector: 'Saúde',
    isActive: true,
  },
  {
    id: 'HAPV3',
    ticker: 'HAPV3',
    name: 'Hapvida Participações e Investimentos S.A.',
    assetType: 'stock',
    sector: 'Saúde',
    isActive: true,
  },
  {
    id: 'HAPV3F',
    ticker: 'HAPV3F',
    name: 'Hapvida Participações e Investimentos S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Saúde',
    isActive: true,
  },

  // Educação
  {
    id: 'COGN3',
    ticker: 'COGN3',
    name: 'Cogna Educação S.A.',
    assetType: 'stock',
    sector: 'Educação',
    isActive: true,
  },
  {
    id: 'COGN3F',
    ticker: 'COGN3F',
    name: 'Cogna Educação S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Educação',
    isActive: true,
  },
  {
    id: 'YDUQ3',
    ticker: 'YDUQ3',
    name: 'YDUQS Participações S.A.',
    assetType: 'stock',
    sector: 'Educação',
    isActive: true,
  },
  {
    id: 'YDUQ3F',
    ticker: 'YDUQ3F',
    name: 'YDUQS Participações S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Educação',
    isActive: true,
  },

  // Tecnologia
  {
    id: 'TOTS3',
    ticker: 'TOTS3',
    name: 'TOTVS S.A.',
    assetType: 'stock',
    sector: 'Tecnologia',
    isActive: true,
  },
  {
    id: 'TOTS3F',
    ticker: 'TOTS3F',
    name: 'TOTVS S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Tecnologia',
    isActive: true,
  },
  {
    id: 'LWSA3',
    ticker: 'LWSA3',
    name: 'Locaweb Serviços de Internet S.A.',
    assetType: 'stock',
    sector: 'Tecnologia',
    isActive: true,
  },
  {
    id: 'LWSA3F',
    ticker: 'LWSA3F',
    name: 'Locaweb Serviços de Internet S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Tecnologia',
    isActive: true,
  },

  // Seguros
  {
    id: 'SULA11',
    ticker: 'SULA11',
    name: 'Sul América S.A.',
    assetType: 'stock',
    sector: 'Seguros',
    isActive: true,
  },
  {
    id: 'SULA11F',
    ticker: 'SULA11F',
    name: 'Sul América S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Seguros',
    isActive: true,
  },
  {
    id: 'PSSA3',
    ticker: 'PSSA3',
    name: 'Porto Seguro S.A.',
    assetType: 'stock',
    sector: 'Seguros',
    isActive: true,
  },
  {
    id: 'PSSA3F',
    ticker: 'PSSA3F',
    name: 'Porto Seguro S.A. (Fracionária)',
    assetType: 'stock',
    sector: 'Seguros',
    isActive: true,
  },

  // FIIs - Fundos de Investimento Imobiliário
  {
    id: 'HGLG11',
    ticker: 'HGLG11',
    name: 'CSHG Logística FII',
    assetType: 'reit',
    sector: 'Logística',
    isActive: true,
  },
  {
    id: 'XPLG11',
    ticker: 'XPLG11',
    name: 'XP Log FII',
    assetType: 'reit',
    sector: 'Logística',
    isActive: true,
  },
  {
    id: 'MXRF11',
    ticker: 'MXRF11',
    name: 'Maxi Renda FII',
    assetType: 'reit',
    sector: 'Híbrido',
    isActive: true,
  },
  {
    id: 'KNRI11',
    ticker: 'KNRI11',
    name: 'Kinea Renda Imobiliária FII',
    assetType: 'reit',
    sector: 'Híbrido',
    isActive: true,
  },
  {
    id: 'VISC11',
    ticker: 'VISC11',
    name: 'Vinci Shopping Centers FII',
    assetType: 'reit',
    sector: 'Shopping',
    isActive: true,
  },
  {
    id: 'BTLG11',
    ticker: 'BTLG11',
    name: 'BTG Pactual Logística FII',
    assetType: 'reit',
    sector: 'Logística',
    isActive: true,
  },
  {
    id: 'HGRE11',
    ticker: 'HGRE11',
    name: 'CSHG Real Estate FII',
    assetType: 'reit',
    sector: 'Corporativo',
    isActive: true,
  },
  {
    id: 'BCFF11',
    ticker: 'BCFF11',
    name: 'BTG Pactual Corporate Office Fund FII',
    assetType: 'reit',
    sector: 'Corporativo',
    isActive: true,
  },
  {
    id: 'XPML11',
    ticker: 'XPML11',
    name: 'XP Malls FII',
    assetType: 'reit',
    sector: 'Shopping',
    isActive: true,
  },
  {
    id: 'KNCR11',
    ticker: 'KNCR11',
    name: 'Kinea Rendimentos Imobiliários FII',
    assetType: 'reit',
    sector: 'Híbrido',
    isActive: true,
  },

  // ETFs - Exchange Traded Funds
  {
    id: 'BOVA11',
    ticker: 'BOVA11',
    name: 'iShares Ibovespa Fundo de Índice',
    assetType: 'etf',
    sector: 'Índice',
    isActive: true,
  },
  {
    id: 'IVVB11',
    ticker: 'IVVB11',
    name: 'iShares Core S&P 500',
    assetType: 'etf',
    sector: 'Internacional',
    isActive: true,
  },
  {
    id: 'SMAL11',
    ticker: 'SMAL11',
    name: 'iShares MSCI Brazil Small Cap',
    assetType: 'etf',
    sector: 'Small Caps',
    isActive: true,
  },
  {
    id: 'DIVO11',
    ticker: 'DIVO11',
    name: 'Caixa Dividendos',
    assetType: 'etf',
    sector: 'Dividendos',
    isActive: true,
  },
  {
    id: 'HASH11',
    ticker: 'HASH11',
    name: 'Hashdex Nasdaq Crypto Index',
    assetType: 'etf',
    sector: 'Criptomoedas',
    isActive: true,
  },
  {
    id: 'GOLD11',
    ticker: 'GOLD11',
    name: 'It Now Ouro',
    assetType: 'etf',
    sector: 'Commodities',
    isActive: true,
  },
  {
    id: 'SPXI11',
    ticker: 'SPXI11',
    name: 'SPDR S&P 500 ETF',
    assetType: 'etf',
    sector: 'Internacional',
    isActive: true,
  },
  {
    id: 'BRAX11',
    ticker: 'BRAX11',
    name: 'EWZ Brazil',
    assetType: 'etf',
    sector: 'Brasil',
    isActive: true,
  },

  // BDRs - Brazilian Depositary Receipts
  {
    id: 'AAPL34',
    ticker: 'AAPL34',
    name: 'Apple Inc.',
    assetType: 'bdr',
    sector: 'Tecnologia',
    isActive: true,
  },
  {
    id: 'MSFT34',
    ticker: 'MSFT34',
    name: 'Microsoft Corporation',
    assetType: 'bdr',
    sector: 'Tecnologia',
    isActive: true,
  },
  {
    id: 'GOOGL34',
    ticker: 'GOOGL34',
    name: 'Alphabet Inc.',
    assetType: 'bdr',
    sector: 'Tecnologia',
    isActive: true,
  },
  {
    id: 'AMZO34',
    ticker: 'AMZO34',
    name: 'Amazon.com Inc.',
    assetType: 'bdr',
    sector: 'Varejo',
    isActive: true,
  },
  {
    id: 'TSLA34',
    ticker: 'TSLA34',
    name: 'Tesla Inc.',
    assetType: 'bdr',
    sector: 'Automotivo',
    isActive: true,
  },
  {
    id: 'NVDC34',
    ticker: 'NVDC34',
    name: 'NVIDIA Corporation',
    assetType: 'bdr',
    sector: 'Tecnologia',
    isActive: true,
  },
  {
    id: 'META34',
    ticker: 'META34',
    name: 'Meta Platforms Inc.',
    assetType: 'bdr',
    sector: 'Tecnologia',
    isActive: true,
  },
  {
    id: 'NFLX34',
    ticker: 'NFLX34',
    name: 'Netflix Inc.',
    assetType: 'bdr',
    sector: 'Entretenimento',
    isActive: true,
  },
  {
    id: 'DISB34',
    ticker: 'DISB34',
    name: 'The Walt Disney Company',
    assetType: 'bdr',
    sector: 'Entretenimento',
    isActive: true,
  },
  {
    id: 'COCA34',
    ticker: 'COCA34',
    name: 'The Coca-Cola Company',
    assetType: 'bdr',
    sector: 'Bebidas',
    isActive: true,
  },
];

// Função para buscar ativo por ticker
export function findAssetByTicker(ticker: string): AssetData | undefined {
  return ASSETS_DATABASE.find(asset => 
    asset.ticker.toLowerCase() === ticker.toLowerCase()
  );
}

// Função para buscar ativos por setor
export function findAssetsBySector(sector: string): AssetData[] {
  return ASSETS_DATABASE.filter(asset => 
    asset.sector?.toLowerCase().includes(sector.toLowerCase())
  );
}

// Função para buscar ativos por tipo
export function findAssetsByType(assetType: AssetType): AssetData[] {
  return ASSETS_DATABASE.filter(asset => asset.assetType === assetType);
}

// Função para buscar ativos ativos
export function getActiveAssets(): AssetData[] {
  return ASSETS_DATABASE.filter(asset => asset.isActive);
}

// Função para buscar ativos por nome (busca parcial)
export function searchAssetsByName(searchTerm: string): AssetData[] {
  const term = searchTerm.toLowerCase();
  return ASSETS_DATABASE.filter(asset => 
    asset.name.toLowerCase().includes(term) ||
    asset.ticker.toLowerCase().includes(term)
  );
}

// Função para buscar ativo por ticker
export function getAssetByTicker(ticker: string): AssetData | undefined {
  return ASSETS_DATABASE.find(asset => 
    asset.ticker.toLowerCase() === ticker.toLowerCase()
  );
}

// Função para buscar ativos (alias para searchAssetsByName)
export function searchAssets(searchTerm: string): AssetData[] {
  return searchAssetsByName(searchTerm);
}

// Função para obter todos os setores únicos
export function getAllSectors(): string[] {
  const sectors = ASSETS_DATABASE
    .map(asset => asset.sector)
    .filter((sector): sector is string => sector !== undefined);
  
  return [...new Set(sectors)].sort();
}

// Função para obter estatísticas da base de dados
export function getDatabaseStats() {
  const totalAssets = ASSETS_DATABASE.length;
  const activeAssets = getActiveAssets().length;
  const assetsByType = {
    stocks: findAssetsByType('stock').length,
    reits: findAssetsByType('reit').length,
    etfs: findAssetsByType('etf').length,
    bdrs: findAssetsByType('bdr').length,
  };
  const totalSectors = getAllSectors().length;

  return {
    totalAssets,
    activeAssets,
    assetsByType,
    totalSectors,
  };
}

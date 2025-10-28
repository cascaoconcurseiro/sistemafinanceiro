# 💎 PROPOSTA: Nova Página de Investimentos - Versão Premium

**Data:** 28/10/2025  
**Objetivo:** Reformular completamente a página de investimentos seguindo princípios dos grandes players  
**Foco:** Sistema offline com entrada manual inteligente

---

## 🎯 VISÃO GERAL

### Problema Atual (Nota: 6/10)
A página atual de investimentos é muito básica:
- Apenas cadastro simples de ativos
- Sem análise de rentabilidade
- Sem diversificação de portfólio
- Sem comparação com benchmarks
- Sem cálculo de IR
- Sem gestão de dividendos

### Solução Proposta (Meta: 9/10)
Uma página completa de gestão de investimentos que:
- **Mantém o controle manual** (sem APIs de cotação)
- **Oferece análises profundas** baseadas nos dados inseridos
- **Educa o usuário** sobre investimentos
- **Facilita a tomada de decisão**
- **Calcula impostos** automaticamente

---

## 📊 ESTRUTURA DA NOVA PÁGINA

### 1. DASHBOARD DE INVESTIMENTOS (Topo)

```
┌─────────────────────────────────────────────────────────────┐
│  💎 MEU PORTFÓLIO                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Patrimônio   │  │ Rentabilidade│  │ Dividendos   │     │
│  │ R$ 125.450   │  │ +12,5% a.a.  │  │ R$ 1.250/mês │     │
│  │ ↑ +5,2% mês  │  │ 🎯 CDI +2%   │  │ Yield: 1,2%  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Aporte Mês   │  │ IR a Pagar   │  │ Próx. Evento │     │
│  │ R$ 2.000     │  │ R$ 450       │  │ Dividendo    │     │
│  │ Meta: R$ 3k  │  │ Venc: 30/11  │  │ PETR4: 15/11 │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```


### 2. GRÁFICO DE ALOCAÇÃO (Centro-Esquerda)

```
┌─────────────────────────────────────┐
│  📊 DIVERSIFICAÇÃO                  │
├─────────────────────────────────────┤
│                                     │
│     [Gráfico Pizza Interativo]      │
│                                     │
│  🟦 Renda Fixa      45% R$ 56.450   │
│  🟩 Ações           30% R$ 37.635   │
│  🟨 FIIs            15% R$ 18.817   │
│  🟧 Cripto           5% R$  6.272   │
│  🟥 Internacional    5% R$  6.272   │
│                                     │
│  ⚠️ Recomendação:                   │
│  Aumentar Renda Fixa para 50%       │
│  (Reserva de emergência baixa)      │
└─────────────────────────────────────┘
```

**Funcionalidades:**
- Gráfico pizza interativo (hover mostra detalhes)
- Comparação com alocação ideal (perfil de risco)
- Alertas de concentração excessiva
- Sugestões de rebalanceamento

---

### 3. EVOLUÇÃO PATRIMONIAL (Centro-Direita)

```
┌─────────────────────────────────────┐
│  📈 EVOLUÇÃO DO PATRIMÔNIO          │
├─────────────────────────────────────┤
│                                     │
│  [Gráfico de Linha - 12 meses]      │
│                                     │
│  ─── Patrimônio Total               │
│  ─── Aportes Acumulados             │
│  ─── Rentabilidade                  │
│                                     │
│  Período: [Últimos 12 meses ▼]      │
│                                     │
│  💡 Insight:                         │
│  Seu patrimônio cresceu 18% no      │
│  último ano, sendo 12% de aportes   │
│  e 6% de rentabilidade.             │
└─────────────────────────────────────┘
```

**Funcionalidades:**
- Gráfico de linha com 3 séries
- Filtros: 6m, 1a, 2a, 5a, Tudo
- Comparação com benchmarks (CDI, IPCA, Ibovespa)
- Insights automáticos

---

### 4. LISTA DE ATIVOS (Abaixo)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📋 MEUS INVESTIMENTOS                                    [+ Novo Ativo]  │
├──────────────────────────────────────────────────────────────────────────┤
│  Filtros: [Todos ▼] [Renda Fixa ▼] [Ações ▼] [FIIs ▼]  🔍 Buscar...     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🟦 RENDA FIXA                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Tesouro Selic 2029                                                 │ │
│  │ R$ 25.000  │  Rent: +0,8% mês  │  Venc: 01/03/2029  │  [Editar]   │ │
│  │ Compra: R$ 20.000 em 15/01/2024  │  Lucro: R$ 5.000 (+25%)        │ │
│  │ 📊 Benchmark: CDI +0,1%  │  ⚠️ IR: R$ 750 (15%)                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  🟩 AÇÕES                                                                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ PETR4 - Petrobras PN                                               │ │
│  │ 500 ações  │  R$ 15.250  │  PM: R$ 30,50  │  Atual: R$ 32,80      │ │
│  │ Rent: +7,5%  │  💰 Próx. Dividendo: R$ 250 em 15/11               │ │
│  │ 📊 vs Ibovespa: +2,3%  │  ⚠️ IR: Isento (< R$ 20k/mês)            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  🟨 FUNDOS IMOBILIÁRIOS                                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ HGLG11 - CSHG Logística                                            │ │
│  │ 150 cotas  │  R$ 18.817  │  PM: R$ 125,45  │  Atual: R$ 128,90    │ │
│  │ Rent: +2,7%  │  💰 Dividendo: R$ 180/mês (Yield: 1,15%)           │ │
│  │ 📊 vs IFIX: -0,5%  │  ⚠️ IR: 20% sobre dividendos                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Cards expansíveis por ativo
- Informações detalhadas (PM, rentabilidade, dividendos)
- Comparação com benchmarks
- Cálculo automático de IR
- Alertas de eventos (dividendos, vencimentos)
- Edição rápida inline


---

## 🎨 FUNCIONALIDADES DETALHADAS

### 1. CADASTRO DE ATIVO (Modal Inteligente)

```
┌─────────────────────────────────────────────────────────┐
│  ➕ NOVO INVESTIMENTO                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tipo de Ativo:                                         │
│  [🟦 Renda Fixa] [🟩 Ações] [🟨 FIIs] [🟧 Cripto]      │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Ticker/Nome: [PETR4                            ]       │
│               💡 Petrobras PN - Ação ON                 │
│                                                         │
│  Quantidade:  [500                              ]       │
│  Preço Médio: [R$ 30,50                         ]       │
│  Data Compra: [15/10/2024                       ]       │
│                                                         │
│  Corretora:   [XP Investimentos            ▼   ]       │
│  Custos:      [R$ 15,00 (corretagem)           ]       │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  💰 VALOR TOTAL: R$ 15.265,00                           │
│     (R$ 15.250 + R$ 15 custos)                          │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ⚙️ Configurações Avançadas:                            │
│  ☑ Registrar como transação (débito da conta)          │
│  ☑ Agendar alertas de dividendos                       │
│  ☐ Adicionar à meta de investimento                    │
│                                                         │
│  [Cancelar]                          [💾 Salvar Ativo]  │
└─────────────────────────────────────────────────────────┘
```

**Campos por Tipo:**

**Renda Fixa:**
- Nome do título
- Valor aplicado
- Taxa (% a.a.)
- Indexador (CDI, IPCA, Prefixado)
- Data de vencimento
- Liquidez (diária, no vencimento)

**Ações:**
- Ticker
- Quantidade
- Preço médio
- Data de compra
- Corretora
- Custos (corretagem, emolumentos)

**FIIs:**
- Ticker
- Quantidade de cotas
- Preço médio
- Data de compra
- Corretora

**Criptomoedas:**
- Moeda (BTC, ETH, etc)
- Quantidade
- Preço médio (em R$)
- Exchange
- Wallet (opcional)

---

### 2. ATUALIZAÇÃO DE PREÇOS (Manual Inteligente)

```
┌─────────────────────────────────────────────────────────┐
│  🔄 ATUALIZAR COTAÇÕES                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Última atualização: 27/10/2024 às 18:30               │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ PETR4          R$ 32,80  [Atualizar]              │ │
│  │ Última: R$ 32,50 (+0,92%)                         │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ VALE3          R$ 68,45  [Atualizar]              │ │
│  │ Última: R$ 67,80 (+0,96%)                         │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ HGLG11         R$ 128,90 [Atualizar]              │ │
│  │ Última: R$ 128,50 (+0,31%)                        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  💡 Dica: Você pode copiar cotações de sites como      │
│     Status Invest, Google Finance ou sua corretora     │
│                                                         │
│  [Atualizar Todos]                          [Fechar]   │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Atualização individual ou em lote
- Histórico de cotações (últimas 10)
- Cálculo automático de variação
- Sugestão de fontes confiáveis
- Lembrete de atualização (semanal/mensal)

---

### 3. REGISTRO DE DIVIDENDOS

```
┌─────────────────────────────────────────────────────────┐
│  💰 REGISTRAR DIVIDENDO                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Ativo:       [PETR4 - Petrobras PN            ▼]      │
│                                                         │
│  Tipo:        [● Dividendo  ○ JCP  ○ Rendimento]       │
│                                                         │
│  Valor Bruto: [R$ 250,00                        ]      │
│  IR Retido:   [R$ 0,00 (isento)                 ]      │
│  Valor Líq.:  [R$ 250,00                        ]      │
│                                                         │
│  Data Pgto:   [15/11/2024                       ]      │
│  Data Com:    [01/11/2024                       ]      │
│                                                         │
│  ☑ Registrar como receita (crédito na conta)           │
│  ☑ Reinvestir automaticamente                          │
│                                                         │
│  📊 Histórico de Dividendos:                            │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 15/10/2024  R$ 250,00  (Dividendo)               │ │
│  │ 15/09/2024  R$ 240,00  (Dividendo)               │ │
│  │ 15/08/2024  R$ 235,00  (Dividendo)               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  💡 Yield anual estimado: 1,15%                         │
│                                                         │
│  [Cancelar]                          [💾 Registrar]     │
└─────────────────────────────────────────────────────────┘
```

---

### 4. CALCULADORA DE IR (Automática)

```
┌─────────────────────────────────────────────────────────┐
│  📋 IMPOSTO DE RENDA - 2024                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🟩 AÇÕES (Swing Trade)                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Vendas no mês:     R$ 18.500,00                   │ │
│  │ Lucro tributável:  R$ 2.300,00                    │ │
│  │ IR (15%):          R$ 345,00                      │ │
│  │ Status: ⚠️ A pagar até 30/11/2024                 │ │
│  │ [Gerar DARF]                                      │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  🟦 RENDA FIXA                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Resgates no ano:   R$ 5.000,00                    │ │
│  │ IR retido (15%):   R$ 750,00                      │ │
│  │ Status: ✅ Já recolhido na fonte                  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  🟨 FIIs                                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Dividendos no ano: R$ 2.160,00                    │ │
│  │ IR retido (20%):   R$ 432,00                      │ │
│  │ Status: ✅ Já recolhido na fonte                  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  💰 TOTAL A PAGAR: R$ 345,00                            │
│                                                         │
│  [Exportar para Declaração IR]      [Gerar Relatório]  │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Cálculo automático por tipo de ativo
- Geração de DARF
- Alertas de vencimento
- Histórico de pagamentos
- Exportação para declaração anual

---

### 5. ANÁLISE DE RENTABILIDADE

```
┌─────────────────────────────────────────────────────────┐
│  📊 ANÁLISE DE RENTABILIDADE                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Período: [Últimos 12 meses                        ▼]  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │  [Gráfico de Barras Comparativo]                 │ │
│  │                                                   │ │
│  │  Seu Portfólio:  +12,5% a.a.                     │ │
│  │  CDI:            +10,4% a.a.                     │ │
│  │  IPCA:           +4,5% a.a.                      │ │
│  │  Ibovespa:       +8,2% a.a.                      │ │
│  │  Poupança:       +6,8% a.a.                      │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  🎯 PERFORMANCE POR CLASSE:                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 🟦 Renda Fixa:      +11,2% (CDI +0,8%)           │ │
│  │ 🟩 Ações:           +15,8% (Ibov +7,6%)          │ │
│  │ 🟨 FIIs:            +8,5% (IFIX +2,1%)           │ │
│  │ 🟧 Cripto:          -5,2% (volátil)              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  💡 Insights:                                           │
│  • Suas ações estão performando muito bem!             │
│  • Considere reduzir exposição a cripto                │
│  • Renda fixa está batendo o CDI 👏                    │
│                                                         │
│  [Exportar Relatório]                                   │
└─────────────────────────────────────────────────────────┘
```


---

### 6. REBALANCEAMENTO DE PORTFÓLIO

```
┌─────────────────────────────────────────────────────────┐
│  ⚖️ REBALANCEAMENTO                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Seu Perfil: [Moderado                             ▼]  │
│                                                         │
│  ALOCAÇÃO ATUAL vs IDEAL:                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │  Renda Fixa:    45% ████████  →  50% ██████████  │ │
│  │  Ações:         30% ██████    →  30% ██████      │ │
│  │  FIIs:          15% ███       →  15% ███         │ │
│  │  Cripto:         5% █         →   3% ▌           │ │
│  │  Internacional:  5% █         →   2% ▌           │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  📋 AÇÕES RECOMENDADAS:                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 1. Aportar R$ 3.000 em Renda Fixa                │ │
│  │    Sugestão: Tesouro Selic 2029                  │ │
│  │                                                   │ │
│  │ 2. Reduzir R$ 1.200 em Cripto                    │ │
│  │    Sugestão: Vender 20% da posição              │ │
│  │                                                   │ │
│  │ 3. Manter Ações e FIIs                           │ │
│  │    Estão na alocação ideal                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  💡 Próximo rebalanceamento sugerido: 01/01/2025       │
│                                                         │
│  [Aplicar Rebalanceamento]              [Adiar]        │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Perfis de risco (Conservador, Moderado, Arrojado)
- Alocação ideal por perfil
- Sugestões automáticas de rebalanceamento
- Simulação de impacto
- Agendamento de lembretes

---

### 7. SIMULADOR DE INVESTIMENTOS

```
┌─────────────────────────────────────────────────────────┐
│  🎯 SIMULADOR DE INVESTIMENTOS                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Quanto você quer investir?                             │
│  Aporte Inicial:  [R$ 10.000                    ]      │
│  Aporte Mensal:   [R$ 1.000                     ]      │
│  Prazo:           [5 anos                       ]      │
│                                                         │
│  Rentabilidade esperada:                                │
│  [● Conservador (8% a.a.)                              │
│   ○ Moderado (12% a.a.)                                │
│   ○ Arrojado (15% a.a.)                                │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📊 RESULTADO:                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │  [Gráfico de Evolução]                           │ │
│  │                                                   │ │
│  │  Valor Final:      R$ 82.450,00                  │ │
│  │  Total Investido:  R$ 70.000,00                  │ │
│  │  Rendimento:       R$ 12.450,00 (+17,8%)         │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  💡 Para atingir R$ 100.000 em 5 anos:                  │
│     Você precisa aportar R$ 1.450/mês                  │
│                                                         │
│  [Criar Meta com essa Simulação]                       │
└─────────────────────────────────────────────────────────┘
```

---

### 8. CALENDÁRIO DE EVENTOS

```
┌─────────────────────────────────────────────────────────┐
│  📅 CALENDÁRIO DE INVESTIMENTOS                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Novembro 2024                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 15/11 💰 Dividendo PETR4      R$ 250,00           │ │
│  │ 18/11 💰 Rendimento HGLG11    R$ 180,00           │ │
│  │ 25/11 💰 JCP VALE3            R$ 120,00           │ │
│  │ 30/11 ⚠️  Vencimento DARF      R$ 345,00           │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Dezembro 2024                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ 01/12 📈 Vencimento Tesouro   R$ 5.000,00         │ │
│  │ 15/12 💰 Dividendo PETR4      R$ 250,00           │ │
│  │ 20/12 💰 Rendimento HGLG11    R$ 180,00           │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ☑ Notificar 3 dias antes                              │
│  ☑ Enviar resumo mensal por email                      │
│                                                         │
│  [Exportar para Google Calendar]                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ ESTRUTURA DE DADOS

### Tabela: Investment (Atualizada)

```typescript
model Investment {
  id                String   @id @default(cuid())
  userId            String
  
  // Dados Básicos
  ticker            String   // PETR4, HGLG11, Tesouro Selic
  name              String   // Nome completo
  type              InvestmentType
  category          InvestmentCategory
  
  // Quantidade e Valores
  quantity          Decimal  // Ações, cotas, valor aplicado
  averagePrice      Decimal  // Preço médio de compra
  currentPrice      Decimal  // Cotação atual
  totalInvested     Decimal  // Total investido (com custos)
  currentValue      Decimal  // Valor atual
  
  // Custos
  brokerageFee      Decimal? // Corretagem
  otherFees         Decimal? // Outras taxas
  
  // Rentabilidade
  profitLoss        Decimal  // Lucro/Prejuízo
  profitLossPercent Decimal  // %
  
  // Renda Fixa Específico
  interestRate      Decimal? // Taxa (% a.a.)
  indexer           String?  // CDI, IPCA, Prefixado
  maturityDate      DateTime?
  liquidity         String?  // Diária, No vencimento
  
  // Dividendos
  lastDividend      Decimal?
  lastDividendDate  DateTime?
  dividendYield     Decimal? // Yield anual
  
  // Metadados
  broker            String?  // Corretora
  purchaseDate      DateTime
  notes             String?
  
  // Relacionamentos
  user              User     @relation(fields: [userId], references: [id])
  dividends         Dividend[]
  transactions      Transaction[]
  
  // Auditoria
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
}

enum InvestmentType {
  FIXED_INCOME      // Renda Fixa
  STOCK             // Ações
  REIT              // FIIs
  CRYPTO            // Criptomoedas
  INTERNATIONAL     // Internacional
  PENSION           // Previdência
  OTHER             // Outros
}

enum InvestmentCategory {
  // Renda Fixa
  TESOURO_DIRETO
  CDB
  LCI_LCA
  DEBENTURE
  
  // Ações
  STOCK_BR
  STOCK_US
  ETF
  
  // FIIs
  REIT_LOGISTIC
  REIT_COMMERCIAL
  REIT_RESIDENTIAL
  REIT_PAPER
  
  // Cripto
  BITCOIN
  ETHEREUM
  OTHER_CRYPTO
  
  // Outros
  PENSION_PGBL
  PENSION_VGBL
  OTHER
}
```

### Tabela: Dividend (Nova)

```typescript
model Dividend {
  id              String   @id @default(cuid())
  investmentId    String
  userId          String
  
  // Dados do Dividendo
  type            DividendType
  grossAmount     Decimal  // Valor bruto
  taxAmount       Decimal  // IR retido
  netAmount       Decimal  // Valor líquido
  
  // Datas
  paymentDate     DateTime // Data de pagamento
  exDate          DateTime? // Data com
  
  // Relacionamentos
  investment      Investment @relation(fields: [investmentId], references: [id])
  user            User @relation(fields: [userId], references: [id])
  transaction     Transaction? // Se registrou como receita
  
  // Auditoria
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum DividendType {
  DIVIDEND        // Dividendo
  JCP             // Juros sobre Capital Próprio
  INCOME          // Rendimento (FIIs)
  INTEREST        // Juros (Renda Fixa)
}
```

### Tabela: InvestmentGoal (Nova)

```typescript
model InvestmentGoal {
  id              String   @id @default(cuid())
  userId          String
  
  // Meta
  name            String   // "Aposentadoria", "Casa própria"
  targetAmount    Decimal  // Valor alvo
  currentAmount   Decimal  // Valor atual
  deadline        DateTime // Prazo
  
  // Estratégia
  monthlyContribution Decimal // Aporte mensal
  expectedReturn      Decimal // Rentabilidade esperada (% a.a.)
  riskProfile         RiskProfile
  
  // Alocação Sugerida
  fixedIncomePercent  Int // % Renda Fixa
  stocksPercent       Int // % Ações
  reitsPercent        Int // % FIIs
  
  // Status
  status          GoalStatus
  priority        Int
  
  // Relacionamentos
  user            User @relation(fields: [userId], references: [id])
  investments     Investment[]
  
  // Auditoria
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum RiskProfile {
  CONSERVATIVE    // Conservador
  MODERATE        // Moderado
  AGGRESSIVE      // Arrojado
}
```


---

## 💻 COMPONENTES REACT

### 1. InvestmentDashboard.tsx

```typescript
interface InvestmentDashboardProps {
  userId: string;
}

export function InvestmentDashboard({ userId }: InvestmentDashboardProps) {
  const { data: portfolio } = useInvestmentPortfolio(userId);
  const { data: performance } = useInvestmentPerformance(userId);
  
  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PortfolioCard 
          title="Patrimônio Total"
          value={portfolio.totalValue}
          change={portfolio.monthlyChange}
          icon={<TrendingUp />}
        />
        <PortfolioCard 
          title="Rentabilidade"
          value={performance.annualReturn}
          benchmark={performance.cdiBenchmark}
          icon={<BarChart />}
        />
        <PortfolioCard 
          title="Dividendos"
          value={portfolio.monthlyDividends}
          yield={portfolio.dividendYield}
          icon={<DollarSign />}
        />
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationChart data={portfolio.allocation} />
        <EvolutionChart data={performance.evolution} />
      </div>
      
      {/* Lista de Ativos */}
      <InvestmentList investments={portfolio.investments} />
    </div>
  );
}
```

### 2. InvestmentModal.tsx (Cadastro)

```typescript
interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment?: Investment; // Para edição
}

export function InvestmentModal({ isOpen, onClose, investment }: InvestmentModalProps) {
  const [type, setType] = useState<InvestmentType>('STOCK');
  const form = useForm<InvestmentFormData>();
  
  const { mutate: createInvestment } = useCreateInvestment();
  
  const onSubmit = (data: InvestmentFormData) => {
    createInvestment({
      ...data,
      currentPrice: data.averagePrice, // Inicial
      currentValue: data.quantity * data.averagePrice,
      profitLoss: 0,
      profitLossPercent: 0,
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {investment ? 'Editar' : 'Novo'} Investimento
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Seletor de Tipo */}
          <InvestmentTypeSelector value={type} onChange={setType} />
          
          {/* Campos Dinâmicos por Tipo */}
          {type === 'STOCK' && <StockFields form={form} />}
          {type === 'FIXED_INCOME' && <FixedIncomeFields form={form} />}
          {type === 'REIT' && <ReitFields form={form} />}
          {type === 'CRYPTO' && <CryptoFields form={form} />}
          
          {/* Custos */}
          <CostsFields form={form} />
          
          {/* Configurações */}
          <AdvancedSettings form={form} />
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Investimento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. PriceUpdateModal.tsx

```typescript
export function PriceUpdateModal({ isOpen, onClose }: PriceUpdateModalProps) {
  const { data: investments } = useInvestments();
  const { mutate: updatePrices } = useUpdatePrices();
  
  const [prices, setPrices] = useState<Record<string, number>>({});
  
  const handleUpdateAll = () => {
    updatePrices(prices);
    toast.success('Cotações atualizadas!');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar Cotações</DialogTitle>
          <DialogDescription>
            Última atualização: {formatDate(lastUpdate)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {investments?.map(inv => (
            <div key={inv.id} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-medium">{inv.ticker}</p>
                <p className="text-sm text-muted-foreground">
                  Última: R$ {inv.currentPrice}
                </p>
              </div>
              <Input
                type="number"
                step="0.01"
                placeholder="Nova cotação"
                value={prices[inv.id] || ''}
                onChange={(e) => setPrices({
                  ...prices,
                  [inv.id]: parseFloat(e.target.value)
                })}
              />
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleUpdateAll}>
            Atualizar Todos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4. DividendModal.tsx

```typescript
export function DividendModal({ isOpen, onClose, investmentId }: DividendModalProps) {
  const form = useForm<DividendFormData>();
  const { mutate: createDividend } = useCreateDividend();
  
  const onSubmit = (data: DividendFormData) => {
    createDividend({
      ...data,
      investmentId,
      netAmount: data.grossAmount - data.taxAmount,
    });
    toast.success('Dividendo registrado!');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Dividendo</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <FormField
              label="Tipo"
              name="type"
              control={form.control}
              render={({ field }) => (
                <Select {...field}>
                  <SelectItem value="DIVIDEND">Dividendo</SelectItem>
                  <SelectItem value="JCP">JCP</SelectItem>
                  <SelectItem value="INCOME">Rendimento</SelectItem>
                </Select>
              )}
            />
            
            <FormField
              label="Valor Bruto"
              name="grossAmount"
              control={form.control}
              render={({ field }) => (
                <CurrencyInput {...field} />
              )}
            />
            
            <FormField
              label="IR Retido"
              name="taxAmount"
              control={form.control}
              render={({ field }) => (
                <CurrencyInput {...field} />
              )}
            />
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Valor Líquido: R$ {calculateNet()}
              </p>
            </div>
            
            <FormField
              label="Data de Pagamento"
              name="paymentDate"
              control={form.control}
              render={({ field }) => (
                <DatePicker {...field} />
              )}
            />
            
            <div className="space-y-2">
              <Checkbox
                id="createTransaction"
                checked={form.watch('createTransaction')}
                onCheckedChange={(checked) => 
                  form.setValue('createTransaction', checked)
                }
              />
              <label htmlFor="createTransaction">
                Registrar como receita
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📊 HOOKS E SERVIÇOS

### useInvestmentPortfolio.ts

```typescript
export function useInvestmentPortfolio(userId: string) {
  return useQuery({
    queryKey: ['investment-portfolio', userId],
    queryFn: async () => {
      const investments = await db.investment.findMany({
        where: { userId, deletedAt: null },
        include: { dividends: true }
      });
      
      // Calcular totais
      const totalValue = investments.reduce(
        (sum, inv) => sum + inv.currentValue, 0
      );
      
      const totalInvested = investments.reduce(
        (sum, inv) => sum + inv.totalInvested, 0
      );
      
      const profitLoss = totalValue - totalInvested;
      const profitLossPercent = (profitLoss / totalInvested) * 100;
      
      // Calcular alocação
      const allocation = calculateAllocation(investments);
      
      // Calcular dividendos mensais
      const monthlyDividends = calculateMonthlyDividends(investments);
      
      return {
        investments,
        totalValue,
        totalInvested,
        profitLoss,
        profitLossPercent,
        allocation,
        monthlyDividends,
        dividendYield: (monthlyDividends * 12 / totalValue) * 100,
      };
    }
  });
}
```

### useInvestmentPerformance.ts

```typescript
export function useInvestmentPerformance(userId: string) {
  return useQuery({
    queryKey: ['investment-performance', userId],
    queryFn: async () => {
      // Buscar histórico de valores
      const history = await db.investmentHistory.findMany({
        where: { userId },
        orderBy: { date: 'asc' }
      });
      
      // Calcular rentabilidade anual
      const annualReturn = calculateAnnualReturn(history);
      
      // Comparar com benchmarks
      const cdiBenchmark = await fetchCDI(); // Pode ser manual
      const ibovBenchmark = await fetchIbovespa();
      
      // Calcular evolução
      const evolution = history.map(h => ({
        date: h.date,
        value: h.totalValue,
        invested: h.totalInvested,
        profit: h.totalValue - h.totalInvested,
      }));
      
      return {
        annualReturn,
        cdiBenchmark,
        ibovBenchmark,
        evolution,
      };
    }
  });
}
```

### investment-service.ts

```typescript
export class InvestmentService {
  // Criar investimento
  async create(data: CreateInvestmentDTO) {
    return await db.$transaction(async (tx) => {
      // Criar investimento
      const investment = await tx.investment.create({
        data: {
          ...data,
          currentPrice: data.averagePrice,
          currentValue: data.quantity * data.averagePrice,
          profitLoss: 0,
          profitLossPercent: 0,
        }
      });
      
      // Se marcou para registrar como transação
      if (data.createTransaction) {
        await tx.transaction.create({
          data: {
            userId: data.userId,
            type: 'EXPENSE',
            amount: data.totalInvested,
            category: 'Investimentos',
            description: `Compra de ${data.ticker}`,
            date: data.purchaseDate,
            accountId: data.accountId,
          }
        });
      }
      
      // Criar histórico inicial
      await tx.investmentHistory.create({
        data: {
          userId: data.userId,
          date: data.purchaseDate,
          totalValue: investment.currentValue,
          totalInvested: investment.totalInvested,
        }
      });
      
      return investment;
    });
  }
  
  // Atualizar cotação
  async updatePrice(investmentId: string, newPrice: number) {
    const investment = await db.investment.findUnique({
      where: { id: investmentId }
    });
    
    if (!investment) throw new Error('Investment not found');
    
    const currentValue = investment.quantity * newPrice;
    const profitLoss = currentValue - investment.totalInvested;
    const profitLossPercent = (profitLoss / investment.totalInvested) * 100;
    
    return await db.investment.update({
      where: { id: investmentId },
      data: {
        currentPrice: newPrice,
        currentValue,
        profitLoss,
        profitLossPercent,
      }
    });
  }
  
  // Registrar dividendo
  async createDividend(data: CreateDividendDTO) {
    return await db.$transaction(async (tx) => {
      // Criar dividendo
      const dividend = await tx.dividend.create({
        data: {
          ...data,
          netAmount: data.grossAmount - data.taxAmount,
        }
      });
      
      // Se marcou para criar transação
      if (data.createTransaction) {
        await tx.transaction.create({
          data: {
            userId: data.userId,
            type: 'INCOME',
            amount: dividend.netAmount,
            category: 'Dividendos',
            description: `Dividendo ${data.investmentId}`,
            date: data.paymentDate,
            accountId: data.accountId,
          }
        });
      }
      
      return dividend;
    });
  }
  
  // Calcular IR
  async calculateTax(userId: string, year: number) {
    const investments = await db.investment.findMany({
      where: { userId },
      include: { dividends: true }
    });
    
    // Calcular IR por tipo
    const stockTax = this.calculateStockTax(investments);
    const fixedIncomeTax = this.calculateFixedIncomeTax(investments);
    const reitTax = this.calculateReitTax(investments);
    
    return {
      stockTax,
      fixedIncomeTax,
      reitTax,
      total: stockTax + fixedIncomeTax + reitTax,
    };
  }
  
  // Sugerir rebalanceamento
  async suggestRebalancing(userId: string, riskProfile: RiskProfile) {
    const portfolio = await this.getPortfolio(userId);
    const idealAllocation = this.getIdealAllocation(riskProfile);
    
    const suggestions = [];
    
    // Comparar alocação atual vs ideal
    for (const [type, idealPercent] of Object.entries(idealAllocation)) {
      const currentPercent = portfolio.allocation[type] || 0;
      const diff = idealPercent - currentPercent;
      
      if (Math.abs(diff) > 5) { // Diferença > 5%
        suggestions.push({
          type,
          action: diff > 0 ? 'BUY' : 'SELL',
          amount: (portfolio.totalValue * Math.abs(diff)) / 100,
          reason: `Rebalancear para ${idealPercent}%`
        });
      }
    }
    
    return suggestions;
  }
}
```


---

## 🎓 RECURSOS EDUCACIONAIS

### 1. Glossário Integrado

```
┌─────────────────────────────────────────────────────────┐
│  📚 O QUE É ISSO?                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Quando o usuário passa o mouse sobre termos técnicos:  │
│                                                         │
│  [Dividend Yield] ← hover                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 💡 Dividend Yield                               │   │
│  │                                                 │   │
│  │ É o percentual de retorno anual que você       │   │
│  │ recebe em dividendos em relação ao preço       │   │
│  │ da ação.                                        │   │
│  │                                                 │   │
│  │ Exemplo: Se uma ação custa R$ 100 e paga      │   │
│  │ R$ 6 por ano em dividendos, o yield é 6%.     │   │
│  │                                                 │   │
│  │ [Saiba mais]                                    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2. Dicas Contextuais

```typescript
const investmentTips = {
  'low-diversification': {
    title: '⚠️ Portfólio Pouco Diversificado',
    message: 'Você tem mais de 50% em um único ativo. Considere diversificar para reduzir riscos.',
    action: 'Ver Sugestões de Diversificação',
  },
  'high-crypto-exposure': {
    title: '⚠️ Alta Exposição a Cripto',
    message: 'Criptomoedas são muito voláteis. Recomendamos no máximo 5% do portfólio.',
    action: 'Rebalancear Portfólio',
  },
  'no-emergency-fund': {
    title: '⚠️ Sem Reserva de Emergência',
    message: 'Antes de investir, tenha 6 meses de despesas em Renda Fixa líquida.',
    action: 'Criar Meta de Reserva',
  },
  'good-performance': {
    title: '🎉 Ótima Performance!',
    message: 'Seu portfólio está batendo o CDI em 2%. Continue assim!',
    action: 'Ver Análise Detalhada',
  },
};
```

### 3. Tutoriais Interativos

```
┌─────────────────────────────────────────────────────────┐
│  🎓 TUTORIAL: Como Registrar um Investimento            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Passo 1 de 5: Escolha o Tipo de Investimento          │
│                                                         │
│  [🟦 Renda Fixa] [🟩 Ações] [🟨 FIIs] [🟧 Cripto]      │
│                    ↑                                    │
│                    └─ Clique aqui                       │
│                                                         │
│  💡 Dica: Se você está começando, recomendamos          │
│     Renda Fixa (menor risco).                           │
│                                                         │
│  [Pular Tutorial]                          [Próximo →]  │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 RESPONSIVIDADE MOBILE

### Layout Mobile

```
┌─────────────────────┐
│  💎 Portfólio       │
├─────────────────────┤
│                     │
│  R$ 125.450         │
│  ↑ +5,2% mês        │
│                     │
│  [Ver Detalhes]     │
├─────────────────────┤
│  📊 Alocação        │
│  [Gráfico Pizza]    │
├─────────────────────┤
│  📈 Evolução        │
│  [Gráfico Linha]    │
├─────────────────────┤
│  📋 Ativos          │
│                     │
│  🟩 PETR4           │
│  R$ 15.250          │
│  +7,5%              │
│  [Ver mais]         │
│                     │
│  🟨 HGLG11          │
│  R$ 18.817          │
│  +2,7%              │
│  [Ver mais]         │
│                     │
│  [+ Novo Ativo]     │
└─────────────────────┘
```

### Gestos Mobile

- **Swipe Left**: Editar ativo
- **Swipe Right**: Ver detalhes
- **Long Press**: Menu de ações
- **Pull to Refresh**: Atualizar dados

---

## 🔔 NOTIFICAÇÕES E ALERTAS

### Tipos de Alertas

```typescript
const investmentAlerts = [
  {
    type: 'DIVIDEND_UPCOMING',
    title: 'Dividendo Próximo',
    message: 'PETR4 pagará R$ 250 em 3 dias',
    priority: 'medium',
    action: 'Ver Calendário',
  },
  {
    type: 'TAX_DUE',
    title: 'DARF Vencendo',
    message: 'IR de R$ 345 vence em 5 dias',
    priority: 'high',
    action: 'Gerar DARF',
  },
  {
    type: 'REBALANCE_NEEDED',
    title: 'Rebalanceamento Sugerido',
    message: 'Seu portfólio está desbalanceado',
    priority: 'low',
    action: 'Ver Sugestões',
  },
  {
    type: 'PRICE_ALERT',
    title: 'Alerta de Preço',
    message: 'PETR4 caiu 5% hoje',
    priority: 'medium',
    action: 'Ver Ativo',
  },
  {
    type: 'GOAL_ACHIEVED',
    title: 'Meta Atingida! 🎉',
    message: 'Você atingiu R$ 100k em investimentos',
    priority: 'high',
    action: 'Celebrar',
  },
];
```

---

## 📊 RELATÓRIOS EXPORTÁVEIS

### 1. Relatório Mensal (PDF)

```
┌─────────────────────────────────────────────────────────┐
│  RELATÓRIO DE INVESTIMENTOS - OUTUBRO 2024             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  RESUMO DO PORTFÓLIO                                    │
│  • Patrimônio Total: R$ 125.450,00                      │
│  • Rentabilidade Mês: +5,2%                             │
│  • Rentabilidade Ano: +12,5%                            │
│  • Dividendos Recebidos: R$ 1.250,00                    │
│                                                         │
│  ALOCAÇÃO                                               │
│  • Renda Fixa: 45% (R$ 56.450)                          │
│  • Ações: 30% (R$ 37.635)                               │
│  • FIIs: 15% (R$ 18.817)                                │
│  • Cripto: 5% (R$ 6.272)                                │
│  • Internacional: 5% (R$ 6.272)                         │
│                                                         │
│  PERFORMANCE POR ATIVO                                  │
│  1. PETR4: +7,5% (R$ 15.250)                            │
│  2. VALE3: +6,2% (R$ 12.385)                            │
│  3. HGLG11: +2,7% (R$ 18.817)                           │
│  ...                                                    │
│                                                         │
│  DIVIDENDOS RECEBIDOS                                   │
│  • 15/10: PETR4 - R$ 250,00                             │
│  • 18/10: HGLG11 - R$ 180,00                            │
│  • 25/10: VALE3 - R$ 120,00                             │
│  ...                                                    │
│                                                         │
│  PRÓXIMOS EVENTOS                                       │
│  • 15/11: Dividendo PETR4 (R$ 250)                      │
│  • 30/11: Vencimento DARF (R$ 345)                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Relatório Anual (Excel)

**Abas:**
- Resumo Anual
- Evolução Mensal
- Dividendos Recebidos
- IR a Pagar
- Performance por Ativo
- Alocação Histórica

---

## 🎯 DIFERENCIAIS vs GRANDES PLAYERS

### O que SuaGrana TEM que outros NÃO TÊM (Offline)

1. **Privacidade Total**
   - Sem APIs externas
   - Dados 100% locais
   - Sem compartilhamento

2. **Controle Manual Completo**
   - Usuário decide quando atualizar
   - Sem surpresas de sincronização
   - Funciona offline

3. **Educação Integrada**
   - Glossário contextual
   - Tutoriais interativos
   - Dicas personalizadas

4. **Cálculos Transparentes**
   - Todas as fórmulas visíveis
   - Explicação de cada métrica
   - Sem "caixa preta"

5. **Sem Conflito de Interesses**
   - Sem recomendações pagas
   - Sem anúncios de produtos
   - Foco no usuário

### O que FALTA (mas é aceitável para offline)

1. ❌ Atualização automática de cotações
   - **Solução**: Atualização manual facilitada
   - **Vantagem**: Usuário controla quando

2. ❌ Sincronização bancária
   - **Solução**: Importação de extratos
   - **Vantagem**: Privacidade total

3. ❌ Notícias em tempo real
   - **Solução**: Links para fontes confiáveis
   - **Vantagem**: Sem ruído

---

## 📈 MÉTRICAS DE SUCESSO

### KPIs da Nova Página

1. **Engajamento**
   - Tempo médio na página: > 5 min
   - Ativos cadastrados por usuário: > 5
   - Atualizações de preço por mês: > 4

2. **Educação**
   - Glossário consultado: > 3x/semana
   - Tutoriais completados: > 80%
   - Dicas aplicadas: > 50%

3. **Ações**
   - Rebalanceamentos realizados: > 1/trimestre
   - Dividendos registrados: > 90%
   - Relatórios exportados: > 1/mês

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### FASE 1: MVP (4 semanas)

**Semana 1-2: Estrutura Base**
- [ ] Criar tabelas (Investment, Dividend)
- [ ] Criar serviços básicos
- [ ] Criar hooks (useInvestmentPortfolio)

**Semana 3-4: Interface**
- [ ] Dashboard com cards
- [ ] Gráfico de alocação
- [ ] Lista de ativos
- [ ] Modal de cadastro

### FASE 2: Funcionalidades Avançadas (4 semanas)

**Semana 5-6: Análises**
- [ ] Gráfico de evolução
- [ ] Cálculo de rentabilidade
- [ ] Comparação com benchmarks
- [ ] Análise de diversificação

**Semana 7-8: Dividendos e IR**
- [ ] Registro de dividendos
- [ ] Calendário de eventos
- [ ] Cálculo de IR
- [ ] Geração de DARF

### FASE 3: Polimento (2 semanas)

**Semana 9-10: UX e Educação**
- [ ] Glossário contextual
- [ ] Tutoriais interativos
- [ ] Dicas personalizadas
- [ ] Relatórios exportáveis
- [ ] Responsividade mobile

---

## 💡 CONCLUSÃO

### Nota Esperada: 9/10

Com esta reformulação, a página de investimentos do SuaGrana:

✅ **Mantém a filosofia offline** (privacidade e controle)
✅ **Oferece análises profundas** (rentabilidade, diversificação, IR)
✅ **Educa o usuário** (glossário, tutoriais, dicas)
✅ **Facilita a gestão** (dividendos, rebalanceamento, calendário)
✅ **Compete com grandes players** (funcionalidades similares)

### Diferencial Único

**"O melhor sistema de investimentos offline do mercado"**

- Privacidade total (sem APIs externas)
- Controle manual inteligente
- Educação financeira integrada
- Cálculos transparentes
- Sem conflito de interesses

---

**Proposta criada por:** Kiro AI  
**Data:** 28/10/2025  
**Status:** 📋 Pronta para Implementação

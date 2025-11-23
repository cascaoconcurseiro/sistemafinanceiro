# 🎨 Design System SuaGrana
## Sistema de Design Completo para Gestão Financeira

---

## 📐 1. FUNDAÇÕES VISUAIS

### 1.1 Paleta de Cores Principal

```typescript
// Cores Semânticas Financeiras
const colors = {
  // Identidade da Marca
  brand: {
    primary: '#10B981',      // Verde confiável (receitas, positivo)
    secondary: '#3B82F6',    // Azul profissional (neutro, informação)
    accent: '#8B5CF6',       // Roxo premium (destaque, premium)
  },
  
  // Semântica Financeira
  financial: {
    income: '#10B981',       // Verde - Receitas
    expense: '#EF4444',      // Vermelho - Despesas
    transfer: '#F59E0B',     // Laranja - Transferências
    investment: '#8B5CF6',   // Roxo - Investimentos
    debt: '#DC2626',         // Vermelho escuro - Dívidas
    credit: '#059669',       // Verde escuro - Créditos
  },
  
  // Estados de Transação
  status: {
    paid: '#10B981',         // Pago
    pending: '#F59E0B',      // Pendente
    overdue: '#DC2626',      // Atrasado
    scheduled: '#3B82F6',    // Agendado
    cancelled: '#6B7280',    // Cancelado
  },
  
  // Neutrals (Escala de Cinza)
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    dark: '#111827',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Feedback
  feedback: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  }
}
```

### 1.2 Tipografia

```typescript
const typography = {
  // Família de Fontes
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, Consolas, monospace',
    display: 'Poppins, Inter, sans-serif',
  },
  
  // Escala de Tamanhos
  fontSize: {
    xs: '0.75rem',    // 12px - Labels pequenos
    sm: '0.875rem',   // 14px - Texto secundário
    base: '1rem',     // 16px - Texto padrão
    lg: '1.125rem',   // 18px - Destaque
    xl: '1.25rem',    // 20px - Subtítulos
    '2xl': '1.5rem',  // 24px - Títulos
    '3xl': '1.875rem',// 30px - Títulos grandes
    '4xl': '2.25rem', // 36px - Display
    '5xl': '3rem',    // 48px - Hero
  },
  
  // Pesos
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Altura de Linha
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  }
}
```


### 1.3 Espaçamento e Grid

```typescript
const spacing = {
  // Escala de Espaçamento (baseada em 4px)
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
}

const layout = {
  // Container
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Breakpoints
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },
  
  // Grid
  grid: {
    columns: 12,
    gap: '1.5rem',
  }
}
```

### 1.4 Sombras e Elevação

```typescript
const shadows = {
  // Elevação de Componentes
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Sombras Coloridas (para destaque)
  success: '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
  error: '0 4px 14px 0 rgba(239, 68, 68, 0.25)',
  warning: '0 4px 14px 0 rgba(245, 158, 11, 0.25)',
  info: '0 4px 14px 0 rgba(59, 130, 246, 0.25)',
}

const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  base: '0.5rem',  // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  full: '9999px',  // Circular
}
```

---

## 🧩 2. COMPONENTES FUNDAMENTAIS

### 2.1 Cards Financeiros

```typescript
// Card de Conta/Cartão
interface AccountCard {
  // Hierarquia Visual
  - Logo do banco (32x32px) no topo esquerdo
  - Nome da conta (font-semibold, text-lg)
  - Tipo de conta (text-sm, text-neutral-500)
  - Saldo (font-bold, text-3xl, cor semântica)
  - Limite disponível (se cartão de crédito)
  
  // Estados Visuais
  - Default: shadow-md, border-neutral-200
  - Hover: shadow-lg, scale-102, transition-all
  - Active: shadow-xl, border-brand-primary
  - Disabled: opacity-50, grayscale
  
  // Variações
  - Compact: altura reduzida, informações essenciais
  - Expanded: mostra últimas transações
  - Summary: apenas saldo e nome
}
```


### 2.2 Lista de Transações

```typescript
// Item de Transação
interface TransactionItem {
  // Estrutura Visual (Grid de 4 colunas)
  [Ícone Categoria] [Descrição + Data] [Conta/Cartão] [Valor]
  
  // Hierarquia
  - Ícone: 40x40px, background colorido da categoria
  - Descrição: font-medium, text-base, text-neutral-900
  - Data: text-sm, text-neutral-500, abaixo da descrição
  - Conta: text-sm, text-neutral-600, com logo pequeno
  - Valor: font-semibold, text-lg, cor semântica
  
  // Indicadores Visuais
  - Borda esquerda colorida (4px) indica tipo
  - Badge de status (pago/pendente/atrasado)
  - Ícone de parcelamento se aplicável
  - Ícone de compartilhamento se despesa compartilhada
  
  // Interações
  - Hover: background-neutral-50
  - Click: abre modal de detalhes
  - Swipe (mobile): ações rápidas (editar/excluir)
}

// Agrupamento
interface TransactionGroup {
  - Cabeçalho de data (sticky)
  - Subtotal do dia
  - Separador visual sutil
  - Transições suaves entre grupos
}
```

### 2.3 Indicadores Financeiros

```typescript
// KPI Card (Key Performance Indicator)
interface KPICard {
  // Estrutura
  - Label (text-sm, text-neutral-600)
  - Valor principal (font-bold, text-3xl)
  - Variação percentual (com seta ↑↓)
  - Sparkline (gráfico miniatura de tendência)
  
  // Cores Semânticas
  - Positivo: text-financial-income
  - Negativo: text-financial-expense
  - Neutro: text-neutral-700
  
  // Animações
  - CountUp animation nos valores
  - Fade in ao carregar
  - Pulse sutil em atualizações
}

// Progress Bar (para metas e orçamentos)
interface ProgressIndicator {
  - Barra de progresso com gradiente
  - Porcentagem atual
  - Valor atual / Valor meta
  - Cores: verde (< 70%), amarelo (70-90%), vermelho (> 90%)
  - Animação de preenchimento suave
}
```

### 2.4 Formulários

```typescript
// Input Field
interface FormInput {
  // Estados
  - Default: border-neutral-300
  - Focus: border-brand-primary, ring-4, ring-brand-primary/10
  - Error: border-feedback-error, text-feedback-error
  - Success: border-feedback-success
  - Disabled: background-neutral-100, cursor-not-allowed
  
  // Variações
  - Text: altura 44px (touch-friendly)
  - Currency: alinhamento à direita, formatação automática
  - Date: com date picker customizado
  - Select: com ícone dropdown, search interno
  
  // Acessibilidade
  - Label sempre visível
  - Helper text abaixo
  - Error message com ícone
  - Placeholder descritivo
}

// Button
interface Button {
  // Variantes
  primary: {
    background: 'brand-primary',
    hover: 'darken 10%',
    active: 'darken 15%',
    shadow: 'md',
  },
  secondary: {
    background: 'transparent',
    border: 'brand-primary',
    color: 'brand-primary',
  },
  ghost: {
    background: 'transparent',
    hover: 'neutral-100',
  },
  danger: {
    background: 'feedback-error',
    hover: 'darken 10%',
  },
  
  // Tamanhos
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg',
  
  // Estados
  - Loading: spinner + disabled
  - Disabled: opacity-50 + cursor-not-allowed
  - Success: checkmark animation
}
```

---

## 📱 3. PADRÕES DE INTERFACE

### 3.1 Dashboard Principal

```
┌─────────────────────────────────────────────────────────┐
│ [Logo] SuaGrana              [Notificações] [Perfil]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 💰 Saldo     │  │ 📈 Receitas  │  │ 📉 Despesas  │ │
│  │ R$ 15.420,00 │  │ R$ 8.500,00  │  │ R$ 6.200,00  │ │
│  │ ↑ +12% mês   │  │ ↑ +5% mês    │  │ ↓ -8% mês    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │ 📊 Visão Geral do Mês                              ││
│  │ [Gráfico de barras: Receitas vs Despesas]         ││
│  │ [Linha de tendência de saldo]                      ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────┐  ┌─────────────────────────┐ │
│  │ 💳 Contas & Cartões │  │ 📝 Transações Recentes  │ │
│  │                     │  │                         │ │
│  │ [Lista de contas]   │  │ [Lista de transações]   │ │
│  │ com saldos          │  │ últimos 7 dias          │ │
│  └─────────────────────┘  └─────────────────────────┘ │
│                                                          │
│  [+ Nova Transação] - FAB (Floating Action Button)     │
└─────────────────────────────────────────────────────────┘
```


### 3.2 Modal de Nova Transação

```
┌─────────────────────────────────────────────┐
│ ✕ Nova Transação                            │
├─────────────────────────────────────────────┤
│                                              │
│ [Receita] [Despesa] [Transferência]         │
│   ✓                                          │
│                                              │
│ Valor                                        │
│ ┌─────────────────────────────────────────┐ │
│ │ R$ 1.500,00                             │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Descrição                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Salário                                 │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Categoria                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ 💼 Salário                       ▼      │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Conta                                        │
│ ┌─────────────────────────────────────────┐ │
│ │ 🏦 Nubank - Conta Corrente       ▼      │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Data                                         │
│ ┌─────────────────────────────────────────┐ │
│ │ 22/11/2025                       📅     │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ☐ Transação recorrente                      │
│ ☐ Parcelar                                   │
│                                              │
│         [Cancelar]  [Salvar Transação]      │
└─────────────────────────────────────────────┘
```

### 3.3 Tela de Faturas (Cartão de Crédito)

```
┌─────────────────────────────────────────────────────────┐
│ ← Faturas - Nubank Mastercard                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │ 📅 Fatura Atual - Novembro 2025                    ││
│  │                                                     ││
│  │ R$ 3.450,00                                         ││
│  │ Vencimento: 15/12/2025 (23 dias)                   ││
│  │                                                     ││
│  │ ████████████░░░░░░░░ 65% do limite                 ││
│  │                                                     ││
│  │ [Ver Detalhes] [Pagar Fatura]                      ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Transações da Fatura                                   │
│  ┌────────────────────────────────────────────────────┐│
│  │ 🛒 Mercado Livre          18/11  R$ 250,00         ││
│  │ 🍔 iFood                  17/11  R$ 45,90          ││
│  │ ⛽ Posto Shell            16/11  R$ 200,00         ││
│  │ 📱 Netflix (3/12)         15/11  R$ 39,90          ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Faturas Anteriores                                     │
│  ┌────────────────────────────────────────────────────┐│
│  │ Outubro 2025    R$ 2.890,00    ✓ Paga             ││
│  │ Setembro 2025   R$ 3.120,00    ✓ Paga             ││
│  └────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 3.4 Despesas Compartilhadas

```
┌─────────────────────────────────────────────────────────┐
│ ← Viagem - Rio de Janeiro 2025                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Visão Geral] [Despesas] [Divisão] [Acerto]           │
│       ✓                                                  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │ 💰 Total Gasto: R$ 4.500,00                        ││
│  │ 👥 Participantes: 3 pessoas                        ││
│  │ 📅 Período: 15/12 - 20/12/2025                     ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Despesas                                                │
│  ┌────────────────────────────────────────────────────┐│
│  │ 🏨 Hotel Copacabana                                ││
│  │    Pago por: João                                  ││
│  │    R$ 1.800,00 ÷ 3 = R$ 600,00/pessoa             ││
│  │    ✓ João  ⏳ Maria  ⏳ Pedro                      ││
│  ├────────────────────────────────────────────────────┤│
│  │ 🍽️ Jantar Restaurante                              ││
│  │    Pago por: Maria                                 ││
│  │    R$ 450,00 ÷ 3 = R$ 150,00/pessoa               ││
│  │    ✓ Maria  ✓ João  ⏳ Pedro                      ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  Saldo de Cada Um                                        │
│  ┌────────────────────────────────────────────────────┐│
│  │ João:  Pagou R$ 1.800  |  Deve receber R$ 300     ││
│  │ Maria: Pagou R$ 1.200  |  Deve receber R$ 150     ││
│  │ Pedro: Pagou R$ 0      |  Deve pagar R$ 450       ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
│  [+ Nova Despesa]                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎭 4. PRINCÍPIOS DE UX

### 4.1 Hierarquia de Informação

```
Nível 1 (Mais Importante)
├─ Saldos e valores principais
├─ Status de pagamento
└─ Ações primárias

Nível 2 (Importante)
├─ Detalhes de transações
├─ Datas e prazos
└─ Categorias

Nível 3 (Contexto)
├─ Metadados
├─ Descrições complementares
└─ Ações secundárias
```

### 4.2 Feedback Visual

```typescript
// Transições e Animações
const animations = {
  // Micro-interações
  buttonClick: 'scale-95 duration-100',
  cardHover: 'scale-102 duration-200',
  modalOpen: 'fade-in + slide-up duration-300',
  
  // Feedback de Ações
  successAction: {
    icon: 'checkmark bounce',
    toast: 'slide-in-right',
    duration: '3s',
  },
  
  errorAction: {
    icon: 'shake',
    toast: 'slide-in-right',
    color: 'feedback-error',
  },
  
  // Loading States
  skeleton: 'pulse',
  spinner: 'rotate infinite',
  progressBar: 'width transition-all duration-500',
}
```


### 4.3 Responsividade

```typescript
// Breakpoints Strategy
const responsive = {
  mobile: {
    // 320px - 767px
    layout: 'single-column',
    navigation: 'bottom-tab-bar',
    cards: 'full-width',
    modals: 'full-screen',
    fontSize: 'base',
  },
  
  tablet: {
    // 768px - 1023px
    layout: 'two-column',
    navigation: 'side-drawer',
    cards: 'grid-2',
    modals: 'centered-large',
    fontSize: 'base',
  },
  
  desktop: {
    // 1024px+
    layout: 'three-column',
    navigation: 'sidebar-fixed',
    cards: 'grid-3',
    modals: 'centered-medium',
    fontSize: 'base',
  }
}
```

### 4.4 Acessibilidade

```typescript
const accessibility = {
  // Contraste
  minContrast: {
    text: '4.5:1',      // WCAG AA
    largeText: '3:1',   // WCAG AA
    interactive: '3:1', // WCAG AA
  },
  
  // Tamanhos Mínimos
  touchTarget: '44x44px',  // iOS/Android guidelines
  fontSize: '16px',        // Evita zoom automático mobile
  
  // Navegação por Teclado
  focusVisible: 'ring-2 ring-brand-primary ring-offset-2',
  skipLinks: 'visible on focus',
  
  // Screen Readers
  ariaLabels: 'sempre presentes',
  semanticHTML: 'uso correto de tags',
  altText: 'descritivo e conciso',
}
```

---

## 🎨 5. IDENTIDADE VISUAL

### 5.1 Logo e Marca

```
┌─────────────────────────────────────────┐
│                                          │
│     💰 SuaGrana                          │
│     ─────────────                        │
│     Controle Financeiro Inteligente     │
│                                          │
└─────────────────────────────────────────┘

Variações:
- Logo completo (com tagline)
- Logo simplificado (apenas ícone + nome)
- Ícone isolado (para favicon, app icon)

Cores da Marca:
- Principal: Verde #10B981 (confiança, crescimento)
- Secundária: Azul #3B82F6 (profissionalismo)
- Accent: Roxo #8B5CF6 (premium, diferenciação)
```

### 5.2 Iconografia

```typescript
// Sistema de Ícones
const icons = {
  // Categorias Financeiras
  categories: {
    alimentacao: '🍔',
    transporte: '🚗',
    moradia: '🏠',
    saude: '🏥',
    educacao: '📚',
    lazer: '🎮',
    vestuario: '👕',
    outros: '📦',
  },
  
  // Tipos de Transação
  transactions: {
    income: '💰',
    expense: '💸',
    transfer: '🔄',
    investment: '📈',
  },
  
  // Instituições Financeiras
  accounts: {
    bank: '🏦',
    creditCard: '💳',
    wallet: '👛',
    investment: '📊',
  },
  
  // Ações
  actions: {
    add: '+',
    edit: '✏️',
    delete: '🗑️',
    filter: '🔍',
    export: '📤',
    import: '📥',
  }
}

// Biblioteca de Ícones: Lucide React
// - Consistente
// - Leve (tree-shakeable)
// - Customizável
```

### 5.3 Ilustrações

```typescript
// Uso de Ilustrações
const illustrations = {
  // Empty States
  noTransactions: 'Ilustração de carteira vazia',
  noAccounts: 'Ilustração de cofre',
  noDebts: 'Ilustração de pessoa feliz',
  
  // Onboarding
  welcome: 'Ilustração de boas-vindas',
  tutorial: 'Ilustrações explicativas',
  
  // Erros
  error404: 'Ilustração de página não encontrada',
  error500: 'Ilustração de erro de servidor',
  noConnection: 'Ilustração de sem conexão',
  
  // Estilo
  style: 'flat, minimalista, 2-3 cores',
  tone: 'amigável, não infantil',
}
```

---

## 📊 6. VISUALIZAÇÃO DE DADOS

### 6.1 Gráficos

```typescript
// Biblioteca: Recharts ou Chart.js
const charts = {
  // Gráfico de Barras (Receitas vs Despesas)
  barChart: {
    colors: ['financial-income', 'financial-expense'],
    animation: 'slide-up',
    tooltip: 'custom com valores formatados',
    legend: 'bottom',
  },
  
  // Gráfico de Linha (Evolução do Saldo)
  lineChart: {
    color: 'brand-primary',
    gradient: 'fade to transparent',
    area: true,
    smooth: true,
  },
  
  // Gráfico de Pizza (Despesas por Categoria)
  pieChart: {
    colors: 'categoria-specific',
    labels: 'outside',
    percentage: true,
    interactive: 'hover to highlight',
  },
  
  // Sparklines (Mini gráficos em cards)
  sparkline: {
    height: '40px',
    color: 'neutral-400',
    strokeWidth: 2,
    noAxis: true,
  }
}
```

### 6.2 Tabelas

```typescript
// Tabela de Transações
const table = {
  // Estrutura
  header: {
    background: 'neutral-50',
    fontWeight: 'semibold',
    sticky: true,
  },
  
  row: {
    hover: 'background-neutral-50',
    border: 'bottom only',
    height: '56px',
  },
  
  // Funcionalidades
  sorting: 'click header to sort',
  filtering: 'search + filters',
  pagination: '20 items per page',
  
  // Responsividade
  mobile: 'card layout instead of table',
  tablet: 'horizontal scroll',
  desktop: 'full table',
}
```

---

## 🔔 7. NOTIFICAÇÕES E ALERTAS

### 7.1 Toast Notifications

```typescript
const toast = {
  // Posicionamento
  position: 'top-right',
  
  // Tipos
  success: {
    icon: '✓',
    color: 'feedback-success',
    duration: '3s',
  },
  
  error: {
    icon: '✕',
    color: 'feedback-error',
    duration: '5s',
  },
  
  warning: {
    icon: '⚠',
    color: 'feedback-warning',
    duration: '4s',
  },
  
  info: {
    icon: 'ℹ',
    color: 'feedback-info',
    duration: '3s',
  },
  
  // Comportamento
  dismissible: true,
  stackable: true,
  maxVisible: 3,
}
```


### 7.2 Alertas In-Page

```typescript
const alerts = {
  // Banner de Alerta (topo da página)
  banner: {
    warning: 'Fatura vencendo em 3 dias',
    error: 'Conta com saldo negativo',
    info: 'Nova funcionalidade disponível',
    
    style: {
      fullWidth: true,
      dismissible: true,
      icon: true,
      action: 'optional button',
    }
  },
  
  // Alert Box (inline)
  inline: {
    padding: 'p-4',
    border: 'left-4',
    icon: 'left',
    title: 'bold',
    description: 'text-sm',
  }
}
```

---

## 🎯 8. PADRÕES DE NAVEGAÇÃO

### 8.1 Estrutura de Navegação

```
Desktop:
┌─────────────────────────────────────────────┐
│ [Logo]  Dashboard  Transações  Contas  ... │
├──────┬──────────────────────────────────────┤
│      │                                      │
│ Nav  │         Conteúdo Principal          │
│ Bar  │                                      │
│      │                                      │
└──────┴──────────────────────────────────────┘

Mobile:
┌─────────────────────────────────────────────┐
│ [☰]  Título da Página            [🔔] [👤] │
├─────────────────────────────────────────────┤
│                                              │
│         Conteúdo Principal                  │
│                                              │
├─────────────────────────────────────────────┤
│ [🏠] [💰] [📊] [💳] [⚙️]                    │
└─────────────────────────────────────────────┘
```

### 8.2 Menu de Navegação

```typescript
const navigation = {
  // Itens Principais
  items: [
    { icon: '🏠', label: 'Dashboard', path: '/' },
    { icon: '💰', label: 'Transações', path: '/transactions' },
    { icon: '💳', label: 'Contas', path: '/accounts' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '🎯', label: 'Metas', path: '/goals' },
    { icon: '👥', label: 'Compartilhado', path: '/shared' },
    { icon: '⚙️', label: 'Configurações', path: '/settings' },
  ],
  
  // Estados
  active: {
    background: 'brand-primary/10',
    color: 'brand-primary',
    borderLeft: '4px solid brand-primary',
  },
  
  hover: {
    background: 'neutral-100',
  }
}
```

---

## 💡 9. ESTADOS E FEEDBACK

### 9.1 Loading States

```typescript
const loading = {
  // Skeleton Screens
  skeleton: {
    background: 'neutral-200',
    animation: 'pulse',
    borderRadius: 'base',
    
    // Componentes
    card: 'altura do card real',
    text: 'linhas com larguras variadas',
    image: 'quadrado ou retângulo',
  },
  
  // Spinners
  spinner: {
    size: {
      sm: '16px',
      md: '24px',
      lg: '32px',
    },
    color: 'brand-primary',
    position: 'center of container',
  },
  
  // Progress Bar
  progressBar: {
    height: '4px',
    color: 'brand-primary',
    position: 'top of page',
    indeterminate: true,
  }
}
```

### 9.2 Empty States

```typescript
const emptyStates = {
  // Estrutura
  structure: {
    icon: 'ilustração ou ícone grande',
    title: 'mensagem clara',
    description: 'explicação breve',
    action: 'CTA para resolver',
  },
  
  // Exemplos
  noTransactions: {
    icon: '💰',
    title: 'Nenhuma transação ainda',
    description: 'Comece adicionando sua primeira transação',
    action: '+ Nova Transação',
  },
  
  noResults: {
    icon: '🔍',
    title: 'Nenhum resultado encontrado',
    description: 'Tente ajustar os filtros',
    action: 'Limpar Filtros',
  }
}
```

### 9.3 Error States

```typescript
const errorStates = {
  // Erro de Validação
  validation: {
    position: 'below input',
    color: 'feedback-error',
    icon: '⚠',
    animation: 'shake',
  },
  
  // Erro de Rede
  network: {
    type: 'banner',
    message: 'Sem conexão com a internet',
    action: 'Tentar novamente',
    persistent: true,
  },
  
  // Erro de Servidor
  server: {
    type: 'full-page',
    illustration: true,
    message: 'Algo deu errado',
    description: 'Estamos trabalhando para resolver',
    action: 'Voltar ao início',
  }
}
```

---

## 🎨 10. TEMAS E PERSONALIZAÇÃO

### 10.1 Modo Escuro

```typescript
const darkMode = {
  // Cores Ajustadas
  background: {
    primary: '#111827',
    secondary: '#1F2937',
    tertiary: '#374151',
  },
  
  text: {
    primary: '#F9FAFB',
    secondary: '#D1D5DB',
    tertiary: '#9CA3AF',
  },
  
  // Ajustes de Contraste
  shadows: 'reduzidas',
  borders: 'mais sutis',
  
  // Cores Semânticas (mantidas)
  financial: {
    income: '#10B981',  // mantido
    expense: '#EF4444', // mantido
  }
}
```

### 10.2 Temas Personalizados

```typescript
const themes = {
  // Tema Padrão (Verde)
  default: {
    primary: '#10B981',
    secondary: '#3B82F6',
  },
  
  // Tema Azul
  blue: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
  },
  
  // Tema Roxo
  purple: {
    primary: '#8B5CF6',
    secondary: '#EC4899',
  },
  
  // Aplicação
  apply: 'CSS variables + localStorage',
}
```

---

## 📐 11. GRID E LAYOUT SYSTEM

### 11.1 Grid de 12 Colunas

```typescript
const grid = {
  // Desktop (1024px+)
  desktop: {
    columns: 12,
    gap: '24px',
    margin: '48px',
    
    // Exemplos de uso
    sidebar: 'col-span-3',
    main: 'col-span-9',
    card: 'col-span-4',
  },
  
  // Tablet (768px - 1023px)
  tablet: {
    columns: 8,
    gap: '16px',
    margin: '32px',
  },
  
  // Mobile (< 768px)
  mobile: {
    columns: 4,
    gap: '16px',
    margin: '16px',
  }
}
```

### 11.2 Containers

```typescript
const containers = {
  // Container Principal
  main: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 24px',
  },
  
  // Container Estreito (formulários, leitura)
  narrow: {
    maxWidth: '640px',
    margin: '0 auto',
  },
  
  // Container Largo (dashboards, tabelas)
  wide: {
    maxWidth: '1536px',
    margin: '0 auto',
  }
}
```

---

## 🚀 12. PERFORMANCE E OTIMIZAÇÃO

### 12.1 Otimizações Visuais

```typescript
const performance = {
  // Lazy Loading
  images: 'lazy load + blur placeholder',
  components: 'React.lazy + Suspense',
  
  // Animações
  animations: {
    useGPU: true,
    properties: ['transform', 'opacity'], // evitar layout shifts
    reducedMotion: 'respeitar preferência do usuário',
  },
  
  // Fontes
  fonts: {
    preload: 'critical fonts',
    display: 'swap',
    subset: 'latin',
  },
  
  // Imagens
  images: {
    format: 'WebP com fallback',
    responsive: 'srcset',
    compression: 'otimizada',
  }
}
```


### 12.2 Métricas de Performance

```typescript
const metrics = {
  // Core Web Vitals
  LCP: '< 2.5s',  // Largest Contentful Paint
  FID: '< 100ms', // First Input Delay
  CLS: '< 0.1',   // Cumulative Layout Shift
  
  // Outras Métricas
  TTI: '< 3.8s',  // Time to Interactive
  FCP: '< 1.8s',  // First Contentful Paint
}
```

---

## 📱 13. MOBILE-FIRST APPROACH

### 13.1 Gestos e Interações Mobile

```typescript
const mobileGestures = {
  // Swipe
  swipeLeft: 'revelar ações (editar/excluir)',
  swipeRight: 'voltar/fechar',
  swipeDown: 'atualizar (pull-to-refresh)',
  
  // Tap
  tap: 'ação primária',
  doubleTap: 'zoom (em gráficos)',
  longPress: 'menu contextual',
  
  // Pinch
  pinchZoom: 'zoom em gráficos',
  
  // Áreas de Toque
  minTouchTarget: '44x44px',
  spacing: '8px entre elementos',
}
```

### 13.2 Navegação Mobile

```typescript
const mobileNavigation = {
  // Bottom Tab Bar
  tabBar: {
    position: 'fixed bottom',
    height: '64px',
    items: 5,
    activeIndicator: 'color + icon fill',
    
    items: [
      { icon: '🏠', label: 'Início' },
      { icon: '💰', label: 'Transações' },
      { icon: '+', label: 'Adicionar', primary: true },
      { icon: '📊', label: 'Relatórios' },
      { icon: '⚙️', label: 'Mais' },
    ]
  },
  
  // FAB (Floating Action Button)
  fab: {
    position: 'bottom-right',
    size: '56px',
    color: 'brand-primary',
    shadow: 'xl',
    action: 'nova transação',
  }
}
```

---

## 🎯 14. CASOS DE USO ESPECÍFICOS

### 14.1 Onboarding

```
Tela 1: Boas-vindas
┌─────────────────────────────────────┐
│                                      │
│         [Ilustração]                │
│                                      │
│    Bem-vindo ao SuaGrana!           │
│                                      │
│    Controle suas finanças de        │
│    forma simples e inteligente      │
│                                      │
│              [Começar]              │
│                                      │
│         ● ○ ○ ○                     │
└─────────────────────────────────────┘

Tela 2: Adicionar Primeira Conta
Tela 3: Configurar Categorias
Tela 4: Tutorial Rápido
```

### 14.2 Fluxo de Pagamento de Fatura

```
1. Ver Fatura
   ↓
2. Confirmar Valor
   ↓
3. Selecionar Conta de Débito
   ↓
4. Confirmar Pagamento
   ↓
5. Feedback de Sucesso
   ↓
6. Atualização Automática de Saldos
```

### 14.3 Criação de Despesa Compartilhada

```
1. Criar Grupo/Viagem
   ↓
2. Adicionar Participantes
   ↓
3. Adicionar Despesa
   ↓
4. Definir Divisão (igual/proporcional/customizada)
   ↓
5. Registrar Pagamento
   ↓
6. Visualizar Saldos
   ↓
7. Acertar Contas
```

---

## 🔐 15. SEGURANÇA E PRIVACIDADE

### 15.1 Indicadores Visuais de Segurança

```typescript
const security = {
  // Dados Sensíveis
  masking: {
    cardNumber: '•••• •••• •••• 1234',
    balance: 'R$ •••,••' (toggle para mostrar),
    cpf: '•••.•••.•••-12',
  },
  
  // Autenticação
  biometric: {
    icon: '👆 ou 👁️',
    fallback: 'senha',
  },
  
  // Sessão
  timeout: {
    warning: '2 minutos antes',
    action: 'renovar ou sair',
  }
}
```

### 15.2 Consentimento e Transparência

```typescript
const privacy = {
  // LGPD Compliance
  dataUsage: 'explicação clara',
  consent: 'opt-in explícito',
  export: 'download de dados',
  delete: 'exclusão de conta',
  
  // Indicadores
  dataSharing: 'ícone de compartilhamento',
  encryption: 'ícone de cadeado',
}
```

---

## 📊 16. RELATÓRIOS E INSIGHTS

### 16.1 Dashboard de Insights

```
┌─────────────────────────────────────────────┐
│ 💡 Insights do Mês                          │
├─────────────────────────────────────────────┤
│                                              │
│ ✓ Você gastou 15% menos que o mês passado  │
│                                              │
│ ⚠ Categoria "Alimentação" acima da média   │
│   R$ 1.200 (média: R$ 800)                  │
│                                              │
│ 📈 Seu patrimônio cresceu R$ 2.500          │
│                                              │
│ 🎯 Faltam R$ 3.000 para sua meta de viagem │
│                                              │
└─────────────────────────────────────────────┘
```

### 16.2 Comparações Temporais

```typescript
const comparisons = {
  // Períodos
  periods: ['Este mês', 'Mês passado', 'Últimos 3 meses', 'Este ano'],
  
  // Visualização
  display: {
    chart: 'linha ou barra',
    percentage: 'variação com seta',
    absolute: 'diferença em reais',
  },
  
  // Cores
  positive: 'financial-income',
  negative: 'financial-expense',
  neutral: 'neutral-600',
}
```

---

## 🎨 17. IMPLEMENTAÇÃO TÉCNICA

### 17.1 Stack Recomendada

```typescript
const techStack = {
  // Styling
  css: 'Tailwind CSS',
  components: 'shadcn/ui + Radix UI',
  icons: 'Lucide React',
  
  // Animações
  animations: 'Framer Motion',
  
  // Gráficos
  charts: 'Recharts',
  
  // Formulários
  forms: 'React Hook Form + Zod',
  
  // Temas
  theming: 'CSS Variables + next-themes',
}
```

### 17.2 Estrutura de Arquivos

```
src/
├── styles/
│   ├── globals.css
│   ├── themes/
│   │   ├── default.css
│   │   └── dark.css
│   └── tokens/
│       ├── colors.css
│       ├── typography.css
│       └── spacing.css
│
├── components/
│   ├── ui/              # Componentes base
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── financial/       # Componentes financeiros
│   │   ├── transaction-item.tsx
│   │   ├── account-card.tsx
│   │   ├── invoice-card.tsx
│   │   └── ...
│   │
│   └── layouts/         # Layouts
│       ├── dashboard-layout.tsx
│       ├── mobile-layout.tsx
│       └── ...
│
└── lib/
    └── design-system/
        ├── colors.ts
        ├── typography.ts
        └── utils.ts
```

### 17.3 Tokens CSS

```css
/* tokens/colors.css */
:root {
  /* Brand */
  --color-brand-primary: #10B981;
  --color-brand-secondary: #3B82F6;
  --color-brand-accent: #8B5CF6;
  
  /* Financial */
  --color-financial-income: #10B981;
  --color-financial-expense: #EF4444;
  --color-financial-transfer: #F59E0B;
  
  /* Status */
  --color-status-paid: #10B981;
  --color-status-pending: #F59E0B;
  --color-status-overdue: #DC2626;
  
  /* Neutrals */
  --color-neutral-50: #F9FAFB;
  --color-neutral-900: #111827;
  
  /* Feedback */
  --color-feedback-success: #10B981;
  --color-feedback-error: #EF4444;
  --color-feedback-warning: #F59E0B;
  --color-feedback-info: #3B82F6;
}

[data-theme="dark"] {
  --color-background-primary: #111827;
  --color-text-primary: #F9FAFB;
  /* ... */
}
```

---

## 🎯 18. CHECKLIST DE IMPLEMENTAÇÃO

### 18.1 Fase 1: Fundações
- [ ] Configurar Tailwind CSS com tokens customizados
- [ ] Implementar sistema de temas (light/dark)
- [ ] Criar componentes base (Button, Input, Card, etc)
- [ ] Configurar tipografia e ícones
- [ ] Implementar grid system

### 18.2 Fase 2: Componentes Financeiros
- [ ] Transaction Item
- [ ] Account Card
- [ ] Invoice Card
- [ ] KPI Cards
- [ ] Charts e gráficos

### 18.3 Fase 3: Layouts e Navegação
- [ ] Dashboard Layout
- [ ] Mobile Navigation
- [ ] Sidebar Navigation
- [ ] Modal System
- [ ] Toast Notifications

### 18.4 Fase 4: Páginas Principais
- [ ] Dashboard
- [ ] Transações
- [ ] Contas
- [ ] Faturas
- [ ] Despesas Compartilhadas
- [ ] Relatórios

### 18.5 Fase 5: Refinamento
- [ ] Animações e transições
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Responsividade completa
- [ ] Acessibilidade (WCAG AA)
- [ ] Performance optimization

---

## 📚 19. REFERÊNCIAS E INSPIRAÇÕES

### 19.1 Design Systems de Referência
- **Nubank**: Simplicidade e clareza
- **Inter**: Profissionalismo e confiança
- **Stripe**: Elegância e precisão
- **Notion**: Flexibilidade e organização

### 19.2 Princípios Aplicados
- **Atomic Design**: Componentes modulares e reutilizáveis
- **Material Design**: Elevação e feedback tátil
- **iOS HIG**: Clareza e profundidade
- **Inclusive Design**: Acessibilidade desde o início

---

## 🎨 20. CONCLUSÃO

Este Design System foi criado pensando em:

✅ **Clareza**: Informações financeiras devem ser fáceis de entender
✅ **Confiança**: Design profissional transmite segurança
✅ **Eficiência**: Usuário consegue realizar tarefas rapidamente
✅ **Consistência**: Padrões visuais em toda aplicação
✅ **Acessibilidade**: Todos podem usar o sistema
✅ **Escalabilidade**: Fácil adicionar novos componentes
✅ **Performance**: Rápido e responsivo

**Próximos Passos:**
1. Validar com usuários reais
2. Criar protótipo interativo (Figma)
3. Implementar gradualmente
4. Documentar componentes (Storybook)
5. Iterar baseado em feedback

---

**Versão**: 1.0  
**Data**: Novembro 2025  
**Autor**: Design System SuaGrana

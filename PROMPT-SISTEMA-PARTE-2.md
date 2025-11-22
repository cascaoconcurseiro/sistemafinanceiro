# 🎯 PROMPT COMPLETO - Sistema SuaGrana (PARTE 2)

## 🔧 FUNCIONALIDADES PRINCIPAIS

### 1. Dashboard
**Componentes:**
- Resumo financeiro (receitas, despesas, saldo)
- Gráficos de evolução mensal
- Despesas por categoria (pizza/donut chart)
- Últimas transações
- Alertas de orçamento
- Metas em progresso
- Faturas próximas do vencimento
- Investimentos (resumo)

**Métricas:**
- Total em contas
- Receitas do mês
- Despesas do mês
- Saldo do mês
- Comparação com mês anterior
- Projeção de gastos

### 2. Transações
**Funcionalidades:**
- Criar transação (receita/despesa/transferência)
- Editar transação
- Deletar transação
- Filtros avançados (data, categoria, conta, tipo)
- Busca por descrição
- Ordenação (data, valor, categoria)
- Paginação
- Exportar (CSV, Excel, PDF)
- Parcelamento automático
- Transações recorrentes
- Vincular a viagem
- Compartilhar despesa
- Anexar comprovante

**Validações:**
- Valor obrigatório e positivo
- Data obrigatória
- Categoria obrigatória
- Conta ou cartão obrigatório
- Descrição obrigatória

### 3. Contas Bancárias
**Funcionalidades:**
- Criar conta
- Editar conta
- Desativar conta
- Ver histórico de saldo
- Reconciliação bancária
- Transferência entre contas
- Cheque especial
- Múltiplas moedas

**Tipos de Conta:**
- Conta Corrente
- Poupança
- Investimento
- Dinheiro

### 4. Cartões de Crédito
**Funcionalidades:**
- Cadastrar cartão
- Editar limite
- Ver fatura atual
- Ver faturas anteriores
- Pagar fatura (total/parcial)
- Estornar pagamento
- Vincular conta de pagamento
- Alertas de vencimento
- Limite excedido

**Cálculo de Fatura:**
- Agrupa transações por período
- Considera data de fechamento
- Calcula data de vencimento
- Permite pagamento parcial
- Registra histórico de pagamentos

### 5. Orçamentos
**Funcionalidades:**
- Criar orçamento por categoria
- Definir período (mensal/trimestral/anual)
- Acompanhar gastos em tempo real
- Alertas de limite (80%, 90%, 100%)
- Comparação com períodos anteriores
- Sugestões de economia

**Cálculo:**
- Soma transações da categoria no período
- Calcula percentual gasto
- Projeta gastos até fim do período
- Alerta quando ultrapassar threshold

### 6. Metas Financeiras
**Funcionalidades:**
- Criar meta
- Definir valor alvo e prazo
- Vincular transações à meta
- Acompanhar progresso
- Calcular quanto falta
- Sugerir valor mensal necessário
- Celebrar conquistas

**Tipos de Meta:**
- Reserva de emergência
- Compra de bem
- Viagem
- Aposentadoria
- Educação
- Outros

### 7. Investimentos
**Funcionalidades:**
- Cadastrar investimento
- Atualizar cotação
- Registrar dividendos
- Calcular rentabilidade
- Diversificação de carteira
- Rebalanceamento
- Histórico de preços
- Alertas de vencimento (renda fixa)

**Tipos:**
- Ações
- FIIs (Fundos Imobiliários)
- Renda Fixa
- Criptomoedas
- Investimentos Internacionais
- Previdência

### 8. Viagens
**Funcionalidades:**
- Criar viagem
- Definir orçamento
- Adicionar participantes
- Vincular transações
- Despesas compartilhadas
- Itinerário
- Checklist
- Relatório de gastos
- Conversão de moedas

**Despesas de Viagem:**
- Transporte
- Hospedagem
- Alimentação
- Passeios
- Compras
- Outros

### 9. Despesas Compartilhadas
**Funcionalidades:**
- Criar despesa compartilhada
- Dividir igualmente ou por percentual
- Registrar quem pagou
- Calcular dívidas
- Simplificar dívidas (algoritmo)
- Registrar pagamentos
- Histórico de acertos

**Algoritmo de Simplificação:**
```typescript
// Reduz número de transações necessárias
// Exemplo: A deve 100 para B, B deve 100 para C
// Resultado: A paga 100 direto para C
```

### 10. Partidas Dobradas (Double Entry)
**Lógica Contábil:**

**Receita:**
```
DÉBITO: Conta Bancária (+)
CRÉDITO: Categoria Receita (+)
```

**Despesa:**
```
DÉBITO: Categoria Despesa (+)
CRÉDITO: Conta Bancária (-)
```

**Transferência:**
```
DÉBITO: Conta Destino (+)
CRÉDITO: Conta Origem (-)
```

**Pagamento de Fatura:**
```
DÉBITO: Cartão de Crédito (reduz saldo devedor)
CRÉDITO: Conta Bancária (-)
```

**Validação:**
- Soma de débitos = Soma de créditos
- Saldo de contas sempre correto
- Auditoria automática
- Detecção de inconsistências

### 11. Notificações Inteligentes
**Tipos:**
- Fatura próxima do vencimento (7, 3, 1 dia antes)
- Orçamento atingindo limite (80%, 90%, 100%)
- Meta alcançada
- Transação suspeita
- Lembrete de pagamento
- Dividendo recebido
- Investimento vencendo

**Canais:**
- In-app
- Email
- Push (PWA)

### 12. Relatórios e Análises
**Relatórios:**
- Fluxo de caixa
- Despesas por categoria
- Evolução patrimonial
- Comparativo mensal
- Análise de investimentos
- Relatório de viagem
- Imposto de renda (preparação)

**Gráficos:**
- Linha (evolução temporal)
- Barra (comparações)
- Pizza (distribuição)
- Área (acumulado)
- Sankey (fluxo de dinheiro)

### 13. Segurança
**Implementações:**
- Autenticação JWT
- 2FA (Two-Factor Authentication)
- Rate Limiting
- CSRF Protection
- XSS Prevention
- SQL Injection Prevention
- Criptografia de dados sensíveis
- Auditoria de ações
- Detecção de fraude
- Bloqueio de IP suspeito

### 14. Performance
**Otimizações:**
- React Query (cache)
- Optimistic Updates
- Lazy Loading
- Code Splitting
- Image Optimization
- Database Indexing
- API Response Caching
- Debounce em buscas
- Virtual Scrolling

### 15. PWA (Progressive Web App)
**Recursos:**
- Instalável
- Offline First
- Service Worker
- Cache Strategy
- Background Sync
- Push Notifications
- App-like Experience

---

## 🎨 COMPONENTES UI

### Componentes Shadcn/ui
- Button
- Input
- Select
- Dialog (Modal)
- Card
- Table
- Form
- Tabs
- Calendar
- DatePicker
- Combobox
- Toast
- Alert
- Badge
- Avatar
- Dropdown Menu
- Sheet (Drawer)
- Skeleton
- Progress
- Tooltip

### Componentes Customizados
- TransactionForm
- AccountCard
- CreditCardCard
- BudgetProgress
- GoalProgress
- InvestmentCard
- TripCard
- CategoryIcon
- AmountInput (formatação de moeda)
- DateRangePicker
- ChartCard
- StatCard
- NotificationBell
- UserMenu

---

## 🔄 FLUXOS PRINCIPAIS

### Fluxo 1: Criar Transação
1. Usuário clica em "Nova Transação"
2. Modal abre com formulário
3. Seleciona tipo (receita/despesa/transferência)
4. Preenche dados (valor, descrição, categoria, conta/cartão, data)
5. Opcionalmente: parcelamento, recorrência, compartilhamento
6. Valida dados (Zod)
7. Envia para API
8. API cria transação
9. API cria lançamentos contábeis (partidas dobradas)
10. API atualiza saldo da conta
11. API atualiza orçamento (se aplicável)
12. API cria notificação (se necessário)
13. Retorna sucesso
14. UI atualiza otimisticamente
15. React Query invalida cache
16. Lista de transações atualiza

### Fluxo 2: Pagar Fatura de Cartão
1. Usuário acessa faturas
2. Seleciona fatura a pagar
3. Escolhe conta de pagamento
4. Define valor (total ou parcial)
5. Confirma pagamento
6. API valida saldo da conta
7. API cria transação de pagamento
8. API atualiza saldo do cartão
9. API atualiza saldo da conta
10. API registra pagamento na fatura
11. API cria lançamentos contábeis
12. Retorna sucesso
13. UI atualiza

### Fluxo 3: Criar Despesa Compartilhada
1. Usuário cria transação normal
2. Marca como "compartilhada"
3. Adiciona participantes
4. Define divisão (igual ou percentual)
5. Sistema calcula parte de cada um
6. Cria transação principal
7. Cria registros de dívida para cada participante
8. Notifica participantes
9. Participantes podem pagar sua parte
10. Sistema registra pagamentos
11. Atualiza status da dívida

### Fluxo 4: Reconciliação Bancária
1. Usuário acessa conta
2. Clica em "Reconciliar"
3. Sistema mostra transações não reconciliadas
4. Usuário marca transações como reconciliadas
5. Sistema compara saldo calculado vs saldo real
6. Se diferença, alerta usuário
7. Usuário pode criar ajuste
8. Sistema atualiza status das transações

---

## 📊 REGRAS DE NEGÓCIO

### Transações
1. Toda transação DEVE ter conta OU cartão
2. Valor DEVE ser positivo
3. Data não pode ser futura (exceto agendadas)
4. Categoria DEVE existir e estar ativa
5. Parcelamento: cria N transações vinculadas
6. Recorrência: cria próxima transação automaticamente
7. Transferência: cria 2 transações (débito e crédito)
8. Compartilhada: cria dívidas para participantes

### Cartões de Crédito
1. Fatura fecha no dia de fechamento
2. Vencimento é X dias após fechamento
3. Transações após fechamento vão para próxima fatura
4. Limite pode ser excedido se configurado (até 20%)
5. Pagamento parcial: registra e mantém saldo devedor
6. Juros aplicados se atraso (se configurado)

### Orçamentos
1. Período DEVE ter início e fim
2. Valor DEVE ser positivo
3. Gasto calculado em tempo real
4. Alerta quando atingir threshold
5. Pode ter múltiplos orçamentos para mesma categoria

### Metas
1. Valor alvo DEVE ser maior que valor atual
2. Prazo é opcional
3. Progresso calculado automaticamente
4. Pode vincular transações específicas
5. Status muda para "concluída" quando atingir alvo

### Investimentos
1. Quantidade DEVE ser positiva
2. Preço médio recalculado a cada compra
3. Rentabilidade = (valor atual - valor investido) / valor investido
4. Dividendos somam ao valor total
5. Histórico de preços para gráficos

### Viagens
1. Data fim DEVE ser após data início
2. Orçamento é opcional
3. Gasto calculado somando transações vinculadas
4. Despesas compartilhadas divididas entre participantes
5. Conversão de moeda se necessário

---

Continua na PARTE 3...

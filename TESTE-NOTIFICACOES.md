# 🔔 Guia de Teste do Sistema de Notificações

## 📋 Visão Geral

Este documento descreve como testar todas as funcionalidades do sistema de notificações do SuaGrana.

## 🎯 Funcionalidades a Testar

### 1️⃣ Notificações de Faturamento

#### ✅ Contas a Vencer
**Como testar:**
1. Acesse `/transactions`
2. Crie uma nova despesa com data de vencimento para **hoje**
3. Clique no sininho 🔔 no header
4. Deve aparecer: "🚨 Conta vence hoje!"

**Exemplo:**
- Descrição: "Conta de Luz"
- Valor: R$ 150,00
- Data: Hoje
- Status: Pendente

#### ⚠️ Contas Vencidas
**Como testar:**
1. Acesse `/transactions`
2. Crie uma despesa com data **ontem** ou anterior
3. Mantenha status como "Pendente"
4. Verifique o sininho
5. Deve aparecer: "⚠️ Conta vencida!"

**Exemplo:**
- Descrição: "Conta de Água"
- Valor: R$ 89,90
- Data: Ontem
- Status: Pendente

#### 💳 Faturas de Cartão
**Como testar:**
1. Acesse `/credit-cards`
2. Crie um cartão com dia de vencimento próximo (2-3 dias)
3. Adicione algumas transações no cartão
4. Verifique o sininho
5. Deve aparecer: "💳 Fatura vence em X dias"

**Exemplo:**
- Nome: "Nubank"
- Limite: R$ 5.000,00
- Dia de vencimento: Dia atual + 2
- Saldo atual: R$ 1.250,00

---

### 2️⃣ Notificações de Metas

#### 🎯 Meta Próxima do Prazo
**Como testar:**
1. Acesse `/goals`
2. Crie uma meta com prazo em 5-7 dias
3. Defina progresso entre 50-70%
4. Verifique o sininho
5. Deve aparecer: "🎯 Meta vence em X dias"

**Exemplo:**
- Nome: "Viagem para Europa"
- Valor alvo: R$ 10.000,00
- Valor atual: R$ 5.000,00 (50%)
- Prazo: Daqui a 5 dias

#### 🎉 Meta Atingida
**Como testar:**
1. Acesse `/goals`
2. Crie uma meta onde valor atual >= valor alvo
3. Verifique o sininho
4. Deve aparecer: "🎉 Meta atingida!"

**Exemplo:**
- Nome: "Fundo de Emergência"
- Valor alvo: R$ 5.000,00
- Valor atual: R$ 5.500,00 (110%)
- Status: Ativa

#### 📊 Progresso de Meta (25%, 50%, 75%)
**Como testar:**
1. Crie uma meta com progresso em 25%, 50% ou 75%
2. O sistema deve notificar automaticamente
3. Verifique o sininho

**Exemplo:**
- Nome: "Carro Novo"
- Valor alvo: R$ 40.000,00
- Valor atual: R$ 10.000,00 (25%)

---

### 3️⃣ Notificações de Orçamento

#### 🚨 Orçamento Estourado (100%+)
**Como testar:**
1. Acesse `/budget`
2. Crie um orçamento mensal
3. Crie transações que ultrapassem o valor
4. Verifique o sininho
5. Deve aparecer: "🚨 Orçamento estourado!"

**Exemplo:**
- Categoria: "Alimentação"
- Orçamento: R$ 1.000,00
- Gasto: R$ 1.050,00 (105%)

#### ⚠️ Orçamento Quase Estourado (90-99%)
**Como testar:**
1. Crie um orçamento
2. Gaste entre 90-99% do valor
3. Verifique o sininho
4. Deve aparecer: "⚠️ Orçamento quase estourado"

**Exemplo:**
- Categoria: "Transporte"
- Orçamento: R$ 500,00
- Gasto: R$ 475,00 (95%)

#### ⚡ Orçamento em Alerta (80-89%)
**Como testar:**
1. Crie um orçamento
2. Gaste entre 80-89% do valor
3. Verifique o sininho
4. Deve aparecer: "⚡ Orçamento em alerta"

**Exemplo:**
- Categoria: "Lazer"
- Orçamento: R$ 300,00
- Gasto: R$ 255,00 (85%)

---

### 4️⃣ Notificações de Investimentos

#### 📈 Investimento em Alta (+10%+)
**Como testar:**
1. Acesse `/investments`
2. Crie um investimento com retorno positivo > 10%
3. Verifique o sininho
4. Deve aparecer: "📈 Investimento em alta!"

**Exemplo:**
- Nome: "Ações PETR4"
- Valor investido: R$ 3.000,00
- Valor atual: R$ 3.450,00 (+15%)

#### 📉 Investimento em Baixa (-5%+)
**Como testar:**
1. Crie um investimento com retorno negativo > 5%
2. Verifique o sininho
3. Deve aparecer: "📉 Atenção ao investimento"

**Exemplo:**
- Nome: "Ações VALE3"
- Valor investido: R$ 3.500,00
- Valor atual: R$ 3.255,00 (-7%)

---

### 5️⃣ Notificações de Lembretes

#### 📌 Lembrete para Hoje
**Como testar:**
1. Acesse `/reminders`
2. Crie um lembrete com data de hoje
3. Verifique o sininho
4. Deve aparecer: "📌 Lembrete para hoje!"

**Exemplo:**
- Título: "Pagar IPTU"
- Data: Hoje
- Prioridade: Alta

#### 📌 Lembrete Vencido
**Como testar:**
1. Crie um lembrete com data passada
2. Mantenha status como "Pendente"
3. Verifique o sininho
4. Deve aparecer: "📌 Lembrete vencido há X dias!"

**Exemplo:**
- Título: "Renovar CNH"
- Data: 2 dias atrás
- Status: Pendente

#### 📌 Lembrete Futuro
**Como testar:**
1. Crie um lembrete para daqui a 3-7 dias
2. Verifique o sininho
3. Deve aparecer: "📌 Lembrete em X dias"

**Exemplo:**
- Título: "Consulta médica"
- Data: Daqui a 5 dias
- Prioridade: Média

---

## 🔔 Testando o Sininho de Notificações

### Localização
O sininho fica no **header** da aplicação, no canto superior direito.

### Funcionalidades do Sininho

#### 1. Badge de Contagem
- Deve mostrar o número de notificações não lidas
- Exemplo: 🔔 **5** (badge vermelho)

#### 2. Dropdown de Notificações
**Ao clicar no sininho:**
- Abre um dropdown com todas as notificações
- Notificações não lidas aparecem destacadas
- Mostra ícones diferentes por categoria:
  - 📅 Contas
  - 🎯 Metas
  - ⚠️ Orçamentos
  - 💳 Cartões
  - 📈 Investimentos
  - 📌 Lembretes

#### 3. Ações nas Notificações
- **Marcar como lida**: ✓ (check)
- **Ver detalhes**: Link para a página relacionada
- **Deletar**: ✗ (X)

#### 4. Marcar Todas como Lidas
- Botão no topo do dropdown
- Marca todas as notificações como lidas de uma vez

---

## 🧪 Teste Automatizado

### Executar Script de Teste
```bash
npm run tsx scripts/test-notification-system.ts
```

### O que o script testa:
1. ✅ Criação de dados de teste
2. ✅ Geração de notificações
3. ✅ Contagem de notificações não lidas
4. ✅ API de notificações
5. ✅ Limpeza de dados de teste

---

## 📊 Categorias de Notificações

### Por Tipo
- 🚨 **Alert** (Vermelho): Urgente, requer ação imediata
- ⚠️ **Warning** (Laranja): Atenção necessária
- ℹ️ **Info** (Azul): Informativo
- ✅ **Success** (Verde): Conquista ou sucesso

### Por Categoria
- 📅 **bill**: Contas e faturas
- 🎯 **goal**: Metas financeiras
- 💰 **budget**: Orçamentos
- 💳 **card**: Cartões de crédito
- 📈 **investment**: Investimentos
- 📌 **reminder**: Lembretes
- 🏆 **achievement**: Conquistas

---

## ✅ Checklist de Teste

### Notificações de Faturamento
- [ ] Conta vence hoje
- [ ] Conta vencida
- [ ] Fatura de cartão próxima

### Notificações de Metas
- [ ] Meta próxima do prazo
- [ ] Meta atingida
- [ ] Progresso de meta (25%, 50%, 75%)

### Notificações de Orçamento
- [ ] Orçamento estourado (100%+)
- [ ] Orçamento quase estourado (90-99%)
- [ ] Orçamento em alerta (80-89%)

### Notificações de Investimentos
- [ ] Investimento em alta (+10%+)
- [ ] Investimento em baixa (-5%+)

### Notificações de Lembretes
- [ ] Lembrete para hoje
- [ ] Lembrete vencido
- [ ] Lembrete futuro

### Funcionalidades do Sininho
- [ ] Badge de contagem aparece
- [ ] Dropdown abre corretamente
- [ ] Notificações aparecem no dropdown
- [ ] Marcar como lida funciona
- [ ] Deletar notificação funciona
- [ ] Marcar todas como lidas funciona
- [ ] Link "Ver detalhes" funciona

---

## 🐛 Problemas Comuns

### Notificações não aparecem
**Solução:**
1. Verifique se o usuário está autenticado
2. Verifique o console do navegador (F12)
3. Verifique se a API `/api/notifications` está respondendo
4. Limpe o cache do navegador

### Badge não atualiza
**Solução:**
1. Recarregue a página
2. Verifique se há erros no console
3. Verifique se o contexto de notificações está ativo

### Notificações duplicadas
**Solução:**
1. Execute o script de limpeza
2. Verifique se não há múltiplas instâncias do cron job

---

## 📝 Notas Importantes

1. **Atualização Automática**: As notificações são atualizadas a cada 5 minutos
2. **Persistência**: Notificações são salvas no banco de dados
3. **Isolamento**: Cada usuário vê apenas suas notificações
4. **Performance**: Sistema otimizado para não impactar a performance

---

## 🎯 Próximos Passos

Após testar todas as funcionalidades:
1. Marque os itens do checklist
2. Reporte qualquer bug encontrado
3. Sugira melhorias
4. Teste em diferentes navegadores

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador
2. Verifique os logs do servidor
3. Execute o script de teste automatizado
4. Documente o erro com screenshots

---

**Última atualização:** 26/10/2025
**Versão:** 1.0.0

# 🔍 Auditoria de Consistência de Dados

## Visão Geral

Sistema completo de auditoria para verificar a integridade e consistência dos dados financeiros do SuaGrana.

---

## 🎯 O que é Auditado

### 1. **Contas (Accounts)**
- ✅ Presença de campos obrigatórios (ID, nome, saldo)
- ✅ Tipos válidos de conta
- ✅ Consistência de saldos com transações

### 2. **Cartões de Crédito**
- ✅ Campos obrigatórios (ID, nome, limite)
- ✅ Dias de fechamento e vencimento válidos
- ✅ Referências a contas existentes

### 3. **Transações**
- ✅ Campos obrigatórios (ID, valor, tipo, data)
- ✅ Tipos válidos (income, expense, transfer)
- ✅ Referências válidas a contas e cartões
- ✅ Referências válidas a categorias
- ✅ Validação de transferências (origem ≠ destino)
- ✅ Valores positivos
- ✅ Parcelamentos consistentes

### 4. **Saldos**
- ✅ Saldo registrado = Saldo calculado (baseado em transações)
- ✅ Tolerância de 1 centavo para arredondamentos

### 5. **Faturas**
- ✅ Campos obrigatórios (ID, cartão, valor, vencimento)
- ✅ Referências válidas a cartões
- ✅ Status válidos (open, closed, paid, overdue)
- ✅ Valor da fatura = Soma das transações

### 6. **Despesas Compartilhadas**
- ✅ Viagens com participantes
- ✅ Despesas com pagador e divisão
- ✅ Divisão soma o valor total
- ✅ Dívidas com status válidos

### 7. **Duplicações**
- ✅ IDs únicos em todas as entidades
- ✅ Detecção de transações duplicadas

### 8. **Integridade Referencial**
- ✅ Transações órfãs (sem conta ou cartão)
- ✅ Faturas sem transações
- ✅ Contas/cartões sem uso

### 9. **Categorias**
- ✅ Campos obrigatórios (ID, nome, tipo)
- ✅ Tipos válidos (income, expense)
- ✅ Categorias sem uso

---

## 🚀 Como Usar

### Opção 1: Interface Web (Recomendado)

1. **Acesse a página de auditoria:**
   ```
   http://localhost:3000/audit
   ```

2. **Clique em "Executar Auditoria"**

3. **Visualize o relatório:**
   - Resumo com total de erros, avisos e informações
   - Estatísticas gerais do sistema
   - Status geral da consistência
   - Lista detalhada de todos os problemas encontrados

### Opção 2: API Direta

```bash
# Fazer requisição GET para a API
curl http://localhost:3000/api/audit
```

Resposta JSON:
```json
{
  "timestamp": "2025-11-22T...",
  "summary": {
    "totalErrors": 0,
    "totalWarnings": 2,
    "totalInfo": 8
  },
  "issues": [
    {
      "category": "TRANSACTIONS",
      "severity": "warning",
      "message": "Transação referencia categoria inexistente",
      "details": {
        "id": "trans_123",
        "categoryId": "cat_999"
      }
    }
  ],
  "statistics": {
    "accounts": 5,
    "creditCards": 3,
    "transactions": 150,
    "categories": 20,
    "invoices": 12,
    "sharedExpenses": 2
  }
}
```

---

## 📊 Níveis de Severidade

### 🔴 **ERROR (Erro Crítico)**
Problemas que **DEVEM** ser corrigidos imediatamente:
- Dados obrigatórios faltando
- Referências a entidades inexistentes
- Saldos inconsistentes
- IDs duplicados
- Valores inválidos

**Ação:** Correção imediata necessária

### 🟡 **WARNING (Aviso)**
Problemas que **DEVEM** ser revisados:
- Categorias inexistentes (mas não crítico)
- Transações sem descrição
- Possíveis duplicações
- Dados incompletos não críticos

**Ação:** Revisão recomendada

### 🔵 **INFO (Informação)**
Informações úteis, não são problemas:
- Estatísticas gerais
- Contas sem transações
- Categorias sem uso
- Totais de registros

**Ação:** Apenas informativo

---

## 🛠️ Correção de Problemas

### Problema: Saldo Inconsistente

**Erro:**
```
Saldo da conta não bate com transações
- Saldo registrado: R$ 1.500,00
- Saldo calculado: R$ 1.450,00
- Diferença: R$ 50,00
```

**Solução:**
1. Verificar se há transações não contabilizadas
2. Verificar se há transações duplicadas
3. Recalcular o saldo manualmente
4. Atualizar o saldo da conta

### Problema: Referência Inexistente

**Erro:**
```
Transação referencia conta inexistente
- ID da transação: trans_123
- ID da conta: acc_999
```

**Solução:**
1. Verificar se a conta foi excluída acidentalmente
2. Atualizar a transação para referenciar conta válida
3. Ou excluir a transação se for inválida

### Problema: IDs Duplicados

**Erro:**
```
IDs duplicados em transactions
- Duplicados: ["trans_123", "trans_456"]
```

**Solução:**
1. Identificar as transações duplicadas
2. Gerar novos IDs únicos
3. Atualizar as referências

---

## 📅 Quando Executar Auditoria

### Recomendações:

1. **Diariamente (Automático)**
   - Configurar job para executar à noite
   - Enviar relatório por email se houver erros

2. **Antes de Backups**
   - Garantir que dados estão consistentes
   - Evitar backup de dados corrompidos

3. **Após Migrações**
   - Verificar integridade após importação
   - Validar transformações de dados

4. **Após Correções Manuais**
   - Confirmar que correções foram efetivas
   - Verificar efeitos colaterais

5. **Mensalmente (Manutenção)**
   - Revisão geral do sistema
   - Limpeza de dados órfãos

---

## 🔧 Configuração Avançada

### Adicionar Nova Verificação

Edite o arquivo `/src/app/api/audit/route.ts`:

```typescript
function auditCustomCheck(data: any[], issues: AuditIssue[]) {
  data.forEach(item => {
    // Sua lógica de validação
    if (/* condição de erro */) {
      issues.push({
        category: 'CUSTOM_CHECK',
        severity: 'error',
        message: 'Descrição do problema',
        details: { /* detalhes */ },
      });
    }
  });
}

// Adicionar na função GET
auditCustomCheck(customData, issues);
```

### Integrar com Monitoramento

```typescript
// Enviar para serviço de monitoramento
if (report.summary.totalErrors > 0) {
  await sendToMonitoring({
    service: 'suagrana',
    alert: 'data_consistency_error',
    severity: 'high',
    details: report,
  });
}
```

---

## 📈 Métricas de Qualidade

### Metas de Consistência:

- ✅ **0 erros críticos** - Obrigatório
- ✅ **< 5 avisos** - Aceitável
- ✅ **Saldos 100% corretos** - Obrigatório
- ✅ **0 referências quebradas** - Obrigatório
- ✅ **0 IDs duplicados** - Obrigatório

### Dashboard de Qualidade:

```
┌─────────────────────────────────────┐
│ Qualidade dos Dados: 98%           │
├─────────────────────────────────────┤
│ ✅ Erros Críticos: 0                │
│ ⚠️  Avisos: 3                       │
│ ℹ️  Informações: 12                 │
│                                     │
│ Última Auditoria: 22/11/2025 14:30│
│ Próxima Auditoria: 23/11/2025 02:00│
└─────────────────────────────────────┘
```

---

## 🚨 Alertas Automáticos

### Configurar Notificações:

```typescript
// webhook.ts
export async function sendAuditAlert(report: AuditReport) {
  if (report.summary.totalErrors > 0) {
    await fetch('https://hooks.slack.com/...', {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 Auditoria encontrou ${report.summary.totalErrors} erros críticos!`,
        attachments: [{
          color: 'danger',
          fields: report.issues
            .filter(i => i.severity === 'error')
            .map(i => ({
              title: i.category,
              value: i.message,
            })),
        }],
      }),
    });
  }
}
```

---

## 📝 Logs de Auditoria

Todas as auditorias são registradas:

```
[2025-11-22 14:30:15] AUDIT_START
[2025-11-22 14:30:16] AUDIT_ACCOUNTS: 5 contas verificadas
[2025-11-22 14:30:16] AUDIT_TRANSACTIONS: 150 transações verificadas
[2025-11-22 14:30:17] AUDIT_BALANCES: 2 inconsistências encontradas
[2025-11-22 14:30:17] AUDIT_COMPLETE: 2 erros, 3 avisos
```

---

## 🎯 Próximos Passos

1. ✅ Executar primeira auditoria
2. ✅ Corrigir todos os erros críticos
3. ✅ Revisar avisos
4. ✅ Configurar auditoria automática
5. ✅ Integrar com monitoramento
6. ✅ Documentar processos de correção

---

## 📚 Referências

- [Documentação de APIs](/docs/API.md)
- [Estrutura de Dados](/docs/DATA-STRUCTURE.md)
- [Guia de Correções](/docs/FIXING-GUIDE.md)

---

**Versão:** 1.0  
**Última Atualização:** 22/11/2025

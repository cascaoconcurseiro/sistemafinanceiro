# Funcionalidades de Dívidas Compartilhadas

## ✅ IMPLEMENTADO

### 1. Visualização de Dívidas Pendentes
**Arquivo:** `pending-debts-list.tsx`

**Funcionalidades:**
- ✅ Lista todas as dívidas pendentes agrupadas por credor
- ✅ Mostra total devido, créditos disponíveis e valor líquido
- ✅ Indica quando há compensação automática
- ✅ Badge mostrando número de despesas

### 2. Pagamento de Dívidas
**Funcionalidades:**
- ✅ Botão "Pagar Dívida" para pagamento normal
- ✅ Botão "Compensar Dívidas" quando netAmount = 0
- ✅ Modal mostrando o que será registrado
- ✅ Seleção de conta para débito
- ✅ Seleção de data de pagamento
- ✅ Cria 2 transações (RECEITA + DESPESA)
- ✅ Cria 4 transações quando compensação total
- ✅ Atomicidade garantida via endpoint `/api/shared-debts/pay`

### 3. Edição de Dívidas ✅ NOVO
**Funcionalidades:**
- ✅ Botão de editar em cada dívida individual
- ✅ Abre modal de edição de transação
- ✅ Permite alterar descrição, valor, data, categoria
- ✅ Atualiza dívida automaticamente

**Como funciona:**
```typescript
// Ao clicar em editar:
1. Busca transação completa via API
2. Dispara evento 'edit-transaction'
3. Modal de transação abre com dados preenchidos
4. Ao salvar, atualiza transação e dívida
```

### 4. Exclusão de Dívidas ✅ NOVO
**Funcionalidades:**
- ✅ Botão de excluir em cada dívida individual
- ✅ Confirmação antes de excluir
- ✅ Explica o que será feito
- ✅ Deleta transação via API
- ✅ Cancela dívida automaticamente
- ✅ Atualiza saldos das contas

**Como funciona:**
```typescript
// Ao clicar em excluir:
1. Mostra confirmação com detalhes
2. Deleta transação via DELETE /api/transactions/{id}
3. API automaticamente:
   - Remove transação
   - Cancela dívida relacionada
   - Atualiza saldo da conta
   - Registra log de auditoria
4. Recarrega página para mostrar dados atualizados
```

---

## 🎨 INTERFACE

### Card de Dívida
```
┌─────────────────────────────────────────────┐
│ 👤 João Silva                               │
│    joao@email.com                           │
│                                  R$ 150,00  │
│                                  2 despesa(s)│
├─────────────────────────────────────────────┤
│ Resumo:                                     │
│ Total Devido:    R$ 150,00                  │
│ Crédito:        -R$ 50,00                   │
│ Líquido:         R$ 100,00                  │
├─────────────────────────────────────────────┤
│ Despesas:                                   │
│ ┌─────────────────────────────────────────┐ │
│ │ Jantar no Restaurante          R$ 100,00│ │
│ │ Alimentação • 30/10/2025                │ │
│ │                            [✏️] [🗑️]    │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Cinema                          R$ 50,00│ │
│ │ Lazer • 29/10/2025                      │ │
│ │                            [✏️] [🗑️]    │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│         [Pagar R$ 100,00]                   │
└─────────────────────────────────────────────┘
```

### Botões de Ação
- **✏️ Editar:** Ícone de lápis, abre modal de edição
- **🗑️ Excluir:** Ícone de lixeira vermelho, pede confirmação

---

## 🔄 FLUXOS

### Fluxo de Edição
```
1. Usuário clica em ✏️ Editar
   ↓
2. Sistema busca transação completa
   GET /api/transactions/{id}
   ↓
3. Dispara evento 'edit-transaction'
   ↓
4. Modal de transação abre preenchido
   ↓
5. Usuário edita e salva
   ↓
6. Sistema atualiza transação
   PUT /api/transactions/{id}
   ↓
7. Dívida é atualizada automaticamente
   ↓
8. Página recarrega com novos dados
```

### Fluxo de Exclusão
```
1. Usuário clica em 🗑️ Excluir
   ↓
2. Sistema mostra confirmação:
   "Tem certeza que deseja excluir?"
   - Remover a transação
   - Cancelar a dívida
   - Atualizar os saldos
   ↓
3. Usuário confirma
   ↓
4. Sistema deleta transação
   DELETE /api/transactions/{id}
   ↓
5. API executa:
   - Remove transação do banco
   - Cancela dívida relacionada
   - Atualiza saldo da conta
   - Registra log de auditoria
   ↓
6. Página recarrega com dados atualizados
```

---

## 🔒 SEGURANÇA

### Validações
- ✅ Apenas o dono da transação pode editar/excluir
- ✅ Confirmação obrigatória antes de excluir
- ✅ Autenticação via cookies
- ✅ Logs de auditoria registrados

### Integridade
- ✅ Exclusão em cascata (transação → dívida)
- ✅ Atualização automática de saldos
- ✅ Transações atômicas no banco
- ✅ Rollback em caso de erro

---

## 📋 ENDPOINTS UTILIZADOS

### GET /api/transactions/{id}
**Usado por:** Botão Editar
**Retorna:** Transação completa com todos os dados

### DELETE /api/transactions/{id}
**Usado por:** Botão Excluir
**Ações:**
- Remove transação
- Cancela dívida relacionada
- Atualiza saldo da conta
- Registra log

### POST /api/shared-debts/pay
**Usado por:** Botão Pagar
**Ações:**
- Cria transações (RECEITA + DESPESA)
- Atualiza saldos
- Marca dívida como paga
- Atomicidade garantida

---

## 🎯 CASOS DE USO

### Caso 1: Editar Valor da Dívida
**Situação:** Valor estava errado

**Passos:**
1. Clicar em ✏️ Editar na dívida
2. Alterar valor no modal
3. Salvar
4. Dívida atualizada automaticamente

### Caso 2: Excluir Dívida Duplicada
**Situação:** Dívida foi registrada duas vezes

**Passos:**
1. Clicar em 🗑️ Excluir na dívida duplicada
2. Confirmar exclusão
3. Transação e dívida removidas
4. Saldo da conta corrigido

### Caso 3: Alterar Categoria
**Situação:** Categoria estava errada

**Passos:**
1. Clicar em ✏️ Editar
2. Alterar categoria
3. Salvar
4. Relatórios atualizados com nova categoria

---

## 🐛 TRATAMENTO DE ERROS

### Erro ao Buscar Transação
```typescript
catch (error) {
  console.error('Erro ao buscar transação:', error);
  toast.error('Erro ao carregar transação');
}
```

### Erro ao Excluir
```typescript
catch (error) {
  console.error('Erro ao excluir dívida:', error);
  toast.error('Erro ao excluir dívida');
}
```

### Erro de Permissão
```
HTTP 403: Você não tem permissão para editar esta transação
```

---

## 📊 LOGS E AUDITORIA

### O que é registrado:
- ✅ Quem editou/excluiu
- ✅ Quando foi feito
- ✅ Valores antes e depois (edição)
- ✅ Motivo da exclusão (se fornecido)
- ✅ IP do usuário
- ✅ Timestamp preciso

### Onde ver:
```
GET /api/audit/{transactionId}
```

---

## ✅ CHECKLIST DE FUNCIONALIDADES

### Visualização
- [x] Listar dívidas pendentes
- [x] Agrupar por credor
- [x] Mostrar resumo (total, crédito, líquido)
- [x] Indicar compensação automática

### Pagamento
- [x] Pagar dívida individual
- [x] Compensar dívidas cruzadas
- [x] Criar transações corretas
- [x] Atomicidade garantida

### Edição
- [x] Botão de editar em cada dívida
- [x] Abrir modal preenchido
- [x] Salvar alterações
- [x] Atualizar dívida automaticamente

### Exclusão
- [x] Botão de excluir em cada dívida
- [x] Confirmação obrigatória
- [x] Deletar transação e dívida
- [x] Atualizar saldos

### Segurança
- [x] Validação de permissões
- [x] Logs de auditoria
- [x] Integridade de dados
- [x] Rollback em erros

---

## 🎉 RESULTADO

Agora o usuário pode:
1. ✅ Ver todas as dívidas pendentes
2. ✅ Pagar dívidas (com compensação automática)
3. ✅ **Editar dívidas** (novo!)
4. ✅ **Excluir dívidas** (novo!)
5. ✅ Ter controle total sobre suas dívidas compartilhadas

Sistema completo e funcional! 🚀

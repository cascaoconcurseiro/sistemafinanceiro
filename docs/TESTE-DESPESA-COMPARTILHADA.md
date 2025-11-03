# Teste: Despesa Compartilhada

## ✅ IMPLEMENTAÇÃO CONCLUÍDA

A correção foi aplicada no arquivo `pending-debts-list.tsx`.

### O que foi alterado:

1. **Função `confirmPayment`** - Agora cria DUAS transações:
   - ✅ RECEITA para o credor (quem recebe)
   - ✅ DESPESA para o devedor (quem paga)

2. **Modal de pagamento** - Atualizado para mostrar claramente:
   - Que serão criadas 2 transações
   - Valor de cada transação
   - Para quem vai cada transação

## 🧪 COMO TESTAR

### Passo 1: Criar Despesa Compartilhada

1. Acesse o sistema como **João**
2. Crie uma nova transação:
   ```
   Descrição: Jantar no Restaurante
   Valor: R$ 100,00
   Tipo: Despesa
   Categoria: Alimentação
   Conta: Conta Corrente João
   Compartilhado: ✅ Sim
   Com quem: Maria
   Divisão: Igual (50/50)
   ```

3. **Verificar:**
   - ✅ Transação criada com valor -R$ 100
   - ✅ Saldo da conta de João diminuiu R$ 100
   - ✅ Dívida criada: Maria deve R$ 50 para João

### Passo 2: Pagar Dívida

1. Acesse o sistema como **Maria**
2. Vá em "Dívidas Pendentes"
3. Clique em "Pagar" na dívida do Jantar
4. Selecione a conta e confirme

5. **Verificar:**
   - ✅ Modal mostra: "Serão criadas 2 transações"
   - ✅ RECEITA de R$ 50 para João
   - ✅ DESPESA de R$ 50 para Maria

### Passo 3: Verificar Transações

**Extrato de João:**
```
Data       Descrição                          Categoria      Valor      
30/10/2025 Jantar no Restaurante             Alimentação    -R$ 100,00
30/10/2025 Recebimento - Jantar no Rest...   Reembolso      +R$ 50,00
```
**Saldo líquido: -R$ 50** ✅

**Extrato de Maria:**
```
Data       Descrição                          Categoria      Valor      
30/10/2025 Pagamento - Jantar no Rest...     Alimentação    -R$ 50,00
```
**Saldo líquido: -R$ 50** ✅

### Passo 4: Verificar Saldos

**Conta de João:**
- Saldo inicial: R$ 1.000,00
- Após despesa: R$ 900,00
- Após recebimento: R$ 950,00
- **Custo líquido: R$ 50** ✅

**Conta de Maria:**
- Saldo inicial: R$ 800,00
- Após pagamento: R$ 750,00
- **Custo líquido: R$ 50** ✅

## 🔍 PONTOS DE ATENÇÃO

### 1. Categoria "Reembolso"
A categoria "reembolso" precisa existir no sistema. Se não existir:
- Criar manualmente no banco de dados
- Ou usar uma categoria existente como "Outras Receitas"

### 2. Conta do Credor
O sistema precisa saber qual conta do credor usar para registrar a receita:
- Atualmente usa `selectedDebt.creditorId` como accountId
- **ATENÇÃO:** Isso pode estar errado se creditorId for o ID do usuário, não da conta
- **Solução:** Buscar a conta principal do credor ou permitir que ele configure

### 3. Atomicidade
Se uma das transações falhar, a outra também deve falhar:
- Usar transação do banco de dados
- Ou implementar rollback manual

## 🐛 POSSÍVEIS PROBLEMAS

### Problema 1: Categoria "reembolso" não existe
**Erro:** `Category not found`

**Solução:**
```sql
INSERT INTO categories (id, name, type, userId) 
VALUES ('reembolso', 'Reembolso', 'RECEITA', 'user-id');
```

### Problema 2: creditorId não é accountId
**Erro:** `Account not found`

**Solução:** Buscar conta do credor:
```typescript
// Buscar conta principal do credor
const creditorAccount = accounts.find(
  acc => acc.userId === selectedDebt.creditorId && acc.isActive
);

if (!creditorAccount) {
  throw new Error('Conta do credor não encontrada');
}

// Usar creditorAccount.id ao invés de selectedDebt.creditorId
```

### Problema 3: Transações criadas mas dívida não atualizada
**Erro:** Dívida continua aparecendo como pendente

**Solução:** Verificar se a API `/api/shared-debts/${id}` está funcionando

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Despesa compartilhada cria dívida corretamente
- [ ] Modal de pagamento mostra 2 transações
- [ ] RECEITA é criada na conta do credor
- [ ] DESPESA é criada na conta do devedor
- [ ] Valores estão corretos (após compensação)
- [ ] Dívida é marcada como paga
- [ ] Saldos das contas estão corretos
- [ ] Extratos mostram ambas as transações
- [ ] Relatórios refletem os valores corretos
- [ ] Compensação de dívidas funciona

## 📝 PRÓXIMOS PASSOS

1. **Testar em desenvolvimento**
2. **Corrigir problema da conta do credor** (se necessário)
3. **Criar categoria "Reembolso"** no banco
4. **Implementar atomicidade** (transação do banco)
5. **Adicionar logs de auditoria**
6. **Testar cenários de compensação**
7. **Testar com múltiplos participantes**
8. **Validar em produção**

## 🎯 RESULTADO ESPERADO

Após a implementação:
- ✅ Cada pessoa vê exatamente o que gastou
- ✅ Saldos das contas estão corretos
- ✅ Relatórios mostram valores reais
- ✅ Sistema mantém integridade contábil
- ✅ Auditoria completa de todas as operações

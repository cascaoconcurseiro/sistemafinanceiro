# 🔍 ANÁLISE: Lógica Correta da Fatura

## 📋 Cenário Atual

### Transações Compartilhadas:
1. **TESTE NORMAL**: R$ 100 (EU paguei, compartilhado com Fran)
   - Fran me deve: R$ 50

2. **TESTE NORMAL PARCELADO**: R$ 100 em 6x (EU paguei, compartilhado com Fran)
   - Total: R$ 100 / 2 = R$ 50 (minha parte) + R$ 50 (parte de Fran)
   - Parcelado em 6x: R$ 16,67 por mês
   - **Fran me deve**: R$ 8,33 por mês (metade de cada parcela)
   - **Apenas a parcela do mês atual** deve aparecer na fatura

3. **TESTE PAGO POR**: R$ 30 (Fran pagou, EU devo)
   - EU devo para Fran: R$ 30

### Dívidas:
- **Dívida 1**: EU devo R$ 30 para Fran
- **Dívida 2**: EU devo R$ 50 para Fran

## ✅ Cálculo Correto da Fatura

```
CRÉDITOS (Fran me deve):
+ R$ 50,00  (TESTE NORMAL - metade)
+ R$ 8,33   (TESTE NORMAL PARCELADO - 1ª parcela do mês)
= R$ 58,33

DÉBITOS (EU devo para Fran):
- R$ 30,00  (TESTE PAGO POR)
- R$ 30,00  (Dívida 1)
- R$ 50,00  (Dívida 2)
= R$ 110,00

VALOR LÍQUIDO:
R$ 58,33 - R$ 110,00 = -R$ 51,67

Resultado: EU DEVO R$ 51,67 para Fran
```

## ❌ Problemas Identificados

### Problema 1: Todas as parcelas sendo contadas
**Atual**: R$ 99,98 = 6 parcelas × R$ 16,67
**Correto**: R$ 8,33 = apenas 1 parcela do mês atual

**Causa**: O código está processando TODAS as 6 parcelas em vez de filtrar apenas as do período atual.

### Problema 2: Dívidas não aparecem
**Atual**: Dívidas são puladas com "userId não corresponde"
**Correto**: Dívidas devem aparecer como DÉBITO na fatura

**Causa**: A lógica de verificação do `userId` está incorreta. As dívidas têm:
- `userId`: ID do usuário logado (dono da dívida)
- `debtorId`: ID de quem deve
- `creditorId`: ID de quem emprestou

Se `userId === debtorId`, então EU sou o devedor (devo para o credor).

## 🔧 Correções Necessárias

### 1. Filtrar Parcelas por Período
Apenas parcelas com `date` dentro do período atual devem ser incluídas.

### 2. Corrigir Lógica de Dívidas
```typescript
// Se EU sou o devedor (userId === debtorId)
if (debt.userId === debt.debtorId) {
  // EU DEVO para o credor
  // Adicionar como DEBIT na fatura do credor
}

// Se EU sou o credor (userId === creditorId)
if (debt.userId === debt.creditorId) {
  // Alguém ME DEVE
  // Adicionar como CREDIT na fatura do devedor
}
```

### 3. Verificar Dados das Dívidas
Preciso ver os dados reais das dívidas no banco para entender a estrutura correta.

---

**Próximo Passo**: Verificar os dados das dívidas no banco e corrigir a lógica.

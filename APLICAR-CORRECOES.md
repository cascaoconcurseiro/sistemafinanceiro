# 🚀 GUIA DE APLICAÇÃO DAS CORREÇÕES

**Data:** 28/10/2025  
**Status:** PRONTO PARA APLICAR

---

## ⚠️ IMPORTANTE - LEIA ANTES DE APLICAR

As correções foram implementadas no código, mas para funcionarem completamente, você precisa:

1. **Regenerar o Prisma Client** (para incluir novos campos do schema)
2. **Aplicar migrações** (se necessário)
3. **Reiniciar o servidor** de desenvolvimento

---

## 📋 PASSO A PASSO

### 1. Regenerar Prisma Client

```bash
cd "Não apagar/SuaGrana-Clean"
npx prisma generate
```

**O que isso faz:**
- Regenera o Prisma Client com os novos campos:
  - `Account.allowNegativeBalance`
  - `Account.overdraftLimit`
  - `Account.overdraftInterestRate`
  - `CreditCard.allowOverLimit`
  - `CreditCard.overLimitPercent`
  - `Installment.originalAmount`
  - `Installment.canAnticipate`
  - `Installment.anticipatedAt`
  - `Installment.discountApplied`

### 2. Verificar se precisa de migração

```bash
npx prisma migrate status
```

**Se aparecer "Database schema is not in sync":**

```bash
npx prisma migrate dev --name add_financial_rules_fields
```

**Se o banco já estiver sincronizado:**
- Não precisa fazer nada, os campos já existem!

### 3. Reiniciar o servidor

```bash
# Parar o servidor atual (Ctrl+C)
# Depois iniciar novamente:
npm run dev
```

---

## ✅ VERIFICAÇÃO

Após aplicar, verifique se não há erros de compilação:

```bash
npm run build
```

**Resultado esperado:**
```
✓ Compiled successfully
```

---

## 🧪 TESTES MANUAIS

### Teste 1: Cheque Especial

1. Vá em Contas
2. Edite uma conta
3. Ative "Permitir saldo negativo"
4. Defina limite de cheque especial: R$ 500
5. Tente criar uma despesa maior que o saldo
6. **Resultado esperado:** Deve permitir até o limite do cheque especial

### Teste 2: Limite Excedido em Cartão

1. Vá em Cartões de Crédito
2. Edite um cartão
3. Ative "Permitir exceder limite"
4. Defina percentual: 10%
5. Tente criar uma compra que exceda o limite normal
6. **Resultado esperado:** Deve permitir até limite + 10%

### Teste 3: Parcelamento com Juros

1. Crie uma nova transação
2. Escolha "Parcelamento"
3. Selecione tipo: "Banco (com juros)"
4. Defina taxa de juros: 2.99% a.m.
5. Parcele em 12x
6. **Resultado esperado:** Deve calcular juros compostos e mostrar total com juros

### Teste 4: Detecção de Duplicatas

1. Crie uma transação
2. Tente criar a mesma transação novamente (mesmo valor, descrição e data)
3. Abra o console do navegador (F12)
4. **Resultado esperado:** Deve aparecer aviso de duplicata no console

### Teste 5: Antecipação de Parcelas

1. Crie um parcelamento de 12x
2. Pague as 3 primeiras parcelas
3. Use a API para antecipar as restantes:

```javascript
// No console do navegador:
fetch('/api/installments/anticipate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    installmentGroupId: 'ID_DO_PARCELAMENTO',
    accountId: 'ID_DA_CONTA',
    discountPercent: 10
  })
}).then(r => r.json()).then(console.log)
```

6. **Resultado esperado:** Deve antecipar parcelas com 10% de desconto

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

### Erro: "Property 'allowNegativeBalance' does not exist"

**Solução:**
```bash
npx prisma generate
```

### Erro: "Column 'allow_negative_balance' not found"

**Solução:**
```bash
npx prisma migrate dev --name add_missing_fields
```

### Erro: "Cannot find module '@prisma/client'"

**Solução:**
```bash
npm install @prisma/client
npx prisma generate
```

### Servidor não reinicia

**Solução:**
```bash
# Matar todos os processos Node
taskkill /F /IM node.exe

# Iniciar novamente
npm run dev
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

Após aplicar as correções, verifique:

- [ ] Prisma Client regenerado sem erros
- [ ] Servidor inicia sem erros de compilação
- [ ] Não há erros no console do navegador
- [ ] Teste de cheque especial funciona
- [ ] Teste de limite excedido funciona
- [ ] Teste de parcelamento com juros funciona
- [ ] Teste de detecção de duplicatas funciona
- [ ] APIs de parcelas estão acessíveis

---

## 🎯 PRÓXIMOS PASSOS

Após validar que tudo funciona:

1. **Criar testes automatizados** para as novas funcionalidades
2. **Adicionar UI** para as funcionalidades "fantasma"
3. **Documentar** as novas APIs
4. **Treinar usuários** sobre as novas funcionalidades

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique os logs do servidor
2. Verifique o console do navegador
3. Consulte a documentação do Prisma
4. Revise o arquivo `CORRECOES-BRECHAS-IMPLEMENTADAS.md`

---

**Documento criado por:** Kiro AI  
**Data:** 28/10/2025  
**Versão:** 1.0

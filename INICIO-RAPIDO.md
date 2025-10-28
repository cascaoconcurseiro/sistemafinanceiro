# ⚡ Início Rápido - Sistema Financeiro v2.0

Guia rápido para começar a usar o sistema em **5 minutos**.

---

## 🚀 Passo 1: Instalar (1 min)

```bash
npm install
```

---

## 🗄️ Passo 2: Configurar Banco (2 min)

### Opção A: Automático (Recomendado)
```powershell
# Windows
.\scripts\apply-migration.ps1

# Linux/Mac
chmod +x scripts/apply-migration.sh
./scripts/apply-migration.sh
```

### Opção B: Manual
```bash
npx prisma generate
npx prisma migrate deploy
npx ts-node scripts/migrate-financial-data.ts
```

---

## ▶️ Passo 3: Iniciar (1 min)

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## ✅ Passo 4: Verificar (1 min)

### Verificar Integridade
```bash
curl http://localhost:3000/api/maintenance/verify-integrity
```

Deve retornar:
```json
{
  "hasIssues": false,
  "issuesCount": 0
}
```

### Recalcular Saldos (se necessário)
```bash
curl -X POST http://localhost:3000/api/maintenance/recalculate-balances
```

---

## 🎯 Pronto!

Seu sistema está funcionando! Agora você pode:

### 1. Criar uma Conta
```bash
POST /api/accounts
{
  "name": "Conta Corrente",
  "type": "ATIVO",
  "balance": 1000,
  "currency": "BRL"
}
```

### 2. Criar uma Transação
```bash
POST /api/transactions
{
  "accountId": "account-id",
  "amount": 100,
  "description": "Salário",
  "type": "RECEITA",
  "date": "2025-10-28T10:00:00Z"
}
```

### 3. Criar um Parcelamento
```bash
POST /api/transactions
{
  "creditCardId": "card-id",
  "amount": 300,
  "description": "Compra Parcelada",
  "type": "DESPESA",
  "date": "2025-10-28T10:00:00Z",
  "installments": 3
}
```

### 4. Criar uma Transferência
```bash
POST /api/transfers
{
  "fromAccountId": "account-1",
  "toAccountId": "account-2",
  "amount": 100,
  "description": "Transferência"
}
```

---

## 📚 Próximos Passos

### Documentação Completa
- **[README-SISTEMA-FINANCEIRO-V2.md](./README-SISTEMA-FINANCEIRO-V2.md)** - Visão geral
- **[API-DOCUMENTATION.md](./API-DOCUMENTATION.md)** - APIs
- **[PROJETO-FINAL-COMPLETO-COM-BANCO.md](./PROJETO-FINAL-COMPLETO-COM-BANCO.md)** - Tudo

### Explorar Funcionalidades
- Criar cartões de crédito
- Configurar orçamentos
- Definir metas financeiras
- Planejar viagens
- Compartilhar despesas

### Manutenção
- Verificar integridade regularmente
- Fazer backup do banco
- Recalcular saldos se necessário

---

## 🚨 Problemas?

### Erro ao Iniciar
```bash
# Limpar e reinstalar
rm -rf node_modules
npm install
```

### Erro no Banco
```bash
# Aplicar migration novamente
.\scripts\apply-migration.ps1
```

### Saldos Incorretos
```bash
# Recalcular
curl -X POST http://localhost:3000/api/maintenance/recalculate-balances
```

### Mais Ajuda
Consulte [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## ✅ Checklist

- [ ] Dependências instaladas
- [ ] Migration aplicada
- [ ] Servidor iniciado
- [ ] Integridade verificada
- [ ] Primeira conta criada
- [ ] Primeira transação criada

---

**🎉 Pronto para usar! Boas finanças!**

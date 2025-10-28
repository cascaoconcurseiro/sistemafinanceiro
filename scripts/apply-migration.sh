#!/bin/bash

# Script para aplicar migration do banco de dados
# Data: 2025-10-28

echo "🚀 Aplicando Migration do Sistema Financeiro v2.0..."
echo ""

# 1. Fazer backup do banco atual
echo "📦 Fazendo backup do banco de dados..."
if [ -f "prisma/dev.db" ]; then
    cp prisma/dev.db "prisma/dev.db.backup-$(date +%Y%m%d-%H%M%S)"
    echo "✅ Backup criado com sucesso"
else
    echo "⚠️  Banco de dados não encontrado, será criado um novo"
fi
echo ""

# 2. Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate
echo ""

# 3. Aplicar migration
echo "📊 Aplicando migration..."
npx prisma migrate deploy
echo ""

# 4. Verificar integridade
echo "🔍 Verificando integridade do banco..."
npx prisma validate
echo ""

# 5. Executar script de migração de dados
echo "🔄 Executando migração de dados..."
npx ts-node scripts/migrate-financial-data.ts
echo ""

echo "✅ Migration aplicada com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Verificar integridade: curl http://localhost:3000/api/maintenance/verify-integrity"
echo "2. Recalcular saldos: curl -X POST http://localhost:3000/api/maintenance/recalculate-balances"
echo "3. Testar sistema: npm run dev"

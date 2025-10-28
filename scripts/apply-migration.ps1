# Script para aplicar migration do banco de dados (Windows)
# Data: 2025-10-28

Write-Host "🚀 Aplicando Migration do Sistema Financeiro v2.0..." -ForegroundColor Cyan
Write-Host ""

# 1. Fazer backup do banco atual
Write-Host "📦 Fazendo backup do banco de dados..." -ForegroundColor Yellow
if (Test-Path "prisma/dev.db") {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    Copy-Item "prisma/dev.db" "prisma/dev.db.backup-$timestamp"
    Write-Host "✅ Backup criado com sucesso" -ForegroundColor Green
} else {
    Write-Host "⚠️  Banco de dados não encontrado, será criado um novo" -ForegroundColor Yellow
}
Write-Host ""

# 2. Gerar cliente Prisma
Write-Host "🔧 Gerando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate
Write-Host ""

# 3. Aplicar migration
Write-Host "📊 Aplicando migration..." -ForegroundColor Yellow
npx prisma migrate deploy
Write-Host ""

# 4. Verificar integridade
Write-Host "🔍 Verificando integridade do banco..." -ForegroundColor Yellow
npx prisma validate
Write-Host ""

# 5. Executar script de migração de dados
Write-Host "🔄 Executando migração de dados..." -ForegroundColor Yellow
npx ts-node scripts/migrate-financial-data.ts
Write-Host ""

Write-Host "✅ Migration aplicada com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Verificar integridade: curl http://localhost:3000/api/maintenance/verify-integrity"
Write-Host "2. Recalcular saldos: curl -X POST http://localhost:3000/api/maintenance/recalculate-balances"
Write-Host "3. Testar sistema: npm run dev"

# Script para restaurar investimentos antigos

$backup = "..\SuaGrana-Clean-v02-BACKUP-2025-10-28_07-46"
$current = "."

Write-Host "Restaurando sistema de investimentos antigo..." -ForegroundColor Green

# 1. Copiar hook
Write-Host "Copiando hook..." -ForegroundColor Yellow
Copy-Item "$backup\src\hooks\useOptimizedInvestments.ts" -Destination "src\hooks\" -Force

# 2. Copiar componentes
Write-Host "Copiando componentes..." -ForegroundColor Yellow
$components = @(
    "asset-autocomplete.tsx",
    "dividend-modal.tsx",
    "investment-dashboard.tsx",
    "investment-export.tsx",
    "investment-ir-report.tsx",
    "investment-list.tsx",
    "investment-operation-modal-fixed.tsx",
    "investment-operation-modal.tsx",
    "investment-reports.tsx",
    "investment-sale-modal.tsx"
)

foreach ($comp in $components) {
    Copy-Item "$backup\src\components\investments\$comp" -Destination "src\components\investments\" -Force
    Write-Host "  ✓ $comp" -ForegroundColor Gray
}

Write-Host "`n✅ Restauração concluída!" -ForegroundColor Green
Write-Host "Reinicie o servidor: npm run dev" -ForegroundColor Cyan

# Script para corrigir todos os usos incorretos de logComponents.error
# Este script substitui logComponents.error por logError.[component] apropriado

$projectPath = "C:\Users\Wesley\Documents\FINANCA\Não apagar\SuaGrana-Clean\src"

# Mapeamento de componentes para logError
$componentMapping = @{
    'automation-rules-manager.tsx' = 'automation'
    'recurring-patterns-suggestions.tsx' = 'ui'
    'investment-modal.tsx' = 'investment'
    'document-checklist.tsx' = 'ui'
    'smart-budget-config.tsx' = 'budget'
    'financial-settings-manager.tsx' = 'settings'
    'cash-flow-projections.tsx' = 'cashflow'
    'billing-invoices.tsx' = 'billing'
    'advanced-ai-dashboard.tsx' = 'ai'
    'page.tsx' = 'page'
    'storage.ts' = 'storage'
    'add-transaction-modal.tsx' = 'transaction'
    'error-boundary.tsx' = 'ui'
    'trip-modal.tsx' = 'travel'
    'enhanced-accounting-dashboard.tsx' = 'accounting'
    'ai-settings.tsx' = 'ai'
    'account-operations.tsx' = 'account'
    'account-history.tsx' = 'account'
    'global-search-modal.tsx' = 'search'
    'smart-suggestions.tsx' = 'ui'
    'goal-modal.tsx' = 'goal'
    'advanced-financial-management.tsx' = 'financial'
    'use-income-settings.ts' = 'settings'
    'edit-account-modal.tsx' = 'account'
    'pwa-manager.tsx' = 'pwa'
    'performance-optimizer.tsx' = 'performance'
    'duplicate-consolidation.tsx' = 'investment'
    'budget-performance-analyzer.tsx' = 'budget'
    'financial-automation-manager.tsx' = 'automation'
    'shared-expenses.tsx' = 'expense'
    'investment-export.tsx' = 'investment'
    'intelligent-financial-dashboard.tsx' = 'ai'
    'dividend-modal.tsx' = 'investment'
    'executive-dashboard.tsx' = 'dashboard'
    'shared-debts-display.tsx' = 'debt'
    'family-selector.tsx' = 'family'
    'advanced-reports-dashboard.tsx' = 'report'
    'budget-insights.tsx' = 'budget'
    'advanced-pwa-settings.tsx' = 'pwa'
    'investment-operation-modal.tsx' = 'investment'
    'trip-settings.tsx' = 'travel'
}

# Função para determinar o componente logError baseado no nome do arquivo
function Get-LogErrorComponent($filePath) {
    $fileName = Split-Path $filePath -Leaf
    
    # Casos específicos
    if ($fileName -eq "page.tsx") {
        if ($filePath -like "*notifications*") { return "notification" }
        if ($filePath -like "*goals*") { return "goal" }
        if ($filePath -like "*cash-flow*") { return "cashflow" }
        if ($filePath -like "*advanced-dashboard*") { return "dashboard" }
        return "page"
    }
    
    # Mapeamento direto
    if ($componentMapping.ContainsKey($fileName)) {
        return $componentMapping[$fileName]
    }
    
    # Fallback baseado no nome do arquivo
    if ($fileName -like "*investment*") { return "investment" }
    if ($fileName -like "*transaction*") { return "transaction" }
    if ($fileName -like "*budget*") { return "budget" }
    if ($fileName -like "*account*") { return "account" }
    if ($fileName -like "*goal*") { return "goal" }
    if ($fileName -like "*travel*" -or $fileName -like "*trip*") { return "travel" }
    if ($fileName -like "*ai*") { return "ai" }
    if ($fileName -like "*pwa*") { return "pwa" }
    if ($fileName -like "*family*") { return "family" }
    if ($fileName -like "*debt*") { return "debt" }
    if ($fileName -like "*expense*") { return "expense" }
    if ($fileName -like "*automation*") { return "automation" }
    if ($fileName -like "*dashboard*") { return "dashboard" }
    if ($fileName -like "*report*") { return "report" }
    if ($fileName -like "*settings*") { return "settings" }
    if ($fileName -like "*modal*") { return "ui" }
    
    return "ui"  # fallback padrão
}

# Obter todos os arquivos que contêm logComponents.error
$files = Get-ChildItem -Path $projectPath -Recurse -Include "*.tsx", "*.ts" | 
    Where-Object { (Get-Content $_.FullName -Raw) -match "logComponents\.error" }

Write-Host "Encontrados $($files.Count) arquivos com logComponents.error"

foreach ($file in $files) {
    Write-Host "Processando: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    $component = Get-LogErrorComponent $file.FullName
    
    # Verificar se já tem logError na importação
    if ($content -notmatch "import.*logError.*from.*logger") {
        # Adicionar logError à importação existente
        $content = $content -replace "(import\s*\{\s*logComponents\s*\})", "import { logComponents, logError }"
        $content = $content -replace "(import\s*\{\s*[^}]*logComponents[^}]*\})", { 
            param($match)
            if ($match.Value -notmatch "logError") {
                return $match.Value -replace "\}", ", logError }"
            }
            return $match.Value
        }
    }
    
    # Substituir logComponents.error por logError.[component]
    $content = $content -replace "logComponents\.error", "logError.$component"
    
    # Salvar o arquivo
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
    
    Write-Host "  ✓ Corrigido com logError.$component"
}

Write-Host ""
Write-Host "Todos os arquivos foram corrigidos!"
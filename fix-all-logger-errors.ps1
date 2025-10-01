# Script para corrigir todos os usos de logComponents.error restantes
$projectPath = "C:\Users\Wesley\Documents\FINANCA\Não apagar\SuaGrana-Clean\src"

# Mapeamento de componentes para logError
$componentMapping = @{
    'pwa-manager.tsx' = 'pwa'
    'shared-debts-display.tsx' = 'ui'
    'shared-expenses.tsx' = 'ui'
    'smart-budget-config.tsx' = 'budget'
    'trip-settings.tsx' = 'travel'
    'use-income-settings.ts' = 'settings'
}

Write-Host "🔧 Corrigindo todos os usos de logComponents.error..." -ForegroundColor Yellow
Write-Host ""

# Buscar todos os arquivos que usam logComponents.error
$files = Get-ChildItem -Path $projectPath -Recurse -Include "*.tsx","*.ts" | Where-Object {
    (Get-Content $_.FullName -Raw) -match "logComponents\.error"
}

foreach ($file in $files) {
    $fileName = $file.Name
    $relativePath = $file.FullName.Replace($projectPath + "\", "")
    
    Write-Host "📝 Processando: $relativePath" -ForegroundColor Cyan
    
    # Determinar o componente apropriado
    $component = 'ui' # padrão
    foreach ($key in $componentMapping.Keys) {
        if ($fileName -eq $key) {
            $component = $componentMapping[$key]
            break
        }
    }
    
    # Ler o conteúdo do arquivo
    $content = Get-Content -Path $file.FullName -Raw
    
    # Verificar se logError já está importado
    if ($content -notmatch "logError") {
        # Adicionar logError ao import existente
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
    
    Write-Host "  ✓ Corrigido com logError.$component" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Todos os arquivos foram corrigidos!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Verificando se ainda há usos de logComponents.error..." -ForegroundColor Yellow

# Verificação final
$remainingFiles = Get-ChildItem -Path $projectPath -Recurse -Include "*.tsx","*.ts" | Where-Object {
    (Get-Content $_.FullName -Raw) -match "logComponents\.error"
}

if ($remainingFiles.Count -eq 0) {
    Write-Host "✅ Nenhum uso de logComponents.error encontrado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Ainda há $($remainingFiles.Count) arquivos com logComponents.error:" -ForegroundColor Red
    foreach ($file in $remainingFiles) {
        Write-Host "  - $($file.Name)" -ForegroundColor Red
    }
}
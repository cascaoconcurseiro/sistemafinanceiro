# SCRIPT: Configurar Backup Automático no Windows
# Executa: PowerShell como Administrador

$ErrorActionPreference = "Stop"

Write-Host "🔧 CONFIGURANDO BACKUP AUTOMÁTICO" -ForegroundColor Cyan
Write-Host "=" * 70

# Obter diretório do projeto
$projectPath = Split-Path -Parent $PSScriptRoot

Write-Host "`n📁 Diretório do projeto: $projectPath"

# Configurar tarefa agendada
$taskName = "SuaGrana-Backup-Diario"
$action = New-ScheduledTaskAction `
    -Execute "node" `
    -Argument "scripts/backup-database.js create" `
    -WorkingDirectory $projectPath

$trigger = New-ScheduledTaskTrigger -Daily -At 3am

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable

try {
    # Verificar se tarefa já existe
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    
    if ($existingTask) {
        Write-Host "`n⚠️  Tarefa já existe. Removendo..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }
    
    # Registrar nova tarefa
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Description "Backup diário automático do banco de dados SuaGrana" `
        -Force | Out-Null
    
    Write-Host "`n✅ Backup automático configurado com sucesso!" -ForegroundColor Green
    Write-Host "`n📋 Detalhes da tarefa:"
    Write-Host "   Nome: $taskName"
    Write-Host "   Horário: 03:00 (diariamente)"
    Write-Host "   Comando: node scripts/backup-database.js create"
    Write-Host "   Diretório: $projectPath"
    
    # Testar backup imediatamente
    Write-Host "`n🧪 Testando backup..."
    Set-Location $projectPath
    node scripts/backup-database.js create
    
    Write-Host "`n✅ Teste de backup concluído!"
    Write-Host "`n📊 Para verificar a tarefa:"
    Write-Host "   Get-ScheduledTask -TaskName '$taskName'"
    Write-Host "`n📋 Para listar backups:"
    Write-Host "   node scripts/backup-database.js list"
    
} catch {
    Write-Host "`n❌ Erro ao configurar backup: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n" + "=" * 70
Write-Host "🎉 CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green

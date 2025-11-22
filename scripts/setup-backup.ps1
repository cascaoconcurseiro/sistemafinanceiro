# SCRIPT: Configurar Backup Automatico no Windows
# Executa: PowerShell como Administrador

$ErrorActionPreference = "Stop"

Write-Host "Configurando Backup Automatico" -ForegroundColor Cyan
Write-Host "=" * 70

$projectPath = Split-Path -Parent $PSScriptRoot
Write-Host "`nDiretorio do projeto: $projectPath"

$taskName = "SuaGrana-Backup-Diario"
$action = New-ScheduledTaskAction -Execute "node" -Argument "scripts/backup-database.js create" -WorkingDirectory $projectPath
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    
    if ($existingTask) {
        Write-Host "`nTarefa ja existe. Removendo..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Backup diario automatico do banco de dados SuaGrana" -Force | Out-Null
    
    Write-Host "`nBackup automatico configurado com sucesso!" -ForegroundColor Green
    Write-Host "`nDetalhes da tarefa:"
    Write-Host "   Nome: $taskName"
    Write-Host "   Horario: 03:00 (diariamente)"
    Write-Host "   Comando: node scripts/backup-database.js create"
    Write-Host "   Diretorio: $projectPath"
    
    Write-Host "`nTestando backup..."
    Set-Location $projectPath
    node scripts/backup-database.js create
    
    Write-Host "`nTeste de backup concluido!"
    Write-Host "`nPara verificar a tarefa:"
    Write-Host "   Get-ScheduledTask -TaskName '$taskName'"
    Write-Host "`nPara listar backups:"
    Write-Host "   node scripts/backup-database.js list"
    
} catch {
    Write-Host "`nErro ao configurar backup: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n" + "=" * 70
Write-Host "Configuracao Concluida!" -ForegroundColor Green


# ============================================
# CONFIGURAR BACKUP AUTOMÁTICO
# ============================================

## Linux/Mac:

1. Editar crontab:
   crontab -e

2. Adicionar linha (backup diário às 3h):
   0 3 * * * cd C:\Users\Wesley\Documents\FINANCA\Não apagar\SuaGrana-Clean && node scripts/backup-database.js create >> logs/backup.log 2>&1

3. Salvar e sair

## Windows:

1. Abrir PowerShell como Administrador

2. Executar:
   $action = New-ScheduledTaskAction -Execute "node" -Argument "scripts/backup-database.js create" -WorkingDirectory "C:\Users\Wesley\Documents\FINANCA\Não apagar\SuaGrana-Clean"
   $trigger = New-ScheduledTaskTrigger -Daily -At 3am
   Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "SuaGrana Backup" -Description "Backup diário do banco de dados"

3. Verificar:
   Get-ScheduledTask -TaskName "SuaGrana Backup"

## Verificar Backups:

   node scripts/backup-database.js list

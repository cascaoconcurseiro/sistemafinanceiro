#!/bin/bash

# Script para remover pastas de backup do repositório
# ATENÇÃO: Execute com cuidado!

echo "🗑️  Script de Remoção de Backups"
echo "================================"
echo ""
echo "⚠️  ATENÇÃO: Este script irá remover pastas de backup do Git"
echo "⚠️  Certifique-se de ter um backup externo antes de continuar!"
echo ""
read -p "Deseja continuar? (s/N): " confirm

if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "❌ Operação cancelada"
    exit 0
fi

echo ""
echo "📋 Removendo pastas de backup do Git..."
echo ""

# Remover do Git (mantém arquivos localmente)
git rm -r --cached backups/ 2>/dev/null && echo "✅ backups/"
git rm -r --cached "out/server/app/api/export/backup" 2>/dev/null && echo "✅ out/server/app/api/export/backup"
git rm -r --cached "out/server/app/api/import/backup" 2>/dev/null && echo "✅ out/server/app/api/import/backup"
git rm -r --cached "out/server/app/settings/backup" 2>/dev/null && echo "✅ out/server/app/settings/backup"
git rm -r --cached "out/static/chunks/app/settings/backup" 2>/dev/null && echo "✅ out/static/chunks/app/settings/backup"
git rm -r --cached "out/types/app/api/export/backup" 2>/dev/null && echo "✅ out/types/app/api/export/backup"
git rm -r --cached "out/types/app/api/import/backup" 2>/dev/null && echo "✅ out/types/app/api/import/backup"
git rm -r --cached "out/types/app/settings/backup" 2>/dev/null && echo "✅ out/types/app/settings/backup"
git rm -r --cached "src/app/api/export/backup" 2>/dev/null && echo "✅ src/app/api/export/backup"
git rm -r --cached "src/app/api/import/backup" 2>/dev/null && echo "✅ src/app/api/import/backup"
git rm -r --cached "src/app/settings/backup" 2>/dev/null && echo "✅ src/app/settings/backup"
git rm -r --cached "src/components/features/backup" 2>/dev/null && echo "✅ src/components/features/backup"
git rm -r --cached "src/lib/backup" 2>/dev/null && echo "✅ src/lib/backup"

echo ""
echo "✅ Pastas removidas do Git (arquivos mantidos localmente)"
echo ""
echo "📝 Próximos passos:"
echo "   1. Revisar: git status"
echo "   2. Commit: git commit -m 'chore: remove backup folders from git'"
echo "   3. Push: git push"
echo ""
echo "💡 Dica: Mova as pastas para fora do projeto se ainda precisar delas"

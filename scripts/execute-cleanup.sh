#!/bin/bash

# Script gerado automaticamente para executar ações de limpeza
# Data: 2025-11-22T18:57:34.479Z

echo "🧹 Executando Limpeza do Projeto..."
echo ""


# 1. Remover pastas de backup do Git
echo "📋 Removendo backups do repositório..."
git rm -r --cached "backups"
git rm -r --cached "out\server\app\api\export\backup"
git rm -r --cached "out\server\app\api\import\backup"
git rm -r --cached "out\server\app\settings\backup"
git rm -r --cached "out\static\chunks\app\settings\backup"
git rm -r --cached "out\types\app\api\export\backup"
git rm -r --cached "out\types\app\api\import\backup"
git rm -r --cached "out\types\app\settings\backup"
git rm -r --cached "src\app\api\export\backup"
git rm -r --cached "src\app\api\import\backup"
git rm -r --cached "src\app\settings\backup"
git rm -r --cached "src\components\features\backup"
git rm -r --cached "src\lib\backup"
echo "✅ Backups removidos"
echo ""





# 3. Organizar documentação
echo "📋 Organizando documentação..."
mkdir -p docs/audits docs/development docs/architecture
git mv "ANALISE-DESPESAS-COMPARTILHADAS.md" "docs/audits/"
git mv "AUDITORIA-PROFISSIONAL-FINAL.md" "docs/"
git mv "AUDITORIA-PRONTA.md" "docs/"
git mv "CERTIFICADO-CONCLUSAO.md" "docs/"
git mv "CONFIGURACAO-RAPIDA.md" "docs/"
git mv "CONFIGURAR-BACKUP-AUTOMATICO.md" "docs/"
git mv "CORRECOES-APLICADAS.md" "docs/"
git mv "CORRECOES-CONSOLE-ERRORS.md" "docs/"
git mv "ERROS-CORRIGIDOS.md" "docs/"
git mv "EXECUTAR-CORRECOES.md" "docs/"
git mv "EXECUTAR-MIGRATIONS.md" "docs/"
git mv "GUIA-COMPLETO-USUARIO.md" "docs/development/"
git mv "GUIA-CORRECOES-COMPLETO.md" "docs/development/"
git mv "GUIA-DESENVOLVIMENTO.md" "docs/development/"
git mv "GUIA-NEON-DATABASE.md" "docs/development/"
git mv "GUIA-PRODUCAO.md" "docs/development/"
git mv "GUIA-SCRIPTS.md" "docs/development/"
git mv "IMPLEMENTACAO-COMPLETA.md" "docs/architecture/"
git mv "IMPLEMENTACAO-CONCLUIDA.md" "docs/architecture/"
git mv "IMPLEMENTACAO-FASE-2-COMPLETA.md" "docs/architecture/"
git mv "INDICE-DOCUMENTACAO.md" "docs/"
git mv "MANIFESTO-FINAL.md" "docs/"
git mv "MELHORIAS-IMPLEMENTADAS.md" "docs/"
git mv "NEON-SETUP.md" "docs/"
git mv "NETLIFY-SETUP.md" "docs/"
git mv "PLANO-ACAO-IMEDIATO.md" "docs/"
git mv "PROBLEMAS-LOGICA-CORRIGIDOS.md" "docs/"
git mv "README-CORRECOES.md" "docs/"
git mv "RELATORIO-FINAL-COMPLETO.md" "docs/"
git mv "RESPOSTA-ANALISE-PROJETO.md" "docs/"
git mv "RESUMO-EXECUTIVO-FINAL.md" "docs/"
git mv "RESUMO-FINAL-CORRECOES.md" "docs/"
git mv "SISTEMA-100-CORRIGIDO.md" "docs/"
git mv "SISTEMA-FUNCIONANDO.md" "docs/"
git mv "SISTEMA-PERFEITO-100.md" "docs/"
git mv "STATUS-SISTEMA.md" "docs/"
echo "✅ Documentação organizada"
echo ""


echo "🎉 Limpeza concluída!"
echo "📝 Próximos passos:"
echo "   1. Revisar mudanças: git status"
echo "   2. Commit: git commit -m 'chore: cleanup project structure'"
echo "   3. Push: git push"

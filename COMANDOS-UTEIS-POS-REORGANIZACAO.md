# 🛠️ COMANDOS ÚTEIS PÓS-REORGANIZAÇÃO

## 🔍 VERIFICAÇÃO E VALIDAÇÃO

### Verificar Estrutura de Arquivos
```bash
# Ver estrutura de transações
ls -la "Não apagar/SuaGrana-Clean/src/lib/services/transactions"

# Ver estrutura de cálculos
ls -la "Não apagar/SuaGrana-Clean/src/lib/services/calculations"

# Contar arquivos criados
find "Não apagar/SuaGrana-Clean/src/lib/services" -name "*.ts" | wc -l
```

### Verificar Imports
```bash
# Procurar uso do serviço antigo
grep -r "financial-operations-service" "Não apagar/SuaGrana-Clean/src" --include="*.ts" --include="*.tsx"

# Procurar uso dos novos módulos
grep -r "TransactionCreator" "Não apagar/SuaGrana-Clean/src" --include="*.ts" --include="*.tsx"
```

### Verificar Erros de Compilação
```bash
# Compilar TypeScript
cd "Não apagar/SuaGrana-Clean"
npx tsc --noEmit

# Verificar com ESLint
npx eslint src/lib/services/transactions/**/*.ts
npx eslint src/lib/services/calculations/**/*.ts
```

---

## 🧪 TESTES

### Executar Testes
```bash
# Todos os testes
npm test

# Testes específicos
npm test -- transactions
npm test -- balance

# Testes com cobertura
npm test -- --coverage
```

### Criar Novos Testes
```bash
# Criar teste para TransactionCreator
touch "Não apagar/SuaGrana-Clean/src/lib/services/transactions/__tests__/transaction-creator.test.ts"

# Criar teste para BalanceCalculator
touch "Não apagar/SuaGrana-Clean/src/lib/services/calculations/__tests__/balance-calculator.test.ts"
```

---

## 📊 ANÁLISE DE CÓDIGO

### Contar Linhas
```bash
# Linhas nos novos módulos
wc -l "Não apagar/SuaGrana-Clean/src/lib/services/transactions"/*.ts
wc -l "Não apagar/SuaGrana-Clean/src/lib/services/calculations"/*.ts

# Total de linhas
find "Não apagar/SuaGrana-Clean/src/lib/services" -name "*.ts" -exec wc -l {} + | tail -1
```

### Análise de Complexidade
```bash
# Instalar ferramenta (se necessário)
npm install -g complexity-report

# Analisar complexidade
cr "Não apagar/SuaGrana-Clean/src/lib/services/transactions"/*.ts
```

---

## 🔄 MIGRAÇÃO

### Encontrar Arquivos para Migrar
```bash
# Arquivos que usam o serviço antigo
grep -l "financial-operations-service" "Não apagar/SuaGrana-Clean/src"/**/*.ts

# Contar quantos arquivos precisam migrar
grep -l "financial-operations-service" "Não apagar/SuaGrana-Clean/src"/**/*.ts | wc -l
```

### Substituir Imports (Cuidado!)
```bash
# ATENÇÃO: Faça backup antes!
# Substituir import antigo por novo (exemplo)
find "Não apagar/SuaGrana-Clean/src" -name "*.ts" -exec sed -i 's/financial-operations-service/financial-operations-orchestrator/g' {} +
```

---

## 🗂️ ORGANIZAÇÃO

### Criar Estrutura de Testes
```bash
# Criar diretórios de testes
mkdir -p "Não apagar/SuaGrana-Clean/src/lib/services/transactions/__tests__"
mkdir -p "Não apagar/SuaGrana-Clean/src/lib/services/calculations/__tests__"
```

### Criar Documentação de Módulos
```bash
# Criar README para cada módulo
touch "Não apagar/SuaGrana-Clean/src/lib/services/transactions/README.md"
touch "Não apagar/SuaGrana-Clean/src/lib/services/calculations/README.md"
```

---

## 🚀 BUILD E DEPLOY

### Build de Produção
```bash
cd "Não apagar/SuaGrana-Clean"

# Build completo
npm run build

# Verificar tamanho do bundle
du -sh .next/

# Analisar bundle
npm run analyze
```

### Verificar Performance
```bash
# Lighthouse (se tiver)
lighthouse http://localhost:3000 --view

# Bundle analyzer
npm run build -- --analyze
```

---

## 🔧 MANUTENÇÃO

### Limpar Cache
```bash
cd "Não apagar/SuaGrana-Clean"

# Limpar node_modules
rm -rf node_modules
npm install

# Limpar build
rm -rf .next
npm run build
```

### Atualizar Dependências
```bash
# Verificar atualizações
npm outdated

# Atualizar dependências
npm update

# Atualizar major versions (cuidado!)
npx npm-check-updates -u
npm install
```

---

## 📝 GIT

### Commit das Mudanças
```bash
cd "Não apagar/SuaGrana-Clean"

# Ver mudanças
git status
git diff

# Adicionar arquivos novos
git add src/lib/services/transactions/
git add src/lib/services/calculations/
git add src/lib/services/financial-operations-orchestrator.ts

# Adicionar documentação
git add *.md

# Commit
git commit -m "refactor: modularizar serviço de operações financeiras

- Dividir financial-operations-service.ts (928 linhas) em 8 módulos
- Criar estrutura /transactions com responsabilidades separadas
- Criar /calculations para cálculos de saldo
- Adicionar orquestrador para compatibilidade
- Remover 24 arquivos stub não utilizados
- Adicionar redirects para rotas duplicadas
- Documentação completa da reorganização

BREAKING CHANGES: Nenhum - compatibilidade 100% mantida"
```

### Criar Branch para Testes
```bash
# Criar branch de feature
git checkout -b feature/modular-architecture

# Fazer mudanças e testar
# ...

# Merge quando estiver pronto
git checkout main
git merge feature/modular-architecture
```

---

## 🐛 DEBUG

### Verificar Imports Quebrados
```bash
# Procurar imports que podem estar quebrados
grep -r "from '@/lib/services/financial-operations-service'" "Não apagar/SuaGrana-Clean/src"

# Verificar se há erros de TypeScript
npx tsc --noEmit 2>&1 | grep "error TS"
```

### Logs de Desenvolvimento
```bash
# Iniciar servidor com logs detalhados
cd "Não apagar/SuaGrana-Clean"
npm run dev -- --verbose

# Ver logs em tempo real
tail -f .next/trace
```

---

## 📊 MÉTRICAS

### Gerar Relatório de Cobertura
```bash
# Executar testes com cobertura
npm test -- --coverage

# Ver relatório HTML
open coverage/lcov-report/index.html
```

### Análise de Bundle
```bash
# Instalar analyzer
npm install --save-dev @next/bundle-analyzer

# Configurar e executar
ANALYZE=true npm run build
```

---

## 🎯 COMANDOS RÁPIDOS

### Verificação Completa
```bash
# Script completo de verificação
cd "Não apagar/SuaGrana-Clean"
echo "🔍 Verificando estrutura..."
ls -la src/lib/services/transactions/
ls -la src/lib/services/calculations/

echo "🧪 Executando testes..."
npm test

echo "🔨 Compilando..."
npx tsc --noEmit

echo "✅ Verificação completa!"
```

### Limpeza Completa
```bash
# Limpar tudo e reconstruir
cd "Não apagar/SuaGrana-Clean"
rm -rf node_modules .next
npm install
npm run build
npm test
```

---

## 📚 REFERÊNCIAS

### Documentação Criada:
- `AUDITORIA-DUPLICIDADES-REORGANIZACAO.md` - Análise inicial
- `FASE-1-LIMPEZA-LOG.md` - Log da limpeza
- `FASE-2-REFATORACAO-LOG.md` - Log da refatoração
- `REORGANIZACAO-COMPLETA-RESUMO.md` - Resumo completo
- `GUIA-MIGRACAO-NOVA-ARQUITETURA.md` - Guia de migração
- `REORGANIZACAO-EXECUTADA-SUCESSO.md` - Resumo executivo

### Arquivos Importantes:
- `src/lib/services/financial-operations-orchestrator.ts` - Orquestrador principal
- `src/lib/services/transactions/index.ts` - Exports de transações
- `src/lib/services/transactions/types.ts` - Tipos compartilhados

---

**💡 Dica**: Salve este arquivo para referência futura!

# 🛠️ Guia de Scripts - SuaGrana

## Scripts de Automação e Ferramentas

Este guia documenta todos os scripts disponíveis no projeto.

---

## 🚀 SETUP E CONFIGURAÇÃO

### Setup Completo do Projeto

```bash
npm run setup:project
```

**O que faz:**
- ✅ Verifica Node.js (versão mínima)
- ✅ Instala dependências
- ✅ Cria .env.local
- ✅ Configura PostgreSQL
- ✅ Executa migrations
- ✅ Roda testes
- ✅ Cria dados de exemplo

**Quando usar:**
- Primeiro setup do projeto
- Onboarding de novos desenvolvedores
- Após clonar o repositório

**Exemplo de uso:**
```bash
git clone https://github.com/seu-usuario/suagrana.git
cd suagrana
npm run setup:project
```

---

## 🏥 HEALTH CHECK

### Verificação de Saúde do Sistema

```bash
npm run health
```

**O que verifica:**
- ✅ Versão do Node.js
- ✅ Dependências instaladas
- ✅ Arquivo .env configurado
- ✅ Arquivos críticos presentes
- ✅ TypeScript sem erros
- ✅ ESLint sem erros
- ✅ Testes passando
- ✅ Vulnerabilidades de segurança
- ✅ Tamanho do bundle

**Quando usar:**
- Antes de fazer deploy
- Após mudanças grandes
- Debugging de problemas
- CI/CD pipeline

**Exemplo de saída:**
```
🏥 HEALTH CHECK - SuaGrana
==========================================================

🔍 Verificando Node.js...
✅ Node.js v18.17.0

🔍 Verificando dependências...
✅ Dependências instaladas

🔍 Verificando .env...
✅ .env.local configurado

📊 RELATÓRIO DE SAÚDE
==========================================================
✅ Passou: 8
⚠️  Avisos: 1
❌ Erros: 0

✅ SISTEMA SAUDÁVEL! Tudo funcionando perfeitamente!
```

---

## 💾 BACKUP E RESTORE

### Criar Backup

```bash
npm run backup:create
```

**O que faz:**
- 💾 Backup do banco PostgreSQL
- 📁 Backup de arquivos críticos (.env, package.json, schema.prisma)
- 🧹 Limpa backups antigos (mantém últimos 10)
- 📋 Lista backups disponíveis

**Quando usar:**
- Antes de mudanças grandes
- Antes de migrations
- Rotina diária/semanal
- Antes de deploy

### Listar Backups

```bash
npm run backup:list
```

**Exemplo de saída:**
```
📋 Backups disponíveis:
1. backup_2025-11-22_14-30-00.sql (2.5MB) - 22/11/2025 14:30:00
2. backup_2025-11-21_14-30-00.sql (2.4MB) - 21/11/2025 14:30:00
3. backup_2025-11-20_14-30-00.sql (2.3MB) - 20/11/2025 14:30:00
```

### Restaurar Backup

```bash
npm run backup:restore backup_2025-11-22_14-30-00.sql
```

**⚠️ ATENÇÃO:** Isso vai sobrescrever o banco atual!

### Limpar Backups Antigos

```bash
npm run backup:clean
```

Remove backups além dos últimos 10.

---

## 🧪 TESTES

### Executar Todos os Testes

```bash
npm test
```

### Testes em Modo Watch

```bash
npm run test:watch
```

### Testes com Cobertura

```bash
npm run test:coverage
```

**Exemplo de saída:**
```
Test Suites: 15 passed, 15 total
Tests:       120 passed, 120 total
Coverage:    72.5%
```

### Testes E2E

```bash
npm run test:e2e
```

### Testes E2E com UI

```bash
npm run test:e2e:ui
```

---

## 🗄️ DATABASE

### Gerar Prisma Client

```bash
npm run db:generate
```

### Executar Migrations

```bash
npm run db:migrate
```

### Push Schema (sem migration)

```bash
npm run db:push
```

### Abrir Prisma Studio

```bash
npm run db:studio
```

Interface visual para ver/editar dados.

### Seed (Dados de Exemplo)

```bash
npm run db:seed
```

### Reset Database

```bash
npm run db:reset
```

⚠️ Apaga todos os dados!

### Otimizar Database

```bash
npm run db:optimize
```

---

## 🔍 AUDITORIA

### Auditoria de Dados

```bash
npm run audit
```

Verifica consistência dos dados financeiros.

### Auditoria Completa

```bash
npm run audit:full
```

Inclui testes de stress.

### Auditoria de Segurança

```bash
npm run audit:security
```

Foca em vulnerabilidades.

### Auditoria de Qualidade

```bash
npm run audit:quality
```

Foca em qualidade de código.

---

## 🔒 SEGURANÇA

### Audit de Dependências

```bash
npm run security:audit
```

Verifica vulnerabilidades em dependências.

### Teste de Segurança

```bash
npm run security:test
```

---

## 💻 DESENVOLVIMENTO

### Iniciar Servidor

```bash
npm run dev
```

Inicia em http://localhost:3000

### Build de Produção

```bash
npm run build
```

### Build com Análise

```bash
npm run build:analyze
```

Gera relatório de bundle size.

### Verificar Tipos

```bash
npm run build:check
```

TypeScript + Build.

### Iniciar Produção

```bash
npm run start
```

Após build.

---

## 🎨 QUALIDADE DE CÓDIGO

### Lint

```bash
npm run lint
```

### Formatar Código

```bash
npm run code:format
```

### Verificar Formatação

```bash
npm run code:format:check
```

### Analisar Qualidade

```bash
npm run code:analyze
```

### Remover Console.logs

```bash
npm run code:clean
```

### Detectar Duplicação

```bash
npm run code:duplication
```

### Remover Imports Não Usados

```bash
npm run code:unused-imports
```

### Corrigir Problemas Comuns

```bash
npm run code:fix-issues
```

### Estatísticas do Projeto

```bash
npm run code:stats
```

### Análise Completa

```bash
npm run code:all
```

Executa todas as verificações.

---

## 📊 LOGS

### Limpar Logs

```bash
npm run logs:clean
```

### Ver Logs em Tempo Real

```bash
npm run logs:view
```

---

## 🔄 WORKFLOWS COMUNS

### Novo Desenvolvedor

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/suagrana.git
cd suagrana

# 2. Setup completo
npm run setup:project

# 3. Iniciar desenvolvimento
npm run dev
```

### Antes de Commit

```bash
# 1. Verificar saúde
npm run health

# 2. Formatar código
npm run code:format

# 3. Executar testes
npm test

# 4. Lint
npm run lint
```

### Antes de Deploy

```bash
# 1. Backup
npm run backup:create

# 2. Health check completo
npm run health

# 3. Testes
npm test

# 4. Build
npm run build

# 5. Auditoria
npm run audit
```

### Manutenção Semanal

```bash
# 1. Atualizar dependências
npm update

# 2. Audit de segurança
npm run security:audit

# 3. Limpar backups antigos
npm run backup:clean

# 4. Limpar logs
npm run logs:clean

# 5. Otimizar database
npm run db:optimize
```

### Debugging

```bash
# 1. Health check
npm run health

# 2. Ver logs
npm run logs:view

# 3. Verificar tipos
npm run build:check

# 4. Auditoria de dados
npm run audit
```

---

## 🎯 SCRIPTS POR CATEGORIA

### Setup
- `setup:project` - Setup completo
- `setup:complete` - Setup avançado
- `setup` - Setup do sistema

### Health & Monitoring
- `health` - Verificação de saúde
- `health:full` - Verificação completa

### Backup
- `backup:create` - Criar backup
- `backup:list` - Listar backups
- `backup:restore` - Restaurar backup
- `backup:clean` - Limpar backups antigos

### Database
- `db:generate` - Gerar Prisma Client
- `db:migrate` - Executar migrations
- `db:push` - Push schema
- `db:studio` - Abrir Prisma Studio
- `db:seed` - Dados de exemplo
- `db:reset` - Reset database
- `db:optimize` - Otimizar database

### Testes
- `test` - Executar testes
- `test:watch` - Testes em watch
- `test:coverage` - Testes com cobertura
- `test:e2e` - Testes E2E
- `test:e2e:ui` - Testes E2E com UI

### Auditoria
- `audit` - Auditoria de dados
- `audit:full` - Auditoria completa
- `audit:security` - Auditoria de segurança
- `audit:quality` - Auditoria de qualidade

### Desenvolvimento
- `dev` - Servidor de desenvolvimento
- `build` - Build de produção
- `build:analyze` - Build com análise
- `build:check` - Verificar tipos + build
- `start` - Iniciar produção
- `lint` - Lint

### Qualidade
- `code:format` - Formatar código
- `code:analyze` - Analisar qualidade
- `code:clean` - Remover console.logs
- `code:duplication` - Detectar duplicação
- `code:unused-imports` - Remover imports não usados
- `code:fix-issues` - Corrigir problemas
- `code:stats` - Estatísticas
- `code:all` - Análise completa

### Segurança
- `security:audit` - Audit de dependências
- `security:test` - Teste de segurança

### Logs
- `logs:clean` - Limpar logs
- `logs:view` - Ver logs em tempo real

---

## 💡 DICAS

### Aliases Úteis

Adicione ao seu `.bashrc` ou `.zshrc`:

```bash
alias sd="npm run dev"
alias st="npm test"
alias sb="npm run build"
alias sh="npm run health"
alias sbu="npm run backup:create"
```

### Git Hooks

Configure pre-commit hook:

```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run health
npm test
```

### CI/CD

Exemplo de workflow GitHub Actions:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run health
      - run: npm test
      - run: npm run build
```

---

## 🆘 TROUBLESHOOTING

### Script não executa

```bash
# Dar permissão de execução
chmod +x scripts/*.js
```

### Erro de módulo não encontrado

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro no backup

```bash
# Verificar PostgreSQL
psql --version

# Verificar .env.local
cat .env.local | grep DATABASE_URL
```

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- [Guia do Usuário](./GUIA-COMPLETO-USUARIO.md)
- [Guia de Desenvolvimento](./GUIA-DESENVOLVIMENTO.md)
- [README](./README.md)

---

**Versão:** 1.0  
**Última Atualização:** 22/11/2025

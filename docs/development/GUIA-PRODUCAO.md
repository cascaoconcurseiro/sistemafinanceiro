# 🚀 GUIA RÁPIDO PARA PRODUÇÃO

**Versão:** 2.0  
**Data:** 22/11/2024

---

## ⚡ CONFIGURAÇÃO RÁPIDA (10 minutos)

### 1. Instalar Dependências (5 min)

```bash
# Instalar TODAS as dependências necessárias
node scripts/install-all-dependencies.js
```

### 2. Configurar Backup Automático (2 min)

**Windows:**
```powershell
# Executar como Administrador
.\scripts\setup-backup-windows.ps1
```

**Linux/Mac:**
```bash
# Editar crontab
crontab -e

# Adicionar linha
0 3 * * * cd /path/to/app && node scripts/backup-database.js create
```

### 3. Configurar Sentry (3 min)

1. Criar conta em https://sentry.io
2. Criar novo projeto Next.js
3. Copiar DSN
4. Adicionar no `.env`:

```env
SENTRY_DSN="https://xxx@sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
```

---

## 🎯 CONFIGURAÇÃO COMPLETA (30 minutos)

### Opção 1: Script Automático

```bash
# Executa TUDO automaticamente
node scripts/setup-production.js
```

### Opção 2: Manual

```bash
# 1. Instalar dependências
node scripts/install-all-dependencies.js

# 2. Executar migrations
npx prisma migrate deploy

# 3. Gerar Prisma Client
npx prisma generate

# 4. Executar testes
npm test

# 5. Criar backup
node scripts/backup-database.js create

# 6. Executar auditoria
node scripts/professional-audit.js
```

---

## ✅ CHECKLIST PRÉ-PRODUÇÃO

### Obrigatório
- [ ] Dependências instaladas
- [ ] Backup automático configurado
- [ ] Sentry configurado
- [ ] Testes executados (60%+ cobertura)
- [ ] Auditoria executada (score 70+)
- [ ] Variáveis de ambiente configuradas
- [ ] Build executado sem erros

### Recomendado
- [ ] Documentação da API revisada
- [ ] Plano de disaster recovery revisado
- [ ] Política de privacidade atualizada
- [ ] Testes de integração executados
- [ ] Performance testada

---

## 🔧 COMANDOS ESSENCIAIS

### Desenvolvimento
```bash
npm run dev              # Iniciar desenvolvimento
npm run build            # Build para produção
npm test                 # Executar testes
npm run lint             # Verificar código
```

### Banco de Dados
```bash
npx prisma migrate dev   # Criar migration
npx prisma migrate deploy # Aplicar migrations
npx prisma generate      # Gerar client
npx prisma studio        # Interface visual
```

### Backup
```bash
node scripts/backup-database.js create   # Criar backup
node scripts/backup-database.js list     # Listar backups
node scripts/backup-database.js restore <file> # Restaurar
```

### Auditoria
```bash
node scripts/professional-audit.js       # Auditoria completa
node scripts/audit-system.js             # Integridade de dados
node scripts/apply-critical-fixes.js     # Testar correções
```

---

## 📊 VARIÁVEIS DE AMBIENTE

### Obrigatórias
```env
DATABASE_URL="file:./prisma/dev.db?connection_limit=10"
NEXTAUTH_SECRET="sua-chave-secreta-32-chars-minimum"
NEXTAUTH_URL="https://seu-dominio.com"
```

### Recomendadas
```env
SENTRY_DSN="https://xxx@sentry.io/xxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
NEXT_PUBLIC_APP_VERSION="2.0.0"
```

### Opcionais
```env
LOG_LEVEL="info"
CACHE_TTL=300
BACKUP_RETENTION_DAYS=30
```

---

## 🚨 TROUBLESHOOTING

### Erro: "Testes falhando"
```bash
# Limpar cache e reinstalar
rm -rf node_modules
npm install
npm test
```

### Erro: "Prisma Client desatualizado"
```bash
npx prisma generate
```

### Erro: "Backup falhou (gzip)"
- Windows: Backup salvo sem compressão (normal)
- Linux/Mac: Instalar gzip

### Erro: "Score baixo na auditoria"
```bash
# Ver problemas específicos
node scripts/professional-audit.js

# Aplicar correções
node scripts/fix-production-issues.js
```

---

## 📈 MÉTRICAS DE SUCESSO

### Mínimo para Produção (Score 70+)
- ✅ Integridade de dados: 100%
- ✅ Testes unitários: 60%+
- ✅ Backup automático: Configurado
- ✅ Error tracking: Ativo
- ✅ Documentação: Completa

### Ideal (Score 90+)
- ✅ Testes unitários: 80%+
- ✅ Testes de integração: 100% APIs
- ✅ Testes E2E: Fluxos críticos
- ✅ Documentação API: Swagger
- ✅ Métricas: Ativas

---

## 🎯 DEPLOY

### Build
```bash
# Verificar build
npm run build:check

# Build de produção
npm run build:prod

# Testar build
npm start
```

### Verificações Finais
```bash
# 1. Auditoria
node scripts/professional-audit.js

# 2. Testes
npm test

# 3. Backup
node scripts/backup-database.js create

# 4. Health check
curl http://localhost:3000/api/health
```

---

## 📞 SUPORTE

### Documentação
- `RELATORIO-FINAL-COMPLETO.md` - Relatório completo
- `STATUS-SISTEMA.md` - Status atual
- `docs/DISASTER-RECOVERY.md` - Plano de DR
- `docs/PRIVACY-POLICY.md` - LGPD/GDPR

### Scripts Úteis
- `scripts/professional-audit.js` - Auditoria
- `scripts/backup-database.js` - Backup
- `scripts/setup-production.js` - Setup completo

---

## 🎉 CONCLUSÃO

Após seguir este guia, seu sistema estará:
- ✅ Seguro (senhas criptografadas, rate limiting)
- ✅ Confiável (backup automático, error tracking)
- ✅ Testado (testes unitários e integração)
- ✅ Documentado (API, DR, privacidade)
- ✅ Pronto para produção profissional

**Score Esperado:** 70-90/100

---

**Última Atualização:** 22/11/2024  
**Versão:** 2.0

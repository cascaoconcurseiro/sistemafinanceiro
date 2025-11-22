# 🗄️ Guia Completo - Neon Database

## 🚨 SEGURANÇA PRIMEIRO

**VOCÊ EXPÔS SUA SENHA DUAS VEZES!** 

### ⚠️ Ação Imediata Necessária:

1. **Acesse**: [console.neon.tech](https://console.neon.tech)
2. **Vá em**: Settings → Reset password
3. **Gere uma NOVA senha**
4. **NUNCA mais cole credenciais em chats, issues ou código!**

---

## 📋 O que é o Neon?

O Neon é um banco de dados PostgreSQL serverless, perfeito para aplicações Next.js no Netlify:

- ✅ **Grátis**: 0.5 GB de armazenamento
- ✅ **Serverless**: Escala automaticamente
- ✅ **Rápido**: Baixa latência
- ✅ **Fácil**: Integração simples

---

## 🔧 Configuração do Neon

### 1. Criar Projeto (se ainda não criou)

1. Acesse [console.neon.tech](https://console.neon.tech)
2. Clique em **New Project**
3. Escolha:
   - **Name**: SuaGrana (ou o nome que preferir)
   - **Region**: US East (Ohio) - mais próximo do Netlify
   - **PostgreSQL Version**: 16 (mais recente)
4. Clique em **Create Project**

### 2. Obter Connection String

Após criar o projeto, você verá a connection string. Ela tem este formato:

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**Componentes:**
- `user`: neondb_owner (padrão)
- `password`: **NUNCA exponha isso!**
- `host`: ep-xxx-xxx.us-east-2.aws.neon.tech
- `database`: neondb (padrão)

### 3. Tipos de Connection String

O Neon oferece 2 tipos:

#### A) **Pooled Connection** (Recomendado para Netlify)
```
postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```
- ✅ Usa connection pooling
- ✅ Melhor para serverless
- ✅ Mais rápido
- ✅ **Use este!**

#### B) **Direct Connection**
```
postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```
- ⚠️ Conexão direta
- ⚠️ Pode ter problemas com serverless
- ❌ Não use no Netlify

---

## ⚙️ Configurar no Netlify

### Passo a Passo:

1. **Copie a Pooled Connection String** do Neon
2. **Acesse o Netlify Dashboard**
3. **Vá em**: Site settings → Environment variables
4. **Adicione**:
   - **Key**: `DATABASE_URL`
   - **Value**: Cole a connection string (pooled)
   - **Scopes**: Marque "All" ou "Production"

### Formato Correto:

```bash
DATABASE_URL=postgresql://neondb_owner:SUA_SENHA@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Importante:**
- ✅ Use `-pooler` no host
- ✅ Inclua `?sslmode=require`
- ✅ Não adicione `&channel_binding=require` (pode causar problemas)

---

## 🔄 Executar Migrations

### Opção 1: Localmente (Recomendado)

```bash
# 1. Crie um arquivo temporário .env.production.local
echo "DATABASE_URL=sua-connection-string-aqui" > .env.production.local

# 2. Execute as migrations
npx dotenv -e .env.production.local -- npx prisma migrate deploy

# 3. Delete o arquivo (IMPORTANTE!)
rm .env.production.local
```

### Opção 2: Via Script

```bash
# Use o script que criamos
DATABASE_URL="sua-connection-string" node scripts/setup-production-db.js
```

### Opção 3: Via Neon SQL Editor

1. Acesse o Neon Console
2. Vá em **SQL Editor**
3. Execute o SQL das migrations manualmente

---

## 🔍 Verificar Conexão

### Teste 1: Via Prisma Studio

```bash
DATABASE_URL="sua-connection-string" npx prisma studio
```

Se abrir o Prisma Studio, a conexão está OK!

### Teste 2: Via psql (se tiver instalado)

```bash
psql "sua-connection-string"
```

### Teste 3: Via Node

```javascript
// test-connection.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Conexão OK!');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('PostgreSQL version:', result);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
```

Execute:
```bash
DATABASE_URL="sua-connection-string" node test-connection.js
```

---

## 📊 Monitoramento no Neon

### Dashboard do Neon

Acesse: [console.neon.tech](https://console.neon.tech)

Você pode ver:
- **Storage**: Quanto espaço está usando
- **Compute**: Uso de CPU
- **Connections**: Conexões ativas
- **Queries**: Queries executadas

### Limites do Plano Free

- **Storage**: 0.5 GB
- **Compute**: 100 horas/mês
- **Branches**: 10
- **Projects**: Ilimitados

---

## 🔐 Segurança no Neon

### Boas Práticas:

1. **Rotacione senhas regularmente**
   - Vá em Settings → Reset password
   - Atualize no Netlify

2. **Use IP Allowlist** (opcional)
   - Settings → IP Allow
   - Adicione IPs permitidos

3. **Monitore acessos**
   - Verifique logs regularmente
   - Ative notificações

4. **Backups**
   - Neon faz backup automático
   - Você pode fazer backup manual via pg_dump

---

## 🚀 Otimizações

### 1. Connection Pooling

Já está ativo ao usar `-pooler` no host!

### 2. Índices

Adicione índices nas colunas mais consultadas:

```sql
-- Exemplo
CREATE INDEX idx_transactions_user_id ON "Transaction"("userId");
CREATE INDEX idx_transactions_date ON "Transaction"("date");
```

### 3. Autovacuum

O Neon gerencia automaticamente, mas você pode monitorar:

```sql
SELECT * FROM pg_stat_user_tables;
```

---

## 🐛 Troubleshooting

### Erro: "Connection timeout"

**Causa**: Firewall ou rede bloqueando
**Solução**: 
- Verifique se `sslmode=require` está na URL
- Teste de outra rede
- Verifique IP Allowlist no Neon

### Erro: "Too many connections"

**Causa**: Limite de conexões atingido
**Solução**:
- Use `-pooler` na connection string
- Feche conexões não usadas
- Upgrade para plano pago

### Erro: "SSL required"

**Causa**: Falta `sslmode=require`
**Solução**:
```bash
# Adicione ao final da URL
?sslmode=require
```

### Erro: "Database does not exist"

**Causa**: Nome do banco incorreto
**Solução**:
- Verifique o nome no Neon Console
- Geralmente é `neondb`

---

## 📝 Checklist Final

- [ ] Projeto criado no Neon
- [ ] Connection string copiada (pooled)
- [ ] Senha rotacionada (se foi exposta)
- [ ] DATABASE_URL configurada no Netlify
- [ ] Migrations executadas
- [ ] Conexão testada
- [ ] Tabelas criadas
- [ ] Aplicação funcionando

---

## 🎯 Resumo Rápido

```bash
# 1. Gere nova senha no Neon
# 2. Configure no Netlify
DATABASE_URL=postgresql://neondb_owner:NOVA_SENHA@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# 3. Execute migrations
DATABASE_URL="..." node scripts/setup-production-db.js

# 4. Deploy
git push

# 5. Teste
curl https://seu-site.netlify.app/api/health
```

---

## 🆘 Suporte

- **Neon Docs**: [neon.tech/docs](https://neon.tech/docs)
- **Neon Discord**: [discord.gg/neon](https://discord.gg/neon)
- **Neon Status**: [status.neon.tech](https://status.neon.tech)

---

## ⚠️ LEMBRE-SE

**NUNCA exponha credenciais:**
- ❌ Não cole em chats
- ❌ Não commite no Git
- ❌ Não compartilhe em screenshots
- ✅ Use apenas variáveis de ambiente
- ✅ Rotacione senhas se expor

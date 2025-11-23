# 🚀 Configure o Netlify AGORA

## ⚠️ VOCÊ ESTÁ AQUI

Você fez o deploy, mas o site ainda não vai funcionar porque **faltam as variáveis de ambiente**.

---

## 📋 O QUE FAZER AGORA (3 passos)

### 🔹 PASSO 1: Criar Banco no Neon (5 minutos)

1. Abra em outra aba: **https://console.neon.tech**
2. Faça login/cadastro
3. Clique em **"New Project"**
4. Preencha:
   - **Name**: SuaGrana
   - **Region**: US East (Ohio)
   - **PostgreSQL**: 16
5. Clique em **"Create Project"**
6. **COPIE** a **"Pooled Connection String"** (tem `-pooler` no meio)
   
   Exemplo:
   ```
   postgresql://neondb_owner:abc123xyz@ep-cool-sound-12345-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

7. **GUARDE ESSA URL!** Você vai usar no próximo passo.

---

### 🔹 PASSO 2: Adicionar Variáveis no Netlify (10 minutos)

Você já está na tela certa! Agora adicione **cada uma** dessas 15 variáveis:

#### Como adicionar cada variável:
1. Clique em **"Add a variable"**
2. Cole o **Key** (nome)
3. Cole o **Value** (valor)
4. Se for **Secret**, marque **"Contains secret values"**
5. **Scopes**: Deixe em **"All scopes"**
6. Clique em **"Create variable"**
7. Repita para as próximas variáveis

---

#### ✅ Variável 1 de 15

```
Key: DATABASE_URL
Value: [COLE A URL DO NEON AQUI]
Secret: ✅ SIM (marque "Contains secret values")
```

**⚠️ IMPORTANTE**: Use a URL que você copiou do Neon no Passo 1!

---

#### ✅ Variável 2 de 15

```
Key: JWT_SECRET
Value: 841b331b619c2be6d3d9d2cd244a668f725300f76cb34ade149d5c244fd1ffd1
Secret: ✅ SIM (marque "Contains secret values")
```

---

#### ✅ Variável 3 de 15

```
Key: JWT_REFRESH_SECRET
Value: 80a9fd58d56b21c1f8b54300e13d454d88c16247a5812a7d21b7d222c3a22dbe
Secret: ✅ SIM (marque "Contains secret values")
```

---

#### ✅ Variável 4 de 15

```
Key: JWT_EXPIRES_IN
Value: 24h
Secret: ❌ NÃO
```

---

#### ✅ Variável 5 de 15

```
Key: JWT_REFRESH_EXPIRES_IN
Value: 7d
Secret: ❌ NÃO
```

---

#### ✅ Variável 6 de 15

```
Key: CRON_SECRET
Value: f256dc5546825335c9d0d05d4a9735e54eecdb732935feb566d42eaa7801ab8b
Secret: ✅ SIM (marque "Contains secret values")
```

---

#### ✅ Variável 7 de 15

```
Key: NODE_ENV
Value: production
Secret: ❌ NÃO
```

---

#### ✅ Variável 8 de 15

```
Key: NEXT_PUBLIC_APP_URL
Value: https://seu-site.netlify.app
Secret: ❌ NÃO
```

**⚠️ SUBSTITUA** `seu-site` pelo nome real do seu site no Netlify!

---

#### ✅ Variável 9 de 15

```
Key: ALLOWED_ORIGINS
Value: https://seu-site.netlify.app
Secret: ❌ NÃO
```

**⚠️ SUBSTITUA** `seu-site` pelo nome real do seu site no Netlify!

---

#### ✅ Variável 10 de 15

```
Key: RATE_LIMIT_MAX
Value: 100
Secret: ❌ NÃO
```

---

#### ✅ Variável 11 de 15

```
Key: RATE_LIMIT_WINDOW
Value: 60000
Secret: ❌ NÃO
```

---

#### ✅ Variável 12 de 15

```
Key: BACKUP_ENABLED
Value: true
Secret: ❌ NÃO
```

---

#### ✅ Variável 13 de 15

```
Key: BACKUP_RETENTION_DAYS
Value: 30
Secret: ❌ NÃO
```

---

#### ✅ Variável 14 de 15

```
Key: LOG_LEVEL
Value: info
Secret: ❌ NÃO
```

---

#### ✅ Variável 15 de 15

```
Key: LOG_RETENTION_DAYS
Value: 7
Secret: ❌ NÃO
```

---

### 🔹 PASSO 3: Criar Tabelas no Banco (2 minutos)

Depois de adicionar TODAS as variáveis, execute no terminal:

```bash
cd "Não apagar/SuaGrana-Clean"

# Configurar .env local com a URL do Neon
echo DATABASE_URL="[COLE A URL DO NEON AQUI]" > .env

# Criar tabelas no PostgreSQL
npx prisma generate
npx prisma db push
```

---

## ✅ PRONTO!

Agora:
1. O Netlify vai fazer um novo deploy automaticamente
2. Aguarde 2-3 minutos
3. Acesse seu site: `https://seu-site.netlify.app`
4. Teste a API: `https://seu-site.netlify.app/api/health`

---

## 🐛 Problemas?

### Deploy falhou?
- Verifique se adicionou TODAS as 15 variáveis
- Vá em: **Site settings** → **Deploys** → **Trigger deploy** → **Deploy site**

### Site não abre?
- Aguarde mais 2 minutos (pode demorar)
- Verifique os logs: **Deploys** → Clique no último deploy → **Deploy log**

### Erro de banco?
- Certifique-se de que a DATABASE_URL está correta
- Verifique se tem `-pooler` na URL
- Verifique se tem `?sslmode=require` no final
- Execute: `npx prisma db push` localmente

---

## 📞 Precisa de Ajuda?

Abra o arquivo `VARIAVEIS-NETLIFY.txt` para ver todas as variáveis em formato de lista.

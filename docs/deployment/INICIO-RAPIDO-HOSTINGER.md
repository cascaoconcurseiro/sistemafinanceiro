# ⚡ Início Rápido - Deploy no Hostinger

## 🎯 5 Passos para Colocar no Ar

### 1️⃣ Criar Banco MySQL no Hostinger (2 min)

1. Acesse o **hPanel** do Hostinger
2. **Bancos de Dados** → **MySQL** → **Criar novo**
3. Anote:
   - Banco: `suagrana_db`
   - Usuário: `suagrana_user`
   - Senha: (a que você criar)
   - Host: `localhost`

---

### 2️⃣ Fazer Upload do Projeto (5 min)

**Via FTP:**
1. Use FileZilla ou similar
2. Conecte no seu servidor
3. Envie todos os arquivos para `/public_html/`

**Via SSH (mais rápido):**
```bash
ssh usuario@seu-dominio.com
cd public_html
git clone https://github.com/cascaoconcurseiro/sistemafinanceiro.git .
```

---

### 3️⃣ Configurar Ambiente (3 min)

Crie o arquivo `.env` no servidor:

```bash
DATABASE_URL="mysql://suagrana_user:SUA_SENHA@localhost:3306/suagrana_db"
JWT_SECRET="841b331b619c2be6d3d9d2cd244a668f725300f76cb34ade149d5c244fd1ffd1"
JWT_REFRESH_SECRET="80a9fd58d56b21c1f8b54300e13d454d88c16247a5812a7d21b7d222c3a22dbe"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
CRON_SECRET="f256dc5546825335c9d0d05d4a9735e54eecdb732935feb566d42eaa7801ab8b"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
ALLOWED_ORIGINS="https://seu-dominio.com"
```

---

### 4️⃣ Instalar e Configurar (5 min)

```bash
# Instalar dependências
npm install

# Criar tabelas no banco
npx prisma db push

# Criar primeiro usuário
node scripts/create-first-user.js

# Build de produção
npm run build
```

---

### 5️⃣ Iniciar Aplicação (2 min)

**No hPanel:**
1. **Avançado** → **Node.js**
2. **Criar aplicação**:
   - Versão: 18.x
   - Diretório: `/public_html`
   - Comando: `npm start`
   - Porta: (automática)

**Ou via SSH:**
```bash
npm start
```

---

## ✅ Pronto!

Acesse: `https://seu-dominio.com`

**Login:**
- Email: `admin@suagrana.com`
- Senha: `admin123`

---

## 📋 Checklist

- [ ] Banco MySQL criado
- [ ] Projeto enviado para servidor
- [ ] `.env` configurado
- [ ] `npm install` executado
- [ ] `npx prisma db push` executado
- [ ] Usuário admin criado
- [ ] `npm run build` executado
- [ ] Aplicação iniciada
- [ ] Site funcionando

---

## 🆘 Problemas?

Veja o guia completo: `DEPLOY-HOSTINGER.md`

**Erros comuns:**
- **Can't reach database**: Verifique DATABASE_URL no `.env`
- **Prisma not found**: Execute `npx prisma generate`
- **Port in use**: Use a porta do Hostinger (variável PORT)

---

## 📞 Suporte

- **Hostinger Chat**: 24/7 no hPanel
- **Documentação**: https://support.hostinger.com

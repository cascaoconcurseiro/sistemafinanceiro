# 🚀 Deploy Final no Hostinger

## ✅ Projeto Pronto

O projeto está 100% configurado para deploy no Hostinger com MySQL.

---

## 📦 O que você precisa fazer no Hostinger

### 1️⃣ Criar Banco MySQL (2 min)

1. Acesse o **hPanel** do Hostinger
2. **Bancos de Dados** → **MySQL** → **Criar novo**
3. Anote as credenciais:
   - **Host**: localhost
   - **Porta**: 3306
   - **Banco**: (nome que você escolher)
   - **Usuário**: (nome que você escolher)
   - **Senha**: (senha que você criar)

---

### 2️⃣ Fazer Upload do Projeto (5 min)

**Opção A - Via Git (Recomendado):**
```bash
ssh usuario@seu-dominio.com
cd public_html
git clone https://github.com/cascaoconcurseiro/sistemafinanceiro.git .
```

**Opção B - Via FTP:**
- Use FileZilla
- Envie todos os arquivos para `/public_html/`

---

### 3️⃣ Configurar .env no Servidor (2 min)

Crie o arquivo `.env` no servidor com:

```bash
# Banco MySQL do Hostinger
DATABASE_URL="mysql://SEU_USUARIO:SUA_SENHA@localhost:3306/SEU_BANCO"

# JWT (use as chaves abaixo)
JWT_SECRET="841b331b619c2be6d3d9d2cd244a668f725300f76cb34ade149d5c244fd1ffd1"
JWT_REFRESH_SECRET="80a9fd58d56b21c1f8b54300e13d454d88c16247a5812a7d21b7d222c3a22dbe"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# CRON
CRON_SECRET="f256dc5546825335c9d0d05d4a9735e54eecdb732935feb566d42eaa7801ab8b"

# AMBIENTE
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
```

---

### 4️⃣ Instalar e Configurar (5 min)

```bash
# Instalar dependências
npm install

# Criar tabelas no banco
npx prisma db push

# Criar usuário administrador
node scripts/setup/create-admin-user.js

# Build de produção
npm run build
```

---

### 5️⃣ Configurar Aplicação Node.js no hPanel (2 min)

1. **Avançado** → **Node.js**
2. **Criar aplicação**:
   - **Versão**: 18.x ou superior
   - **Diretório**: `/public_html`
   - **Comando de inicialização**: `npm start`
   - **Porta**: (automática)

---

### 6️⃣ Iniciar Aplicação

No hPanel, clique em **Iniciar** ou via SSH:
```bash
npm start
```

---

## ✅ Pronto!

Acesse: `https://seu-dominio.com`

**Login do Administrador:**
- Email: adm@suagrana.com.br
- Senha: 834702

---

## 📋 Checklist

- [ ] Banco MySQL criado no Hostinger
- [ ] Projeto clonado/enviado para servidor
- [ ] `.env` configurado com credenciais do MySQL
- [ ] `npm install` executado
- [ ] `npx prisma db push` executado
- [ ] Usuário admin criado
- [ ] `npm run build` executado
- [ ] Aplicação Node.js configurada no hPanel
- [ ] Aplicação iniciada
- [ ] Site funcionando

---

## 🔧 Comandos Úteis

```bash
# Ver logs
pm2 logs

# Reiniciar aplicação
pm2 restart all

# Parar aplicação
pm2 stop all

# Status
pm2 status
```

---

## 🐛 Problemas?

Consulte: `docs/deployment/TROUBLESHOOTING.md`

---

## 📞 Suporte Hostinger

- **Chat 24/7**: Disponível no hPanel
- **Tutoriais**: https://support.hostinger.com

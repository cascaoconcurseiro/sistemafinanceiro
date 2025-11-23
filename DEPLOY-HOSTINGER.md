# 🚀 Deploy no Hostinger - Guia Completo

## 📋 Pré-requisitos

1. Conta no Hostinger com plano que suporte Node.js
2. Acesso ao painel de controle (hPanel)
3. Banco de dados MySQL ou PostgreSQL criado

---

## 🗄️ PASSO 1: Criar Banco de Dados no Hostinger

### MySQL (Recomendado para Hostinger)

1. Acesse o **hPanel** do Hostinger
2. Vá em **Bancos de Dados** → **MySQL**
3. Clique em **Criar novo banco de dados**
4. Preencha:
   - **Nome do banco**: `suagrana_db`
   - **Usuário**: `suagrana_user`
   - **Senha**: Gere uma senha forte
5. Anote as informações:
   - Host: `localhost` ou `127.0.0.1`
   - Porta: `3306`
   - Banco: `suagrana_db`
   - Usuário: `suagrana_user`
   - Senha: (a que você criou)

### PostgreSQL (Se disponível)

1. Vá em **Bancos de Dados** → **PostgreSQL**
2. Crie o banco seguindo os mesmos passos
3. Porta padrão: `5432`

---

## ⚙️ PASSO 2: Configurar o Projeto para MySQL

O Hostinger geralmente usa MySQL. Vou atualizar o schema do Prisma:

### Atualizar `prisma/schema.prisma`

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

### Formato da DATABASE_URL para MySQL

```
mysql://usuario:senha@localhost:3306/nome_banco
```

Exemplo:
```
mysql://suagrana_user:SuaSenha123@localhost:3306/suagrana_db
```

---

## 📦 PASSO 3: Build do Projeto

Execute localmente:

```bash
cd "Não apagar/SuaGrana-Clean"

# 1. Instalar dependências
npm install

# 2. Configurar .env com dados do Hostinger
# (edite o arquivo .env)

# 3. Gerar Prisma Client
npx prisma generate

# 4. Criar tabelas no banco
npx prisma db push

# 5. Criar primeiro usuário
node scripts/create-first-user.js

# 6. Build de produção
npm run build
```

---

## 📤 PASSO 4: Upload para o Hostinger

### Opção A: Via FTP/SFTP (Recomendado)

1. **Conectar via FTP**:
   - Host: Seu domínio ou IP do servidor
   - Usuário: Seu usuário FTP
   - Senha: Sua senha FTP
   - Porta: 21 (FTP) ou 22 (SFTP)

2. **Fazer upload dos arquivos**:
   ```
   /public_html/
   ├── .next/              (pasta de build)
   ├── node_modules/       (dependências)
   ├── prisma/
   ├── public/
   ├── src/
   ├── package.json
   ├── next.config.js
   └── .env
   ```

3. **Arquivos essenciais**:
   - ✅ `.next/` (resultado do build)
   - ✅ `node_modules/` (ou instalar no servidor)
   - ✅ `package.json`
   - ✅ `prisma/`
   - ✅ `.env` (com credenciais do banco)
   - ❌ NÃO envie: `.git/`, `node_modules/` (se for instalar no servidor)

### Opção B: Via Git + SSH

```bash
# 1. Conectar via SSH
ssh usuario@seu-dominio.com

# 2. Clonar repositório
cd public_html
git clone https://github.com/cascaoconcurseiro/sistemafinanceiro.git .

# 3. Instalar dependências
npm install

# 4. Configurar .env
nano .env
# (cole as variáveis de ambiente)

# 5. Build
npm run build

# 6. Criar tabelas
npx prisma db push

# 7. Criar usuário
node scripts/create-first-user.js
```

---

## 🔧 PASSO 5: Configurar Variáveis de Ambiente

Crie o arquivo `.env` no servidor com:

```bash
# Banco de Dados MySQL
DATABASE_URL="mysql://suagrana_user:SuaSenha123@localhost:3306/suagrana_db"

# JWT
JWT_SECRET="841b331b619c2be6d3d9d2cd244a668f725300f76cb34ade149d5c244fd1ffd1"
JWT_REFRESH_SECRET="80a9fd58d56b21c1f8b54300e13d454d88c16247a5812a7d21b7d222c3a22dbe"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Cron
CRON_SECRET="f256dc5546825335c9d0d05d4a9735e54eecdb732935feb566d42eaa7801ab8b"

# Ambiente
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"

# CORS
ALLOWED_ORIGINS="https://seu-dominio.com"

# Rate Limiting
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="60000"

# Backup
BACKUP_ENABLED="true"
BACKUP_RETENTION_DAYS="30"

# Logs
LOG_LEVEL="info"
LOG_RETENTION_DAYS="7"
```

---

## 🚀 PASSO 6: Iniciar a Aplicação

### No Hostinger (via hPanel)

1. Vá em **Avançado** → **Node.js**
2. Clique em **Criar aplicação**
3. Configure:
   - **Versão do Node**: 18.x ou superior
   - **Modo**: Production
   - **Diretório**: `/public_html`
   - **Arquivo de entrada**: `server.js` (vamos criar)
   - **Porta**: A que o Hostinger fornecer

### Criar `server.js`

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

### Atualizar `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node server.js",
    "postinstall": "prisma generate"
  }
}
```

---

## 🔄 PASSO 7: Configurar Domínio

1. No hPanel, vá em **Domínios**
2. Aponte seu domínio para a aplicação Node.js
3. Configure SSL (Let's Encrypt gratuito)

---

## ✅ PASSO 8: Testar

1. Acesse: `https://seu-dominio.com`
2. Faça login com:
   - Email: `admin@suagrana.com`
   - Senha: `admin123`

---

## 🐛 Troubleshooting

### Erro: "Can't reach database server"

**Solução**: Verifique as credenciais do banco no `.env`

### Erro: "Prisma Client not found"

**Solução**:
```bash
npx prisma generate
```

### Erro: "Port already in use"

**Solução**: Use a porta fornecida pelo Hostinger (variável `PORT`)

### Site não carrega

**Solução**:
1. Verifique os logs: `pm2 logs` ou no painel do Hostinger
2. Certifique-se de que o build foi feito: `npm run build`
3. Reinicie a aplicação

---

## 📊 Checklist Final

- [ ] Banco de dados MySQL criado no Hostinger
- [ ] Projeto clonado/enviado para o servidor
- [ ] Dependências instaladas (`npm install`)
- [ ] `.env` configurado com credenciais corretas
- [ ] Build realizado (`npm run build`)
- [ ] Tabelas criadas (`npx prisma db push`)
- [ ] Usuário admin criado
- [ ] `server.js` criado
- [ ] Aplicação Node.js configurada no hPanel
- [ ] Domínio apontado
- [ ] SSL configurado
- [ ] Site funcionando

---

## 🔐 Segurança

Depois que funcionar:

1. **Altere a senha do admin**
2. **Altere a senha do banco de dados**
3. **Configure backup automático**
4. **Configure firewall** (se disponível)

---

## 📞 Suporte Hostinger

- **Chat**: Disponível 24/7 no hPanel
- **Tutoriais**: https://support.hostinger.com
- **Node.js**: https://support.hostinger.com/en/articles/5617851-how-to-set-up-a-node-js-application

---

**Próximo passo**: Vou criar o arquivo `server.js` e atualizar o schema do Prisma para MySQL!

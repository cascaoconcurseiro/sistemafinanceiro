# SuaGrana - Sistema Financeiro

Sistema completo de gestão financeira pessoal.

## 🚀 Deploy no Hostinger

Siga o guia: `DEPLOY-HOSTINGER.md`

Ou o guia rápido: `INICIO-RAPIDO-HOSTINGER.md`

## 📦 Instalação

```bash
npm install
npx prisma generate
npx prisma db push
node scripts/create-first-user.js
npm run build
npm start
```

## 🔧 Configuração

Crie o arquivo `.env` com:

```bash
DATABASE_URL="mysql://usuario:senha@localhost:3306/banco"
JWT_SECRET="sua-chave-jwt"
JWT_REFRESH_SECRET="sua-chave-refresh"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
```

## 📚 Documentação

- `DEPLOY-HOSTINGER.md` - Guia completo de deploy
- `INICIO-RAPIDO-HOSTINGER.md` - Guia rápido (17 min)
- `RESUMO-FINAL.md` - Visão geral do projeto

## 🔐 Primeiro Acesso

Após criar o primeiro usuário:
- Email: admin@suagrana.com
- Senha: admin123

⚠️ Altere a senha após o primeiro login!

## 📞 Suporte

Para problemas, consulte: `TROUBLESHOOTING-NETLIFY.md`

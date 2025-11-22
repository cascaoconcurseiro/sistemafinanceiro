# 💰 SuaGrana - Sistema de Gestão Financeira Pessoal

> Sistema completo de controle financeiro pessoal com recursos avançados de gestão, análise e planejamento.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Configurar banco de dados
cp .env.example .env
npx prisma migrate dev

# Iniciar desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

## ✨ Funcionalidades

### 💳 Gestão Financeira
- **Contas Bancárias** - Controle múltiplas contas
- **Transações** - Receitas, despesas e transferências
- **Cartões de Crédito** - Gestão de faturas e limites
- **Parcelamentos** - Controle de compras parceladas

### 📊 Análise e Relatórios
- **Dashboard Interativo** - Visão geral das finanças
- **Relatórios Detalhados** - Análises por período
- **Gráficos e Métricas** - Visualização de dados
- **Exportação** - PDF, Excel, CSV

### 🎯 Planejamento
- **Orçamentos** - Defina limites por categoria
- **Metas Financeiras** - Acompanhe objetivos
- **Investimentos** - Registre e monitore
- **Viagens** - Planeje gastos de viagens

### 👥 Recursos Colaborativos
- **Despesas Compartilhadas** - Divida gastos
- **Gestão de Dívidas** - Controle empréstimos
- **Múltiplos Usuários** - Compartilhe contas

### 🔔 Notificações Inteligentes
- **Alertas de Vencimento** - Nunca perca um pagamento
- **Limites de Orçamento** - Avisos de gastos
- **Progresso de Metas** - Acompanhe objetivos

### 🔒 Segurança
- **Autenticação 2FA** - Segurança reforçada
- **Criptografia** - Dados protegidos
- **Auditoria** - Rastreamento completo
- **Backup Automático** - Seus dados seguros

## 🏗️ Tecnologias

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **React Query** - Gerenciamento de estado

### Backend
- **Next.js API Routes** - API REST
- **Prisma** - ORM
- **PostgreSQL** - Banco de dados
- **NextAuth** - Autenticação
- **Zod** - Validação de schemas

### Infraestrutura
- **Vercel/Netlify** - Deploy
- **Neon** - Database hosting
- **Upstash Redis** - Cache
- **GitHub Actions** - CI/CD

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── (auth)/            # Páginas de autenticação
│   └── (dashboard)/       # Páginas do dashboard
├── components/            # Componentes React
│   ├── features/         # Componentes por feature
│   ├── ui/               # Componentes reutilizáveis
│   └── layout/           # Layouts
├── lib/                   # Bibliotecas e utilitários
│   ├── services/         # Lógica de negócio
│   ├── utils/            # Funções utilitárias
│   └── validation/       # Schemas Zod
├── contexts/             # React Contexts
├── hooks/                # Custom Hooks
└── types/                # TypeScript Types

docs/                      # Documentação
├── audits/               # Relatórios de auditoria
├── development/          # Guias de desenvolvimento
├── architecture/         # Documentação de arquitetura
└── deployment/           # Guias de deploy

scripts/                   # Scripts utilitários
prisma/                    # Schema e migrations
public/                    # Arquivos estáticos
```

## 🛠️ Desenvolvimento

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Configuração

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/suagrana.git
cd suagrana
```

2. **Instale dependências**
```bash
npm install
```

3. **Configure variáveis de ambiente**
```bash
cp .env.example .env
```

Edite `.env` com suas configurações:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/suagrana"
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Execute migrations**
```bash
npx prisma migrate dev
npx prisma db seed
```

5. **Inicie o servidor**
```bash
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Lint do código
npm run type-check   # Verificação de tipos
npm run test         # Executar testes
npm run db:studio    # Prisma Studio
npm run db:migrate   # Executar migrations
npm run db:seed      # Popular banco de dados
```

## 📚 Documentação

- [Guia de Desenvolvimento](docs/development/GUIA-DESENVOLVIMENTO.md)
- [Arquitetura do Sistema](docs/architecture/IMPLEMENTACAO-COMPLETA.md)
- [API Documentation](docs/api/README.md)
- [Guia de Deploy](docs/deployment/NETLIFY-SETUP.md)
- [Índice Completo](docs/README.md)

## 🧪 Testes

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🚀 Deploy

### Vercel (Recomendado)
```bash
vercel
```

### Netlify
```bash
netlify deploy --prod
```

Veja o [Guia de Deploy](docs/deployment/) para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia o [Guia de Contribuição](CONTRIBUTING.md).

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Changelog

Veja [CHANGELOG.md](CHANGELOG.md) para histórico de versões.

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Equipe SuaGrana** - [GitHub](https://github.com/suagrana)

## 🙏 Agradecimentos

- Next.js Team
- Prisma Team
- Shadcn/ui
- Comunidade Open Source

## 📞 Suporte

- 📧 Email: suporte@suagrana.com
- 💬 Discord: [SuaGrana Community](https://discord.gg/suagrana)
- 🐛 Issues: [GitHub Issues](https://github.com/suagrana/issues)

---

**Feito com ❤️ pela equipe SuaGrana**

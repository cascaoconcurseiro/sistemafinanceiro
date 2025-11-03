# Sistema Financeiro SuaGrana

Um sistema completo de gestão financeira pessoal com funcionalidades avançadas para controle de despesas, viagens e compartilhamento de gastos.

## 🚀 Funcionalidades Principais

### 💰 Gestão Financeira
- **Controle de Contas**: Gerenciamento de múltiplas contas bancárias e cartões
- **Transações**: Registro completo de receitas e despesas
- **Categorização**: Sistema inteligente de categorização automática
- **Parcelamento**: Controle de compras parceladas e prestações
- **Cartão de Crédito**: Gestão de faturas e limites

### 👥 Despesas Compartilhadas
- **Divisão de Gastos**: Compartilhamento de despesas entre usuários
- **Cálculo Automático**: Divisão proporcional ou igualitária
- **Controle de Dívidas**: Acompanhamento de valores a pagar/receber
- **Notificações**: Alertas de pagamentos pendentes

### ✈️ Gestão de Viagens
- **Planejamento**: Criação e organização de viagens
- **Orçamento**: Controle de gastos por viagem
- **Participantes**: Gestão de viajantes e divisão de custos
- **Relatórios**: Análise detalhada dos gastos por viagem

### 📊 Relatórios e Análises
- **Dashboard**: Visão geral da situação financeira
- **Gráficos**: Análises visuais de gastos e receitas
- **Exportação**: Relatórios em diversos formatos
- **Histórico**: Acompanhamento temporal das finanças

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Shadcn/ui** - Componentes de interface
- **React Query** - Gerenciamento de estado servidor

### Backend
- **Next.js API Routes** - API REST integrada
- **Prisma** - ORM para banco de dados
- **SQLite** - Banco de dados (desenvolvimento)
- **NextAuth.js** - Autenticação e autorização

### Ferramentas de Desenvolvimento
- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **Jest** - Testes unitários
- **Playwright** - Testes end-to-end

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/cascaoconcurseiro/sistemafinanceiro.git
cd sistemafinanceiro
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

4. **Configure o banco de dados**
```bash
npx prisma generate
npx prisma db push
```

5. **Execute o projeto**
```bash
npm run dev
```

6. **Acesse a aplicação**
```
http://localhost:3000
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start

# Testes
npm test

# Linting
npm run lint

# Formatação
npm run format
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Dashboard principal
│   └── ...
├── components/            # Componentes React
│   ├── ui/               # Componentes base (Shadcn)
│   ├── features/         # Componentes de funcionalidades
│   └── layout/           # Componentes de layout
├── lib/                  # Utilitários e configurações
│   ├── services/         # Serviços de negócio
│   ├── utils/           # Funções utilitárias
│   └── validation/      # Schemas de validação
├── hooks/               # Custom hooks
└── contexts/           # Contextos React
```

## 🔧 Configuração

### Banco de Dados
O projeto utiliza Prisma como ORM. Para configurar:

1. Configure a `DATABASE_URL` no arquivo `.env`
2. Execute as migrações: `npx prisma db push`
3. (Opcional) Popule dados iniciais: `npm run seed`

### Autenticação
Configure as variáveis de ambiente para NextAuth.js:
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## 📖 Documentação

A documentação detalhada está disponível na pasta `docs/`:

- [Guia de Funcionalidades](docs/GUIA-RAPIDO-NOVAS-FUNCIONALIDADES.md)
- [Arquitetura do Sistema](docs/ARQUITETURA-SISTEMA-INTERLIGADO.md)
- [Fluxo Contábil](docs/FLUXO-CONTABIL-PARCELAS.md)

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Wesley Cascão**
- GitHub: [@cascaoconcurseiro](https://github.com/cascaoconcurseiro)

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) - Framework React
- [Prisma](https://prisma.io/) - ORM TypeScript
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Shadcn/ui](https://ui.shadcn.com/) - Componentes de UI
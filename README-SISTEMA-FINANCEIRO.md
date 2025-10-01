# 💰 Sistema Financeiro Completo - TypeScript/PostgreSQL

Um sistema financeiro robusto e completo desenvolvido em TypeScript/Node.js com PostgreSQL como única fonte de verdade.

## 🚀 Características Principais

### ✨ Funcionalidades Core
- **Contas Bancárias e Cartões de Crédito** com saldo atualizado automaticamente
- **Transações** (receita, despesa, transferência) com ID único
- **Atualização em tempo real** usando sistema de eventos/observers
- **CRUD completo** para contas, cartões e transações
- **Consultas avançadas** de saldo, extrato e relatórios
- **Suporte a múltiplos usuários** com autenticação segura
- **Categorias e subcategorias** organizadas hierarquicamente
- **Alertas inteligentes** para saldo negativo ou limite de cartão
- **Dados iniciais simulados** para testes e demonstração

### 🏗️ Arquitetura Técnica
- **TypeScript** com tipagem forte e interfaces bem definidas
- **PostgreSQL** como única fonte de verdade
- **Sistema de Eventos** para atualizações em tempo real
- **Estrutura modular** e limpa, fácil de manter
- **Pronto para Neon/PostgreSQL** sem alterações estruturais
- **Sem localStorage** - tudo no banco de dados

## 📁 Estrutura do Projeto

```
src/
├── config/
│   └── database.ts          # Configuração e conexão PostgreSQL
├── types/
│   └── database.ts          # Tipos e interfaces TypeScript
├── events/
│   └── event-system.ts      # Sistema de eventos/observers
├── services/
│   ├── user-service.ts      # CRUD de usuários
│   ├── account-service.ts   # CRUD de contas e cartões
│   ├── category-service.ts  # CRUD de categorias
│   ├── transaction-service.ts # CRUD de transações
│   └── alert-service.ts     # Sistema de alertas
├── data/
│   └── initial-data.ts      # Dados iniciais para teste
├── index.ts                 # Arquivo principal
database/
└── schema.sql              # Schema completo PostgreSQL
```

## 🛠️ Instalação e Configuração

### 1. Pré-requisitos
- Node.js >= 16.0.0
- PostgreSQL >= 12
- npm >= 8.0.0

### 2. Instalação
```bash
# Clone o repositório
git clone <seu-repositorio>
cd sistema-financeiro-typescript

# Instale as dependências
npm install
```

### 3. Configuração do Banco de Dados

#### 3.1 Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Configuração do PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_financeiro
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_SSL=false

# Para Neon Database (opcional)
# DATABASE_URL=postgresql://usuario:senha@host:5432/database?sslmode=require

# Configurações da aplicação
NODE_ENV=development
LOG_LEVEL=info
```

#### 3.2 Inicializar Schema
```bash
# Execute o schema SQL no seu PostgreSQL
psql -U seu_usuario -d sistema_financeiro -f database/schema.sql

# Ou use o script de inicialização (quando disponível)
npm run finance:init
```

### 4. Executar o Sistema

#### 4.1 Modo Desenvolvimento
```bash
# Executar sistema financeiro
npm run finance:dev

# Executar exemplo de uso
npm run finance:example
```

#### 4.2 Modo Produção
```bash
# Build do projeto
npm run build

# Executar em produção
npm start
```

## 📖 Como Usar

### 1. Inicialização Básica

```typescript
import { initializeSystem, financialSystem } from './src/index';

// Inicializar sistema com dados de teste
await initializeSystem({
  createTestData: true,
  createDemoUser: true
});

// Verificar se está pronto
if (financialSystem.isReady()) {
  console.log('Sistema pronto para uso!');
}
```

### 2. Gerenciamento de Usuários

```typescript
// Criar usuário
const userResult = await financialSystem.users.createUser({
  name: 'João da Silva',
  email: 'joao@exemplo.com',
  password: 'senha123',
  phone: '(11) 99999-9999'
});

// Buscar usuário
const user = await financialSystem.users.findUserByEmail('joao@exemplo.com');

// Autenticar usuário
const authResult = await financialSystem.users.authenticateUser(
  'joao@exemplo.com', 
  'senha123'
);
```

### 3. Gerenciamento de Contas

```typescript
// Criar conta bancária
const accountResult = await financialSystem.accounts.createAccount({
  user_id: userId,
  name: 'Conta Corrente',
  type: 'checking',
  initial_balance: 1000.00,
  description: 'Minha conta principal'
});

// Criar cartão de crédito
const cardResult = await financialSystem.accounts.createCreditCard({
  user_id: userId,
  name: 'Cartão Visa',
  credit_limit: 5000.00,
  closing_day: 15,
  due_day: 10
});

// Consultar saldo
const account = await financialSystem.accounts.findAccountById(accountId);
console.log(`Saldo: R$ ${parseFloat(account.balance).toFixed(2)}`);
```

### 4. Gerenciamento de Categorias

```typescript
// Criar categoria principal
const categoryResult = await financialSystem.categories.createCategory({
  user_id: userId,
  name: 'Alimentação',
  description: 'Gastos com comida',
  color: '#FF6B6B',
  icon: '🍽️'
});

// Criar subcategoria
const subcategoryResult = await financialSystem.categories.createCategory({
  user_id: userId,
  name: 'Restaurantes',
  parent_id: categoryResult.data.id,
  color: '#FF8E8E',
  icon: '🍴'
});
```

### 5. Gerenciamento de Transações

```typescript
// Criar transação de despesa
const transactionResult = await financialSystem.transactions.createTransaction({
  user_id: userId,
  type: 'expense',
  amount: -50.00,
  description: 'Almoço no restaurante',
  transaction_date: '2024-01-15',
  account_id: accountId,
  category_id: categoryId
});

// Criar transferência entre contas
const transferResult = await financialSystem.transactions.createTransaction({
  user_id: userId,
  type: 'transfer',
  amount: -200.00,
  description: 'Transferência para poupança',
  transaction_date: '2024-01-15',
  account_id: contaCorrenteId,
  transfer_account_id: poupancaId
});

// Listar transações com filtros
const transactions = await financialSystem.transactions.listUserTransactions(userId, {
  type: 'expense',
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  category_id: categoryId,
  limit: 10,
  offset: 0
});
```

### 6. Sistema de Alertas

```typescript
// Listar alertas não lidos
const alerts = await financialSystem.alerts.listUserAlerts(userId, {
  is_read: false,
  limit: 10
});

// Marcar alerta como lido
await financialSystem.alerts.markAlertAsRead(alertId);

// Marcar todos como lidos
await financialSystem.alerts.markAllAlertsAsRead(userId);
```

### 7. Sistema de Eventos

```typescript
// Escutar eventos de transação
financialSystem.events.subscribe('transaction_created', (event) => {
  console.log('Nova transação criada:', event.payload);
});

// Escutar mudanças de saldo
financialSystem.events.subscribe('account_balance_updated', (event) => {
  console.log('Saldo atualizado:', event.payload);
});

// Escutar alertas
financialSystem.events.subscribe('alert_created', (event) => {
  console.log('Novo alerta:', event.payload);
});
```

## 🔧 Scripts Disponíveis

### Sistema Financeiro
- `npm run finance:dev` - Executar em modo desenvolvimento
- `npm run finance:example` - Executar exemplo de uso
- `npm run finance:init` - Inicializar banco de dados
- `npm run finance:seed` - Popular com dados de teste
- `npm run finance:reset` - Resetar banco de dados

### Desenvolvimento Geral
- `npm run build` - Build do projeto
- `npm run dev` - Next.js em desenvolvimento
- `npm run start` - Executar em produção
- `npm run test` - Executar testes
- `npm run lint` - Verificar código

## 🗄️ Schema do Banco de Dados

### Tabelas Principais

#### `users` - Usuários do Sistema
- `id` (UUID, PK)
- `name` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `phone` (VARCHAR)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

#### `accounts` - Contas Bancárias
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `name` (VARCHAR)
- `type` (ENUM: checking, savings, investment)
- `balance` (DECIMAL)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

#### `credit_cards` - Cartões de Crédito
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `name` (VARCHAR)
- `credit_limit` (DECIMAL)
- `current_balance` (DECIMAL)
- `closing_day`, `due_day` (INTEGER)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

#### `transactions` - Transações
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `type` (ENUM: income, expense, transfer)
- `amount` (DECIMAL)
- `description` (TEXT)
- `transaction_date` (DATE)
- `account_id` (UUID, FK)
- `category_id` (UUID, FK)
- `transfer_account_id` (UUID, FK)
- `created_at`, `updated_at` (TIMESTAMP)

#### `categories` - Categorias
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `name` (VARCHAR)
- `parent_id` (UUID, FK)
- `description` (TEXT)
- `color` (VARCHAR)
- `icon` (VARCHAR)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### Funcionalidades Avançadas

#### Triggers Automáticos
- **Atualização de Saldo**: Saldos são atualizados automaticamente em transações
- **Auditoria**: Todas as operações são registradas em `audit_logs`
- **Timestamps**: `updated_at` é atualizado automaticamente

#### Views Úteis
- `account_balance_summary`: Resumo de saldos por usuário
- `transaction_details`: Detalhes completos de transações

#### Índices de Performance
- Índices em campos de busca frequente
- Índices compostos para queries complexas

## 🔐 Segurança

### Autenticação
- Senhas hasheadas com bcrypt
- Validação de entrada em todos os endpoints
- Sanitização de dados

### Banco de Dados
- Prepared statements para prevenir SQL injection
- Transações para consistência de dados
- Soft delete para preservar histórico

### Validações
- Validação de email, telefone e dados de entrada
- Verificação de permissões por usuário
- Limites de taxa para operações sensíveis

## 📊 Monitoramento e Logs

### Sistema de Logs
- Winston para logging estruturado
- Diferentes níveis de log (error, warn, info, debug)
- Logs de auditoria para todas as operações

### Métricas
- Estatísticas do pool de conexões
- Contadores de eventos
- Performance de queries

## 🚀 Deploy para Produção

### Neon Database
```env
# Configure a URL do Neon
DATABASE_URL=postgresql://usuario:senha@host:5432/database?sslmode=require
```

### Variáveis de Ambiente Produção
```env
NODE_ENV=production
LOG_LEVEL=warn
DB_SSL=true
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Build e Deploy
```bash
# Build para produção
npm run build

# Executar em produção
NODE_ENV=production npm start
```

## 🧪 Testes

### Executar Testes
```bash
# Todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de testes
npm run test:coverage
```

### Dados de Teste
O sistema inclui dados iniciais para teste:
- Usuários de exemplo
- Contas e cartões pré-configurados
- Transações simuladas
- Categorias padrão

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação do código
- Verifique os logs do sistema

## 🔄 Changelog

### v1.0.0
- ✅ Sistema completo de usuários, contas e transações
- ✅ Sistema de eventos em tempo real
- ✅ Categorias hierárquicas
- ✅ Alertas automáticos
- ✅ Schema PostgreSQL completo
- ✅ Dados iniciais para teste
- ✅ Documentação completa

---

**Desenvolvido com ❤️ em TypeScript + PostgreSQL**
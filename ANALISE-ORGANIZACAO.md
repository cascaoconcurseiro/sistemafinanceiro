# Análise de Organização e Refatoração

## 🔍 Problemas Identificados

### 1. Duplicação de Pastas
- ❌ `src/providers` E `src/components/providers` (duplicado)
- ❌ `src/middleware` E `src/middleware.ts` (confuso)
- ❌ `src/utils` E `src/lib/utils` (duplicado)

### 2. Pastas Vazias ou Quase Vazias
- `src/financial/` - vazia
- `src/utils/` - apenas 1 arquivo
- `src/__mocks__/` - pode ser removido se não usa testes

### 3. Estrutura Confusa em `src/lib`
Muitos arquivos soltos na raiz de `src/lib` que deveriam estar organizados:
- 40+ arquivos na raiz
- Deveria ter subpastas claras

### 4. Páginas Duplicadas em `src/app`
- `accounts` E `accounts-manager` (duplicado?)
- `shared` E `shared-debts` (duplicado?)
- `travel` E `trips` (duplicado?)

## ✅ Estrutura Ideal Sugerida

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Rotas do dashboard
│   ├── api/               # API routes
│   └── ...
│
├── components/
│   ├── ui/                # Componentes base (shadcn)
│   ├── features/          # Componentes de features
│   ├── layout/            # Layouts
│   ├── modals/            # Modais
│   └── providers/         # React providers
│
├── lib/
│   ├── api/               # Cliente API
│   ├── auth/              # Autenticação
│   ├── database/          # Prisma e DB
│   ├── services/          # Serviços de negócio
│   ├── utils/             # Utilitários
│   └── hooks/             # Hooks customizados (mover de src/hooks)
│
├── types/                 # TypeScript types
├── contexts/              # React contexts
└── middleware.ts          # Next.js middleware
```

## 🎯 Ações Recomendadas

### Prioridade Alta
1. **Remover duplicações**
   - Consolidar `providers`
   - Consolidar `utils`
   - Remover páginas duplicadas

2. **Organizar src/lib**
   - Criar subpastas por domínio
   - Mover arquivos soltos

3. **Limpar páginas não usadas**
   - Verificar quais páginas realmente funcionam
   - Remover as não utilizadas

### Prioridade Média
4. **Mover hooks**
   - `src/hooks` → `src/lib/hooks`

5. **Consolidar middleware**
   - Manter apenas `src/middleware.ts`

### Prioridade Baixa
6. **Remover pastas vazias**
7. **Padronizar nomenclatura**

## 📊 Impacto

### Antes
- Estrutura confusa
- Duplicações
- Difícil de navegar
- ~40 arquivos soltos em lib/

### Depois
- Estrutura clara
- Sem duplicações
- Fácil de encontrar código
- Organizado por domínio

## ⚠️ Cuidados

- Fazer backup antes
- Testar após cada mudança
- Atualizar imports
- Verificar build

## 🚀 Próximos Passos

1. Criar backup
2. Aplicar refatoração gradual
3. Testar sistema
4. Commit incremental

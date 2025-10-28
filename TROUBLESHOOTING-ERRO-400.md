# Troubleshooting - Erro 400 ao Criar Conta

## Problema
Erro 400 (Bad Request) ao tentar criar uma nova conta através da interface.

## Como Identificar o Erro

### 1. Verificar Logs do Servidor
No terminal onde está rodando `npm run dev`, procure por:

```
🔍 API Accounts - Body recebido: {...}
🔍 API Accounts - Tipo do campo type: ...
❌ [API Accounts] Erro de validação: [...]
```

### 2. Possíveis Causas

#### Causa 1: Campo `type` inválido
**Sintoma:** Erro de validação no campo `type`

**Solução:** Verificar se o frontend está enviando um dos tipos válidos:
- `checking`
- `savings`
- `investment`
- `credit_card`
- `cash`

**Arquivo:** `src/components/features/accounts/enhanced-accounts-manager.tsx`

#### Causa 2: Campo `name` vazio
**Sintoma:** Erro "Nome é obrigatório"

**Solução:** Garantir que o campo nome não está vazio no formulário

#### Causa 3: Conta duplicada
**Sintoma:** Erro "Já existe uma conta com este nome"

**Solução:** Usar um nome diferente para a conta

#### Causa 4: Categoria não encontrada
**Sintoma:** Erro ao criar transação de depósito inicial

**Solução:** Executar script para garantir categorias:
```bash
node scripts/ensure-all-users-have-categories.js
```

## Scripts de Diagnóstico

### Testar Criação de Conta Diretamente
```bash
node scripts/test-create-account.js
```

### Verificar Categorias do Usuário
```bash
node scripts/ensure-all-users-have-categories.js
```

### Verificar Tipos de Conta
```bash
node scripts/fix-account-types.js
```

## Logs Adicionados

Os seguintes logs foram adicionados na API para facilitar o debug:

1. **Body recebido:** Mostra todos os dados enviados pelo frontend
2. **Tipo do campo type:** Mostra o tipo e valor do campo `type`
3. **Erro de validação:** Mostra detalhes do erro do Zod

## Próximos Passos

1. ✅ Verificar logs do servidor Next.js
2. ✅ Identificar qual campo está falhando
3. ✅ Corrigir o frontend ou a validação conforme necessário
4. ✅ Testar novamente

## Contato

Se o problema persistir, compartilhe os logs do servidor para análise mais detalhada.

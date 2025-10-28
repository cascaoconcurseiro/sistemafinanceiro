# ✅ CHECKLIST DE TESTES PÓS-REORGANIZAÇÃO

## 🧪 TESTES MANUAIS ESSENCIAIS

### 1. Navegação e Redirects
- [ ] Acessar `/investimentos` → deve redirecionar para `/investments`
- [ ] Acessar `/travel` → deve redirecionar para `/trips`
- [ ] Acessar `/lembretes` → deve redirecionar para `/reminders`
- [ ] Verificar se as páginas carregam corretamente

### 2. Funcionalidades Principais

#### Transações
- [ ] Criar transação simples
- [ ] Editar transação
- [ ] Deletar transação
- [ ] Filtrar transações
- [ ] Buscar transações

#### Parcelamentos
- [ ] Criar parcelamento
- [ ] Visualizar parcelas
- [ ] Pagar parcela
- [ ] Cancelar parcelamento

#### Transferências
- [ ] Criar transferência entre contas
- [ ] Verificar débito na conta origem
- [ ] Verificar crédito na conta destino
- [ ] Cancelar transferência

#### Cartões de Crédito
- [ ] Criar transação no cartão
- [ ] Verificar limite disponível
- [ ] Visualizar fatura
- [ ] Pagar fatura

#### Contas
- [ ] Criar conta
- [ ] Editar conta
- [ ] Verificar saldo
- [ ] Deletar conta

### 3. Validações
- [ ] Tentar criar transação com valor maior que saldo
- [ ] Tentar criar transação com valor maior que limite do cartão
- [ ] Verificar mensagens de erro
- [ ] Verificar validações de campos obrigatórios

### 4. Cálculos
- [ ] Verificar saldo de conta após transação
- [ ] Verificar total de fatura após compra
- [ ] Verificar limite disponível do cartão
- [ ] Verificar totais no dashboard

## 🔧 TESTES TÉCNICOS

### 1. Compilação
```bash
cd "Não apagar/SuaGrana-Clean"
npx tsc --noEmit
```
**Resultado Esperado**: 0 erros

### 2. Linting
```bash
npx eslint src/lib/services/transactions/**/*.ts
npx eslint src/lib/services/calculations/**/*.ts
```
**Resultado Esperado**: 0 erros críticos

### 3. Build
```bash
npm run build
```
**Resultado Esperado**: Build bem-sucedido

### 4. Testes Automatizados (se existirem)
```bash
npm test
```
**Resultado Esperado**: Todos os testes passando

## 📊 VERIFICAÇÕES DE QUALIDADE

### 1. Imports
- [ ] Verificar se não há imports quebrados
- [ ] Verificar se não há imports circulares
- [ ] Verificar se paths estão corretos

### 2. Performance
- [ ] Verificar tempo de carregamento das páginas
- [ ] Verificar se não há lentidão perceptível
- [ ] Verificar console do navegador (sem erros)

### 3. Console
- [ ] Abrir DevTools
- [ ] Verificar se não há erros no console
- [ ] Verificar se não há warnings críticos

## ✅ CRITÉRIOS DE SUCESSO

### Todos os itens devem estar OK:
- ✅ Redirects funcionando
- ✅ Funcionalidades principais operacionais
- ✅ Validações funcionando
- ✅ Cálculos corretos
- ✅ 0 erros de compilação
- ✅ Build bem-sucedido
- ✅ Console sem erros críticos

## 🐛 SE ENCONTRAR PROBLEMAS

### 1. Erro de Compilação
- Verificar imports
- Verificar tipos
- Consultar: COMANDOS-UTEIS-POS-REORGANIZACAO.md

### 2. Funcionalidade Quebrada
- Usar orquestrador como fallback
- Verificar logs do navegador
- Consultar: GUIA-MIGRACAO-NOVA-ARQUITETURA.md

### 3. Performance Ruim
- Verificar se há loops infinitos
- Verificar console para warnings
- Verificar Network tab no DevTools

## 📝 RELATÓRIO DE TESTES

Após completar os testes, documente:

### Testes Realizados:
- Data: ___________
- Testado por: ___________
- Ambiente: ___________

### Resultados:
- [ ] Todos os testes passaram
- [ ] Alguns testes falharam (listar abaixo)
- [ ] Problemas críticos encontrados (listar abaixo)

### Problemas Encontrados:
1. ___________
2. ___________
3. ___________

### Ações Necessárias:
1. ___________
2. ___________
3. ___________

---

**Status**: [ ] APROVADO [ ] REPROVADO [ ] APROVADO COM RESSALVAS

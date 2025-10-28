# 🔔 Como Testar o Sistema de Notificações

## 🚀 Início Rápido

### 1. Inicie o servidor
```bash
npm run dev
```

### 2. Acesse a aplicação
```
http://localhost:3000
```

### 3. Faça login ou crie uma conta

---

## 🧪 Testes Rápidos (5 minutos)

### ✅ Teste 1: Conta a Vencer (30 segundos)
1. Vá em **Transações** (`/transactions`)
2. Clique em **"+ Nova Transação"**
3. Preencha:
   - Tipo: **Despesa**
   - Descrição: **"Conta de Luz"**
   - Valor: **R$ 150,00**
   - Data: **Hoje**
   - Status: **Pendente**
4. Salve
5. **Clique no sininho 🔔** no header
6. ✅ Deve aparecer: **"🚨 Conta vence hoje!"**

---

### ✅ Teste 2: Meta Atingida (1 minuto)
1. Vá em **Metas** (`/goals`)
2. Clique em **"+ Nova Meta"**
3. Preencha:
   - Nome: **"Fundo de Emergência"**
   - Valor alvo: **R$ 5.000,00**
   - Valor atual: **R$ 5.500,00** (mais que o alvo!)
   - Prazo: Qualquer data futura
4. Salve
5. **Clique no sininho 🔔**
6. ✅ Deve aparecer: **"🎉 Meta atingida!"**

---

### ✅ Teste 3: Orçamento Estourado (1 minuto)
1. Vá em **Orçamentos** (`/budget`)
2. Crie um orçamento:
   - Categoria: **"Alimentação"**
   - Valor: **R$ 1.000,00**
   - Período: **Mensal**
3. Salve
4. Vá em **Transações** e crie uma despesa:
   - Categoria: **"Alimentação"**
   - Valor: **R$ 1.050,00** (mais que o orçamento!)
   - Data: **Hoje**
5. **Clique no sininho 🔔**
6. ✅ Deve aparecer: **"🚨 Orçamento estourado!"**

---

### ✅ Teste 4: Lembrete (30 segundos)
1. Vá em **Lembretes** (`/reminders`)
2. Clique em **"+ Novo Lembrete"**
3. Preencha:
   - Título: **"Pagar IPTU"**
   - Data: **Hoje**
   - Prioridade: **Alta**
4. Salve
5. **Clique no sininho 🔔**
6. ✅ Deve aparecer: **"📌 Lembrete para hoje!"**

---

### ✅ Teste 5: Investimento em Alta (1 minuto)
1. Vá em **Investimentos** (`/investments`)
2. Crie um investimento:
   - Nome: **"Ações PETR4"**
   - Tipo: **Ações**
   - Valor investido: **R$ 3.000,00**
   - Valor atual: **R$ 3.450,00** (+15%)
   - Data de compra: **30 dias atrás**
3. Salve
4. **Clique no sininho 🔔**
5. ✅ Deve aparecer: **"📈 Investimento em alta!"**

---

## 🔔 Verificando o Sininho

### O que verificar:
- [ ] **Badge vermelho** com número de notificações não lidas
- [ ] **Dropdown abre** ao clicar no sininho
- [ ] **Notificações aparecem** com ícones corretos
- [ ] **Cores diferentes** por tipo (vermelho=alerta, laranja=aviso, azul=info, verde=sucesso)
- [ ] **Botão "Marcar como lida"** funciona
- [ ] **Botão "Ver detalhes"** leva para a página correta
- [ ] **Botão "Marcar todas como lidas"** funciona

---

## 🎯 Tipos de Notificações

### 🚨 Alertas (Vermelho)
- Contas vencidas
- Orçamento estourado
- Investimento em queda
- Lembretes vencidos

### ⚠️ Avisos (Laranja)
- Contas a vencer em 1-3 dias
- Orçamento quase estourado (90%+)
- Metas próximas do prazo

### ℹ️ Informações (Azul)
- Lembretes futuros
- Dicas do sistema
- Novidades

### ✅ Sucesso (Verde)
- Metas atingidas
- Investimentos em alta
- Conquistas

---

## 🐛 Problemas?

### Notificações não aparecem?
1. **Recarregue a página** (F5)
2. **Verifique o console** (F12 → Console)
3. **Limpe o cache** (Ctrl+Shift+Delete)

### Badge não atualiza?
1. **Clique no sininho** para forçar atualização
2. **Aguarde 5 minutos** (atualização automática)

---

## 📊 Teste Automatizado

Para testar tudo de uma vez:

```bash
npm run tsx scripts/test-notification-system.ts
```

Este script:
- ✅ Cria dados de teste
- ✅ Gera todas as notificações
- ✅ Verifica se estão funcionando
- ✅ Mostra relatório completo

---

## ✨ Recursos Avançados

### Filtros
- **Todas**: Mostra todas as notificações
- **Orçamento**: Apenas notificações de orçamento
- **Metas**: Apenas notificações de metas
- **Geral**: Lembretes e dicas

### Ações
- **Marcar como lida**: ✓
- **Deletar**: ✗
- **Ver detalhes**: →
- **Marcar todas como lidas**: ✓✓

---

## 📝 Checklist Rápido

- [ ] Sininho aparece no header
- [ ] Badge mostra número correto
- [ ] Dropdown abre ao clicar
- [ ] Notificações aparecem
- [ ] Cores estão corretas
- [ ] Ícones estão corretos
- [ ] Botões funcionam
- [ ] Links funcionam

---

## 🎉 Pronto!

Se todos os testes passaram, o sistema de notificações está funcionando perfeitamente! 🚀

**Tempo total de teste:** ~5 minutos
**Última atualização:** 26/10/2025

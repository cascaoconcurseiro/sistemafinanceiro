# 🚀 Como Executar o Teste do Sistema de Notificações

## Opção 1: Teste Manual (Recomendado) ⭐

### Passo 1: Inicie o servidor
```bash
cd "Não apagar/SuaGrana-Clean"
npm run dev
```

### Passo 2: Abra o navegador
```
http://localhost:3000
```

### Passo 3: Faça login ou crie uma conta

### Passo 4: Siga o guia de teste
Abra o arquivo: **`COMO-TESTAR-NOTIFICACOES.md`**

Ele tem testes rápidos de 5 minutos que você pode fazer manualmente.

---

## Opção 2: Teste Automatizado 🤖

### Passo 1: Execute o script
```bash
cd "Não apagar/SuaGrana-Clean"
npm run tsx scripts/test-notification-system.ts
```

### O que o script faz:
1. ✅ Cria um usuário de teste
2. ✅ Cria dados de teste (contas, metas, orçamentos, etc)
3. ✅ Gera notificações automaticamente
4. ✅ Verifica se tudo está funcionando
5. ✅ Mostra relatório completo
6. ✅ Oferece limpar os dados de teste

### Resultado esperado:
```
🚀 === INICIANDO TESTES DO SISTEMA DE NOTIFICAÇÕES ===

✅ Usuário de teste criado

📋 === TESTANDO NOTIFICAÇÕES DE FATURAMENTO ===
✅ [Faturamento] Criar conta a vencer hoje: Conta criada com sucesso
✅ [Faturamento] Criar conta vencida: Conta vencida criada
✅ [Faturamento] Criar cartão com vencimento próximo: Cartão criado
✅ [Faturamento] Gerar notificações de faturamento: 3 notificações geradas

🎯 === TESTANDO NOTIFICAÇÕES DE METAS ===
✅ [Metas] Criar meta próxima do prazo: Meta criada (50% completa)
✅ [Metas] Criar meta atingida: Meta atingida criada (110%)
✅ [Metas] Gerar notificações de metas: 2 notificações geradas

💰 === TESTANDO NOTIFICAÇÕES DE ORÇAMENTO ===
✅ [Orçamento] Criar orçamento: Orçamento criado
✅ [Orçamento] Criar transação que estoura orçamento: Transação criada (95%)
✅ [Orçamento] Gerar notificações de orçamento: 1 notificações geradas

📈 === TESTANDO NOTIFICAÇÕES DE INVESTIMENTOS ===
✅ [Investimentos] Criar investimento com ganho: Investimento criado (+15%)
✅ [Investimentos] Criar investimento com perda: Investimento criado (-7%)
✅ [Investimentos] Gerar notificações de investimentos: 2 notificações geradas

📌 === TESTANDO NOTIFICAÇÕES DE LEMBRETES ===
✅ [Lembretes] Criar lembrete para hoje: Lembrete criado
✅ [Lembretes] Criar lembrete vencido: Lembrete vencido criado
✅ [Lembretes] Gerar notificações de lembretes: 2 notificações geradas

🔔 === TESTANDO SININHO DE NOTIFICAÇÕES ===
✅ [Sininho] Contar notificações não lidas: 10 notificações não lidas

📊 === RESUMO DOS TESTES ===
✅ Passou: 15
❌ Falhou: 0
⏭️  Pulou: 0
📝 Total: 15

🎉 TODOS OS TESTES PASSARAM! Sistema de notificações funcionando perfeitamente.

Deseja limpar os dados de teste? (s/n):
```

---

## Opção 3: Teste Visual no Navegador 👀

### Passo 1: Inicie o servidor
```bash
npm run dev
```

### Passo 2: Acesse a aplicação
```
http://localhost:3000
```

### Passo 3: Verifique o sininho
1. Olhe no **header** (canto superior direito)
2. Deve ter um **sininho 🔔**
3. Se tiver notificações, aparece um **badge vermelho** com o número

### Passo 4: Clique no sininho
1. Deve abrir um **dropdown**
2. Mostra todas as **notificações**
3. Cada notificação tem:
   - **Ícone** (por categoria)
   - **Título** e **mensagem**
   - **Data/hora**
   - **Botões** (marcar lida, deletar, ver detalhes)

### Passo 5: Teste as ações
1. **Marcar como lida**: Clique no ✓
2. **Deletar**: Clique no ✗
3. **Ver detalhes**: Clique no link →
4. **Marcar todas**: Clique no botão no topo

---

## 🎯 Teste Rápido (1 minuto)

### Criar uma notificação de teste:

1. Vá em **Transações** (`/transactions`)
2. Clique em **"+ Nova Transação"**
3. Preencha:
   - Tipo: **Despesa**
   - Descrição: **"Teste de Notificação"**
   - Valor: **R$ 100,00**
   - Data: **Hoje**
   - Status: **Pendente**
4. Salve
5. **Clique no sininho 🔔**
6. ✅ Deve aparecer: **"🚨 Conta vence hoje!"**

---

## 📊 Verificar Notificações no Banco

### Usando Prisma Studio:
```bash
npx prisma studio
```

1. Abra: `http://localhost:5555`
2. Clique em **"Notification"**
3. Veja todas as notificações criadas
4. Verifique os campos:
   - `userId` - ID do usuário
   - `title` - Título da notificação
   - `message` - Mensagem
   - `type` - Tipo (alert, warning, info, success)
   - `isRead` - Se foi lida
   - `createdAt` - Data de criação

---

## 🐛 Problemas Comuns

### Erro: "Cannot find module"
**Solução:**
```bash
npm install
```

### Erro: "Port 3000 already in use"
**Solução:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou use outra porta
PORT=3001 npm run dev
```

### Notificações não aparecem
**Solução:**
1. Verifique se está logado
2. Limpe o cache (Ctrl+Shift+Delete)
3. Recarregue a página (F5)
4. Verifique o console (F12)

### Script de teste falha
**Solução:**
1. Verifique se o banco está acessível
2. Execute: `npx prisma generate`
3. Execute: `npx prisma db push`
4. Tente novamente

---

## 📝 Logs e Debug

### Ver logs do servidor:
O servidor mostra logs no terminal onde você executou `npm run dev`

### Ver logs do navegador:
1. Pressione **F12**
2. Vá na aba **Console**
3. Procure por mensagens com `[Notifications]`

### Ver logs do script de teste:
O script mostra logs detalhados durante a execução

---

## ✅ Checklist de Verificação

Após executar os testes, verifique:

- [ ] Servidor iniciou sem erros
- [ ] Conseguiu fazer login
- [ ] Sininho aparece no header
- [ ] Badge mostra número correto
- [ ] Dropdown abre ao clicar
- [ ] Notificações aparecem
- [ ] Cores estão corretas
- [ ] Ícones estão corretos
- [ ] Botões funcionam
- [ ] Links funcionam
- [ ] Marcar como lida funciona
- [ ] Deletar funciona
- [ ] Marcar todas funciona

---

## 🎉 Pronto!

Se todos os testes passaram, o sistema está funcionando perfeitamente! 🚀

**Próximos passos:**
1. Use o sistema normalmente
2. Crie transações, metas, orçamentos
3. Veja as notificações aparecerem automaticamente
4. Aproveite o sistema de notificações inteligente!

---

## 📞 Precisa de Ajuda?

### Documentação:
- **Guia Rápido:** `COMO-TESTAR-NOTIFICACOES.md`
- **Guia Completo:** `TESTE-NOTIFICACOES.md`
- **Documentação Técnica:** `SISTEMA-NOTIFICACOES-COMPLETO.md`
- **Resumo:** `RESUMO-SISTEMA-NOTIFICACOES.md`

### Suporte:
1. Verifique os logs
2. Leia a documentação
3. Execute o teste automatizado
4. Reporte o problema com detalhes

---

**Última atualização:** 26/10/2025  
**Versão:** 1.0.0

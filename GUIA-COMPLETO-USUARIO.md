# 📖 Guia Completo do Usuário - SuaGrana

## Bem-vindo ao SuaGrana! 🎉

Este guia vai te ensinar a usar todas as funcionalidades do sistema de forma eficiente.

---

## 🚀 INÍCIO RÁPIDO

### Primeiro Acesso

1. **Criar Conta**
   - Acesse a página de registro
   - Preencha seus dados
   - Confirme seu email

2. **Configurar Perfil**
   - Defina sua moeda (BRL padrão)
   - Configure preferências
   - Escolha tema (claro/escuro)

3. **Adicionar Primeira Conta**
   - Clique em "Nova Conta"
   - Escolha o tipo (Corrente, Poupança, etc)
   - Defina saldo inicial

---

## 💰 GERENCIAMENTO DE TRANSAÇÕES

### Criar Nova Transação

**Método 1: Botão Principal**
```
1. Clique no botão "+" no canto inferior direito
2. Preencha os dados:
   - Descrição (ex: "Almoço no restaurante")
   - Valor (ex: R$ 45,90)
   - Tipo (Receita/Despesa/Transferência)
   - Categoria (será sugerida automaticamente!)
   - Conta ou Cartão
   - Data
3. Clique em "Salvar"
```

**Método 2: Atalho de Teclado**
```
Pressione Ctrl+N (ou Cmd+N no Mac)
```

**Método 3: Command Palette**
```
Pressione Ctrl+K e digite "Nova Transação"
```

### Categorização Automática 🤖

O sistema sugere categorias automaticamente baseado na descrição:

| Descrição | Categoria Sugerida | Confiança |
|-----------|-------------------|-----------|
| "Uber para casa" | Transporte | 95% |
| "iFood jantar" | Alimentação | 95% |
| "Netflix" | Assinaturas | 95% |
| "Farmácia" | Saúde | 95% |

**Dica:** O sistema aprende com suas escolhas! Se você categorizar "Padaria do João" como "Alimentação", da próxima vez ele vai sugerir automaticamente.

### Editar Transação

**Desktop:**
```
1. Clique na transação
2. Edite os campos
3. Salve
```

**Mobile:**
```
1. Deslize para a direita na transação
2. Toque em "Editar"
```

### Deletar Transação

**Desktop:**
```
1. Clique na transação
2. Clique em "Excluir"
3. Confirme
```

**Mobile:**
```
1. Deslize para a esquerda na transação
2. Toque em "Excluir"
```

---

## 💳 CARTÕES DE CRÉDITO

### Adicionar Cartão

```
1. Vá em "Contas" > "Cartões"
2. Clique em "Novo Cartão"
3. Preencha:
   - Nome do cartão
   - Limite
   - Dia de fechamento (ex: 10)
   - Dia de vencimento (ex: 17)
   - Banco/Bandeira
4. Salve
```

### Gerenciar Faturas

**Ver Fatura Atual:**
```
1. Clique no cartão
2. Veja o resumo:
   - Valor total
   - Vencimento
   - % do limite usado
   - Transações da fatura
```

**Pagar Fatura:**
```
1. Abra a fatura
2. Clique em "Pagar Fatura"
3. Selecione conta de débito
4. Confirme
```

**Resultado:**
- ✅ Fatura marcada como paga
- ✅ Valor debitado da conta
- ✅ Limite do cartão liberado

---

## 👥 DESPESAS COMPARTILHADAS

### Criar Viagem/Grupo

```
1. Vá em "Viagens"
2. Clique em "Nova Viagem"
3. Preencha:
   - Nome (ex: "Rio de Janeiro 2025")
   - Participantes (adicione amigos)
   - Datas (início e fim)
4. Salve
```

### Adicionar Despesa Compartilhada

```
1. Abra a viagem
2. Clique em "Nova Despesa"
3. Preencha:
   - Descrição (ex: "Hotel")
   - Valor (ex: R$ 1.800)
   - Quem pagou (ex: João)
   - Como dividir:
     * Igual entre todos
     * Proporcional
     * Customizado
4. Salve
```

**Exemplo de Divisão:**
```
Hotel: R$ 1.800
Participantes: João, Maria, Pedro
Divisão: Igual

Resultado:
- João pagou: R$ 1.800
- João deve receber: R$ 600 (de Maria) + R$ 600 (de Pedro)
- Maria deve: R$ 600
- Pedro deve: R$ 600
```

### Acertar Contas

```
1. Vá na aba "Acerto"
2. Veja o resumo de quem deve para quem
3. Registre pagamentos:
   - "Pedro pagou R$ 600 para João"
4. Sistema atualiza automaticamente
```

---

## 📊 INSIGHTS INTELIGENTES

### Dashboard de Insights

O sistema analisa seus dados e gera insights automáticos:

**1. Gastos Acima da Média** ⚠️
```
"Você gastou R$ 3.500 este mês, 25% acima da sua média"
→ Ação: Ver detalhes
```

**2. Categoria em Crescimento** 📈
```
"Gastos com Alimentação aumentaram 50% em relação ao mês passado"
→ Ação: Criar meta de economia
```

**3. Assinaturas Não Utilizadas** 💰
```
"2 assinaturas não usadas há mais de 30 dias. Economia: R$ 50/mês"
→ Ação: Ver assinaturas
```

**4. Gastos Recorrentes** 🔄
```
"'Uber' aparece 15x. Média: R$ 25"
→ Ação: Considere transporte alternativo
```

**5. Economia Detectada** 🎉
```
"Parabéns! Você gastou 15% menos que o mês passado"
→ Continue assim!
```

**6. Previsão do Próximo Mês** 🔮
```
"Baseado nos últimos 3 meses, você deve gastar R$ 3.200 no próximo mês"
Confiança: 85%
```

---

## ⌨️ ATALHOS DE TECLADO

### Navegação
| Atalho | Ação |
|--------|------|
| `Ctrl+K` | Abrir Command Palette |
| `Ctrl+N` | Nova Transação |
| `Ctrl+F` | Buscar |
| `Esc` | Fechar modal |

### Command Palette (Ctrl+K)
```
Digite para buscar:
- "nova transação" → Criar transação
- "nova conta" → Criar conta
- "dashboard" → Ir para dashboard
- "relatórios" → Ver relatórios
- "auditoria" → Executar auditoria
```

---

## 📱 FUNCIONALIDADES MOBILE

### Gestos Touch

**Swipe Left (Deslizar para Esquerda)**
```
Em transação → Excluir
```

**Swipe Right (Deslizar para Direita)**
```
Em transação → Editar
```

**Pull Down (Puxar para Baixo)**
```
Em qualquer lista → Atualizar dados
```

**Long Press (Pressionar e Segurar)**
```
Em transação → Menu de opções
```

### Modo Offline

O app funciona offline! 📱

**O que funciona offline:**
- ✅ Ver transações
- ✅ Ver saldos
- ✅ Ver relatórios
- ✅ Criar transações (salvas localmente)

**Quando voltar online:**
- 🔄 Sincronização automática
- ✅ Dados enviados ao servidor
- ✅ Conflitos resolvidos

---

## 🔍 AUDITORIA DE DADOS

### Executar Auditoria

```
1. Vá em "Auditoria" (ou Ctrl+K → "auditoria")
2. Clique em "Executar Auditoria"
3. Aguarde análise (5-10 segundos)
4. Veja o relatório:
   - Erros críticos (vermelho)
   - Avisos (amarelo)
   - Informações (azul)
```

### Tipos de Verificação

**1. Contas**
- ✅ Campos obrigatórios
- ✅ Saldos consistentes
- ✅ Tipos válidos

**2. Transações**
- ✅ Referências válidas
- ✅ Valores corretos
- ✅ Datas válidas

**3. Saldos**
- ✅ Saldo = Soma das transações
- ✅ Tolerância de 1 centavo

**4. Duplicações**
- ✅ IDs únicos
- ✅ Transações duplicadas

---

## 📈 RELATÓRIOS

### Relatório de Gastos

```
1. Vá em "Relatórios"
2. Selecione período
3. Escolha categorias
4. Veja gráficos:
   - Pizza (por categoria)
   - Barras (receitas vs despesas)
   - Linha (evolução temporal)
```

### Exportar Dados

```
1. Clique em "Exportar"
2. Escolha formato:
   - Excel (.xlsx)
   - PDF
   - CSV
3. Download automático
```

---

## ⚙️ CONFIGURAÇÕES

### Preferências

**Moeda**
```
Configurações → Moeda → Selecione (BRL, USD, EUR)
```

**Tema**
```
Configurações → Aparência → Claro/Escuro/Sistema
```

**Notificações**
```
Configurações → Notificações → Ativar/Desativar
```

**Sincronização**
```
Configurações → Sincronização → Automática/Manual
```

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### Saldo Incorreto

**Problema:** Saldo da conta não bate

**Solução:**
```
1. Vá em "Auditoria"
2. Execute auditoria
3. Veja erros de saldo
4. Corrija transações problemáticas
5. Execute auditoria novamente
```

### Transação Duplicada

**Problema:** Mesma transação aparece 2x

**Solução:**
```
1. Identifique a duplicata
2. Delete uma das transações
3. Execute auditoria para confirmar
```

### App Lento

**Problema:** App está lento

**Solução:**
```
1. Limpe cache do navegador
2. Feche abas não utilizadas
3. Atualize a página (F5)
4. Se persistir, contate suporte
```

### Dados Não Sincronizam

**Problema:** Mudanças não aparecem

**Solução:**
```
1. Verifique conexão com internet
2. Puxe para baixo para atualizar
3. Faça logout e login novamente
4. Limpe cache e tente novamente
```

---

## 💡 DICAS E TRUQUES

### Produtividade

**1. Use Atalhos**
```
Ctrl+K → Acesso rápido a tudo
Ctrl+N → Nova transação em segundos
```

**2. Deixe o Sistema Categorizar**
```
Digite descrições claras:
✅ "Uber para o trabalho"
❌ "Transporte"
```

**3. Configure Recorrências**
```
Para gastos fixos (aluguel, Netflix):
- Marque como recorrente
- Sistema cria automaticamente
```

**4. Use Insights**
```
Revise insights semanalmente
Aja nas recomendações
Economize dinheiro real!
```

### Organização

**1. Categorias Consistentes**
```
Use sempre as mesmas categorias
Facilita análise e relatórios
```

**2. Descrições Claras**
```
✅ "Almoço Restaurante Italiano"
❌ "Comida"
```

**3. Registre Imediatamente**
```
Não deixe acumular
Use o app mobile no momento da compra
```

**4. Revise Mensalmente**
```
Todo início de mês:
- Veja relatório do mês anterior
- Analise insights
- Ajuste metas
```

---

## 🎯 METAS E OBJETIVOS

### Criar Meta

```
1. Vá em "Metas"
2. Clique em "Nova Meta"
3. Defina:
   - Categoria (ex: Alimentação)
   - Valor máximo (ex: R$ 800/mês)
   - Período (mensal/anual)
4. Salve
```

### Acompanhar Meta

```
Dashboard mostra:
- Progresso (barra)
- Valor gasto / Valor meta
- % utilizado
- Dias restantes
```

**Alertas:**
- 🟢 < 70% → Tudo bem
- 🟡 70-90% → Atenção
- 🔴 > 90% → Limite próximo

---

## 📞 SUPORTE

### Precisa de Ajuda?

**Documentação:**
- Este guia
- FAQ
- Tutoriais em vídeo

**Contato:**
- Email: suporte@suagrana.com
- Chat: Disponível no app
- WhatsApp: (11) 99999-9999

**Comunidade:**
- Fórum: forum.suagrana.com
- Discord: discord.gg/suagrana
- YouTube: youtube.com/suagrana

---

## 🎓 PRÓXIMOS PASSOS

Agora que você conhece o sistema:

1. ✅ Configure suas contas
2. ✅ Adicione transações dos últimos 30 dias
3. ✅ Revise os insights gerados
4. ✅ Configure metas de gastos
5. ✅ Use atalhos para ganhar tempo
6. ✅ Compartilhe com amigos!

**Bem-vindo ao controle financeiro inteligente! 🚀**

---

**Versão:** 1.0  
**Última Atualização:** 22/11/2025

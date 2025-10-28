# 🎯 PASSO A PASSO: Vincular Suas Transações

## 📊 Situação Atual vs Esperada

### ❌ O Que Você Está Vendo AGORA
```
Total Gasto: R$ 0,00
Receitas: R$ 298,50
Orçamento Usado: 0.0%
Média Diária: R$ 0,00
Saldo Restante: R$ 1.999,00
```

### ✅ O Que DEVERIA Aparecer
```
Total Gasto: R$ 199,00 (suas despesas)
Receitas: R$ 99,50 (reembolso recebido)
Orçamento Usado: 10.0% (199/1999)
Média Diária: R$ 99,50 (199/2 dias)
Saldo Restante: R$ 1.800,00 (1999-199)
```

## 🔧 SOLUÇÃO: Vincular as Transações

### Passo 1: Abra a Viagem
1. Vá para **Gestão de Viagens**
2. Clique no card da viagem **"111118888"**

### Passo 2: Vá para Análises
1. Você verá várias abas no topo
2. Clique na aba **"Análises"**

### Passo 3: Encontre o Botão
1. Na página de Análises, logo abaixo dos cards de resumo
2. Você verá filtros (dropdowns) e ao lado deles
3. Um botão **"Vincular Transações Existentes"** com ícone de link 🔗

### Passo 4: Vincule as Transações
1. Clique no botão **"Vincular Transações Existentes"**
2. Uma janela abrirá mostrando suas transações:
   - ✅ Despesa de R$ 199,00 (26/10 ou 27/10)
   - ❌ A receita de R$ 99,50 NÃO aparecerá (é reembolso, não despesa)
3. Marque a checkbox da despesa de R$ 199,00
4. Clique em **"Vincular 1 Transação"**

### Passo 5: Verifique o Resultado
1. A janela fechará automaticamente
2. Pressione **Ctrl+F5** (ou Cmd+R no Mac) para atualizar
3. Agora você verá:
   ```
   Total Gasto: R$ 199,00 ✅
   Receitas: R$ 99,50 ✅
   Orçamento Usado: 10.0% ✅
   Média Diária: R$ 99,50 ✅
   Saldo Restante: R$ 1.800,00 ✅
   ```

## ❓ E Se Não Aparecer Nenhuma Transação?

Se a janela abrir vazia, pode ser que:

### Possibilidade 1: Transações com Data Errada
- Verifique se suas transações estão com data entre **26/10/2025 e 27/10/2025**
- Se não estiverem, edite a data das transações primeiro

### Possibilidade 2: Transações Já Vinculadas
- As transações já podem estar vinculadas a outra viagem
- Verifique na lista de transações se elas têm uma viagem associada

### Possibilidade 3: Tipo Errado
- O filtro mostra apenas transações do tipo **"DESPESA"**
- Verifique se suas transações estão marcadas como DESPESA (não RECEITA)

## 🔍 Como Verificar Suas Transações

1. Vá para **Transações** no menu principal
2. Procure pelas transações de R$ 199,00
3. Verifique:
   - ✅ Data: 26/10/2025 ou 27/10/2025
   - ✅ Tipo: DESPESA
   - ✅ Viagem: (vazio ou nenhuma)

## 💡 Dica Importante

A receita de R$ 298,50 que aparece é composta por:
- R$ 199,00 (sua despesa compartilhada que a outra pessoa pagou)
- R$ 99,50 (reembolso que você recebeu)

Quando você vincular a despesa de R$ 199,00 à viagem:
- ✅ Total Gasto mostrará R$ 199,00
- ✅ A receita de R$ 99,50 continuará aparecendo (é correto)
- ✅ O saldo líquido será calculado corretamente

## 🆘 Se Ainda Não Funcionar

1. Abra o Console do Navegador (F12)
2. Vá para a aba "Console"
3. Clique no botão "Vincular Transações Existentes"
4. Procure por mensagens com `[LinkTransactions]` ou erros em vermelho
5. Copie as mensagens e me envie

---

**Tempo estimado**: 2 minutos
**Dificuldade**: Muito fácil
**Resultado**: Estatísticas corretas ✅

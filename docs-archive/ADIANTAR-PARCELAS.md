# 💳 Adiantar Parcelas - Guia de Uso

## O que é?

A funcionalidade de **Adiantar Parcelas** permite que você pague antecipadamente múltiplas parcelas de uma compra parcelada, similar ao que acontece em sistemas financeiros reais.

## Como funciona?

### Cenário Exemplo:
- Você tem uma compra parcelada em **12x de R$ 100** (total R$ 1.200)
- Está na parcela **3/12**
- Decide adiantar **3 parcelas** de uma vez

### O que acontece:
1. ✅ As parcelas 4, 5 e 6 são marcadas como **pagas**
2. 💰 O valor total (R$ 300) é **debitado** da conta que você escolher
3. 📅 As parcelas restantes (7 a 12) continuam normais
4. 📊 Uma transação de pagamento é criada para registro

## Como usar?

### 1. Na lista de transações:
- Localize uma **parcela pendente** (não paga)
- Clique no botão **"Adiantar"** ao lado da transação
- O botão só aparece se houver parcelas futuras para adiantar

### 2. No modal de adiantamento:
- **Selecione quantas parcelas** deseja adiantar (1 até o número de parcelas restantes)
- **Escolha a conta** de onde o dinheiro será debitado
- Veja o **resumo** com o valor total a pagar
- Clique em **"Adiantar X parcela(s)"**

### 3. Confirmação:
- As parcelas são marcadas como pagas
- O saldo da conta é atualizado
- Você recebe uma confirmação de sucesso

## Regras e Validações

### ✅ Quando você PODE adiantar:
- A transação é uma **parcela** (isInstallment = true)
- A parcela está **pendente** (status ≠ completed)
- Existem **parcelas futuras** para adiantar
- A conta tem **saldo suficiente** (se não permitir saldo negativo)

### ❌ Quando você NÃO PODE adiantar:
- É a **última parcela** (não há parcelas futuras)
- A parcela já está **paga**
- A transação **não é parcelada**
- A conta não tem saldo suficiente

## Exemplos Práticos

### Exemplo 1: Adiantar 1 parcela
```
Compra: Notebook - 10x de R$ 200
Parcela atual: 3/10
Adiantar: 1 parcela

Resultado:
- Parcela 4 → Paga
- Débito: R$ 200
- Parcelas 5-10 → Continuam normais
```

### Exemplo 2: Adiantar múltiplas parcelas
```
Compra: Celular - 12x de R$ 150
Parcela atual: 5/12
Adiantar: 4 parcelas

Resultado:
- Parcelas 6, 7, 8, 9 → Pagas
- Débito: R$ 600 (4 × R$ 150)
- Parcelas 10-12 → Continuam normais
```

### Exemplo 3: Quitar todas as parcelas restantes
```
Compra: TV - 6x de R$ 300
Parcela atual: 2/6
Adiantar: 4 parcelas (todas restantes)

Resultado:
- Parcelas 3, 4, 5, 6 → Pagas
- Débito: R$ 1.200 (4 × R$ 300)
- Compra totalmente quitada!
```

## Impacto no Sistema

### No Saldo:
- O valor total das parcelas adiantadas é **debitado imediatamente** da conta escolhida
- O saldo é atualizado em tempo real

### Nas Transações:
- As parcelas adiantadas aparecem como **"✓ Parcela X/Y"** (com check)
- Uma nova transação de **"Adiantamento"** é criada para registro
- O histórico completo fica preservado

### Nos Relatórios:
- As parcelas pagas não aparecem mais como pendentes
- O fluxo de caixa reflete o pagamento antecipado
- Os gráficos são atualizados automaticamente

## Dicas e Boas Práticas

### 💡 Quando adiantar parcelas?
- Quando você tem **dinheiro disponível** e quer reduzir dívidas
- Para aproveitar **descontos** por pagamento antecipado
- Para **simplificar** o controle financeiro
- Quando a taxa de juros é **alta**

### ⚠️ Cuidados:
- Verifique se não há **penalidades** por pagamento antecipado
- Certifique-se de ter **reserva de emergência** antes
- Considere se não é melhor **investir** o dinheiro
- Não comprometa o **fluxo de caixa** do mês

## Perguntas Frequentes

### ❓ Posso cancelar um adiantamento?
Não. Uma vez processado, o adiantamento não pode ser desfeito. As parcelas ficam marcadas como pagas.

### ❓ O que acontece se eu deletar uma parcela adiantada?
Se você deletar uma parcela que foi adiantada, ela será removida do sistema, mas a transação de pagamento permanece.

### ❓ Posso adiantar parcelas de cartão de crédito?
Sim! A funcionalidade funciona para qualquer transação parcelada, incluindo compras no cartão de crédito.

### ❓ O adiantamento afeta o limite do cartão?
Não diretamente. O adiantamento é um pagamento da sua conta para quitar as parcelas. O limite do cartão não é alterado automaticamente.

### ❓ Posso adiantar parcelas de diferentes compras ao mesmo tempo?
Não. Você precisa adiantar as parcelas de cada compra separadamente.

## Suporte Técnico

Se você encontrar algum problema ou tiver dúvidas:
1. Verifique se a transação é realmente uma parcela
2. Confirme que há parcelas futuras para adiantar
3. Verifique o saldo da conta
4. Consulte os logs do sistema para mais detalhes

---

**Desenvolvido com ❤️ para SuaGrana**

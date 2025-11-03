# 📊 Diagrama Visual: Fluxo de Parcelas

## 🎬 Cenário: Notebook R$ 1.200 em 12x de R$ 100

---

## 1️⃣ COMPRA INICIAL (Mês 1)

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOMENTO DA COMPRA                        │
└─────────────────────────────────────────────────────────────────┘

    🏪 LOJA                    💳 CARTÃO                 👤 VOCÊ
    ┌────┐                    ┌────────┐               ┌──────┐
    │ 💻 │ ──────────────────>│ -R$1200│<──────────────│ Deve │
    └────┘   Recebe dinheiro  └────────┘  Fica devendo └──────┘
                                   │
                                   │ Cria 12 parcelas
                                   ▼
                    ┌──────────────────────────────┐
                    │ Parcela 1/12: R$ 100 (Mês 1)│
                    │ Parcela 2/12: R$ 100 (Mês 2)│
                    │ Parcela 3/12: R$ 100 (Mês 3)│
                    │ Parcela 4/12: R$ 100 (Mês 4)│
                    │ ...                          │
                    │ Parcela 12/12: R$ 100 (Mês 12)│
                    └──────────────────────────────┘

RESULTADO:
┌─────────────────────────────────────────────────────────────────┐
│ Conta Corrente:    R$ 5.000,00 (sem alteração)                 │
│ Cartão (Dívida):  -R$ 1.200,00 (dívida total)                  │
│ Limite Usado:      R$ 1.200,00                                  │
│ Limite Disponível: R$ 1.800,00 (de R$ 3.000 total)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ PAGAMENTO MENSAL (Mês 1, 2, 3...)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAGAMENTO DA FATURA (Mês 1)                  │
└─────────────────────────────────────────────────────────────────┘

    💰 CONTA CORRENTE          💳 CARTÃO              📄 FATURA
    ┌──────────────┐          ┌────────┐            ┌────────┐
    │ R$ 5.000,00  │          │-R$1200 │            │ R$ 100 │
    │              │ ────────>│        │<───────────│ Vence  │
    │ -R$ 100      │  Paga    │+R$ 100 │  Libera   │ hoje   │
    └──────────────┘          └────────┘            └────────┘
         │                         │
         │                         │
         ▼                         ▼
    R$ 4.900,00              -R$ 1.100,00
    (Reduz saldo)            (Reduz dívida)

RESULTADO APÓS PAGAMENTO:
┌─────────────────────────────────────────────────────────────────┐
│ Conta Corrente:    R$ 4.900,00 (-R$ 100)                       │
│ Cartão (Dívida):  -R$ 1.100,00 (+R$ 100)                       │
│ Limite Usado:      R$ 1.100,00 (-R$ 100)                       │
│ Limite Disponível: R$ 1.900,00 (+R$ 100) ✅                    │
│ Parcela 1/12:      ✅ PAGA                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ ADIANTAMENTO DE PARCELAS (Mês 3)

```
┌─────────────────────────────────────────────────────────────────┐
│              ADIANTAR 3 PARCELAS (4, 5, 6) = R$ 300            │
└─────────────────────────────────────────────────────────────────┘

ANTES DO ADIANTAMENTO:
┌─────────────────────────────────────────────────────────────────┐
│ Conta Corrente:    R$ 4.700,00                                 │
│ Cartão (Dívida):  -R$ 1.000,00 (10 parcelas restantes)         │
│ Limite Disponível: R$ 2.000,00                                  │
│                                                                  │
│ Parcelas Pendentes:                                             │
│ ○ Parcela 4/12: R$ 100 (Mês 4) ← Vai adiantar                 │
│ ○ Parcela 5/12: R$ 100 (Mês 5) ← Vai adiantar                 │
│ ○ Parcela 6/12: R$ 100 (Mês 6) ← Vai adiantar                 │
│ ○ Parcela 7/12: R$ 100 (Mês 7)                                │
│ ... (até 12/12)                                                 │
└─────────────────────────────────────────────────────────────────┘

FLUXO DO ADIANTAMENTO:
    💰 CONTA CORRENTE          💳 CARTÃO              📋 PARCELAS
    ┌──────────────┐          ┌────────┐            ┌──────────┐
    │ R$ 4.700,00  │          │-R$1000 │            │ 4/12: ○  │
    │              │ ────────>│        │            │ 5/12: ○  │
    │ -R$ 300      │  Paga    │+R$ 300 │            │ 6/12: ○  │
    │   (único)    │  3x      │ Libera │            └──────────┘
    └──────────────┘          └────────┘                  │
         │                         │                       │
         │                         │                       │
         ▼                         ▼                       ▼
    R$ 4.400,00              -R$ 700,00              ✅ PAGAS
    (Reduz R$ 300)           (Reduz R$ 300)          (Status: paid)

DEPOIS DO ADIANTAMENTO:
┌─────────────────────────────────────────────────────────────────┐
│ Conta Corrente:    R$ 4.400,00 (-R$ 300) ✅                    │
│ Cartão (Dívida):  -R$   700,00 (+R$ 300) ✅                    │
│ Limite Disponível: R$ 2.300,00 (+R$ 300) ✅ LIBERADO!          │
│                                                                  │
│ Parcelas Pagas:                                                 │
│ ✅ Parcela 4/12: R$ 100 (PAGA ANTECIPADAMENTE)                 │
│ ✅ Parcela 5/12: R$ 100 (PAGA ANTECIPADAMENTE)                 │
│ ✅ Parcela 6/12: R$ 100 (PAGA ANTECIPADAMENTE)                 │
│                                                                  │
│ Parcelas Pendentes:                                             │
│ ○ Parcela 7/12: R$ 100 (Mês 7)                                │
│ ○ Parcela 8/12: R$ 100 (Mês 8)                                │
│ ... (até 12/12)                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 COMPARAÇÃO: Antes vs Depois

```
┌─────────────────────────────────────────────────────────────────┐
│                         ANTES                                    │
├─────────────────────────────────────────────────────────────────┤
│ Conta Corrente:    R$ 4.700,00                                 │
│ Cartão (Dívida):  -R$ 1.000,00                                 │
│ Limite Disponível: R$ 2.000,00                                  │
│ Parcelas Pendentes: 10 (4 até 12)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ ADIANTAR 3 PARCELAS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DEPOIS                                   │
├─────────────────────────────────────────────────────────────────┤
│ Conta Corrente:    R$ 4.400,00 ⬇️ (-R$ 300)                    │
│ Cartão (Dívida):  -R$   700,00 ⬆️ (+R$ 300)                    │
│ Limite Disponível: R$ 2.300,00 ⬆️ (+R$ 300) ✅                 │
│ Parcelas Pendentes: 7 (7 até 12) ⬇️ (-3)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXO COMPLETO DE TRANSAÇÕES

```
┌─────────────────────────────────────────────────────────────────┐
│                    HISTÓRICO DE TRANSAÇÕES                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 📅 01/01/2025 - Compra: Notebook                                │
│    ├─ Parcela 1/12: R$ 100 (Vence 01/01) ✅ PAGA              │
│    ├─ Parcela 2/12: R$ 100 (Vence 01/02) ✅ PAGA              │
│    ├─ Parcela 3/12: R$ 100 (Vence 01/03) ✅ PAGA              │
│    ├─ Parcela 4/12: R$ 100 (Vence 01/04) ✅ PAGA (Adiantada)  │
│    ├─ Parcela 5/12: R$ 100 (Vence 01/05) ✅ PAGA (Adiantada)  │
│    ├─ Parcela 6/12: R$ 100 (Vence 01/06) ✅ PAGA (Adiantada)  │
│    ├─ Parcela 7/12: R$ 100 (Vence 01/07) ○ PENDENTE           │
│    ├─ Parcela 8/12: R$ 100 (Vence 01/08) ○ PENDENTE           │
│    └─ ... (até 12/12)                                           │
│                                                                  │
│ 📅 01/01/2025 - Pagamento Fatura (Parcela 1)                   │
│    💰 Conta Corrente: -R$ 100                                   │
│    💳 Cartão: +R$ 100 (limite liberado)                         │
│                                                                  │
│ 📅 01/02/2025 - Pagamento Fatura (Parcela 2)                   │
│    💰 Conta Corrente: -R$ 100                                   │
│    💳 Cartão: +R$ 100 (limite liberado)                         │
│                                                                  │
│ 📅 01/03/2025 - Pagamento Fatura (Parcela 3)                   │
│    💰 Conta Corrente: -R$ 100                                   │
│    💳 Cartão: +R$ 100 (limite liberado)                         │
│                                                                  │
│ 📅 15/03/2025 - 💳 Pagamento Antecipado (3 parcelas)           │
│    💰 Conta Corrente: -R$ 300                                   │
│    💳 Cartão: +R$ 300 (limite liberado)                         │
│    ✅ Parcelas 4, 5, 6 marcadas como PAGAS                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 PONTOS-CHAVE

### ✅ O que acontece:
1. **Conta Corrente**: Saldo reduz R$ 300 (saída única)
2. **Cartão de Crédito**: Dívida reduz R$ 300 (imediato)
3. **Limite**: Aumenta R$ 300 (disponível imediatamente)
4. **Parcelas**: 3 parcelas marcadas como "paid"
5. **Histórico**: Transação de "Pagamento Antecipado" criada

### ❌ O que NÃO acontece:
1. ❌ Parcelas não "somem" - ficam marcadas como pagas
2. ❌ Não cria 3 transações separadas de R$ 100
3. ❌ Não duplica a despesa
4. ❌ Limite não fica "travado" até o vencimento

---

## 📱 Como Aparece no App

### Lista de Transações:
```
┌─────────────────────────────────────────────────────────────────┐
│ 💳 Pagamento Antecipado - 3x Notebook                           │
│ 15/03/2025 • Conta Corrente                                     │
│ -R$ 300,00                                                       │
│ ✅ Parcelas 4, 5, 6 quitadas                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 💻 Notebook - Parcela 6/12                                      │
│ 01/06/2025 • Cartão de Crédito                                  │
│ R$ 100,00                                                        │
│ ✅ PAGA ANTECIPADAMENTE (15/03/2025)                            │
└─────────────────────────────────────────────────────────────────┘
```

### Detalhes do Cartão:
```
┌─────────────────────────────────────────────────────────────────┐
│ 💳 Cartão de Crédito Itaú                                       │
├─────────────────────────────────────────────────────────────────┤
│ Limite Total:      R$ 3.000,00                                  │
│ Limite Usado:      R$   700,00                                  │
│ Limite Disponível: R$ 2.300,00 ⬆️ (+R$ 300 hoje)               │
│                                                                  │
│ Fatura Atual:      R$ 100,00 (Parcela 7/12)                    │
│ Próximo Vencimento: 01/07/2025                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Desenvolvido com ❤️ para SuaGrana**

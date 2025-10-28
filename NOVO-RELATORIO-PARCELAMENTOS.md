# Novo Relatório de Parcelamentos

## O Que Mudou

Criamos um relatório de parcelamentos completamente novo e mais intuitivo, focado em mostrar informações práticas e úteis.

## Funcionalidades

### 1. Resumo Geral
- **Total de Compras**: Quantas compras parceladas você tem ativas
- **Já Pago**: Quanto você já pagou de todas as parcelas
- **Saldo Devedor**: Quanto ainda falta pagar

### 2. Minhas Compras
Para cada compra parcelada, mostra:
- ✅ Nome da compra
- ✅ Valor total da compra
- ✅ Valor de cada parcela
- ✅ Quantas parcelas foram pagas (ex: 3/12)
- ✅ Barra de progresso visual
- ✅ Quanto já foi pago
- ✅ Quanto ainda falta pagar
- ✅ Quantas parcelas restam

**Exemplo**:
```
Notebook Dell
Categoria: Eletrônicos | 3/12 parcelas pagas

R$ 3.600,00
12x de R$ 300,00

[████████░░░░░░░░░░░░] 25%

✓ Pago: R$ 900,00    ⏱ Faltam: R$ 2.700,00
↓ 9 parcelas restantes
```

### 3. Compras Compartilhadas
Agrupa por pessoa e mostra:
- ✅ Nome da pessoa (ex: "Fran")
- ✅ Quantas compras compartilhadas com ela
- ✅ Quanto VOCÊ deve no total
- ✅ Lista de cada compra compartilhada
- ✅ Sua parte em cada parcela
- ✅ Quanto você já pagou
- ✅ Quanto você ainda deve

**Exemplo**:
```
┌─────────────────────────────────────┐
│ Fran                                │
│ 2 compras compartilhadas            │
│                                     │
│ Você deve: R$ 450,00                │
└─────────────────────────────────────┘

  ├─ TV Samsung
  │  Compartilhado | 2/6 pagas
  │  R$ 1.800,00
  │  Sua parte: R$ 150,00 por parcela
  │  
  │  [████░░░░░░░░] 33%
  │  Você pagou: R$ 300,00 | Você deve: R$ 600,00
  │
  └─ Geladeira Brastemp
     Compartilhado | 1/4 pagas
     R$ 2.400,00
     Sua parte: R$ 300,00 por parcela
     
     [██░░░░░░░░░░] 25%
     Você pagou: R$ 300,00 | Você deve: R$ 900,00
```

## Atualização Automática

O relatório atualiza automaticamente quando:
- ✅ Você paga uma parcela no cartão de crédito
- ✅ A outra pessoa paga a parte dela
- ✅ Uma fatura é paga
- ✅ Uma parcela é marcada como paga

## Como Funciona

### 1. Detecção de Parcelas Pagas
O sistema verifica o `status` de cada transação:
- `completed` ou `cleared` = Paga ✅
- Outros status = Pendente ⏱

### 2. Cálculo de Saldo Devedor
```
Saldo Devedor = (Parcelas Restantes) × (Valor da Parcela)
```

Para compartilhadas:
```
Meu Saldo Devedor = (Parcelas Restantes) × (Minha Parte)
```

### 3. Progresso Visual
```
Progresso = (Parcelas Pagas / Total de Parcelas) × 100%
```

## Exemplo Completo

### Cenário
- Você comprou um notebook de R$ 3.600 em 12x de R$ 300
- Você e Fran compraram uma TV de R$ 1.800 em 6x de R$ 300 (você paga R$ 150 por parcela)
- Você já pagou 3 parcelas do notebook
- Você já pagou 2 parcelas da TV

### Relatório Mostrará

```
┌─────────────────────────────────────────────────┐
│ Resumo de Parcelamentos                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  2 Compras Parceladas Ativas                   │
│                                                 │
│  Já Pago: R$ 1.200,00                          │
│  Saldo Devedor: R$ 3.300,00                    │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Minhas Compras (1)                              │
│ Saldo devedor: R$ 2.700,00                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ Notebook Dell                                   │
│ Eletrônicos | 3/12 parcelas pagas              │
│                                                 │
│ R$ 3.600,00                                     │
│ 12x de R$ 300,00                                │
│                                                 │
│ [████████░░░░░░░░░░░░] 25%                     │
│ ✓ Pago: R$ 900,00    ⏱ Faltam: R$ 2.700,00   │
│ ↓ 9 parcelas restantes                         │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Compras Compartilhadas                          │
│ Saldo devedor total: R$ 600,00                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ Fran                                            │
│ 1 compra compartilhada                         │
│ Você deve: R$ 600,00                           │
│                                                 │
│   TV Samsung                                    │
│   Compartilhado | 2/6 pagas                    │
│   R$ 1.800,00                                   │
│   Sua parte: R$ 150,00 por parcela             │
│                                                 │
│   [████░░░░░░░░] 33%                           │
│   Você pagou: R$ 300,00 | Você deve: R$ 600,00│
│                                                 │
└─────────────────────────────────────────────────┘
```

## Benefícios

1. **Clareza**: Vê rapidamente quanto deve e para quem
2. **Controle**: Acompanha o progresso de cada compra
3. **Organização**: Separado por tipo (suas vs compartilhadas)
4. **Atualização**: Reflete pagamentos em tempo real
5. **Visual**: Barras de progresso facilitam entendimento

## Onde Acessar

O relatório está disponível em:
- Dashboard (seção de parcelamentos)
- Menu Relatórios → Parcelamentos
- Qualquer lugar que use o componente `InstallmentsReport`

## Compatibilidade

O novo componente substitui o antigo automaticamente. Não é necessário alterar nenhum código existente.

## Data de Implementação

27 de outubro de 2025

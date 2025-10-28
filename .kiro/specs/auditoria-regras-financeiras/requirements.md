# Requirements Document: Auditoria Completa de Regras Financeiras

## Introduction

Este documento define os requisitos para uma auditoria completa do sistema financeiro SuaGrana, identificando gaps nas regras de negócio, lógica financeira e implementando as funcionalidades críticas faltantes para garantir integridade e competitividade com grandes players do mercado (Mobills, Organizze, GuiaBolso).

## Glossary

- **Sistema**: Aplicação SuaGrana de gestão financeira pessoal
- **Transação**: Registro de movimentação financeira (receita ou despesa)
- **Fatura**: Consolidação de compras em cartão de crédito em um período
- **Parcelamento**: Divisão de uma compra em múltiplas parcelas
- **Limite de Crédito**: Valor máximo disponível para uso em cartão de crédito
- **Saldo Negativo**: Situação onde despesas excedem o saldo disponível
- **Antecipação**: Pagamento antecipado de parcelas futuras
- **Reversão**: Desfazer uma operação financeira mantendo integridade
- **Integridade Financeira**: Garantia de que todos os cálculos e saldos estão corretos
- **Transação Atômica**: Operação que executa completamente ou não executa nada
- **Soft Delete**: Marcação de registro como deletado sem remover do banco

## Requirements

### Requirement 1: Gestão de Limite de Cartão de Crédito

**User Story:** Como usuário, quero que o sistema controle o limite do meu cartão de crédito, para evitar compras que excedam o limite disponível

#### Acceptance Criteria

1. WHEN o usuário cadastra um cartão de crédito, THE Sistema SHALL armazenar o limite total do cartão
2. WHEN o usuário realiza uma compra no cartão, THE Sistema SHALL calcular o limite disponível subtraindo o valor usado do limite total
3. IF uma compra exceder o limite disponível, THEN THE Sistema SHALL exibir alerta informando que o limite será ultrapassado
4. WHERE o usuário possui múltiplos cartões, THE Sistema SHALL calcular o limite disponível individualmente para cada cartão
5. WHEN o usuário paga uma fatura, THE Sistema SHALL restaurar o limite disponível do cartão

### Requirement 2: Gestão de Faturas de Cartão de Crédito

**User Story:** Como usuário, quero que o sistema gerencie automaticamente as faturas do meu cartão, para ter controle sobre o que preciso pagar

#### Acceptance Criteria

1. WHEN uma compra é realizada no cartão, THE Sistema SHALL adicionar a compra à fatura do período correspondente baseado na data de fechamento
2. WHEN a data de fechamento é atingida, THE Sistema SHALL consolidar todas as compras do período em uma fatura
3. IF uma fatura é paga, THEN THE Sistema SHALL marcar todas as compras da fatura como pagas
4. WHEN novas compras são adicionadas após o fechamento, THE Sistema SHALL incluir as compras na próxima fatura
5. WHERE uma fatura possui parcelamentos, THE Sistema SHALL incluir apenas a parcela do mês correspondente

### Requirement 3: Antecipação de Parcelamentos

**User Story:** Como usuário, quero poder antecipar o pagamento de parcelas futuras, para quitar uma dívida mais rapidamente

#### Acceptance Criteria

1. WHEN o usuário seleciona parcelas futuras para antecipar, THE Sistema SHALL calcular o valor total das parcelas selecionadas
2. IF o usuário optar por desconto na antecipação, THEN THE Sistema SHALL aplicar o percentual de desconto ao valor total
3. WHEN a antecipação é confirmada, THE Sistema SHALL marcar todas as parcelas selecionadas como pagas
4. WHEN a antecipação é confirmada, THE Sistema SHALL criar uma transação única de pagamento com o valor total
5. WHERE há desconto aplicado, THE Sistema SHALL registrar o valor do desconto na transação

### Requirement 4: Compras Acima do Limite

**User Story:** Como usuário, quero ser alertado quando uma compra exceder meu limite, mas ainda poder realizar a compra se necessário

#### Acceptance Criteria

1. WHEN o usuário tenta realizar uma compra que excede o limite, THE Sistema SHALL exibir modal de confirmação com o valor excedente
2. IF o usuário confirmar a compra acima do limite, THEN THE Sistema SHALL registrar a compra e marcar o cartão como "acima do limite"
3. WHEN um cartão está acima do limite, THE Sistema SHALL exibir indicador visual de alerta
4. WHEN o usuário paga a fatura, THE Sistema SHALL verificar se o limite foi normalizado
5. WHERE o cartão permanece acima do limite, THE Sistema SHALL manter o indicador de alerta

### Requirement 5: Saldo Negativo em Contas

**User Story:** Como usuário, quero ser alertado quando uma despesa deixar minha conta negativa, mas poder prosseguir se necessário

#### Acceptance Criteria

1. WHEN o usuário cria uma despesa, THE Sistema SHALL calcular o saldo resultante da conta
2. IF o saldo resultante for negativo, THEN THE Sistema SHALL exibir alerta informando o valor negativo
3. WHERE o usuário confirma a operação, THE Sistema SHALL permitir a criação da despesa
4. WHEN uma conta está com saldo negativo, THE Sistema SHALL exibir indicador visual de alerta
5. WHILE uma conta está negativa, THE Sistema SHALL incluir a conta em relatórios de atenção

### Requirement 6: Reversão de Transações

**User Story:** Como usuário, quero poder reverter transações incorretas, mantendo a integridade financeira do sistema

#### Acceptance Criteria

1. WHEN o usuário deleta uma transação, THE Sistema SHALL reverter automaticamente todos os efeitos da transação
2. IF a transação deletada é um pagamento de fatura, THEN THE Sistema SHALL restaurar o status da fatura para não paga
3. IF a transação deletada é um pagamento de dívida, THEN THE Sistema SHALL restaurar o status da dívida para ativa
4. WHEN uma transação é revertida, THE Sistema SHALL recalcular todos os saldos afetados
5. WHERE a transação faz parte de um parcelamento, THE Sistema SHALL manter as outras parcelas intactas

### Requirement 7: Exclusão de Transações com Integridade

**User Story:** Como usuário, quero que ao excluir uma transação, o sistema mantenha a integridade de todos os dados relacionados

#### Acceptance Criteria

1. WHEN o usuário exclui uma transação, THE Sistema SHALL usar transação atômica do banco de dados
2. IF a exclusão falhar em qualquer etapa, THEN THE Sistema SHALL reverter todas as alterações
3. WHEN uma transação é excluída, THE Sistema SHALL atualizar o saldo da conta imediatamente
4. WHERE a transação está vinculada a outros registros, THE Sistema SHALL atualizar todos os vínculos
5. WHEN a exclusão é concluída, THE Sistema SHALL emitir evento de atualização para o contexto unificado

### Requirement 8: Edição de Parcelamentos

**User Story:** Como usuário, quero poder editar o valor de um parcelamento, recalculando automaticamente todas as parcelas

#### Acceptance Criteria

1. WHEN o usuário edita o valor total de um parcelamento, THE Sistema SHALL recalcular o valor de cada parcela
2. IF o usuário edita uma parcela individual, THEN THE Sistema SHALL perguntar se deseja recalcular as demais
3. WHEN o recálculo é confirmado, THE Sistema SHALL distribuir o novo valor igualmente entre as parcelas restantes
4. WHERE há parcelas já pagas, THE Sistema SHALL manter o valor das parcelas pagas
5. WHEN o recálculo é concluído, THE Sistema SHALL atualizar todas as parcelas em uma transação atômica

### Requirement 9: Validação de Duplicatas

**User Story:** Como usuário, quero que o sistema detecte possíveis transações duplicadas, para evitar lançamentos em duplicidade

#### Acceptance Criteria

1. WHEN o usuário cria uma transação, THE Sistema SHALL verificar se existe transação similar recente
2. IF encontrar transação com mesma descrição, valor, data e conta, THEN THE Sistema SHALL exibir alerta de possível duplicata
3. WHERE o usuário confirma que não é duplicata, THE Sistema SHALL permitir a criação
4. WHEN o usuário confirma que é duplicata, THE Sistema SHALL cancelar a criação
5. WHILE verifica duplicatas, THE Sistema SHALL considerar janela de tempo de 1 minuto antes e depois

### Requirement 10: Validação de Valores

**User Story:** Como usuário, quero que o sistema valide os valores das transações, impedindo valores inválidos

#### Acceptance Criteria

1. WHEN o usuário tenta criar transação com valor zero, THE Sistema SHALL exibir erro informando que o valor deve ser maior que zero
2. IF o usuário tenta criar despesa com valor positivo, THEN THE Sistema SHALL converter automaticamente para negativo
3. IF o usuário tenta criar receita com valor negativo, THEN THE Sistema SHALL converter automaticamente para positivo
4. WHEN o usuário edita uma transação, THE Sistema SHALL aplicar as mesmas validações
5. WHERE o valor é inválido, THE Sistema SHALL impedir a criação/edição da transação

### Requirement 11: Transferências entre Contas

**User Story:** Como usuário, quero que transferências entre contas mantenham integridade, com mesma data e validação de moeda

#### Acceptance Criteria

1. WHEN o usuário cria uma transferência, THE Sistema SHALL garantir que ambas as transações tenham a mesma data
2. IF as contas têm moedas diferentes, THEN THE Sistema SHALL exigir taxa de câmbio
3. WHEN a taxa de câmbio é fornecida, THE Sistema SHALL calcular o valor convertido automaticamente
4. WHERE a transferência é criada, THE Sistema SHALL usar transação atômica para criar ambas as movimentações
5. IF a criação falhar, THEN THE Sistema SHALL reverter ambas as transações

### Requirement 12: Auditoria de Operações Financeiras

**User Story:** Como administrador, quero que todas as operações financeiras sejam auditadas, para rastreamento e conformidade

#### Acceptance Criteria

1. WHEN qualquer operação financeira é realizada, THE Sistema SHALL registrar log de auditoria
2. WHERE o log de auditoria é criado, THE Sistema SHALL incluir usuário, data/hora, tipo de operação e valores
3. IF a operação é uma edição, THEN THE Sistema SHALL armazenar valor anterior e novo valor
4. WHEN uma operação é revertida, THE Sistema SHALL registrar a reversão no log
5. WHILE consulta logs, THE Sistema SHALL permitir filtros por usuário, data e tipo de operação

### Requirement 13: Validação de Conta Ativa

**User Story:** Como usuário, quero que o sistema impeça operações em contas inativas, para evitar erros

#### Acceptance Criteria

1. WHEN o usuário tenta criar transação em conta inativa, THE Sistema SHALL exibir erro informando que a conta está inativa
2. IF o usuário tenta transferir para conta inativa, THEN THE Sistema SHALL impedir a operação
3. WHERE uma conta é desativada, THE Sistema SHALL manter as transações existentes visíveis
4. WHEN uma conta é reativada, THE Sistema SHALL permitir novas transações
5. WHILE uma conta está inativa, THE Sistema SHALL exibir indicador visual de status

### Requirement 14: Soft Delete de Contas

**User Story:** Como usuário, quero que ao excluir uma conta, ela seja apenas desativada, mantendo histórico

#### Acceptance Criteria

1. WHEN o usuário exclui uma conta, THE Sistema SHALL marcar a conta como deletada sem remover do banco
2. WHERE a conta é marcada como deletada, THE Sistema SHALL definir data de exclusão
3. IF a conta possui transações, THEN THE Sistema SHALL manter todas as transações vinculadas
4. WHEN a conta é deletada, THE Sistema SHALL ocultar a conta das listagens principais
5. WHERE necessário, THE Sistema SHALL permitir visualizar contas deletadas em área específica

### Requirement 15: Cálculo de Juros em Rotativo

**User Story:** Como usuário, quero que o sistema calcule automaticamente os juros do rotativo quando não pago o valor total da fatura

#### Acceptance Criteria

1. WHEN o usuário paga valor menor que o total da fatura, THE Sistema SHALL calcular o saldo devedor
2. WHERE há saldo devedor, THE Sistema SHALL aplicar taxa de juros configurada do cartão
3. IF a taxa não está configurada, THEN THE Sistema SHALL usar taxa padrão de mercado
4. WHEN os juros são calculados, THE Sistema SHALL adicionar o valor à próxima fatura
5. WHILE há saldo em rotativo, THE Sistema SHALL exibir alerta de juros acumulados


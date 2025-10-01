/**
 * 🔒 ESLINT RULE CUSTOMIZADA - no-financial-calculations
 * 
 * OBJETIVO: Bloquear uso de reduce, map, filter em valores de transactions fora do finance-engine
 * RESULTADO: Build falha se detectar violações
 * 
 * Esta regra força que qualquer manipulação de dados financeiros vá para dentro do engine.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Proibir cálculos financeiros fora do core/finance-engine',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      noFinancialCalculations: '🚨 VIOLAÇÃO CRÍTICA: Cálculos financeiros só são permitidos no core/finance-engine. Use getSaldoGlobal(), getRelatorioMensal(), etc.',
      noTransactionManipulation: '🚨 VIOLAÇÃO CRÍTICA: Manipulação de transactions com {{method}} só é permitida no core/finance-engine.',
      noAmountCalculations: '🚨 VIOLAÇÃO CRÍTICA: Cálculos com propriedade "amount" só são permitidos no core/finance-engine.',
      noBalanceCalculations: '🚨 VIOLAÇÃO CRÍTICA: Cálculos com propriedade "balance" só são permitidos no core/finance-engine.'
    },
  },

  create(context) {
    const filename = context.getFilename();
    const isFinanceEngine = filename.includes('core/finance-engine') || filename.includes('core\\finance-engine');
    
    // Se estamos no finance-engine, permitir tudo
    if (isFinanceEngine) {
      return {};
    }

    // Palavras-chave financeiras que indicam cálculos
    const financialKeywords = [
      'amount', 'balance', 'income', 'expense', 'total', 'sum', 
      'saldo', 'receita', 'despesa', 'valor', 'price', 'cost'
    ];

    // Métodos proibidos para manipulação de arrays
    const prohibitedMethods = ['reduce', 'map', 'filter', 'forEach', 'find', 'some', 'every'];

    function isFinancialContext(node) {
      const sourceCode = context.getSourceCode();
      const nodeText = sourceCode.getText(node);
      
      // Verificar se o contexto contém palavras-chave financeiras
      return financialKeywords.some(keyword => 
        nodeText.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    function isTransactionArray(node) {
      const sourceCode = context.getSourceCode();
      const nodeText = sourceCode.getText(node);
      
      return nodeText.includes('transactions') || 
             nodeText.includes('transaction') ||
             nodeText.includes('accounts') ||
             nodeText.includes('account');
    }

    function hasFinancialProperty(node) {
      if (node.type === 'MemberExpression') {
        const propertyName = node.property.name;
        return financialKeywords.includes(propertyName);
      }
      return false;
    }

    return {
      // Detectar chamadas de métodos em arrays de transações
      CallExpression(node) {
        if (node.callee.type === 'MemberExpression') {
          const methodName = node.callee.property.name;
          const object = node.callee.object;

          // Verificar se é um método proibido
          if (prohibitedMethods.includes(methodName)) {
            // Verificar se está sendo usado em contexto financeiro
            if (isTransactionArray(object) || isFinancialContext(node)) {
              context.report({
                node,
                messageId: 'noTransactionManipulation',
                data: { method: methodName }
              });
            }
          }
        }
      },

      // Detectar operações aritméticas com propriedades financeiras
      BinaryExpression(node) {
        const operators = ['+', '-', '*', '/', '%'];
        
        if (operators.includes(node.operator)) {
          // Verificar se algum operando é uma propriedade financeira
          if (hasFinancialProperty(node.left) || hasFinancialProperty(node.right)) {
            context.report({
              node,
              messageId: 'noAmountCalculations'
            });
          }
          
          // Verificar se está em contexto financeiro
          if (isFinancialContext(node)) {
            context.report({
              node,
              messageId: 'noFinancialCalculations'
            });
          }
        }
      },

      // Detectar assignment com cálculos financeiros
      AssignmentExpression(node) {
        if (node.operator === '+=' || node.operator === '-=') {
          if (hasFinancialProperty(node.left) || isFinancialContext(node)) {
            context.report({
              node,
              messageId: 'noFinancialCalculations'
            });
          }
        }
      },

      // Detectar update expressions (++, --)
      UpdateExpression(node) {
        if (hasFinancialProperty(node.argument) || isFinancialContext(node)) {
          context.report({
            node,
            messageId: 'noFinancialCalculations'
          });
        }
      },

      // Detectar Math.* em contexto financeiro
      MemberExpression(node) {
        if (node.object.name === 'Math' && isFinancialContext(node.parent)) {
          context.report({
            node,
            messageId: 'noFinancialCalculations'
          });
        }
      },

      // Detectar variáveis que acumulam valores financeiros
      VariableDeclarator(node) {
        if (node.init && node.init.type === 'Literal' && typeof node.init.value === 'number') {
          const variableName = node.id.name;
          if (financialKeywords.some(keyword => 
            variableName.toLowerCase().includes(keyword.toLowerCase())
          )) {
            // Verificar se a variável é usada em cálculos posteriormente
            const scope = context.getScope();
            const variable = scope.set.get(variableName);
            
            if (variable && variable.references.some(ref => {
              const parent = ref.identifier.parent;
              return parent.type === 'AssignmentExpression' || 
                     parent.type === 'BinaryExpression' ||
                     parent.type === 'UpdateExpression';
            })) {
              context.report({
                node,
                messageId: 'noFinancialCalculations'
              });
            }
          }
        }
      }
    };
  },
};
# 🔒 Pull Request - SuaGrana System

## Descrição das Mudanças

<!-- Descreva brevemente as mudanças implementadas -->

## Tipo de Mudança

- [ ] 🐛 Bug fix (correção que resolve um problema)
- [ ] ✨ Nova funcionalidade (mudança que adiciona funcionalidade)
- [ ] 💥 Breaking change (correção ou funcionalidade que causa mudança em funcionalidade existente)
- [ ] 📚 Documentação (mudanças apenas na documentação)
- [ ] 🎨 Refatoração (mudanças de código que não corrigem bugs nem adicionam funcionalidades)
- [ ] ⚡ Performance (mudanças que melhoram a performance)
- [ ] 🧪 Testes (adição ou correção de testes)

## 🔒 Checklist de Conformidade Arquitetural (OBRIGATÓRIO)

### Consumo de Dados Financeiros

- [ ] **Esse código consome dados diretamente do finance-engine?**
  - ✅ SIM - Usa apenas `getSaldoGlobal()`, `getRelatorioMensal()`, `getTransacoesPorConta()`, `getResumoCategorias()`
  - ❌ NÃO - **PR NÃO PODE SER APROVADO** - Refatore para usar finance-engine

- [ ] **Não há cálculos financeiros fora do finance-engine?**
  - ✅ SIM - Nenhum `reduce`, `map`, `filter` em valores financeiros fora do engine
  - ❌ NÃO - **PR NÃO PODE SER APROVADO** - Mova cálculos para finance-engine

- [ ] **Não há importações proibidas?**
  - ✅ SIM - Não usa `unified-context`, `useFinancialMetrics` diretamente
  - ❌ NÃO - **PR NÃO PODE SER APROVADO** - Use apenas finance-engine

### Validações Técnicas

- [ ] **ESLint passou sem erros?**
  ```bash
  npm run lint:check
  ```

- [ ] **Testes de rastreabilidade passaram?**
  ```bash
  npm run test:finance-engine
  ```

- [ ] **Validação arquitetural completa passou?**
  ```bash
  npm run validate-architecture
  ```

## Checklist de Qualidade

- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados conforme necessário
- [ ] Documentação foi atualizada (se aplicável)
- [ ] Não há console.logs ou código de debug
- [ ] Não há secrets ou informações sensíveis no código
- [ ] Performance foi considerada (se aplicável)

## Testes Realizados

<!-- Descreva os testes realizados para validar as mudanças -->

- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes E2E (se aplicável)
- [ ] Testes manuais

## Screenshots (se aplicável)

<!-- Adicione screenshots das mudanças visuais -->

## Impacto

### Áreas Afetadas
- [ ] Dashboard
- [ ] Relatórios
- [ ] Contas
- [ ] Transações
- [ ] Metas
- [ ] Configurações

### Breaking Changes
<!-- Liste qualquer breaking change e como migrar -->

## Notas Adicionais

<!-- Qualquer informação adicional relevante para os revisores -->

---

## 🚨 Para Revisores

### Verificações Obrigatórias

1. **Arquitetura Finance-Engine:** Confirme que o código segue o fluxo obrigatório:
   ```
   UI Pages → Hooks → Finance Engine → Database
   ```

2. **Sem Cálculos Paralelos:** Verifique que não há cálculos financeiros fora do engine

3. **Testes Passando:** Confirme que todos os testes de conformidade passaram

4. **ESLint Limpo:** Verifique que não há violações da regra customizada

### ❌ Critérios de Rejeição Automática

- Cálculos financeiros fora do finance-engine
- Importações diretas de contextos financeiros
- Falha nos testes de rastreabilidade
- Violações da regra ESLint customizada

### ✅ Critérios de Aprovação

- Todos os checkboxes de conformidade marcados
- Testes de validação passando
- Código segue padrões arquiteturais
- Funcionalidade testada e validada
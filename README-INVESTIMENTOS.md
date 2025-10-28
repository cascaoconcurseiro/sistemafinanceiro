# 💎 Sistema de Investimentos - SuaGrana

**Versão:** 1.0  
**Data:** 28/10/2025  
**Status:** ✅ Pronto para Uso

---

## 🎯 Visão Geral

Sistema completo de gestão de investimentos integrado ao SuaGrana, permitindo:
- Cadastro e acompanhamento de investimentos
- Atualização manual de preços
- Registro de dividendos e proventos
- Análise de rentabilidade e performance
- Comparação com benchmarks de mercado
- Visualizações gráficas profissionais

---

## 🚀 Início Rápido

### 1. Instalar Dependências
```bash
npm install recharts
```

### 2. Rodar Migration
```bash
npx prisma migrate dev --name add_investments
npx prisma generate
```

### 3. Iniciar Aplicação
```bash
npm run dev
```

### 4. Acessar
```
http://localhost:3000/investimentos
```

---

## 📋 Funcionalidades

### ✅ Gestão de Investimentos
- Cadastro de 7 tipos de ativos (Ações, FIIs, Renda Fixa, Cripto, etc)
- Edição e exclusão de investimentos
- Atualização manual de preços
- Histórico de cotações
- Cálculo automático de rentabilidade

### ✅ Dividendos e Proventos
- Registro de dividendos, JCP, rendimentos
- Cálculo automático de IR
- Histórico completo
- Integração com transações

### ✅ Dashboard e Análises
- 3 cards de resumo (Patrimônio, Rentabilidade, Dividendos)
- Gráfico de alocação por tipo
- Gráfico de evolução patrimonial
- Comparação com benchmarks (CDI, Ibovespa, IPCA)
- Performance por tipo de ativo
- Insights automáticos

### ✅ Integrações
- Criação automática de transações
- Débito/crédito em contas
- Vínculo bidirecional
- Atualização de saldos

---

## 📊 Estrutura

### Backend
```
src/
├── app/api/investments/
│   ├── route.ts                    # CRUD básico
│   ├── [id]/route.ts              # Get/Update/Delete
│   ├── portfolio/route.ts         # Portfolio summary
│   ├── performance/route.ts       # Performance data
│   ├── prices/route.ts            # Update prices
│   └── dividends/route.ts         # Dividends CRUD
│
└── lib/services/
    └── investment-service.ts       # Lógica de negócio
```

### Frontend
```
src/components/investments/
├── investment-dashboard.tsx        # Dashboard principal
├── investment-modal.tsx           # Cadastro
├── investment-list.tsx            # Lista de ativos
├── price-update-modal.tsx         # Atualizar preços
├── dividend-modal.tsx             # Registrar dividendos
├── allocation-chart.tsx           # Gráfico de alocação
├── evolution-chart.tsx            # Gráfico de evolução
└── performance-card.tsx           # Card de performance
```

### Banco de Dados
```
prisma/schema.prisma
├── Investment                      # Investimentos
├── Dividend                        # Dividendos
├── InvestmentPriceHistory         # Histórico de preços
├── InvestmentGoal                 # Metas (estrutura)
└── InvestmentEvent                # Calendário (estrutura)
```

---

## 🎨 Tipos de Investimentos

1. **Renda Fixa** 🟦
   - Tesouro Direto
   - CDB, LCI, LCA
   - Debêntures

2. **Ações** 🟩
   - Ações brasileiras
   - Ações internacionais
   - ETFs

3. **FIIs** 🟨
   - Fundos imobiliários
   - Logística, Comercial, Residencial

4. **Criptomoedas** 🟧
   - Bitcoin, Ethereum
   - Outras criptos

5. **Internacional** 🟪
   - Ações estrangeiras
   - REITs

6. **Previdência** 🟫
   - PGBL, VGBL

7. **Outros** ⬜
   - Outros tipos de investimento

---

## 💰 Cálculos Automáticos

### Rentabilidade
```
ROI = (Valor Atual - Valor Investido) / Valor Investido × 100
```

### Valor Total Investido
```
Total = (Quantidade × Preço Médio) + Corretagem + Taxas
```

### Dividend Yield
```
Yield = (Dividendos Anuais / Preço) × 100
```

### Alocação
```
Alocação % = (Valor do Tipo / Valor Total) × 100
```

---

## 📈 Benchmarks

- **CDI:** 10.4% a.a.
- **Ibovespa:** 8.2% a.a.
- **IPCA:** 4.5% a.a.
- **IFIX:** 6.4% a.a.

*Valores fixos - atualizar manualmente conforme mercado*

---

## 🔧 Configuração

### Adicionar ao Menu
```typescript
// src/components/layout/sidebar.tsx
{
  title: 'Investimentos',
  href: '/investimentos',
  icon: TrendingUp,
}
```

### Variáveis de Ambiente
Não requer variáveis adicionais. Usa o banco SQLite existente.

---

## 🧪 Testes

### Teste 1: Cadastro
1. Acessar /investimentos
2. Clicar em "Novo Investimento"
3. Preencher dados
4. Salvar
5. Verificar na lista

### Teste 2: Atualização de Preço
1. Clicar em "Atualizar Cotações"
2. Inserir novo preço
3. Salvar
4. Verificar rentabilidade

### Teste 3: Dividendo
1. Clicar em "Registrar Dividendo"
2. Selecionar investimento
3. Preencher valores
4. Salvar
5. Verificar no card

---

## 📱 Responsividade

- ✅ Desktop (1920px+)
- ✅ Laptop (1366px)
- ✅ Tablet (768px)
- ✅ Mobile (375px)

---

## 🐛 Troubleshooting

### Erro: Module not found
```bash
npm install recharts @tanstack/react-query
```

### Erro: Prisma Client
```bash
npx prisma generate
```

### Erro: Migration failed
```bash
npx prisma migrate reset
npx prisma migrate dev --name add_investments
```

---

## 📚 Documentação Adicional

- **AUDITORIA-FINAL-INVESTIMENTOS.md** - Checklist completo
- **VERIFICACAO-COMPLETA-FINAL.md** - Verificação de tudo
- **COMANDOS-EXECUTAR-AGORA.md** - Comandos prontos
- **TUDO-PRONTO-INVESTIMENTOS.md** - Resumo executivo
- **PROPOSTA-NOVA-PAGINA-INVESTIMENTOS.md** - Proposta original

---

## 🎯 Roadmap Futuro

### Fase 2 (Próximas Features)
- [ ] Calendário de eventos
- [ ] Calculadora de IR completa
- [ ] Simulador de investimentos
- [ ] Metas de investimento
- [ ] Rebalanceamento automático
- [ ] Importação de extratos
- [ ] Relatórios exportáveis (PDF, Excel)
- [ ] Notificações de dividendos

### Fase 3 (Avançado)
- [ ] Integração com APIs de cotação
- [ ] Atualização automática de preços
- [ ] Análise de risco
- [ ] Sugestões de investimento
- [ ] Comparação com outros usuários
- [ ] Gamificação

---

## 🤝 Contribuindo

Para adicionar novas funcionalidades:

1. Criar branch: `git checkout -b feature/nova-funcionalidade`
2. Implementar mudanças
3. Testar localmente
4. Commit: `git commit -m "feat: adiciona nova funcionalidade"`
5. Push: `git push origin feature/nova-funcionalidade`
6. Criar Pull Request

---

## 📄 Licença

Propriedade do projeto SuaGrana.

---

## 👨‍💻 Autor

**Kiro AI**  
Data de Criação: 28/10/2025

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consultar documentação
2. Verificar logs do console
3. Verificar logs do terminal
4. Consultar AUDITORIA-FINAL-INVESTIMENTOS.md

---

**Status:** ✅ Sistema 100% Funcional e Pronto para Uso!

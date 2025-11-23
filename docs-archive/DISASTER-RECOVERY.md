# 🚨 PLANO DE DISASTER RECOVERY

**Versão:** 1.0  
**Data:** 22/11/2024  
**Responsável:** Equipe de Desenvolvimento

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Cenários de Desastre](#cenários-de-desastre)
3. [Procedimentos de Backup](#procedimentos-de-backup)
4. [Procedimentos de Recuperação](#procedimentos-de-recuperação)
5. [Contatos de Emergência](#contatos-de-emergência)
6. [Testes de Recuperação](#testes-de-recuperação)

---

## 🎯 VISÃO GERAL

### Objetivos
- **RTO (Recovery Time Objective):** 4 horas
- **RPO (Recovery Point Objective):** 24 horas
- **Disponibilidade Alvo:** 99.5%

### Escopo
Este plano cobre:
- Perda de dados do banco de dados
- Falha completa do servidor
- Corrupção de dados
- Ataques cibernéticos
- Erros humanos

---

## 🔥 CENÁRIOS DE DESASTRE

### 1. Perda de Dados do Banco

**Sintomas:**
- Banco de dados corrompido
- Dados inconsistentes
- Transações perdidas

**Impacto:** CRÍTICO  
**Probabilidade:** BAIXA

**Ação Imediata:**
1. Parar aplicação
2. Isolar banco corrompido
3. Restaurar último backup
4. Validar integridade
5. Reiniciar aplicação

### 2. Falha Completa do Servidor

**Sintomas:**
- Aplicação inacessível
- Servidor não responde
- Timeout em todas requisições

**Impacto:** CRÍTICO  
**Probabilidade:** MÉDIA

**Ação Imediata:**
1. Verificar status do servidor
2. Provisionar novo servidor
3. Restaurar backup
4. Redirecionar DNS
5. Validar funcionamento

### 3. Ataque Cibernético

**Sintomas:**
- Atividade suspeita
- Dados modificados
- Acesso não autorizado

**Impacto:** CRÍTICO  
**Probabilidade:** MÉDIA

**Ação Imediata:**
1. Isolar sistema comprometido
2. Analisar logs de auditoria
3. Identificar ponto de entrada
4. Restaurar backup limpo
5. Aplicar patches de segurança
6. Notificar usuários afetados

### 4. Erro Humano

**Sintomas:**
- Dados deletados acidentalmente
- Configuração incorreta
- Deploy com bugs

**Impacto:** MÉDIO  
**Probabilidade:** ALTA

**Ação Imediata:**
1. Identificar escopo do erro
2. Reverter mudanças (se possível)
3. Restaurar backup parcial
4. Validar correção
5. Documentar incidente

---

## 💾 PROCEDIMENTOS DE BACKUP

### Backup Automático Diário

**Frequência:** Diariamente às 03:00 AM  
**Retenção:** 30 dias  
**Localização:** `/backups/`

**Comando:**
```bash
node scripts/backup-database.js create
```

**Configurar Cron (Linux/Mac):**
```bash
# Editar crontab
crontab -e

# Adicionar linha
0 3 * * * cd /path/to/app && node scripts/backup-database.js create
```

**Configurar Task Scheduler (Windows):**
1. Abrir Task Scheduler
2. Criar nova tarefa
3. Trigger: Diariamente às 03:00
4. Action: `node scripts/backup-database.js create`

### Backup Manual

**Quando executar:**
- Antes de migrations
- Antes de deploys importantes
- Antes de mudanças críticas

**Comando:**
```bash
node scripts/backup-database.js create
```

### Verificação de Backups

**Frequência:** Semanalmente

**Procedimento:**
```bash
# Listar backups
node scripts/backup-database.js list

# Verificar integridade
node scripts/audit-system.js
```

---

## 🔄 PROCEDIMENTOS DE RECUPERAÇÃO

### Recuperação Completa

**Tempo Estimado:** 30 minutos

**Passo a Passo:**

1. **Parar Aplicação**
   ```bash
   # Parar servidor
   pm2 stop all
   # ou
   docker-compose down
   ```

2. **Listar Backups Disponíveis**
   ```bash
   node scripts/backup-database.js list
   ```

3. **Restaurar Backup**
   ```bash
   node scripts/backup-database.js restore backup-2024-11-22-03-00-00.db.gz
   ```

4. **Validar Integridade**
   ```bash
   node scripts/audit-system.js
   ```

5. **Reiniciar Aplicação**
   ```bash
   pm2 start all
   # ou
   docker-compose up -d
   ```

6. **Verificar Funcionamento**
   - Acessar aplicação
   - Testar login
   - Verificar transações
   - Validar saldos

### Recuperação Parcial

**Quando usar:** Apenas alguns dados foram perdidos

**Passo a Passo:**

1. **Identificar Dados Perdidos**
   ```bash
   # Verificar audit log
   node scripts/check-audit-log.js
   ```

2. **Extrair Dados do Backup**
   ```bash
   # Restaurar em banco temporário
   cp backups/backup-latest.db.gz /tmp/
   gzip -d /tmp/backup-latest.db.gz
   ```

3. **Importar Dados Específicos**
   ```sql
   -- Conectar ao backup
   sqlite3 /tmp/backup-latest.db

   -- Exportar dados
   .mode csv
   .output /tmp/transactions.csv
   SELECT * FROM transactions WHERE id IN (...);
   ```

4. **Importar no Banco Principal**
   ```bash
   node scripts/import-data.js /tmp/transactions.csv
   ```

### Recuperação de Emergência

**Quando usar:** Servidor completamente perdido

**Passo a Passo:**

1. **Provisionar Novo Servidor**
   - Criar instância na cloud
   - Instalar Node.js
   - Instalar dependências

2. **Clonar Repositório**
   ```bash
   git clone https://github.com/seu-repo/suagrana.git
   cd suagrana
   npm install
   ```

3. **Restaurar Backup**
   ```bash
   # Baixar backup do cloud storage
   aws s3 cp s3://backups/latest.db.gz ./prisma/dev.db.gz
   gzip -d ./prisma/dev.db.gz
   ```

4. **Configurar Ambiente**
   ```bash
   cp .env.example .env
   # Editar .env com configurações
   ```

5. **Iniciar Aplicação**
   ```bash
   npm run build
   npm start
   ```

---

## 📞 CONTATOS DE EMERGÊNCIA

### Equipe Técnica

**Desenvolvedor Principal**
- Nome: [SEU NOME]
- Email: [SEU EMAIL]
- Telefone: [SEU TELEFONE]
- Disponibilidade: 24/7

**DevOps**
- Nome: [NOME]
- Email: [EMAIL]
- Telefone: [TELEFONE]
- Disponibilidade: 24/7

### Fornecedores

**Hosting Provider**
- Empresa: [NOME]
- Suporte: [TELEFONE/EMAIL]
- Portal: [URL]

**Database Provider**
- Empresa: [NOME]
- Suporte: [TELEFONE/EMAIL]
- Portal: [URL]

---

## 🧪 TESTES DE RECUPERAÇÃO

### Teste Mensal

**Objetivo:** Validar procedimentos de backup e restore

**Procedimento:**
1. Criar backup de teste
2. Restaurar em ambiente de staging
3. Validar integridade dos dados
4. Documentar tempo de recuperação
5. Identificar melhorias

**Checklist:**
- [ ] Backup criado com sucesso
- [ ] Restore executado sem erros
- [ ] Dados íntegros após restore
- [ ] Aplicação funcional
- [ ] Tempo dentro do RTO

### Teste Trimestral

**Objetivo:** Simular desastre completo

**Procedimento:**
1. Simular falha completa do servidor
2. Provisionar novo ambiente
3. Restaurar backup
4. Validar funcionamento completo
5. Medir tempo total de recuperação

---

## 📊 MÉTRICAS E MONITORAMENTO

### KPIs de Disaster Recovery

- **Tempo Médio de Recuperação:** < 4 horas
- **Taxa de Sucesso de Backups:** > 99%
- **Perda Máxima de Dados:** < 24 horas
- **Testes de DR por Ano:** 12

### Monitoramento de Backups

**Alertas Configurados:**
- Backup falhou
- Backup não executado em 24h
- Espaço em disco baixo
- Backup corrompido

---

## 📝 HISTÓRICO DE INCIDENTES

| Data | Tipo | Impacto | Tempo de Recuperação | Lições Aprendidas |
|------|------|---------|---------------------|-------------------|
| - | - | - | - | - |

---

## 🔄 REVISÃO E ATUALIZAÇÃO

**Frequência de Revisão:** Trimestral

**Próxima Revisão:** [DATA]

**Responsável:** [NOME]

**Changelog:**
- 22/11/2024 - v1.0 - Criação inicial do documento

---

## ✅ CHECKLIST DE PREPARAÇÃO

### Antes do Desastre
- [ ] Backups automáticos configurados
- [ ] Backups testados mensalmente
- [ ] Documentação atualizada
- [ ] Equipe treinada
- [ ] Contatos atualizados
- [ ] Monitoramento ativo

### Durante o Desastre
- [ ] Equipe notificada
- [ ] Escopo identificado
- [ ] Procedimento iniciado
- [ ] Progresso documentado
- [ ] Stakeholders informados

### Após o Desastre
- [ ] Sistema restaurado
- [ ] Funcionamento validado
- [ ] Incidente documentado
- [ ] Post-mortem realizado
- [ ] Melhorias implementadas
- [ ] Plano atualizado

---

**Documento Confidencial - Uso Interno Apenas**

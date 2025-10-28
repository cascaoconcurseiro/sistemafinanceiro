# 🔐 Sistema Administrativo - SuaGrana

## 📋 Visão Geral

O SuaGrana agora possui um sistema administrativo completo com isolamento total de dados por usuário.

## 🚀 Configuração Inicial

### 1. Atualizar o Banco de Dados

```bash
# Aplicar as migrações do schema
npm run db:push

# Resetar o banco e criar usuário admin
npm run db:reset
```

### 2. Credenciais do Administrador

```
Email: admin@suagrana.com
Senha: admin123
```

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

## 🎯 Funcionalidades da Área Administrativa

### Dashboard Principal (`/admin`)
- Estatísticas gerais do sistema
- Total de usuários (ativos/inativos)
- Total de transações
- Total de contas
- Tamanho do banco de dados
- Status de saúde do sistema

### Gerenciamento de Usuários (`/admin/users`)
- ✅ Listar todos os usuários
- ✅ Criar novos usuários
- ✅ Editar usuários existentes
- ✅ Ativar/Desativar usuários
- ✅ Excluir usuários (com todos os dados relacionados)
- ✅ Buscar usuários por nome ou email
- ⚠️ Proteção: Admin não pode ser excluído

### Banco de Dados (`/admin/database`)
- Backup e restauração
- Manutenção do banco
- Estatísticas de uso

### Logs do Sistema (`/admin/logs`)
- Visualizar logs de auditoria
- Filtrar por usuário, ação, data
- Exportar logs

### Relatórios (`/admin/reports`)
- Relatórios gerenciais
- Estatísticas de uso
- Análise de dados

### Monitoramento (`/admin/monitoring`)
- Performance do sistema
- Uso de recursos
- Métricas em tempo real

### Configurações (`/admin/settings`)
- Configurações gerais
- Parâmetros do sistema
- Manutenção

## 🔒 Segurança e Isolamento

### Isolamento de Dados
- ✅ Cada usuário vê apenas seus próprios dados
- ✅ Transações isoladas por `userId`
- ✅ Contas isoladas por `userId`
- ✅ Categorias isoladas por `userId`
- ✅ Metas isoladas por `userId`
- ✅ Orçamentos isolados por `userId`

### Controle de Acesso
- ✅ Admin acessa apenas `/admin/*`
- ✅ Usuários normais acessam apenas `/dashboard/*`
- ✅ Redirecionamento automático baseado em role
- ✅ Middleware protegendo rotas

### Autenticação
- ✅ NextAuth com JWT
- ✅ Role incluído na sessão
- ✅ Verificação de usuário ativo
- ✅ Registro de último login

## 📊 Estrutura de Roles

```typescript
enum UserRole {
  USER = 'USER',    // Usuário normal
  ADMIN = 'ADMIN'   // Administrador
}
```

## 🔄 Fluxo de Login

### Usuário Normal (USER)
1. Login em `/login`
2. Autenticação bem-sucedida
3. Redirecionamento para `/dashboard`
4. Acesso apenas aos próprios dados

### Administrador (ADMIN)
1. Login em `/login` com `admin@suagrana.com`
2. Autenticação bem-sucedida
3. Redirecionamento para `/admin`
4. Acesso a todos os dados do sistema
5. Não pode acessar área de usuário normal

## 🛠️ APIs Administrativas

### GET `/api/admin/stats`
Retorna estatísticas gerais do sistema

### GET `/api/admin/users`
Lista todos os usuários

### DELETE `/api/admin/users/[id]`
Exclui um usuário e todos os seus dados

### PATCH `/api/admin/users/[id]`
Atualiza um usuário (ativar/desativar)

## 📝 Próximos Passos

1. ✅ Resetar banco de dados
2. ✅ Criar usuário admin
3. ✅ Fazer login como admin
4. ✅ Explorar área administrativa
5. ⏳ Criar usuários de teste
6. ⏳ Testar isolamento de dados
7. ⏳ Configurar backup automático

## 🔧 Comandos Úteis

```bash
# Resetar banco e criar admin
npm run db:reset

# Abrir Prisma Studio
npm run db:studio

# Gerar cliente Prisma
npm run db:generate

# Aplicar migrações
npm run db:push
```

## ⚠️ Avisos Importantes

1. **Backup**: Sempre faça backup antes de resetar o banco
2. **Senha**: Altere a senha padrão do admin
3. **Produção**: Use variáveis de ambiente seguras
4. **HTTPS**: Use HTTPS em produção
5. **Rate Limiting**: Implemente rate limiting nas APIs

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa ou entre em contato com o suporte técnico.

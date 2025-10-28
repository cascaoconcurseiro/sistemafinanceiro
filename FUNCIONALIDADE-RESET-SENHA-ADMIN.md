# 🔑 Funcionalidade: Reset de Senha pelo Admin

## ✅ Implementação Completa

### Funcionalidades Adicionadas

1. **Botão de Reset de Senha** na lista de usuários
2. **API para gerar senha aleatória** segura
3. **Modal para exibir nova senha** gerada
4. **Copiar senha** para área de transferência
5. **Log de auditoria** do reset

## 🎯 Como Funciona

### 1. Interface do Admin

Na página `/admin/users`, cada usuário tem um botão com ícone de chave (🔑):

```
[🔑] [✓/✗] [✏️] [🗑️]
```

### 2. Fluxo de Reset

1. Admin clica no botão de chave (🔑)
2. Confirma a ação no dialog
3. Sistema gera senha aleatória segura (12 caracteres)
4. Senha é atualizada no banco de dados
5. Modal exibe a nova senha
6. Admin pode copiar a senha
7. Admin envia a senha ao usuário

### 3. Geração de Senha Segura

A senha gerada contém:
- **12 caracteres** no total
- Pelo menos **1 letra minúscula** (a-z)
- Pelo menos **1 letra maiúscula** (A-Z)
- Pelo menos **1 número** (0-9)
- Pelo menos **1 símbolo** (!@#$%&*)
- Caracteres **embaralhados** aleatoriamente

Exemplo de senha gerada: `aB3!xY7@mK9$`

## 📋 Arquivos Modificados/Criados

### Criados
- ✅ `src/app/api/admin/users/[id]/reset-password/route.ts` - API de reset

### Modificados
- ✅ `src/app/admin/users/page.tsx` - Adicionado botão e modal

## 🔐 Segurança

### Validações Implementadas
- ✅ Apenas ADMIN pode resetar senhas
- ✅ Verificação de sessão do admin
- ✅ Verificação se usuário existe
- ✅ Senha com hash bcrypt (10 rounds)
- ✅ Senha exibida apenas uma vez
- ✅ Log de auditoria do reset

### Logs de Auditoria
```typescript
{
  adminId: "id-do-admin",
  adminEmail: "admin@suagrana.com",
  userId: "id-do-usuario",
  userEmail: "usuario@exemplo.com",
  timestamp: "2025-10-28T10:30:00.000Z"
}
```

## 🧪 Como Testar

### 1. Acessar Lista de Usuários
```
http://localhost:3000/admin/users
```

### 2. Resetar Senha
1. Localize um usuário na lista
2. Clique no botão de chave (🔑)
3. Confirme a ação
4. Veja a nova senha no modal
5. Clique em "Copiar" para copiar a senha
6. Envie a senha ao usuário

### 3. Testar Login com Nova Senha
1. Faça logout
2. Tente fazer login com o usuário
3. Use a nova senha gerada
4. Deve funcionar normalmente

### 4. Verificar Logs
No terminal do servidor, procure por:
```
✅ Senha resetada pelo admin: { ... }
```

## 📊 API Endpoint

### POST `/api/admin/users/[id]/reset-password`

**Autenticação**: Requer sessão de ADMIN

**Parâmetros**:
- `id` (path): ID do usuário

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "message": "Senha resetada com sucesso",
  "newPassword": "aB3!xY7@mK9$",
  "user": {
    "id": "user-id",
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com"
  }
}
```

**Resposta de Erro** (403):
```json
{
  "error": "Não autorizado"
}
```

**Resposta de Erro** (404):
```json
{
  "error": "Usuário não encontrado"
}
```

## 🎨 Interface do Modal

```
┌─────────────────────────────────────┐
│ Nova Senha Gerada                   │
├─────────────────────────────────────┤
│ A senha foi resetada com sucesso.   │
│ Copie e envie para o usuário.       │
│                                     │
│ Nova Senha:                         │
│ ┌─────────────────────────┬───┐    │
│ │ aB3!xY7@mK9$           │📋 │    │
│ └─────────────────────────┴───┘    │
│                                     │
│ ⚠️ IMPORTANTE: Esta senha só será   │
│ exibida uma vez. Certifique-se de  │
│ copiá-la e enviá-la ao usuário de  │
│ forma segura.                       │
│                                     │
│         [ Fechar ]                  │
└─────────────────────────────────────┘
```

## 💡 Boas Práticas

### Para o Admin
1. ✅ Sempre copie a senha antes de fechar o modal
2. ✅ Envie a senha por canal seguro (não por email comum)
3. ✅ Instrua o usuário a trocar a senha no primeiro login
4. ✅ Não compartilhe a senha em grupos ou chats públicos

### Para o Usuário
1. ✅ Troque a senha assim que receber
2. ✅ Use uma senha forte e única
3. ✅ Não compartilhe a senha com ninguém
4. ✅ Ative autenticação de dois fatores (se disponível)

## 🔄 Melhorias Futuras

### Possíveis Adições
- [ ] Enviar senha por email automaticamente
- [ ] Forçar troca de senha no próximo login
- [ ] Histórico de resets de senha
- [ ] Notificação ao usuário sobre o reset
- [ ] Opção de definir senha manualmente
- [ ] Expiração automática da senha temporária
- [ ] SMS com código de verificação

### Configurações Adicionais
- [ ] Comprimento da senha configurável
- [ ] Tipos de caracteres configuráveis
- [ ] Política de senha customizável
- [ ] Tempo de expiração da senha temporária

## 🐛 Troubleshooting

### Erro: "Não autorizado"
**Causa**: Usuário não é admin
**Solução**: Fazer login com conta admin

### Erro: "Usuário não encontrado"
**Causa**: ID do usuário inválido
**Solução**: Verificar se usuário existe no banco

### Modal não abre
**Causa**: Componente Dialog não importado
**Solução**: Verificar importação do Dialog

### Senha não copia
**Causa**: Navegador não suporta clipboard API
**Solução**: Copiar manualmente a senha

## 📝 Código de Exemplo

### Gerar Senha Manualmente (Script)
```typescript
function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

console.log(generateSecurePassword(12));
```

### Resetar Senha via Script
```bash
# Criar script para resetar senha
node scripts/reset-user-password.js usuario@exemplo.com
```

## ✅ Checklist de Implementação

- [x] API de reset de senha criada
- [x] Botão de reset adicionado à lista
- [x] Modal de exibição de senha
- [x] Função de copiar senha
- [x] Validação de permissão admin
- [x] Geração de senha segura
- [x] Hash da senha com bcrypt
- [x] Log de auditoria
- [x] Tratamento de erros
- [x] Feedback visual (toast)
- [x] Documentação completa

## 🎉 Pronto para Usar!

A funcionalidade está completa e pronta para uso. O admin pode agora resetar senhas de usuários de forma segura e eficiente.

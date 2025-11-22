# 🔧 Guia Completo de Correções - Console Errors

## ✅ Correções Aplicadas

### 1. Content Security Policy (CSP) - Fontes Bloqueadas ✅

**Problema:**
```
Loading the font '<URL>' violates the following Content Security Policy directive: "font-src 'self' data:"
```

**Solução Aplicada:**
- ✅ Atualizado `src/middleware.ts`
- ✅ Adicionado `https://fonts.googleapis.com` em `style-src`
- ✅ Adicionado `https://fonts.gstatic.com` em `font-src`
- ✅ Adicionado `connect-src` para APIs

**Arquivo:** `src/middleware.ts` (linha 75)

**Teste:**
```bash
# Limpar cache do navegador (Ctrl+Shift+Delete)
# Recarregar página (Ctrl+Shift+R)
# Verificar console - não deve haver erros de CSP
```

---

### 2. API Audit - 500 Internal Server Error ✅

**Problema:**
```
GET http://localhost:3000/api/audit/ 500 (Internal Server Error)
```

**Solução Aplicada:**
- ✅ Corrigido `src/app/api/audit/route.ts`
- ✅ Adicionado propagação de headers `Cookie` e `Authorization`
- ✅ Corrigido construção de URLs base

**Arquivo:** `src/app/api/audit/route.ts` (linhas 35-70)

**Teste:**
```bash
# 1. Fazer login na aplicação
# 2. Acessar http://localhost:3000/audit/
# 3. Clicar em "Executar Auditoria"
# 4. Deve retornar dados sem erro 500
```

---

### 3. Rate Limiting - 429 Too Many Requests ✅

**Problema:**
```
POST http://localhost:3000/api/auth/login/ 429 (Too Many Requests)
```

**Solução Aplicada:**
- ✅ Aumentado limite de `/api/auth/login` de 5 para 10 tentativas
- ✅ Mantido janela de 15 minutos para segurança

**Arquivo:** `src/middleware/rate-limit.ts` (linha 24)

**Teste:**
```bash
# Tentar fazer login 6-7 vezes seguidas
# Deve permitir até 10 tentativas agora
# Após 10 tentativas, aguardar mensagem com tempo de retry
```

---

### 4. PWA Manifest - Ícones Não Encontrados ✅

**Problema:**
```
Error while trying to use the following icon from the Manifest: 
http://localhost:3000/icon-192.png (Download error or resource isn't a valid image)
```

**Solução Aplicada:**
- ✅ Corrigido `public/manifest.json`
- ✅ Atualizado referências de `/icon-192.png` para `/icon-192x192.png`
- ✅ Atualizado referências de `/icon-512.png` para `/icon-512x512.png`
- ✅ Ícones já existem no diretório public

**Arquivo:** `public/manifest.json`

**Teste:**
```bash
# Abrir DevTools > Application > Manifest
# Verificar se os ícones carregam corretamente
# Não deve haver erros de ícone não encontrado
```

---

### 5. Auth Interceptor - Melhor Tratamento de 401 ✅

**Problema:**
```
GET /api/notifications/ 401 (Unauthorized)
GET /api/unified-financial/optimized/ 401 (Unauthorized)
GET /api/auth/me/ 401 (Unauthorized)
```

**Solução Aplicada:**
- ✅ Melhorado `src/components/auth-interceptor.tsx`
- ✅ Adicionado verificação de rotas públicas
- ✅ Melhor tratamento de erros 401
- ✅ Redirecionamento automático para login quando necessário
- ✅ Mensagens de erro mais claras

**Arquivo:** `src/components/auth-interceptor.tsx`

**Comportamento:**
- Ignora 401 em rotas públicas (login, register)
- Redireciona para login em rotas protegidas
- Limpa sessão automaticamente
- Mostra mensagem de sessão expirada

**Teste:**
```bash
# 1. Fazer logout
# 2. Tentar acessar /dashboard diretamente
# 3. Deve redirecionar para /auth/login
# 4. Fazer login
# 5. Não deve haver mais erros 401 no console
```

---

### 6. Utilitário de Tratamento de Erros ✅

**Novo Arquivo Criado:**
- ✅ `src/lib/utils/error-handler.ts`

**Funcionalidades:**
- Classe `ApiError` para erros tipados
- `handleApiError()` - trata respostas de erro
- `fetchWithErrorHandling()` - wrapper para fetch
- `formatErrorMessage()` - formata mensagens
- `isAuthError()` - detecta erros de autenticação
- `isRateLimitError()` - detecta rate limiting
- `getRetryAfter()` - extrai tempo de retry

**Uso:**
```typescript
import { fetchWithErrorHandling, isAuthError } from '@/lib/utils/error-handler';

try {
  const data = await fetchWithErrorHandling('/api/accounts');
  console.log(data);
} catch (error) {
  if (isAuthError(error)) {
    // Redirecionar para login
  }
}
```

---

## ⚠️ Avisos Informativos (Não Críticos)

### 1. React DevTools

**Mensagem:**
```
Download the React DevTools for a better development experience
```

**Solução:** Instalar extensão (opcional)
- Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

---

### 2. Message Channel Closed

**Mensagem:**
```
Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, 
but the message channel closed before a response was received
```

**Causa:** Extensão do navegador (Kaspersky ou similar)

**Solução:**
- Desabilitar extensões que interferem
- Adicionar localhost às exceções
- Não afeta funcionalidade da aplicação

---

## 📋 Checklist de Verificação

### Após Aplicar Correções:

- [ ] Limpar cache do navegador (Ctrl+Shift+Delete)
- [ ] Recarregar página (Ctrl+Shift+R)
- [ ] Verificar console - não deve haver erros de CSP
- [ ] Fazer login - não deve haver erro 429
- [ ] Acessar /audit/ - não deve haver erro 500
- [ ] Verificar manifest - ícones devem carregar
- [ ] Testar logout/login - deve redirecionar corretamente

### Testes de Funcionalidade:

- [ ] Login funciona normalmente
- [ ] Dashboard carrega sem erros
- [ ] Transações são listadas
- [ ] Notificações funcionam
- [ ] Auditoria executa sem erros
- [ ] PWA instala corretamente

---

## 🔍 Como Debugar Problemas

### 1. Verificar CSP:
```javascript
// No console do navegador
console.log(document.querySelector('meta[http-equiv="Content-Security-Policy"]'));
```

### 2. Verificar Rate Limit:
```javascript
// No console do navegador
fetch('/api/auth/login', { method: 'POST' })
  .then(r => {
    console.log('Rate Limit Remaining:', r.headers.get('X-RateLimit-Remaining'));
    console.log('Rate Limit Reset:', r.headers.get('X-RateLimit-Reset'));
  });
```

### 3. Verificar Autenticação:
```javascript
// No console do navegador
fetch('/api/auth/me')
  .then(r => r.json())
  .then(data => console.log('User:', data))
  .catch(err => console.error('Auth Error:', err));
```

### 4. Verificar Manifest:
```
1. Abrir DevTools (F12)
2. Ir em Application > Manifest
3. Verificar se todos os ícones carregam
4. Verificar se não há erros
```

---

## 🚀 Próximos Passos (Opcional)

### 1. Implementar Renovação Automática de Token
```typescript
// src/lib/auth/token-refresh.ts
export async function refreshToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }
  
  return response.json();
}
```

### 2. Adicionar Retry Automático para Rate Limit
```typescript
// src/lib/utils/fetch-with-retry.ts
export async function fetchWithRetry(url: string, options?: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * (i + 1);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### 3. Implementar Logging de Erros (Sentry)
```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}
```

---

## 📊 Configuração de Produção vs Desenvolvimento

### Desenvolvimento (Atual):
```typescript
// Rate limit mais permissivo
'/api/auth/login': {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10, // ✅ Aumentado
}

// CSP permite localhost
connect-src 'self' http://localhost:3000 https:;

// Logs detalhados
console.log('📡 [API] ...');
```

### Produção (Recomendado):
```typescript
// Rate limit mais restritivo
'/api/auth/login': {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5, // Mais restritivo
}

// CSP apenas HTTPS
connect-src 'self' https:;

// Logs apenas erros
if (process.env.NODE_ENV === 'production') {
  console.error('❌ [ERROR] ...');
}

// Usar Redis para rate limiting
import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});
```

---

## 📝 Resumo das Mudanças

### Arquivos Modificados:
1. ✅ `src/middleware.ts` - CSP atualizado
2. ✅ `src/app/api/audit/route.ts` - Headers de autenticação
3. ✅ `src/middleware/rate-limit.ts` - Limite aumentado
4. ✅ `public/manifest.json` - Ícones corrigidos
5. ✅ `src/components/auth-interceptor.tsx` - Melhor tratamento de 401

### Arquivos Criados:
1. ✅ `src/lib/utils/error-handler.ts` - Utilitário de erros
2. ✅ `GUIA-CORRECOES-COMPLETO.md` - Este guia

---

## 🎯 Status Final

| Problema | Status | Prioridade |
|----------|--------|------------|
| CSP - Fontes bloqueadas | ✅ Corrigido | Alta |
| API Audit - 500 Error | ✅ Corrigido | Alta |
| Rate Limiting - 429 | ✅ Corrigido | Alta |
| PWA Manifest - Ícones | ✅ Corrigido | Média |
| Auth - 401 Errors | ✅ Melhorado | Alta |
| React DevTools | ℹ️ Informativo | Baixa |
| Message Channel | ℹ️ Extensão | Baixa |

---

**Data:** 22/11/2025  
**Status:** ✅ Todas as correções críticas aplicadas  
**Próximo:** Testar em produção e monitorar logs

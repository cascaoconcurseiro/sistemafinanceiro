# Script de Diagnóstico e Limpeza de Parcelas

## Problema

Parcelas excluídas ainda aparecem no relatório, mesmo após exclusão.

## Solução Rápida

### 1. Abrir Console do Navegador

Pressione `F12` e vá para a aba "Console"

### 2. Executar Script de Diagnóstico

Cole e execute este código no console:

```javascript
// 1. Verificar transações no contexto
const checkContext = () => {
  console.log('=== DIAGNÓSTICO DE PARCELAS ===');
  
  // Buscar dados do contexto
  fetch('/api/unified-financial/optimized', {
    credentials: 'include'
  })
  .then(r => r.json())
  .then(data => {
    const transactions = data.transactions || [];
    
    // Filtrar parceladas
    const installments = transactions.filter(t => 
      t.installmentNumber && t.totalInstallments > 1
    );
    
    // Agrupar por installmentGroupId
    const groups = {};
    installments.forEach(t => {
      const key = t.installmentGroupId || t.parentTransactionId || t.description;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(t);
    });
    
    console.log('📊 Total de transações:', transactions.length);
    console.log('📦 Transações parceladas:', installments.length);
    console.log('🔢 Grupos de parcelamento:', Object.keys(groups).length);
    
    // Mostrar detalhes de cada grupo
    Object.entries(groups).forEach(([key, txs]) => {
      console.log(`\n📦 Grupo: ${key}`);
      console.log(`   Total de parcelas: ${txs.length}`);
      console.log(`   Parcelas:`, txs.map(t => ({
        id: t.id,
        desc: t.description,
        parcela: `${t.installmentNumber}/${t.totalInstallments}`,
        deletedAt: t.deletedAt
      })));
    });
    
    // Verificar se há parcelas com deletedAt
    const withDeletedAt = installments.filter(t => t.deletedAt);
    if (withDeletedAt.length > 0) {
      console.warn('⚠️ ATENÇÃO: Encontradas parcelas com deletedAt no contexto!');
      console.warn('Isso não deveria acontecer. A API deve filtrar deletedAt: null');
      console.warn('Parcelas:', withDeletedAt);
    }
  })
  .catch(err => console.error('❌ Erro:', err));
};

checkContext();
```

### 3. Verificar Banco de Dados (API de Debug)

```javascript
// 2. Verificar no banco de dados (incluindo deletadas)
const checkDatabase = () => {
  console.log('\n=== VERIFICANDO BANCO DE DADOS ===');
  
  fetch('/api/debug/installments', {
    credentials: 'include'
  })
  .then(r => r.json())
  .then(data => {
    console.log('📊 Total de grupos:', data.totalGroups);
    console.log('✅ Grupos ativos:', data.activeGroups);
    console.log('🗑️ Grupos deletados:', data.deletedGroups);
    
    // Mostrar grupos ativos
    const activeGroups = data.groups.filter(g => g.status === 'ATIVO');
    if (activeGroups.length > 0) {
      console.log('\n✅ GRUPOS ATIVOS:');
      activeGroups.forEach(g => {
        console.log(`\n📦 ${g.groupKey}`);
        console.log(`   Parcelas ativas: ${g.activeTransactions}`);
        console.log(`   Parcelas deletadas: ${g.deletedTransactions}`);
        console.log(`   Detalhes:`, g.transactions);
      });
    }
    
    // Mostrar grupos parcialmente deletados
    const partialGroups = data.groups.filter(g => 
      g.activeTransactions > 0 && g.deletedTransactions > 0
    );
    if (partialGroups.length > 0) {
      console.warn('\n⚠️ GRUPOS PARCIALMENTE DELETADOS:');
      console.warn('Estes grupos têm algumas parcelas ativas e outras deletadas');
      partialGroups.forEach(g => {
        console.warn(`\n📦 ${g.groupKey}`);
        console.warn(`   Parcelas ativas: ${g.activeTransactions}`);
        console.warn(`   Parcelas deletadas: ${g.deletedTransactions}`);
        console.warn(`   Detalhes:`, g.transactions);
      });
    }
  })
  .catch(err => console.error('❌ Erro:', err));
};

checkDatabase();
```

### 4. Forçar Limpeza (Se Necessário)

Se encontrar parcelas que deveriam estar deletadas:

```javascript
// 3. Forçar soft delete de um grupo específico
const forceDeleteGroup = (groupKey) => {
  console.log(`🔄 Forçando soft delete do grupo: ${groupKey}`);
  
  fetch('/api/debug/installments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'force-delete-group',
      groupKey: groupKey
    })
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Resultado:', data);
    console.log('🔄 Forçando refresh do contexto...');
    
    // Forçar refresh
    window.dispatchEvent(new CustomEvent('cache-invalidation', { 
      detail: { entity: 'unified-financial-data' } 
    }));
    
    setTimeout(() => {
      console.log('✅ Refresh concluído. Recarregue a página (Ctrl+Shift+R)');
    }, 2000);
  })
  .catch(err => console.error('❌ Erro:', err));
};

// Exemplo de uso:
// forceDeleteGroup('tieif (2/6)');
```

### 5. Limpar Parcelas Órfãs

Se houver grupos incompletos (algumas parcelas deletadas, outras não):

```javascript
// 4. Limpar parcelas órfãs
const cleanupOrphans = () => {
  console.log('🔄 Limpando parcelas órfãs...');
  
  fetch('/api/debug/installments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'cleanup-orphans'
    })
  })
  .then(r => r.json())
  .then(data => {
    console.log('✅ Resultado:', data);
    console.log('🔄 Forçando refresh do contexto...');
    
    // Forçar refresh
    window.dispatchEvent(new CustomEvent('cache-invalidation', { 
      detail: { entity: 'unified-financial-data' } 
    }));
    
    setTimeout(() => {
      console.log('✅ Limpeza concluída. Recarregue a página (Ctrl+Shift+R)');
    }, 2000);
  })
  .catch(err => console.error('❌ Erro:', err));
};

cleanupOrphans();
```

## Passo a Passo Completo

1. **Abrir Console** (F12)

2. **Executar diagnóstico**:
   ```javascript
   // Cole e execute
   checkContext();
   checkDatabase();
   ```

3. **Analisar resultados**:
   - Se aparecer "tieif" nos grupos ativos → Problema no banco
   - Se aparecer "tieif" com deletedAt → Problema na API
   - Se não aparecer "tieif" → Problema de cache do navegador

4. **Aplicar correção**:
   
   **Se problema no banco**:
   ```javascript
   forceDeleteGroup('tieif (2/6)');
   // ou
   forceDeleteGroup('tieif');
   ```
   
   **Se problema de cache**:
   - Hard refresh: `Ctrl + Shift + R`
   - Ou limpar cache do navegador

5. **Verificar novamente**:
   ```javascript
   checkContext();
   checkDatabase();
   ```

6. **Recarregar página**:
   - `Ctrl + Shift + R` (hard refresh)

## Exemplo de Saída Esperada

### Após Limpeza Bem-Sucedida:

```
=== DIAGNÓSTICO DE PARCELAS ===
📊 Total de transações: 50
📦 Transações parceladas: 0
🔢 Grupos de parcelamento: 0

=== VERIFICANDO BANCO DE DADOS ===
📊 Total de grupos: 1
✅ Grupos ativos: 0
🗑️ Grupos deletados: 1
```

## Troubleshooting

### Problema: Script não funciona

**Solução**: Verifique se está logado e na página correta

### Problema: Erro 401

**Solução**: Faça login novamente

### Problema: Parcelas ainda aparecem

**Solução**: 
1. Execute `forceDeleteGroup('tieif')`
2. Aguarde 2 segundos
3. Hard refresh (Ctrl + Shift + R)
4. Limpe cache do navegador completamente

### Problema: Erro ao executar script

**Solução**: 
1. Copie o script linha por linha
2. Verifique se não há erros de sintaxe
3. Tente em modo anônimo/privado

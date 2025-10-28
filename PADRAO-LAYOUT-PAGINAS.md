# 📐 Padrão de Layout das Páginas - SuaGrana

## 🎯 Objetivo

Manter consistência visual em todas as páginas do sistema, evitando duplicação de títulos e informações que já aparecem no topbar.

---

## ✅ Padrão Correto

### Estrutura de Página

```tsx
export default function MinhaPage() {
  return (
    <ModernAppLayout
      title="Título da Página"           // ← Aparece no topbar
      subtitle="Descrição da página"     // ← Aparece no topbar
    >
      <div className="p-4 md:p-6">
        {/* ❌ NÃO adicionar título aqui */}
        {/* ❌ NÃO adicionar <h1>Título da Página</h1> */}
        
        {/* ✅ Começar direto com o conteúdo */}
        <Card>
          <CardHeader>
            <CardTitle>Seção Específica</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Conteúdo */}
          </CardContent>
        </Card>
      </div>
    </ModernAppLayout>
  );
}
```

---

## ❌ Evitar

### 1. Títulos Duplicados

```tsx
// ❌ ERRADO - Título duplicado
<ModernAppLayout title="Relatórios">
  <div>
    <h1>Relatórios</h1>  {/* ← Duplicado! */}
    <p>Análises financeiras</p>
  </div>
</ModernAppLayout>
```

### 2. Descrições Duplicadas

```tsx
// ❌ ERRADO - Descrição duplicada
<ModernAppLayout 
  title="Dashboard" 
  subtitle="Visão geral das finanças"
>
  <div>
    <p>Visão geral das finanças</p>  {/* ← Duplicado! */}
  </div>
</ModernAppLayout>
```

### 3. Headers Desnecessários

```tsx
// ❌ ERRADO - Header desnecessário
<div className="mb-6">
  <h1 className="text-3xl font-bold">Transações</h1>
  <p className="text-muted-foreground">Gerencie suas transações</p>
</div>
```

---

## ✅ Padrões Corretos

### 1. Página Simples

```tsx
export default function TransacoesPage() {
  return (
    <ModernAppLayout
      title="Transações"
      subtitle="Gerencie suas transações financeiras"
    >
      <div className="p-4 md:p-6">
        {/* Conteúdo direto */}
        <TransactionList />
      </div>
    </ModernAppLayout>
  );
}
```

### 2. Página com Filtros

```tsx
export default function RelatoriosPage() {
  return (
    <ModernAppLayout
      title="Relatórios"
      subtitle="Análises detalhadas"
    >
      <div className="p-4 md:p-6">
        {/* Filtros e controles */}
        <div className="flex gap-2 mb-4">
          <DatePicker />
          <Button>Filtrar</Button>
        </div>
        
        {/* Conteúdo */}
        <ReportContent />
      </div>
    </ModernAppLayout>
  );
}
```

### 3. Página com Seções

```tsx
export default function DashboardPage() {
  return (
    <ModernAppLayout
      title="Dashboard"
      subtitle="Visão geral das finanças"
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Seções com títulos específicos */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Conteúdo */}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Conteúdo */}
          </CardContent>
        </Card>
      </div>
    </ModernAppLayout>
  );
}
```

---

## 📋 Checklist de Revisão

Ao criar ou revisar uma página, verifique:

- [ ] O título está apenas no `ModernAppLayout`?
- [ ] Não há `<h1>` duplicado no conteúdo?
- [ ] A descrição está apenas no `subtitle`?
- [ ] O conteúdo começa direto após o padding?
- [ ] Seções específicas usam `CardTitle` quando necessário?
- [ ] Não há textos repetitivos?

---

## 🎨 Hierarquia de Títulos

### Topbar (ModernAppLayout)
- **title**: Título principal da página (aparece no topbar)
- **subtitle**: Descrição breve (aparece no topbar)

### Conteúdo da Página
- **CardTitle**: Títulos de seções específicas
- **h3/h4**: Subtítulos dentro de cards
- **p**: Textos descritivos

### Exemplo Completo

```tsx
<ModernAppLayout 
  title="Investimentos"              // ← Nível 1: Topbar
  subtitle="Gerencie sua carteira"   // ← Nível 1: Topbar
>
  <div className="p-4 md:p-6 space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Carteira Atual</CardTitle>  {/* ← Nível 2: Seção */}
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">
          Ações
        </h3>  {/* ← Nível 3: Subseção */}
        <p>Conteúdo...</p>
      </CardContent>
    </Card>
  </div>
</ModernAppLayout>
```

---

## 🔧 Como Corrigir Páginas Existentes

### Passo 1: Identificar Duplicações

```bash
# Buscar títulos duplicados
grep -r "text-3xl.*font-bold" src/app/
grep -r "<h1" src/app/
```

### Passo 2: Remover Títulos Duplicados

**Antes:**
```tsx
<ModernAppLayout title="Metas">
  <div>
    <h1 className="text-3xl font-bold">Metas</h1>
    <p>Acompanhe suas metas</p>
    <GoalsList />
  </div>
</ModernAppLayout>
```

**Depois:**
```tsx
<ModernAppLayout 
  title="Metas"
  subtitle="Acompanhe suas metas"
>
  <div className="p-4 md:p-6">
    <GoalsList />
  </div>
</ModernAppLayout>
```

### Passo 3: Testar

1. Verifique se o título aparece no topbar
2. Confirme que não há duplicação
3. Teste em mobile e desktop

---

## 📱 Responsividade

### Mobile
- Título aparece no topbar (sempre visível)
- Conteúdo com padding adequado
- Sem títulos duplicados que ocupam espaço

### Desktop
- Título aparece no topbar
- Mais espaço para conteúdo útil
- Layout limpo e profissional

---

## 🎯 Benefícios

1. **Consistência**: Todas as páginas seguem o mesmo padrão
2. **Espaço**: Mais espaço para conteúdo útil
3. **UX**: Usuário não vê informações repetidas
4. **Manutenção**: Mais fácil de manter e atualizar
5. **Performance**: Menos elementos no DOM

---

## 📝 Páginas Já Corrigidas

- ✅ `/reports` - Relatórios Financeiros

## 📝 Páginas a Revisar

- [ ] `/dashboard`
- [ ] `/transactions`
- [ ] `/accounts`
- [ ] `/goals`
- [ ] `/investments`
- [ ] `/budget`
- [ ] `/credit-cards`
- [ ] `/trips`
- [ ] `/settings/*`
- [ ] Todas as subpáginas

---

## 🚀 Próximos Passos

1. Revisar todas as páginas do sistema
2. Remover títulos duplicados
3. Padronizar estrutura de layout
4. Documentar exceções (se houver)
5. Criar testes visuais

---

**Última atualização:** 26/10/2025  
**Versão:** 1.0.0  
**Status:** 🟢 Ativo

// Script para debugar o contexto unificado no navegador
// Execute este código no console do navegador

(() => {
  console.log('=== DEBUG DO CONTEXTO UNIFICADO ===');
  
  // Verificar se o React DevTools está disponível
  if (typeof window !== 'undefined' && window.React) {
    console.log('✅ React encontrado');
  } else {
    console.log('❌ React não encontrado');
  }
  
  // Procurar por elementos que usam o contexto
  const categoryCard = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent?.includes('Gastos por Categoria')
  );
  
  if (categoryCard) {
    console.log('✅ CategoryBudgetCard encontrado');
    console.log('Conteúdo do card:', categoryCard.textContent.substring(0, 300));
    
    // Verificar se há dados de categoria
    const hasOtros = categoryCard.textContent.includes('Outros');
    const hasAmount = categoryCard.textContent.includes('R$');
    const hasNenhumaCategoria = categoryCard.textContent.includes('Nenhuma categoria');
    
    console.log('Análise do conteúdo:');
    console.log('- Tem "Outros":', hasOtros);
    console.log('- Tem valor (R$):', hasAmount);
    console.log('- Mostra "Nenhuma categoria":', hasNenhumaCategoria);
    
    if (hasNenhumaCategoria) {
      console.log('🔍 PROBLEMA: Card mostra "Nenhuma categoria" mas API tem dados');
      console.log('Isso indica que o contexto não está passando os dados corretamente');
    }
  } else {
    console.log('❌ CategoryBudgetCard não encontrado');
  }
  
  // Tentar acessar dados do contexto via React Fiber
  try {
    const reactFiber = categoryCard?._reactInternalFiber || categoryCard?.__reactInternalInstance;
    if (reactFiber) {
      console.log('✅ React Fiber encontrado, tentando acessar contexto...');
    }
  } catch (error) {
    console.log('❌ Erro ao acessar React Fiber:', error.message);
  }
  
  return {
    cardFound: !!categoryCard,
    hasData: categoryCard?.textContent?.includes('Outros') || false,
    showsEmpty: categoryCard?.textContent?.includes('Nenhuma categoria') || false
  };
})();
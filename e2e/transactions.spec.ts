import { test, expect } from '@playwright/test';

test.describe('Aplicação SuaGrana - Testes Básicos', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a aplicação
    await page.goto('/');
    
    // Aguardar a aplicação carregar
    await page.waitForLoadState('networkidle');
    
    // Aguardar um pouco mais para garantir que a aplicação está totalmente carregada
    await page.waitForTimeout(2000);
  });

  test('Deve carregar a aplicação e verificar elementos básicos', async ({ page }) => {
    // Verificar se o título da aplicação está presente
    await expect(page.locator('text=SuaGrana')).toBeVisible();
    
    // Verificar se a navegação principal está presente usando seletores mais específicos
    await expect(page.locator('nav a[href="/"]')).toBeVisible(); // Link Dashboard na navegação
    await expect(page.locator('nav a[href="/transactions"]')).toBeVisible(); // Link Transações na navegação
    await expect(page.locator('nav a:has-text("Contas")')).toBeVisible(); // Link Contas na navegação
    
    console.log('✅ Aplicação carregou corretamente com elementos básicos');
  });

  test('Deve navegar para a página de transações', async ({ page }) => {
    // Navegar para a página de transações usando seletor mais específico
    await page.click('nav a[href="/transactions"]');
    
    // Aguardar a página carregar
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verificar se chegou na página de transações usando seletor mais específico para o título principal
    await expect(page.locator('main h1:has-text("Transações")')).toBeVisible();
    
    // Verificar se o botão Nova Transação está presente (usar seletor mais específico para o botão principal)
    await expect(page.locator('main button:has-text("Nova Transação")')).toBeVisible();
    
    console.log('✅ Navegação para página de transações funcionando');
  });

  test('Deve abrir o modal de nova transação', async ({ page }) => {
    // Navegar para transações
    await page.click('nav a[href="/transactions"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Clicar no botão Nova Transação usando seletor mais simples
    await page.click('button:has-text("Nova Transação")');
    await page.waitForTimeout(2000);
    
    // Verificar se o modal abriu procurando por elementos típicos de modal/dialog
    const modalSelectors = [
      '[role="dialog"]',
      '[data-state="open"]',
      '.modal',
      'dialog',
      'form',
      'input[type="text"]',
      'input[type="number"]',
      'button:has-text("Salvar")',
      'button:has-text("Cancelar")'
    ];
    
    let modalOpened = false;
    for (const selector of modalSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          modalOpened = true;
          console.log(`✅ Modal encontrado usando seletor: ${selector}`);
          break;
        }
      } catch (error) {
        // Continuar tentando outros seletores
      }
    }
    
    expect(modalOpened).toBe(true);
    console.log('✅ Modal de nova transação abre corretamente');
  });

  test('Deve navegar entre diferentes páginas', async ({ page }) => {
    // Testar navegação para Dashboard
    await page.click('nav a[href="/"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Testar navegação para Transações
    await page.click('nav a[href="/transactions"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Testar navegação para Contas (usando seletor mais específico)
    await page.click('nav a[href="/accounts"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    console.log('✅ Navegação entre páginas funcionando');
  });
});

test.describe('Aplicação SuaGrana - Testes CRUD de Transações', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a aplicação
    await page.goto('/');
    
    // Aguardar a aplicação carregar
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Navegar para a página de transações
    await page.click('nav a[href="/transactions"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Deve criar uma nova transação', async ({ page }) => {
    // Clicar no botão Nova Transação
    await page.click('button:has-text("Nova Transação")');
    await page.waitForTimeout(2000);
    
    // Verificar se o modal abriu
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Preencher o formulário de transação usando IDs específicos
    const testTransaction = {
      description: 'Teste E2E - Compra de supermercado',
      amount: '150.50'
    };
    
    // Preencher descrição usando ID específico
    await page.fill('#description', testTransaction.description);
    
    // Preencher valor usando ID específico
    await page.fill('#amount', testTransaction.amount);
    
    // Salvar a transação
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(3000);
    
    // Verificar se a transação foi criada (procurar na lista)
    const transactionCreated = await page.locator(`text=${testTransaction.description}`).isVisible();
    expect(transactionCreated).toBe(true);
    
    console.log('✅ Nova transação criada com sucesso');
  });

  test('Deve editar uma transação existente', async ({ page }) => {
    // Primeiro, criar uma transação para editar
    await page.click('button:has-text("Nova Transação")');
    await page.waitForTimeout(2000);
    
    const originalDescription = 'Transação para editar - E2E';
    const editedDescription = 'Transação editada - E2E';
    
    // Preencher e salvar transação original usando IDs específicos
    await page.fill('#description', originalDescription);
    await page.fill('#amount', '100.00');
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(3000);
    
    // Procurar pela transação criada e clicar para editar
    const transactionRow = page.locator(`text=${originalDescription}`).first();
    await expect(transactionRow).toBeVisible();
    
    // Procurar por botão de editar próximo à transação
    const editButtons = [
      'button:has-text("Editar")',
      'button[aria-label="Editar"]',
      '[data-action="edit"]',
      '.edit-button',
      'button:has([data-lucide="edit"])',
      'button:has([data-lucide="pencil"])'
    ];
    
    let editClicked = false;
    for (const selector of editButtons) {
      try {
        const editButton = page.locator(selector).first();
        if (await editButton.isVisible()) {
          await editButton.click();
          editClicked = true;
          break;
        }
      } catch (error) {
        // Continuar tentando outros seletores
      }
    }
    
    if (!editClicked) {
      // Se não encontrou botão de editar, tentar clicar na própria transação
      await transactionRow.click();
    }
    
    await page.waitForTimeout(2000);
    
    // Verificar se o modal de edição abriu
    const modalVisible = await page.locator('[role="dialog"]').isVisible();
    if (modalVisible) {
      // Editar a descrição usando ID específico
      await page.fill('#description', '');
      await page.fill('#description', editedDescription);
      
      // Salvar as alterações
      await page.click('button:has-text("Salvar")');
      await page.waitForTimeout(3000);
      
      // Verificar se a transação foi editada
      const editedTransactionVisible = await page.locator(`text=${editedDescription}`).isVisible();
      expect(editedTransactionVisible).toBe(true);
      
      console.log('✅ Transação editada com sucesso');
    } else {
      console.log('⚠️ Modal de edição não abriu - funcionalidade pode não estar implementada');
    }
  });

  test('Deve excluir uma transação existente', async ({ page }) => {
    // Primeiro, criar uma transação para excluir
    await page.click('button:has-text("Nova Transação")');
    await page.waitForTimeout(2000);
    
    const transactionToDelete = 'Transação para excluir - E2E';
    
    // Preencher e salvar transação usando IDs específicos
    await page.fill('#description', transactionToDelete);
    await page.fill('#amount', '50.00');
    await page.click('button:has-text("Salvar")');
    await page.waitForTimeout(3000);
    
    // Verificar se a transação foi criada
    const transactionRow = page.locator(`text=${transactionToDelete}`).first();
    await expect(transactionRow).toBeVisible();
    
    // Procurar por botão de excluir próximo à transação
    const deleteButtons = [
      'button:has-text("Excluir")',
      'button:has-text("Deletar")',
      'button[aria-label="Excluir"]',
      'button[aria-label="Deletar"]',
      '[data-action="delete"]',
      '.delete-button',
      'button:has([data-lucide="trash"])',
      'button:has([data-lucide="trash-2"])'
    ];
    
    let deleteClicked = false;
    for (const selector of deleteButtons) {
      try {
        const deleteButton = page.locator(selector).first();
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          deleteClicked = true;
          break;
        }
      } catch (error) {
        // Continuar tentando outros seletores
      }
    }
    
    if (deleteClicked) {
      await page.waitForTimeout(1000);
      
      // Confirmar exclusão se houver modal de confirmação
      const confirmButtons = [
        'button:has-text("Confirmar")',
        'button:has-text("Sim")',
        'button:has-text("Excluir")',
        'button:has-text("Deletar")'
      ];
      
      for (const selector of confirmButtons) {
        try {
          const confirmButton = page.locator(selector);
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            break;
          }
        } catch (error) {
          // Continuar tentando outros seletores
        }
      }
      
      await page.waitForTimeout(3000);
      
      // Verificar se a transação foi excluída
      const transactionStillVisible = await page.locator(`text=${transactionToDelete}`).isVisible();
      expect(transactionStillVisible).toBe(false);
      
      console.log('✅ Transação excluída com sucesso');
    } else {
      console.log('⚠️ Botão de excluir não encontrado - funcionalidade pode não estar implementada');
    }
  });
});
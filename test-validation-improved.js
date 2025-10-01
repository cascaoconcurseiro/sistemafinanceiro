const puppeteer = require('puppeteer');

async function testTransferValidation() {
  console.log('🚀 Starting improved transfer validation tests...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to transactions page
    console.log('📍 Navigating to transactions page...');
    await page.goto('http://localhost:3001/transactions', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Look for transfer button with multiple strategies
    console.log('🔍 Looking for transfer button...');
    
    const transferButton = await page.evaluate(() => {
      // Strategy 1: Look for button with "Transferência" text
      const buttons = Array.from(document.querySelectorAll('button'));
      let found = buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('transferência') ||
        btn.textContent?.toLowerCase().includes('transfer')
      );
      
      if (found) return 'text-based';
      
      // Strategy 2: Look for buttons with transfer-related classes or data attributes
      found = document.querySelector('[data-testid*="transfer"], .transfer-btn, button[class*="transfer"]');
      if (found) return 'attribute-based';
      
      // Strategy 3: Look for any button that might trigger a modal
      const modalTriggers = buttons.filter(btn => 
        btn.getAttribute('data-bs-toggle') === 'modal' ||
        btn.onclick?.toString().includes('modal') ||
        btn.onclick?.toString().includes('transfer')
      );
      
      if (modalTriggers.length > 0) return 'modal-trigger';
      
      return null;
    });
    
    if (!transferButton) {
      console.log('❌ Transfer button not found. Available buttons:');
      const availableButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(btn => ({
          text: btn.textContent?.trim(),
          className: btn.className,
          id: btn.id
        }));
      });
      console.log(availableButtons);
      return;
    }
    
    console.log(`✅ Transfer button found using ${transferButton} strategy`);
    
    // Click the transfer button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const transferBtn = buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('transferência') ||
        btn.textContent?.toLowerCase().includes('transfer')
      );
      if (transferBtn) transferBtn.click();
    });
    
    // Wait for modal to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if modal opened
    const modalVisible = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"], .modal, [data-testid*="modal"]');
      return modal && modal.offsetParent !== null;
    });
    
    if (!modalVisible) {
      console.log('❌ Transfer modal did not open');
      return;
    }
    
    console.log('✅ Transfer modal opened successfully');
    
    // Test 1: Submit empty form (should show validation errors)
    console.log('\n📝 Test 1: Empty form validation');
    
    const submitButton = await page.$('button[type="submit"], button:contains("Realizar"), button:contains("Transferir")');
    if (submitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for validation messages
      const validationMessages = await page.evaluate(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast], .toast, [role="alert"]');
        return Array.from(toasts).map(toast => toast.textContent?.trim()).filter(Boolean);
      });
      
      console.log('Validation messages:', validationMessages);
      
      if (validationMessages.some(msg => msg.includes('obrigatórios'))) {
        console.log('✅ Empty form validation working');
      } else {
        console.log('❌ Empty form validation not working as expected');
      }
    }
    
    // Test 2: Test minimum value validation
    console.log('\n📝 Test 2: Minimum value validation');
    
    // Fill amount with 0
    const amountInput = await page.$('input[type="number"], input[id*="amount"]');
    if (amountInput) {
      await amountInput.clear();
      await amountInput.type('0');
      
      if (submitButton) {
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const validationMessages = await page.evaluate(() => {
          const toasts = document.querySelectorAll('[data-sonner-toast], .toast, [role="alert"]');
          return Array.from(toasts).map(toast => toast.textContent?.trim()).filter(Boolean);
        });
        
        console.log('Minimum value validation messages:', validationMessages);
        
        if (validationMessages.some(msg => msg.includes('maior que zero') || msg.includes('mínimo'))) {
          console.log('✅ Minimum value validation working');
        } else {
          console.log('❌ Minimum value validation not working as expected');
        }
      }
    }
    
    // Test 3: Check required field indicators
    console.log('\n📝 Test 3: Required field indicators');
    
    const requiredFields = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      return labels.filter(label => label.textContent?.includes('*')).map(label => label.textContent?.trim());
    });
    
    console.log('Required field labels:', requiredFields);
    
    if (requiredFields.length >= 4) { // Should have at least 4 required fields
      console.log('✅ Required field indicators present');
    } else {
      console.log('❌ Missing required field indicators');
    }
    
    // Test 4: Check HTML5 validation attributes
    console.log('\n📝 Test 4: HTML5 validation attributes');
    
    const validationAttributes = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return inputs.map(input => ({
        type: input.type || input.tagName,
        required: input.required,
        min: input.min,
        step: input.step,
        id: input.id
      })).filter(attr => attr.required || attr.min);
    });
    
    console.log('Validation attributes:', validationAttributes);
    
    if (validationAttributes.length > 0) {
      console.log('✅ HTML5 validation attributes present');
    } else {
      console.log('❌ Missing HTML5 validation attributes');
    }
    
    console.log('\n🎉 Transfer validation tests completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
}

testTransferValidation().catch(console.error);
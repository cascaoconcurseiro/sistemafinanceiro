const puppeteer = require('puppeteer');

async function testTransferValidationFinal() {
  console.log('🚀 Starting final transfer validation tests...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to transactions page
    console.log('📍 Navigating to transactions page...');
    await page.goto('http://localhost:3001/transactions', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Look for the transfer button using the exact selector from the code
    console.log('🔍 Looking for transfer button...');
    
    // Try to find and click the transfer button
    const transferButtonClicked = await page.evaluate(() => {
      // Look for button with "Transferência" text and Split icon
      const buttons = Array.from(document.querySelectorAll('button'));
      const transferButton = buttons.find(btn => 
        btn.textContent && btn.textContent.includes('Transferência')
      );
      
      if (transferButton) {
        transferButton.click();
        return true;
      }
      return false;
    });
    
    if (!transferButtonClicked) {
      console.log('❌ Transfer button not found or not clickable');
      
      // Debug: Show what buttons are available
      const availableButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(btn => ({
          text: btn.textContent?.trim(),
          className: btn.className,
          visible: btn.offsetParent !== null
        }));
      });
      console.log('Available buttons:', availableButtons);
      return;
    }
    
    console.log('✅ Transfer button clicked successfully');
    
    // Wait for modal to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if modal is visible
    const modalVisible = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      return modal && modal.offsetParent !== null;
    });
    
    if (!modalVisible) {
      console.log('❌ Transfer modal did not appear');
      return;
    }
    
    console.log('✅ Transfer modal opened successfully');
    
    // Test 1: Check required field indicators (asterisks)
    console.log('\n📝 Test 1: Required field indicators');
    
    const requiredFields = await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      return labels
        .filter(label => label.textContent?.includes('*'))
        .map(label => label.textContent?.trim());
    });
    
    console.log('Required field labels:', requiredFields);
    
    const expectedRequiredFields = ['Conta de Origem *', 'Conta de Destino *', 'Valor da Transferência *', 'Descrição *'];
    const hasAllRequiredFields = expectedRequiredFields.every(field => 
      requiredFields.some(label => label === field)
    );
    
    if (hasAllRequiredFields) {
      console.log('✅ All required field indicators present');
    } else {
      console.log('❌ Missing some required field indicators');
      console.log('Expected:', expectedRequiredFields);
      console.log('Found:', requiredFields);
    }
    
    // Test 2: Check HTML5 validation attributes
    console.log('\n📝 Test 2: HTML5 validation attributes');
    
    const validationAttributes = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      return inputs.map(input => ({
        type: input.type || input.tagName.toLowerCase(),
        required: input.required,
        min: input.min,
        step: input.step,
        id: input.id || input.name,
        placeholder: input.placeholder
      })).filter(attr => attr.required || attr.min);
    });
    
    console.log('Validation attributes:', validationAttributes);
    
    // Check for amount field with min="0.01"
    const amountField = validationAttributes.find(attr => 
      attr.type === 'number' && attr.min === '0.01'
    );
    
    if (amountField) {
      console.log('✅ Amount field has correct minimum value (0.01)');
    } else {
      console.log('❌ Amount field missing minimum value validation');
    }
    
    // Test 3: Test empty form submission
    console.log('\n📝 Test 3: Empty form validation');
    
    // Try to submit empty form
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for validation toast messages
      const toastMessages = await page.evaluate(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        return Array.from(toasts).map(toast => toast.textContent?.trim()).filter(Boolean);
      });
      
      console.log('Toast messages after empty submission:', toastMessages);
      
      if (toastMessages.some(msg => msg.includes('obrigatórios'))) {
        console.log('✅ Empty form validation working correctly');
      } else {
        console.log('❌ Empty form validation not working as expected');
      }
    }
    
    // Test 4: Test minimum value validation
    console.log('\n📝 Test 4: Minimum value validation');
    
    // Fill amount with 0
    const amountInput = await page.$('input[type="number"]');
    if (amountInput) {
      await amountInput.click({ clickCount: 3 }); // Select all
      await amountInput.type('0');
      
      if (submitButton) {
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const toastMessages = await page.evaluate(() => {
          const toasts = document.querySelectorAll('[data-sonner-toast]');
          return Array.from(toasts).map(toast => toast.textContent?.trim()).filter(Boolean);
        });
        
        console.log('Toast messages after zero amount:', toastMessages);
        
        if (toastMessages.some(msg => 
          msg.includes('maior que zero') || msg.includes('mínimo')
        )) {
          console.log('✅ Minimum value validation working correctly');
        } else {
          console.log('❌ Minimum value validation not working as expected');
        }
      }
    }
    
    // Test 5: Test very small value (less than 0.01)
    console.log('\n📝 Test 5: Very small value validation');
    
    if (amountInput) {
      await amountInput.click({ clickCount: 3 }); // Select all
      await amountInput.type('0.001');
      
      if (submitButton) {
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const toastMessages = await page.evaluate(() => {
          const toasts = document.querySelectorAll('[data-sonner-toast]');
          return Array.from(toasts).map(toast => toast.textContent?.trim()).filter(Boolean);
        });
        
        console.log('Toast messages after 0.001 amount:', toastMessages);
        
        if (toastMessages.some(msg => msg.includes('R$ 0,01'))) {
          console.log('✅ Minimum value (0.01) validation working correctly');
        } else {
          console.log('❌ Minimum value (0.01) validation not working as expected');
        }
      }
    }
    
    console.log('\n🎉 Transfer validation tests completed!');
    console.log('\n📊 Summary:');
    console.log('- Required field indicators: ' + (hasAllRequiredFields ? '✅' : '❌'));
    console.log('- HTML5 validation attributes: ' + (amountField ? '✅' : '❌'));
    console.log('- Empty form validation: Check console output above');
    console.log('- Minimum value validation: Check console output above');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser kept open for manual inspection. Close manually when done.');
    // await browser.close();
  }
}

testTransferValidationFinal().catch(console.error);
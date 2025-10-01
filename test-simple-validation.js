const puppeteer = require('puppeteer');

async function testTransferValidationSimple() {
  console.log('🚀 Starting simple transfer validation test...');
  
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
    console.log('⏳ Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'transactions-page.png', fullPage: true });
    console.log('📸 Screenshot saved as transactions-page.png');
    
    // Look for the transfer button
    console.log('🔍 Looking for transfer button...');
    
    // Try to find button with Transferência text
    const transferButtonFound = await page.evaluate(() => {
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
    
    if (!transferButtonFound) {
      // Try alternative selectors
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(btn => ({
          text: btn.textContent?.trim(),
          visible: btn.offsetParent !== null,
          className: btn.className
        }))
      );
      
      console.log('Available buttons:', buttons);
      console.log('❌ Transfer button not found');
      return;
    }
    
    console.log('✅ Transfer button found and clicked');
    
    // Wait for modal to appear
    console.log('⏳ Waiting for modal to appear...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of modal
    await page.screenshot({ path: 'transfer-modal.png', fullPage: true });
    console.log('📸 Modal screenshot saved as transfer-modal.png');
    
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
    
    console.log('Required field labels found:', requiredFields);
    
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
        id: input.id || input.name || input.placeholder,
        tagName: input.tagName
      })).filter(attr => attr.required || attr.min);
    });
    
    console.log('Validation attributes found:', validationAttributes);
    
    // Check for amount field with min="0.01"
    const amountField = validationAttributes.find(attr => 
      attr.type === 'number' && attr.min === '0.01'
    );
    
    if (amountField) {
      console.log('✅ Amount field has correct minimum value (0.01)');
    } else {
      console.log('❌ Amount field missing minimum value validation');
    }
    
    // Test 3: Test form submission with empty fields
    console.log('\n📝 Test 3: Empty form validation');
    
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for validation messages
      const toastMessages = await page.evaluate(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        return Array.from(toasts).map(toast => toast.textContent?.trim()).filter(Boolean);
      });
      
      console.log('Toast messages after empty submission:', toastMessages);
      
      if (toastMessages.length > 0) {
        console.log('✅ Form validation messages displayed');
      } else {
        console.log('❌ No validation messages found');
      }
    } else {
      console.log('❌ Submit button not found');
    }
    
    console.log('\n🎉 Simple validation test completed!');
    console.log('\n📊 Summary:');
    console.log('- Required field indicators: ' + (hasAllRequiredFields ? '✅' : '❌'));
    console.log('- HTML5 validation attributes: ' + (amountField ? '✅' : '❌'));
    console.log('- Form validation: Check console output above');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    console.log('\n🔍 Browser kept open for manual inspection. Close manually when done.');
    // Keep browser open for inspection
    // await browser.close();
  }
}

testTransferValidationSimple().catch(console.error);
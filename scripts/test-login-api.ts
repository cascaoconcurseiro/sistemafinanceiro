async function testLogin() {
  console.log('🔐 Testando API de login...\n');

  const email = 'admin@suagrana.com';
  const password = 'admin123';

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('📡 Status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📦 Resposta:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ LOGIN BEM-SUCEDIDO!');
    } else {
      console.log('\n❌ LOGIN FALHOU!');
      console.log('Erro:', data.error);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

testLogin();

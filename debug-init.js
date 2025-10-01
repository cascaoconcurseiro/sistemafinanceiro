// Script para debug da inicialização
console.log('=== DEBUG INICIALIZAÇÃO ===');

// Verificar localStorage
const accounts = localStorage.getItem('sua-grana-accounts');
const transactions = localStorage.getItem('sua-grana-transactions');
const initialized = localStorage.getItem('sua-grana-initialized');

console.log('Initialized flag:', initialized);
console.log('Accounts in localStorage:', accounts ? JSON.parse(accounts).length : 0);
console.log('Transactions in localStorage:', transactions ? JSON.parse(transactions).length : 0);

if (accounts) {
  console.log('Accounts data:', JSON.parse(accounts));
}

// Verificar se há problemas com o contexto
console.log('Window React:', typeof window.React);
console.log('Document ready state:', document.readyState);
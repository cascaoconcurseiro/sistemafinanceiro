'use client';

export default function TestPage() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white', 
      color: 'black',
      minHeight: '100vh'
    }}>
      <h1>Página de Teste</h1>
      <p>Se você está vendo esta página, o Next.js está funcionando corretamente.</p>
      <div style={{ 
        backgroundColor: 'lightblue', 
        padding: '10px', 
        margin: '10px 0' 
      }}>
        <p>Este é um teste simples sem contextos ou componentes complexos.</p>
      </div>
    </div>
  );
}

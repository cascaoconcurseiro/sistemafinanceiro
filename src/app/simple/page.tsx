'use client';

import { useState } from 'react';

export default function SimplePage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f5f5f5', 
      color: '#333',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#2563eb' }}>SuaGrana - Dashboard Simplificado</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginTop: '20px'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>Saldo Total</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
            R$ 5.250,00
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>Receitas do Mês</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
            R$ 3.500,00
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>Despesas do Mês</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
            R$ 2.100,00
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>Contador de Teste</h3>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>
            Valor: {count}
          </p>
          <button 
            onClick={() => setCount(count + 1)}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Incrementar
          </button>
        </div>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <h3>Status do Sistema</h3>
        <p>✅ Next.js funcionando corretamente</p>
        <p>✅ React hooks funcionando</p>
        <p>✅ Renderização de componentes OK</p>
        <p>⚠️ Problema identificado nos contextos complexos</p>
      </div>
    </div>
  );
}

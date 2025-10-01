'use client';

import { useEffect } from 'react';

export function TestUseEffect() {
  console.log('🧪 TEST COMPONENT - Renderizado');

  useEffect(() => {
    console.log('🧪 TEST COMPONENT - useEffect executado!');
  }, []);

  useEffect(() => {
    console.log('🧪 TEST COMPONENT - useEffect com dependência vazia executado!');
    
    const timer = setTimeout(() => {
      console.log('🧪 TEST COMPONENT - Timer executado após 1 segundo');
    }, 1000);

    return () => {
      console.log('🧪 TEST COMPONENT - Cleanup do useEffect');
      clearTimeout(timer);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, background: 'red', color: 'white', padding: '10px', zIndex: 9999 }}>
      TEST COMPONENT
    </div>
  );
}

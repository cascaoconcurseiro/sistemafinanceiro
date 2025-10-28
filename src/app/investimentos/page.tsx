'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirect: /investimentos -> /investments
 * Mantém compatibilidade com URLs antigas em português
 */
export default function InvestimentosRedirect() {
  useEffect(() => {
    redirect('/investments');
  }, []);

  // Fallback caso o redirect não funcione imediatamente
  redirect('/investments');
  return null;
}

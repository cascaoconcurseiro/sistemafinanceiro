'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@suagrana.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verificar se foi redirecionado por sessão expirada
    if (searchParams.get('error') === 'session_expired') {
      setSessionExpired(true);
      setError('Sua sessão expirou. Por favor, faça login novamente.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Usar nossa API customizada de login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Importante para cookies
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Email ou senha incorretos');
        setLoading(false);
        return;
      }

      if (data.success && data.data?.user) {
        console.log('✅ Login bem-sucedido:', data.data.user);
        
        // Redirecionar baseado no role
        if (data.data.user.role === 'ADMIN') {
          console.log('🔐 Redirecionando ADMIN para /admin');
          window.location.href = '/admin';
        } else {
          console.log('👤 Redirecionando USER para /dashboard');
          window.location.href = '/dashboard';
        }
      } else {
        setError('Erro ao processar login');
        setLoading(false);
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro de conexão');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            SuaGrana
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema Financeiro
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p><strong>Credenciais padrão:</strong></p>
            <p>admin@suagrana.com / admin123</p>
            <div className="mt-4">
              <a
                href="/auth/register"
                className="text-indigo-600 hover:text-indigo-500"
              >
                Não tem conta? Cadastre-se
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

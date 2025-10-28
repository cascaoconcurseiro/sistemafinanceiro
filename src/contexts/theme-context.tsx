'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // Carregar tema do banco de dados
    const loadTheme = async () => {
      try {
        const response = await fetch('/api/theme-settings');
        const result = await response.json();
        
        if (result.success && result.data) {
          setTheme(result.data.theme || 'system');
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
        // Usar valores padrão em caso de erro
      }
    };

    if (typeof window !== 'undefined') {
      loadTheme();
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: async (newTheme: Theme) => {
      try {
        const response = await fetch('/api/theme-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ theme: newTheme }),
        });
        
        if (response.ok) {
          setTheme(newTheme);
        } else {
          throw new Error('Falha ao salvar tema');
        }
      } catch (error) {
        console.error('Erro ao salvar tema no banco de dados:', error);
        // Ainda assim atualiza o tema localmente
        setTheme(newTheme);
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

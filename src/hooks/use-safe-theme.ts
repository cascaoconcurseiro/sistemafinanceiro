'use client';

import { useState, useEffect } from 'react';

export interface ThemeSettings {
  theme: 'light' | 'dark' | 'system';
  colorfulIcons: boolean;
  compactMode: boolean;
  animations: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

const defaultSettings: ThemeSettings = {
  theme: 'system',
  colorfulIcons: true,
  compactMode: false,
  animations: true,
  highContrast: false,
  fontSize: 'medium'
};

export const useSafeTheme = () => {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load theme settings from database
    const loadThemeSettings = async () => {
      try {
        const response = await fetch('/api/user/appearance', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        } else if (response.status === 401) {
          // Não autenticado - usar configurações padrão silenciosamente
          setSettings(defaultSettings);
        } else {
          setSettings(defaultSettings);
        }
      } catch (error) {
        // Erro de rede ou outro - usar configurações padrão silenciosamente
        setSettings(defaultSettings);
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemeSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<ThemeSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      await fetch('/api/user/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedSettings),
      });
    } catch (error) {
      console.error('Error saving theme settings:', error);
    }
  };

  const resetSettings = async () => {
    setSettings(defaultSettings);

    try {
      await fetch('/api/user/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(defaultSettings),
      });
    } catch (error) {
      console.error('Error resetting theme settings:', error);
    }
  };

  // Aplicar tema ao documento
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;

    try {
      const root = document.documentElement;

      // Aplicar tema de forma segura
      if (settings.theme === 'system') {
        try {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const prefersDark = mediaQuery.matches;
          root.classList.toggle('dark', prefersDark);
        } catch (error) {
          // Fallback para light theme se houver erro
          root.classList.remove('dark');
        }
      } else {
        root.classList.toggle('dark', settings.theme === 'dark');
      }

      // Aplicar outras configurações
      root.classList.toggle('high-contrast', settings.highContrast);
      root.classList.toggle('compact-mode', settings.compactMode);
      root.classList.toggle('no-animations', !settings.animations);

      // Aplicar tamanho da fonte
      const fontSizeMap = {
        'small': '14px',
        'medium': '16px',
        'large': '18px'
      };
      root.style.fontSize = fontSizeMap[settings.fontSize] || '16px';
    } catch (error) {
      console.error('Error applying theme settings:', error);
    }
  }, [settings, isLoaded]);

  const toggleTheme = () => {
    const currentTheme = settings.theme;
    let newTheme: 'light' | 'dark' | 'system';

    if (currentTheme === 'light') {
      newTheme = 'dark';
    } else if (currentTheme === 'dark') {
      newTheme = 'system';
    } else {
      newTheme = 'light';
    }

    updateSettings({ theme: newTheme });
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    toggleTheme,
    isLoaded
  };
};

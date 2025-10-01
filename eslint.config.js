/**
 * 🔒 CONFIGURAÇÃO ESLINT - Proteção Arquitetural Finance-Engine
 * 
 * Esta configuração integra a regra customizada que bloqueia cálculos financeiros
 * fora do core/finance-engine, garantindo que o build falhe em caso de violações.
 */

import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import next from '@next/eslint-plugin-next';

// Importar nossa regra customizada
import noFinancialCalculations from './eslint-rules/no-financial-calculations.js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      '@next/next': next,
      // 🔒 REGRA CUSTOMIZADA CRÍTICA
      'finance-engine': {
        rules: {
          'no-financial-calculations': noFinancialCalculations,
        },
      },
    },
    rules: {
      // Regras padrão do TypeScript
      ...typescript.configs.recommended.rules,
      
      // Regras do React
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      
      // Regras do Next.js
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
      
      // 🚨 REGRA CRÍTICA - BLOQUEIA CÁLCULOS FINANCEIROS FORA DO ENGINE
      'finance-engine/no-financial-calculations': 'error',
      
      // Configurações específicas
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Regras de segurança financeira adicionais
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Configuração específica para o finance-engine (permite tudo)
    files: ['**/core/finance-engine/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'finance-engine/no-financial-calculations': 'off',
    },
  },
  {
    // Ignorar arquivos de configuração e build
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      '*.config.js',
      '*.config.ts',
      'eslint-rules/**',
    ],
  },
];
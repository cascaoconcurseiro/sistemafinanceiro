/**
 * Jest Configuration - SuaGrana System
 * 
 * Configuração especial para suportar testes de rastreabilidade do finance-engine
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Configuração para testes de rastreabilidade
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/tests/**/*.(js|jsx|ts|tsx)'
  ],
  
  // Módulos que devem ser transformados
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/core/finance-engine$': '<rootDir>/src/core/finance-engine/index.ts',
  },
  
  // Ignorar node_modules exceto alguns pacotes específicos
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@next|next))',
  ],
  
  // Configuração para cobertura
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/core/finance-engine/**', // Finance engine é testado separadamente
  ],
  
  // Configuração específica para testes de finance-engine
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Timeout aumentado para testes de rastreabilidade
  testTimeout: 10000,
  
  // Configuração para verbose output nos testes críticos
  verbose: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
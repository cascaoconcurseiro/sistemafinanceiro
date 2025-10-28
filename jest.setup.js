/**
 * Jest Setup - SuaGrana System
 * 
 * Configuração inicial para todos os testes, incluindo testes de rastreabilidade
 */

import '@testing-library/jest-dom';

// Mock global para Next.js Web APIs
global.Headers = global.Headers || class Headers {
  constructor(init) {
    this.headers = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }
  }
  
  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }
  
  get(name) {
    return this.headers.get(name.toLowerCase());
  }
  
  has(name) {
    return this.headers.has(name.toLowerCase());
  }
  
  delete(name) {
    this.headers.delete(name.toLowerCase());
  }
  
  entries() {
    return this.headers.entries();
  }
};

global.Response = global.Response || class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }
  
  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  }
  
  async json() {
    return JSON.parse(this.body);
  }
  
  async text() {
    return this.body;
  }
};

global.Request = global.Request || class Request {
  constructor(input, init = {}) {
    this.url = input;
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers);
    this.body = init.body;
  }
};

// Mock do Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock do Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Configuração global para testes de rastreabilidade
// Mock para console (reduzir ruído nos testes)
global.console = {
  ...console,
  // Silenciar logs desnecessários nos testes
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Manter erros visíveis
};

// NOTA: localStorage foi removido do sistema - não é mais necessário mock
// O sistema agora usa banco de dados para persistência

// Mock para sessionStorage (ainda usado para dados temporários)
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Configuração para testes de finance-engine
beforeEach(() => {
  // Limpar mocks antes de cada teste
  jest.clearAllMocks();
  
  // Reset sessionStorage (localStorage removido do sistema)
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});

// Configuração para timeouts de testes críticos
jest.setTimeout(10000);
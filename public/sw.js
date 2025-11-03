/**
 * Service Worker para PWA com Cache Inteligente
 * Implementa cache offline, notificações e cache de API
 */

const CACHE_NAME = 'suagrana-v2';
const API_CACHE_NAME = 'suagrana-api-v1';
const OFFLINE_URL = '/offline';

const STATIC_CACHE = [
  '/',
  '/dashboard',
  '/transactions',
  '/offline',
  '/manifest.json',
];

// Configurações de cache por tipo de API
const API_CACHE_CONFIG = {
  '/api/accounts': { ttl: 30 * 60 * 1000 }, // 30 minutos
  '/api/categories': { ttl: 60 * 60 * 1000 }, // 1 hora
  '/api/credit-cards': { ttl: 30 * 60 * 1000 }, // 30 minutos
  '/api/transactions': { ttl: 5 * 60 * 1000 }, // 5 minutos
  '/api/unified-financial': { ttl: 2 * 60 * 1000 }, // 2 minutos
  '/api/budgets': { ttl: 10 * 60 * 1000 }, // 10 minutos
  '/api/goals': { ttl: 10 * 60 * 1000 }, // 10 minutos
  '/api/notifications': { ttl: 1 * 60 * 1000 }, // 1 minuto
};

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto');
      return cache.addAll(STATIC_CACHE);
    })
  );
  
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Apenas para requisições GET
  if (event.request.method !== 'GET') return;
  
  // Tratar requisições de API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Tratar requisições estáticas
  event.respondWith(handleStaticRequest(event.request));
});

// Manipular requisições de API com cache inteligente
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Verificar se deve usar cache para esta API
    const cacheConfig = getCacheConfigForPath(pathname);
    
    if (cacheConfig) {
      // Tentar buscar do cache primeiro
      const cache = await caches.open(API_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        const cacheTime = new Date(cachedResponse.headers.get('sw-cache-time'));
        const now = new Date();
        
        // Verificar se ainda está válido
        if (now - cacheTime < cacheConfig.ttl) {
          console.log('[SW] API Cache Hit:', pathname);
          
          // Atualizar em background se próximo do vencimento
          if (now - cacheTime > cacheConfig.ttl * 0.8) {
            updateApiCacheInBackground(request);
          }
          
          return cachedResponse;
        }
      }
    }
    
    // Buscar da rede
    console.log('[SW] API Network Request:', pathname);
    const response = await fetch(request);
    
    if (response.ok && cacheConfig) {
      // Adicionar timestamp ao cache
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', new Date().toISOString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      // Armazenar no cache
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, cachedResponse);
      
      console.log('[SW] API Cached:', pathname);
    }
    
    return response;
    
  } catch (error) {
    console.error('[SW] API Request Failed:', pathname, error);
    
    // Tentar retornar do cache mesmo se expirado
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Returning stale cache for:', pathname);
      return cachedResponse;
    }
    
    // Retornar erro se não há cache
    return new Response(JSON.stringify({ 
      error: 'Offline - dados não disponíveis',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Manipular requisições estáticas
async function handleStaticRequest(request) {
  try {
    const response = await caches.match(request);
    
    if (response) {
      return response;
    }
    
    // Buscar da rede
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // Clonar e cachear
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Static request failed:', error);
    
    // Retornar página offline
    return caches.match(OFFLINE_URL);
  }
}

// Obter configuração de cache para um path
function getCacheConfigForPath(pathname) {
  // Verificar correspondências exatas
  if (API_CACHE_CONFIG[pathname]) {
    return API_CACHE_CONFIG[pathname];
  }
  
  // Verificar padrões (ex: /api/accounts/123)
  for (const [pattern, config] of Object.entries(API_CACHE_CONFIG)) {
    if (pathname.startsWith(pattern + '/') || pathname === pattern) {
      return config;
    }
  }
  
  return null;
}

// Atualizar cache em background
async function updateApiCacheInBackground(request) {
  try {
    console.log('[SW] Background update for:', request.url);
    
    const response = await fetch(request);
    
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('sw-cache-time', new Date().toISOString());
      
      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, cachedResponse);
      
      console.log('[SW] Background update completed for:', request.url);
    }
  } catch (error) {
    console.error('[SW] Background update failed:', error);
  }
}

// Notificações Push
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'SuaGrana', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

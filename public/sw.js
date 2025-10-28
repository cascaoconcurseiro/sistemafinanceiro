/**
 * Service Worker para PWA
 * Implementa cache offline e notificações
 */

const CACHE_NAME = 'suagrana-v1';
const OFFLINE_URL = '/offline';

const STATIC_CACHE = [
  '/',
  '/dashboard',
  '/transactions',
  '/offline',
  '/manifest.json',
];

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
  // Apenas para requisições GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições de API
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retornar do cache se existir
      if (response) {
        return response;
      }
      
      // Buscar da rede
      return fetch(event.request)
        .then((response) => {
          // Não cachear respostas inválidas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clonar resposta
          const responseToCache = response.clone();
          
          // Adicionar ao cache
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // Retornar página offline se falhar
          return caches.match(OFFLINE_URL);
        });
    })
  );
});

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

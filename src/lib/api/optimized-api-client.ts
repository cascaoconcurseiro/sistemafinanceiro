interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  cache?: boolean;
  cacheDuration?: number;
  retries?: number;
  timeout?: number;
}

class OptimizedApiClient {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  private requestQueue = new Map<string, NodeJS.Timeout>();

  private readonly DEFAULT_CACHE_DURATION = 30000; // 30 seconds
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private readonly DEFAULT_RETRIES = 3;

  // Debounced request to prevent spam
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      cache = method === 'GET',
      cacheDuration = this.DEFAULT_CACHE_DURATION,
      retries = this.DEFAULT_RETRIES,
      timeout = this.DEFAULT_TIMEOUT
    } = config;

    const cacheKey = this.getCacheKey(endpoint, method, body);

    // Check cache first for GET requests
    if (cache && method === 'GET') {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
                return cached;
      }
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
    }

    // Debounce rapid requests
    if (this.requestQueue.has(cacheKey)) {
      clearTimeout(this.requestQueue.get(cacheKey));
    }

    const requestPromise = new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        this.requestQueue.delete(cacheKey);

        try {
          const result = await this.executeRequest<T>(endpoint, {
            method,
            body,
            headers,
            retries,
            timeout
          });

          // Cache successful GET requests
          if (cache && method === 'GET') {
            this.setCache(cacheKey, result, cacheDuration);
          }

          this.pendingRequests.delete(cacheKey);
          resolve(result);
        } catch (error) {
          this.pendingRequests.delete(cacheKey);
          reject(error);
        }
      }, method === 'GET' ? 50 : 0); // Debounce GET requests by 50ms

      this.requestQueue.set(cacheKey, timeoutId);
    });

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  private async executeRequest<T>(
    endpoint: string,
    config: {
      method: string;
      body?: any;
      headers: Record<string, string>;
      retries: number;
      timeout: number;
    }
  ): Promise<T> {
    const { method, body, headers, retries, timeout } = config;

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`📡 [OptimizedApiClient] ${method} ${endpoint} (attempt ${attempt + 1})`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const startTime = performance.now();

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`✅ [OptimizedApiClient] ${method} ${endpoint} completed in ${Math.round(duration)}ms`);

        // Track performance
        if (typeof window !== 'undefined' && (window as any).performanceMonitor) {
          (window as any).performanceMonitor.trackApiCall(endpoint, duration);
        }

        if (!response.ok) {
          if (response.status === 401) {
            // Don't retry auth errors
            throw new Error('Unauthorized');
          }

          if (response.status >= 500 && attempt < retries) {
            // Retry server errors with exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`⏳ [OptimizedApiClient] Retrying ${endpoint} in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error as Error;

        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }

        if (attempt === retries) {
          console.error(`❌ [OptimizedApiClient] ${method} ${endpoint} failed after ${retries + 1} attempts:`, error);
          throw lastError;
        }

        // Exponential backoff for retries
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ [OptimizedApiClient] Retrying ${endpoint} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  private getCacheKey(endpoint: string, method: string, body?: any): string {
    const bodyHash = body ? JSON.stringify(body) : '';
    return `${method}:${endpoint}:${bodyHash}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T, duration: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    };

    this.cache.set(key, entry);

    // Cleanup old entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🧹 [OptimizedApiClient] Cleaned up ${keysToDelete.length} expired cache entries`);
  }

  // Invalidate cache for specific patterns
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      console.log('🗑️ [OptimizedApiClient] Cache cleared');
      return;
    }

    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ [OptimizedApiClient] Invalidated ${keysToDelete.length} cache entries matching "${pattern}"`);
  }

  // Preload data
  async preload(endpoints: string[]): Promise<void> {
    
    const promises = endpoints.map(endpoint =>
      this.request(endpoint, { cache: true }).catch(error => {
        console.warn(`⚠️ [OptimizedApiClient] Preload failed for ${endpoint}:`, error);
      })
    );

    await Promise.allSettled(promises);
      }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    this.cache.forEach(entry => {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      pendingRequests: this.pendingRequests.size,
      queuedRequests: this.requestQueue.size
    };
  }
}

// Singleton instance
export const apiClient = new OptimizedApiClient();

// Convenience methods
export const api = {
  get: <T>(endpoint: string, config?: Omit<RequestConfig, 'method'>) =>
    apiClient.request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    apiClient.request<T>(endpoint, { ...config, method: 'POST', body }),

  put: <T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    apiClient.request<T>(endpoint, { ...config, method: 'PUT', body }),

  delete: <T>(endpoint: string, config?: Omit<RequestConfig, 'method'>) =>
    apiClient.request<T>(endpoint, { ...config, method: 'DELETE' }),

  invalidateCache: (pattern?: string) => apiClient.invalidateCache(pattern),

  preload: (endpoints: string[]) => apiClient.preload(endpoints),

  getCacheStats: () => apiClient.getCacheStats()
};

export default apiClient;

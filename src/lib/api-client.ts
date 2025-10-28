/**
 * API CLIENT
 * Cliente HTTP com retry automático e tratamento de erros
 */

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  retries?: number;
}

export class ApiClient {
  /**
   * Fetch com retry automático
   */
  private static async fetchWithRetry(
    url: string,
    options: ApiOptions,
    retries = 3
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      return response;
    } catch (error) {
      if (retries > 0) {
        console.log(`🔄 Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Request genérico com tratamento de erros
   */
  static async request<T>(
    url: string,
    options: ApiOptions = {}
  ): Promise<T> {
    try {
      const response = await this.fetchWithRetry(url, options, options.retries || 3);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.details?.join(', ') || error.error || 'Erro desconhecido'
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ API Error [${options.method || 'GET'} ${url}]:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  static async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  /**
   * POST request
   */
  static async post<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'POST', body, headers });
  }

  /**
   * PUT request
   */
  static async put<T>(url: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'PUT', body, headers });
  }

  /**
   * DELETE request
   */
  static async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }
}

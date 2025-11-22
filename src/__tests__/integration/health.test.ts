/**
 * TESTES DE INTEGRAÇÃO: Health Check
 */

import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('deve retornar status healthy', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });
});

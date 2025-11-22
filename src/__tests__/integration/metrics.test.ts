/**
 * TESTES DE INTEGRAÇÃO: Metrics
 */

import { GET } from '@/app/api/metrics/route';

describe('GET /api/metrics', () => {
  it('deve retornar métricas do sistema', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metrics).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });
});

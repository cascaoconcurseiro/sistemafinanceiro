// Rate limiter simples em memória
const requests = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = requests.get(identifier);

  // Limpar registros expirados
  if (record && now > record.resetAt) {
    requests.delete(identifier);
  }

  const current = requests.get(identifier);

  if (!current) {
    requests.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false; // Bloqueado
  }

  current.count++;
  return true;
}

// Limpar registros antigos periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requests.entries()) {
    if (now > value.resetAt) {
      requests.delete(key);
    }
  }
}, 60000); // Limpar a cada minuto

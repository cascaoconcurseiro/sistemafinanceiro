import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Criando eventos de segurança de exemplo...');

  // Buscar usuário admin
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@suagrana.com' },
  });

  if (!admin) {
    console.log('❌ Usuário admin não encontrado');
    return;
  }

  // Criar eventos de exemplo
  const events = [
    {
      type: 'LOGIN_SUCCESS',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      description: 'Login bem-sucedido',
      severity: 'LOW',
      source: 'system',
      details: JSON.stringify({ userId: admin.id, email: admin.email }),
      blocked: false,
      resolved: false,
    },
    {
      type: 'LOGIN_FAILED',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      description: 'Tentativa de login com senha incorreta',
      severity: 'MEDIUM',
      source: 'system',
      details: JSON.stringify({ attempts: 3 }),
      blocked: false,
      resolved: false,
    },
    {
      type: 'SUSPICIOUS_ACTIVITY',
      ipAddress: '10.0.0.50',
      userAgent: 'curl/7.68.0',
      description: 'Múltiplas requisições em curto período',
      severity: 'HIGH',
      source: 'system',
      details: JSON.stringify({ requests: 50, timeWindow: '1 minuto' }),
      blocked: false,
      resolved: false,
    },
    {
      type: 'PASSWORD_RESET_REQUEST',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      description: 'Solicitação de reset de senha',
      severity: 'MEDIUM',
      source: 'system',
      details: JSON.stringify({ userId: admin.id, email: admin.email }),
      blocked: false,
      resolved: false,
    },
  ];

  for (const event of events) {
    await prisma.securityEvent.create({ data: event });
  }

  console.log(`✅ ${events.length} eventos de segurança criados!`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

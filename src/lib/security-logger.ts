import { prisma } from './prisma';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_DELETED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'UNAUTHORIZED_ACCESS';

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface LogSecurityEventParams {
  type: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
  severity?: SecuritySeverity;
  metadata?: Record<string, any>;
}

export async function logSecurityEvent({
  type,
  userId,
  ipAddress = 'unknown',
  userAgent = 'unknown',
  details,
  severity = 'LOW',
  metadata,
}: LogSecurityEventParams) {
  try {
    // Adicionar userId aos metadados se fornecido
    const fullMetadata = {
      ...metadata,
      ...(userId && { userId }),
    };

    await prisma.securityEvent.create({
      data: {
        type,
        ipAddress,
        userAgent,
        description: details,
        severity,
        details: JSON.stringify(fullMetadata),
        source: 'system',
        blocked: false,
        resolved: false,
      },
    });

    console.log(`🔒 [Security] ${type} - ${details}`);
  } catch (error) {
    console.error('❌ Erro ao registrar evento de segurança:', error);
  }
}

// Helper para obter IP e User Agent do request
export function getRequestInfo(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0] :
                    request.headers.get('x-real-ip') ||
                    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

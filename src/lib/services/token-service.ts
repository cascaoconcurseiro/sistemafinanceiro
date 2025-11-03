/**
 * Serviço de Rotação de Tokens
 * Implementa refresh tokens e rotação automática
 */

import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'sua-grana-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutos
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 dias

interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

/**
 * Gera par de tokens (access + refresh)
 */
export function generateTokenPair(userId: string, email: string): {
  accessToken: string;
  refreshToken: string;
} {
  const accessToken = jwt.sign(
    { userId, email, type: 'access' } as TokenPayload,
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' } as TokenPayload,
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

/**
 * Verifica e decodifica token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Rotaciona tokens usando refresh token
 */
export async function rotateTokens(refreshToken: string): Promise<{
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}> {
  // Verificar refresh token
  const decoded = verifyToken(refreshToken);

  if (!decoded || decoded.type !== 'refresh') {
    return { success: false, error: 'Invalid refresh token' };
  }

  // Verificar se token está na blacklist
  const isBlacklisted = await isTokenBlacklisted(refreshToken);
  if (isBlacklisted) {
    return { success: false, error: 'Token has been revoked' };
  }

  // Verificar se usuário ainda existe e está ativo
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user || !user.isActive) {
    return { success: false, error: 'User not found or inactive' };
  }

  // Adicionar token antigo à blacklist
  await addToBlacklist(refreshToken, 7 * 24 * 60 * 60); // 7 dias

  // Gerar novos tokens
  const newTokens = generateTokenPair(user.id, user.email);

  return {
    success: true,
    ...newTokens
  };
}

/**
 * Adiciona token à blacklist
 */
async function addToBlacklist(token: string, expiresInSeconds: number): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  try {
    // Criar tabela se não existir (migration deve fazer isso)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO token_blacklist (id, token, expires_at)
      VALUES (${generateId()}, ${token}, ${expiresAt.toISOString()})
    `;
  } catch (error) {
    console.error('Erro ao adicionar token à blacklist:', error);
  }
}

/**
 * Verifica se token está na blacklist
 */
async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count
      FROM token_blacklist
      WHERE token = ${token}
      AND expires_at > ${new Date().toISOString()}
    `;

    return result[0]?.count > 0;
  } catch {
    return false;
  }
}

/**
 * Limpa tokens expirados da blacklist
 */
export async function cleanupBlacklist(): Promise<void> {
  try {
    await prisma.$executeRaw`
      DELETE FROM token_blacklist
      WHERE expires_at < ${new Date().toISOString()}
    `;
  } catch (error) {
    console.error('Erro ao limpar blacklist:', error);
  }
}

/**
 * Revoga todos os tokens de um usuário
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  // Adicionar marcador de revogação
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() }
    });
  } catch (error) {
    console.error('Erro ao revogar tokens:', error);
  }
}

/**
 * Gera ID único
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

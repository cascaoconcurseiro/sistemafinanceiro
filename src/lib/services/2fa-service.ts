/**
 * Serviço de Autenticação de Dois Fatores (2FA)
 * Implementa TOTP (Time-based One-Time Password)
 */

import crypto from 'crypto';

/**
 * Gera um secret para 2FA
 */
export function generate2FASecret(email: string): {
  secret: string;
  qrCodeUrl: string;
} {
  // Gerar secret aleatório (base32)
  const secret = generateBase32Secret();

  // Gerar URL para QR Code
  const appName = 'SuaGrana';
  const qrCodeUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;

  return { secret, qrCodeUrl };
}

/**
 * Verifica um token 2FA
 */
export function verify2FAToken(secret: string, token: string): boolean {
  // Verificar token atual e janelas adjacentes (±1 período de 30s)
  const currentTime = Math.floor(Date.now() / 1000);

  for (let i = -1; i <= 1; i++) {
    const time = currentTime + (i * 30);
    const expectedToken = generateTOTP(secret, time);

    if (expectedToken === token) {
      return true;
    }
  }

  return false;
}

/**
 * Gera um secret base32
 */
function generateBase32Secret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Codifica em base32
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodifica base32
 */
function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = Buffer.alloc(Math.ceil(encoded.length * 5 / 8));

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i].toUpperCase();
    const val = alphabet.indexOf(char);

    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return output.slice(0, index);
}

/**
 * Gera um token TOTP
 */
function generateTOTP(secret: string, time: number): string {
  const key = base32Decode(secret);
  const timeBuffer = Buffer.alloc(8);

  // Converter tempo para buffer (big-endian)
  const timeStep = Math.floor(time / 30);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));

  // HMAC-SHA1
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Extrair código de 6 dígitos
  const offset = hash[hash.length - 1] & 0x0f;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

/**
 * Gera códigos de backup
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }

  return codes;
}

/**
 * Verifica código de backup
 */
export function verifyBackupCode(
  storedCodes: string[],
  providedCode: string
): { valid: boolean; remainingCodes: string[] } {
  const normalizedProvided = providedCode.replace(/[^A-Z0-9]/g, '').toUpperCase();

  const index = storedCodes.findIndex(code => {
    const normalized = code.replace(/[^A-Z0-9]/g, '').toUpperCase();
    return normalized === normalizedProvided;
  });

  if (index === -1) {
    return { valid: false, remainingCodes: storedCodes };
  }

  // Remover código usado
  const remainingCodes = [...storedCodes];
  remainingCodes.splice(index, 1);

  return { valid: true, remainingCodes };
}

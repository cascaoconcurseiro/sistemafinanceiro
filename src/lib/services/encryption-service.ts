/**
 * SERVIÇO DE CRIPTOGRAFIA
 * Gerencia criptografia de senhas e dados sensíveis
 */

import bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static readonly SALT_ROUNDS = 10;
  private static readonly SECRET_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';
  
  /**
   * SENHAS (bcrypt)
   */
  
  /**
   * Criptografa senha usando bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }
  
  /**
   * Compara senha com hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Erro ao comparar senha:', error);
      return false;
    }
  }
  
  /**
   * DADOS SENSÍVEIS (AES-256)
   */
  
  /**
   * Criptografa dados sensíveis
   */
  static encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
    } catch (error) {
      console.error('Erro ao criptografar:', error);
      throw new Error('Falha na criptografia');
    }
  }
  
  /**
   * Descriptografa dados sensíveis
   */
  static decrypt(encrypted: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, this.SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Falha na descriptografia');
      }
      
      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar:', error);
      throw new Error('Falha na descriptografia');
    }
  }
  
  /**
   * Criptografa objeto JSON
   */
  static encryptObject(obj: any): string {
    return this.encrypt(JSON.stringify(obj));
  }
  
  /**
   * Descriptografa objeto JSON
   */
  static decryptObject<T>(encrypted: string): T {
    const decrypted = this.decrypt(encrypted);
    return JSON.parse(decrypted) as T;
  }
  
  /**
   * Gera hash SHA-256 (para checksums)
   */
  static hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }
}

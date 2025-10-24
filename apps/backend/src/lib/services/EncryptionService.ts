import crypto from 'node:crypto';
import { ERROR_MESSAGES } from '@sanity-notion-llm/shared';

/*===============================================
|=              EncryptionService               =
===============================================*/

/**
 * ENCRYPTION SERVICE
 *
 * Provides secure encryption/decryption for API keys and sensitive data.
 * Uses AES-256-GCM encryption with authenticated encryption for maximum security.
 *
 * Key Features:
 * - AES-256-GCM: Industry-standard authenticated encryption
 * - Key Derivation: SHA-256 hash of ENCRYPTION_SECRET for key generation
 * - Base64 Encoding: Safe encoding for database storage
 * - Error Handling: Comprehensive error handling with typed responses
 *
 * Security Features:
 * - Authenticated Encryption: Prevents tampering with encrypted data
 * - Random IV: Each encryption uses a unique initialization vector
 * - Secure Key Derivation: Uses SHA-256 for key generation
 * - Environment-based Secret: Encryption key from environment variable
 *
 * Format:
 * - Encrypted data: "iv:ciphertext:authTag" (base64 encoded)
 * - IV Length: 12 bytes (recommended for GCM)
 * - Key Length: 32 bytes (AES-256)
 *
 * Usage:
 * - Encrypt API keys before database storage
 * - Decrypt API keys for service usage
 * - All operations are synchronous for simplicity
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended length for GCM

const getEncryptionKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error(ERROR_MESSAGES.ENCRYPTION_SECRET_NOT_SET);
  }
  return crypto.createHash('sha256').update(secret).digest();
};

const encode = (iv: Buffer, cipher: Buffer, authTag: Buffer): string =>
  [iv, cipher, authTag].map((segment) => segment.toString('base64')).join(':');

const decode = (payload: string): [Buffer, Buffer, Buffer] => {
  const [iv, cipher, authTag] = payload.split(':');
  if (!iv || !cipher || !authTag) {
    throw new Error('Encrypted payload is malformed');
  }
  return [
    Buffer.from(iv, 'base64'),
    Buffer.from(cipher, 'base64'),
    Buffer.from(authTag, 'base64'),
  ];
};

export const encryptSecret = (plaintext: string): string => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return encode(iv, encrypted, authTag);
  } catch (error) {
    console.error('[encryption] Failed to encrypt text:', error);
    throw new Error('Encryption failed');
  }
};

export const decryptSecret = (encryptedText: string): string => {
  try {
    const key = getEncryptionKey();
    const [iv, ciphertext, authTag] = decode(encryptedText);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('[encryption] Failed to decrypt text:', error);
    throw new Error('Decryption failed');
  }
};

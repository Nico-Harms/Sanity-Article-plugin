import crypto from 'node:crypto';
import { ERROR_MESSAGES } from '@sanity-notion-llm/shared';

/**
 * Symmetric encryption helpers using AES-256-GCM.
 *
 * We derive a 32-byte key from ENCRYPTION_SECRET via SHA-256 hashing.
 * Ciphertext is encoded as three base64 segments (iv:cipher:authTag).
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
  return [Buffer.from(iv, 'base64'), Buffer.from(cipher, 'base64'), Buffer.from(authTag, 'base64')];
};

export const encryptSecret = (plaintext: string): string => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
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
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('[encryption] Failed to decrypt text:', error);
    throw new Error('Decryption failed');
  }
};

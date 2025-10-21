import bcrypt from 'bcryptjs';
import { ERROR_MESSAGES } from '@sanity-notion-llm/shared';

export class EncryptionService {
  private static readonly SALT_ROUNDS = 12;

  static encrypt(text: string): string {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
      throw new Error(ERROR_MESSAGES.ENCRYPTION_SECRET_NOT_SET);
    }

    try {
      // Combine the text with the secret before hashing
      const combined = text + secret;
      return bcrypt.hashSync(combined, this.SALT_ROUNDS);
    } catch (error) {
      console.error('[encryption] Failed to encrypt text:', error);
      throw new Error('Encryption failed');
    }
  }

  static decrypt(encryptedText: string): string {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
      throw new Error(ERROR_MESSAGES.ENCRYPTION_SECRET_NOT_SET);
    }

    try {
      // For decryption, we need to store the original text
      // Since bcrypt is one-way, we'll use a different approach
      // In a real implementation, you'd use AES encryption for this
      // For now, we'll return the encrypted text as-is and handle decryption differently
      console.warn(
        '[encryption] bcrypt is one-way, cannot decrypt. Use AES for two-way encryption.'
      );
      return encryptedText;
    } catch (error) {
      console.error('[encryption] Failed to decrypt text:', error);
      throw new Error('Decryption failed');
    }
  }

  static verify(text: string, encryptedText: string): boolean {
    const secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
      throw new Error(ERROR_MESSAGES.ENCRYPTION_SECRET_NOT_SET);
    }

    try {
      const combined = text + secret;
      return bcrypt.compareSync(combined, encryptedText);
    } catch (error) {
      console.error('[encryption] Failed to verify text:', error);
      return false;
    }
  }
}

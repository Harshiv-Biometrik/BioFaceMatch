import crypto from 'react-native-quick-crypto';
import { Buffer } from 'buffer';

// Use an environment variable or a secure vault in a real application.
// For now, we use a 256-bit key (32 bytes) for AES-256-CBC.
const SECRET_KEY = crypto.createHash('sha256')
    .update('my-super-secret-biometric-key')
    .digest();
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts a Base64 payload using AES-256-CBC and returns a concatenated IV:Ciphertext string.
 */
export const encryptPayload = (payload: string): string => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

        let encrypted = cipher.update(payload, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        // Concatenate IV and cipher text so the decryptor can use the same IV
        return `${iv.toString('base64')}:${encrypted}`;
    } catch (error) {
        console.error('[Encryption Error] Failed to encrypt:', error);
        return '';
    }
};

/**
 * Decrypts a previously encrypted IV:Ciphertext string back to the original Base64 payload.
 */
export const decryptPayload = (encryptedPayload: string): string => {
    try {
        const parts = encryptedPayload.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted payload format. Expected IV:Ciphertext');
        }

        const iv = Buffer.from(parts[0], 'base64');
        const encryptedText = parts[1];

        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);

        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('[Decryption Error] Failed to decrypt:', error);
        return '';
    }
};

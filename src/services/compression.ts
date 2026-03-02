import pako from 'pako';
import { Buffer } from 'buffer';

/**
 * Converts a float vector into a gzipped Base64 payload suitable for QR text.
 * Returns empty string on failure.
 */
export const compressVector = (vector: number[]): string => {
  if (!Array.isArray(vector) || vector.length === 0) return '';

  // FaceNet typically returns 128 floats; pad/trim to keep size stable in QR
  const targetLength = 128;
  const normalized = new Float32Array(targetLength);
  for (let i = 0; i < targetLength; i += 1) {
    const value = vector[i] ?? 0;
    normalized[i] = Number.isFinite(value) ? value : 0;
  }

  try {
    const uint8Data = new Uint8Array(normalized.buffer);
    const compressed = pako.gzip(uint8Data);
    return Buffer.from(compressed).toString('base64');
  } catch (error) {
    console.error('Compression failed:', error);
    return '';
  }
};

/**
 * Reverses the process: Base64 -> Ungzip -> Float32Array -> number[]
 */
export const decompressVector = (base64String: string): number[] => {
  try {
    const compressed = Buffer.from(base64String, 'base64');
    const decompressed = pako.ungzip(compressed);
    const floatData = new Float32Array(decompressed.buffer);
    return Array.from(floatData);
  } catch (error) {
    console.error('Decompression failed:', error);
    return [];
  }
};

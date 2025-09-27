/**
 * Cryptographic utilities for the blockchain
 * Implements security functions following crypto specification
 */

import { createHash, generateKeyPairSync, createSign, createVerify } from 'crypto';

export class CryptoUtils {
  /**
   * Generates SHA-256 hash of input data
   */
  public static sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generates a new key pair for digital signatures
   */
  public static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  /**
   * Signs data with a private key
   */
  public static sign(data: string, privateKey: string): string {
    const signer = createSign('SHA256');
    signer.update(data);
    return signer.sign(privateKey, 'hex');
  }

  /**
   * Verifies a signature with a public key
   */
  public static verify(data: string, signature: string, publicKey: string): boolean {
    const verifier = createVerify('SHA256');
    verifier.update(data);
    return verifier.verify(publicKey, signature, 'hex');
  }

  /**
   * Generates a random nonce for mining
   */
  public static generateNonce(): number {
    return Math.floor(Math.random() * 1000000);
  }

  /**
   * Generates a wallet address from public key
   */
  public static generateAddress(publicKey: string): string {
    const hash = this.sha256(publicKey);
    return hash.substring(0, 40); // First 40 characters as address
  }
}
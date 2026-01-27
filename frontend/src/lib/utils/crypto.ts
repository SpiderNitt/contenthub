/**
 * Cryptographic Utilities
 */

import { createHmac, timingSafeEqual } from 'crypto';

export function createSignature(payload: any, secret: string): string {
    return createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
}

export function verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = createSignature(payload, secret);

    // Use timing-safe comparison to prevent timing attacks
    try {
        return timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch {
        return false;
    }
}

export function generateNonce(): number {
    return Math.floor(Math.random() * 1000000);
}

export function generateIdempotencyKey(): string {
    return crypto.randomUUID();
}

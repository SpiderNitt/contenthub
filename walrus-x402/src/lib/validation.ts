import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Input validation helpers
 */

export function isValidBlobId(id: string): boolean {
    // Blob IDs should be alphanumeric, reasonable length
    return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

export function isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidTransactionHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

export function isValidTierId(tier: any): boolean {
    return typeof tier === 'number' && tier >= 0 && tier <= 10;
}

/**
 * Cryptographic helpers
 */

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

/**
 * Sanitization helpers
 */

export function sanitizeString(input: string, maxLength: number = 1000): string {
    return input.slice(0, maxLength).trim();
}

export function normalizeAddress(address: string): string {
    return address.toLowerCase();
}

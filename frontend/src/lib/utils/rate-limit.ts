/**
 * Rate Limiting Utilities
 */

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

export class RateLimiter {
    private store: Map<string, RateLimitRecord>;
    private windowMs: number;
    private maxRequests: number;

    constructor(windowMs: number, maxRequests: number) {
        this.store = new Map();
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    check(identifier: string): boolean {
        const now = Date.now();
        const record = this.store.get(identifier);

        if (!record || now > record.resetAt) {
            this.store.set(identifier, {
                count: 1,
                resetAt: now + this.windowMs
            });
            return true;
        }

        if (record.count >= this.maxRequests) {
            return false;
        }

        record.count++;
        return true;
    }

    reset(identifier: string): void {
        this.store.delete(identifier);
    }

    cleanup(): void {
        const now = Date.now();
        for (const [key, value] of this.store.entries()) {
            if (now > value.resetAt) {
                this.store.delete(key);
            }
        }
    }
}

// Simple function-based rate limiter for backward compatibility
const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(
    identifier: string,
    windowMs: number,
    maxRequests: number
): boolean {
    const now = Date.now();
    const record = rateLimitStore.get(identifier);

    if (!record || now > record.resetAt) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetAt: now + windowMs
        });
        return true;
    }

    if (record.count >= maxRequests) {
        return false;
    }

    record.count++;
    return true;
}

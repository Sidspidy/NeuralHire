import { Injectable } from '@nestjs/common';
// Removed Redis import

@Injectable()
export class IdempotencyService {
    private store = new Map<string, { value: any; expiry: number }>();

    constructor() { }

    /**
     * Check if a key exists and set it if it doesn't
     * @param key Idempotency key
     * @param value Value to store
     * @param ttl Time to live in seconds (default 24 hours)
     * @returns true if can proceed (key didn't exist), false if already processed
     */
    async checkAndSet(key: string, value: any, ttl: number = 86400): Promise<boolean> {
        const now = Date.now();
        const item = this.store.get(key);

        if (item) {
            if (item.expiry > now) {
                return false; // Already processed and valid
            }
            this.store.delete(key); // Expired
        }

        this.store.set(key, {
            value,
            expiry: now + ttl * 1000,
        });
        return true; // Can proceed
    }

    /**
     * Get cached value for idempotency key
     * @param key Idempotency key
     * @returns Cached value or null
     */
    async get(key: string): Promise<any> {
        const now = Date.now();
        const item = this.store.get(key);

        if (item) {
            if (item.expiry > now) {
                return item.value;
            }
            this.store.delete(key);
        }
        return null;
    }

    /**
     * Generate idempotency key for webhook
     * @param provider Payment provider
     * @param eventId Event ID from webhook
     * @returns Idempotency key
     */
    generateWebhookKey(provider: string, eventId: string): string {
        return `webhook:${provider}:${eventId}`;
    }

    /**
     * Generate idempotency key for subscription creation
     * @param userId User ID
     * @param planId Plan ID
     * @returns Idempotency key
     */
    generateSubscriptionKey(userId: string, planId: string): string {
        const timestamp = Date.now();
        return `subscription:${userId}:${planId}:${timestamp}`;
    }
}

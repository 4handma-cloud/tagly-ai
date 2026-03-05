// Cache service – in-memory with optional Redis
import dotenv from 'dotenv';
dotenv.config();

class MemoryCache {
    constructor() {
        this.store = new Map();
        this.timers = new Map();
    }

    async get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiry) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }

    async set(key, value, ttlSeconds = 900) {
        if (this.timers.has(key)) clearTimeout(this.timers.get(key));
        const expiry = Date.now() + ttlSeconds * 1000;
        this.store.set(key, { value, expiry });
        const timer = setTimeout(() => this.store.delete(key), ttlSeconds * 1000);
        this.timers.set(key, timer);
    }

    async del(key) {
        this.store.delete(key);
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
    }

    async flush() {
        this.store.clear();
        this.timers.forEach((t) => clearTimeout(t));
        this.timers.clear();
    }
}

let cacheInstance;

export function getCache() {
    if (!cacheInstance) {
        // Could add Redis here via REDIS_URL, for now in-memory
        cacheInstance = new MemoryCache();
        console.log('⚡ Cache initialized (in-memory)');
    }
    return cacheInstance;
}

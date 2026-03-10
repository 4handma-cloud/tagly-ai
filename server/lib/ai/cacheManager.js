// Cache service – in-memory with optional Firebase integration
// Firebase Admin is NOT initialized here; if Firebase is already initialized elsewhere,
// we can optionally wire it up. For now, pure in-memory cache is used.

let localCache = new Map();

export async function getCache() {
    return {
        async exists(key) {
            return localCache.has(key);
        },

        async get(key) {
            const entry = localCache.get(key);
            if (!entry) return null;
            // Check TTL
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
                localCache.delete(key);
                return null;
            }
            return entry.data;
        },

        async set(key, resultObj, ttlHours = 4) {
            localCache.set(key, {
                data: resultObj,
                generatedAt: Date.now(),
                expiresAt: Date.now() + (ttlHours * 60 * 60 * 1000)
            });
        }
    };
}

// Ensure "gym workout for beginners" matches "gym"
export function normalizeTopicKey(userInput) {
    if (!userInput) return 'general';

    // Step 1: Lowercase and trim
    let normalized = userInput.toLowerCase().trim();

    // Step 2: Remove stop words
    const stopWords = ['for', 'the', 'best', 'top', 'good', 'great',
        'how', 'to', 'a', 'an', 'and', 'or', 'with',
        'beginners', 'advanced', 'tips', 'ideas', 'easy'];
    stopWords.forEach(word => {
        normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
    });

    // Step 3: Extract core keyword (first meaningful word)
    const coreWord = normalized.trim().split(' ')[0] || 'general';

    // Step 4: Remove special characters
    return coreWord.replace(/[^a-z0-9]/g, '');
}

export function currentSlot() {
    const currentHour = new Date().getHours();
    // 4-hour slots: 1=0-3, 2=4-7, 3=8-11, 4=12-15, 5=16-19, 6=20-23
    return Math.floor(currentHour / 4) + 1;
}

// Cache service – Persistent Cloud Firestore Caching
import { db } from '../firebaseAdmin.js';

let localCache = new Map();

export async function getCache() {
    return {
        async get(key) {
            // 1. Try Local Memory first (Lightning fast)
            const memoryEntry = localCache.get(key);
            if (memoryEntry) {
                if (memoryEntry.expiresAt && Date.now() > memoryEntry.expiresAt) {
                    localCache.delete(key);
                } else {
                    return memoryEntry.data;
                }
            }

            // 2. Try Firestore (Persistent across restarts)
            if (db) {
                try {
                    const docRef = db.collection('ai_cache').doc(key);
                    const doc = await docRef.get();

                    if (doc.exists) {
                        const data = doc.data();
                        const expiresAt = data.expiresAt;

                        if (expiresAt && Date.now() > expiresAt) {
                            // Expired
                            await docRef.delete();
                            return null;
                        }

                        // Store in memory for next time
                        localCache.set(key, {
                            data: data.result,
                            expiresAt: expiresAt
                        });

                        return data.result;
                    }
                } catch (e) {
                    console.error('🔥 Firestore Cache Get Error:', e.message);
                }
            }
            return null;
        },

        async set(key, resultObj, ttlHours = 4) {
            const expiresAt = Date.now() + (ttlHours * 60 * 60 * 1000);

            // 1. Set Memory
            localCache.set(key, {
                data: resultObj,
                expiresAt: expiresAt
            });

            // 2. Set Firestore
            if (db) {
                try {
                    await db.collection('ai_cache').doc(key).set({
                        result: resultObj,
                        expiresAt: expiresAt,
                        generatedAt: Date.now(),
                        key: key
                    });
                } catch (e) {
                    console.error('🔥 Firestore Cache Set Error:', e.message);
                }
            }
        }
    };
}

// Ensure "gym workout for beginners" matches "gym"
export function normalizeTopicKey(userInput) {
    if (!userInput) return 'general';
    let normalized = userInput.toLowerCase().trim();
    const stopWords = ['for', 'the', 'best', 'top', 'good', 'great', 'how', 'to', 'a', 'an', 'and', 'or', 'with', 'beginners', 'advanced', 'tips', 'ideas', 'easy'];
    stopWords.forEach(word => {
        normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
    });
    const coreWord = normalized.trim().split(' ')[0] || 'general';
    return coreWord.replace(/[^a-z0-9]/g, '');
}

export function currentSlot() {
    const currentHour = new Date().getHours();
    return Math.floor(currentHour / 4) + 1;
}

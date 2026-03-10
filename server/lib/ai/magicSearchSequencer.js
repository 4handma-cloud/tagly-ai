import { generateWithFallback } from './modelFallback.js';
import { getTrendContext } from '../trends/trendAggregator.js';
import { incrementMagicSearchCount } from './quotaEnforcer.js';

const MAGIC_SEARCH_SEQUENCE = {
    1: 'qwen3.5-122b',
    2: 'deepseek-r1',
    3: 'gemini-flash',
    4: 'qwen3.5-122b',
    5: 'qwen-2.5',
    6: 'gemini-flash',
    7: 'deepseek-r1',
    8: 'qwen-2.5',
    9: 'deepseek-r1',
    10: 'qwen3.5-122b'
};

const MODEL_DISPLAY_NAMES = {
    'qwen3.5-122b': 'Qwen 3.5 122B',
    'qwen-2.5': 'Qwen 2.5 72B',
    'deepseek-r1': 'DeepSeek R1',
    'gemini-flash': 'Gemini Flash',
    'llama-3.3': 'Llama 3.3 70B'
};

export async function routeMagicSearch(userId, platform, topic) {
    let searchCount = 1;
    let isPaidUser = false;

    // Try to read search count from Firebase, fail gracefully if not available
    if (userId) {
        try {
            const admin = (await import('firebase-admin')).default;
            if (admin.apps && admin.apps.length > 0) {
                const db = admin.firestore();
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    searchCount = (data.magicSearchesUsedThisMonth || 0) + 1;
                    isPaidUser = !!data.isPaidUser;
                }
            }
        } catch (err) {
            console.warn('Firebase not available for search count, defaulting to 1');
        }
    }

    const MAGIC_SEARCH_FREE_LIMIT = parseInt(process.env.MAGIC_SEARCH_FREE_LIMIT) || 10;

    if (searchCount > MAGIC_SEARCH_FREE_LIMIT && !isPaidUser) {
        return { blocked: true, showUpgradeModal: true };
    }

    const position = ((searchCount - 1) % 10) + 1;
    const modelKey = MAGIC_SEARCH_SEQUENCE[position] || 'deepseek-r1';

    const trendContext = await getTrendContext(platform, topic);
    const result = await generateWithFallback(modelKey, platform, topic, 'magic_search_strategy', trendContext);

    if (userId) {
        await incrementMagicSearchCount(userId);
    }

    return {
        ...result,
        searchNumber: searchCount
    };
}

import { generateWithFallback } from './modelFallback.js';
import { getTrendContext } from '../trends/trendAggregator.js';
import { incrementMagicSearchCount } from './quotaEnforcer.js';

const MAGIC_SEARCH_SEQUENCE = {
    1: { model: 'qwen3.5-122b', prompt: 'magic_search_strategy' },
    2: { model: 'deepseek-r1', prompt: 'magic_search_strategy' },
    3: { model: 'gemini-flash', prompt: 'magic_search_spark' },
    4: { model: 'llama-3.3', prompt: 'magic_search_flash' },
    5: { model: 'qwen3.5-122b', prompt: 'magic_search_strategy' },
    6: { model: 'gemini-flash', prompt: 'magic_search_spark' },
    7: { model: 'deepseek-r1', prompt: 'magic_search_strategy' },
    8: { model: 'qwen3.5-122b', prompt: 'magic_search_spark' },
    9: { model: 'deepseek-r1', prompt: 'magic_search_flash' },
    10: { model: 'qwen3.5-122b', prompt: 'magic_search_strategy' }
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
                const userDoc = await db.collection('tagly_users').doc(userId).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    searchCount = (data.searchesUsedThisMonth || 0) + 1;
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
    const config = MAGIC_SEARCH_SEQUENCE[position] || { model: 'deepseek-r1', prompt: 'magic_search_strategy' };
    const modelKey = config.model;
    const promptType = config.prompt;

    const trendContext = await getTrendContext(platform, topic);

    let result;
    try {
        result = await generateWithFallback(modelKey, platform, topic, promptType, trendContext);
        if (!result.hashtags) throw new Error('Missing hashtags');
    } catch (err) {
        console.warn(`[Magic Search] ${promptType} failed on ${modelKey}, trying SPARK fallback...`);
        result = await generateWithFallback(modelKey, platform, topic, 'magic_search_spark', trendContext);
    }

    if (userId) {
        await incrementMagicSearchCount(userId);
    }

    return {
        ...result,
        searchNumber: searchCount
    };
}

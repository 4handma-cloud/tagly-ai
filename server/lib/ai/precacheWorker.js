import cron from 'node-cron';
import { generateWithFallback } from './modelFallback.js';
import { getTrendContext } from '../trends/trendAggregator.js';
import { getCache, normalizeTopicKey, currentSlot } from './cacheManager.js';

const TOP_200_TOPICS = [
    'fitness', 'gym', 'yoga', 'meditation', 'wellness', 'health',
    'nutrition', 'diet', 'weightloss', 'running', 'cycling', 'hiking',
    'food', 'cooking', 'recipe', 'baking', 'coffee', 'restaurant',
    'vegan', 'vegetarian', 'streetfood', 'dessert', 'breakfast',
    'fashion', 'style', 'ootd', 'beauty', 'makeup', 'skincare',
    'haircare', 'nails', 'luxury', 'streetstyle', 'vintage',
    'travel', 'wanderlust', 'photography', 'nature', 'beach',
    'mountains', 'adventure', 'backpacking', 'luxury travel',
    'technology', 'ai', 'startup', 'entrepreneur', 'marketing',
    'socialmedia', 'digitalmarketing', 'ecommerce', 'crypto',
    'gaming', 'music', 'movies', 'art', 'dance', 'comedy',
    'anime', 'books', 'podcast', 'streaming',
    'homedecor', 'interior', 'garden', 'diy', 'crafts',
    'minimalism', 'sustainability', 'zerowaste',
    'motivation', 'mindset', 'selfcare', 'mentalhealth',
    'parenting', 'pets', 'dogs', 'cats',
    'summer', 'winter', 'christmas', 'halloween', 'newyear',
    'wedding', 'birthday', 'graduation'
];

const PLATFORMS = ['instagram', 'tiktok', 'linkedin', 'pinterest', 'facebook', 'threads', 'snapchat', 'twitter', 'youtube'];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runPrecacheWorker() {
    if (process.env.PRECACHE_ENABLED !== 'true') return;
    console.log('🔄 Starting Pre-cache Worker...');

    const cache = await getCache();
    const slot = currentSlot();
    const db = null; // Firebase logging disabled for local dev

    let totalCostEstimate = 0;
    let successCount = 0;

    for (const topic of TOP_200_TOPICS) {
        for (const platform of PLATFORMS) {
            if (platform === 'youtube') continue; // Handled directly via API differently

            const normalizedQuery = normalizeTopicKey(topic);
            const cacheKey = `topic_${normalizedQuery}_${platform}_slot${slot}`;

            const exists = await cache.exists(cacheKey);

            if (!exists) {
                try {
                    const trendContext = await getTrendContext(platform, topic);
                    // Topic search uniformly uses Llama 3.3 per prompt rules, which is free
                    const result = await generateWithFallback('llama-3.3', platform, topic, 'topic_search_30', trendContext);

                    await cache.set(cacheKey, result, parseInt(process.env.CACHE_TTL_HOURS) || 4);
                    successCount++;

                    // Rate limit ourselves gently
                    await sleep(2000);
                } catch (err) {
                    console.warn(`Precache failed for ${topic} on ${platform}:`, err.message);
                }
            }
        }
    }

    console.log(`✅ Pre-cache Worker Completed. Generated ${successCount} new caches.`);

    // Firebase logging can be added when Admin SDK is initialized
}

export function initPrecacheCron() {
    // Run every 4 hours
    cron.schedule('0 0,4,8,12,16,20 * * *', () => {
        runPrecacheWorker();
    });
}

// Scheduler – Persistent 4-hour cron with YouTube API refresh
import cron from 'node-cron';
import { getTopHashtags } from './hashtagEngine.js';
import { isAIAvailable } from './aiScoring.js';
import { fetchYouTubeTrending, isYouTubeAvailable } from './youtubeFetcher.js';
import { getCache, currentSlot } from '../lib/ai/cacheManager.js';   // ← SAME cache as routes
import { initPrecacheCron } from '../lib/ai/precacheWorker.js';

let io = null;
let refreshCount = 0;

const ALL_PLATFORMS = ['youtube', 'instagram', 'facebook', 'tiktok', 'threads', 'x', 'pinterest', 'linkedin', 'snapchat'];

export function initScheduler(socketIo) {
    io = socketIo;

    // Run initial data load (skips if Firestore cache already warm)
    refreshData(false);
    initPrecacheCron();

    // Re-check every 4 hours (aligns with cache slot)
    // Only generates if cache is MISSING — never overwrites fresh cache
    cron.schedule('0 0,4,8,12,16,20 * * *', () => {
        console.log('⏰ 4-hour slot refresh triggered');
        refreshData(false);
    });

    console.log('⏰ Scheduler initialized – refreshing every 4 hours (slot-based)');
    console.log(`▶️ YouTube: ${isYouTubeAvailable() ? 'API Connected (LIVE)' : 'Not configured'}`);
}

async function refreshData(force = false) {
    try {
        refreshCount++;
        const cache = await getCache();
        const slot = currentSlot();
        const sources = {};

        console.log(`\n🔄 Refresh #${refreshCount} starting (Slot: ${slot})...`);

        for (const platform of ALL_PLATFORMS) {
            try {
                const cacheKey = `${platform}_top100_slot${slot}`;   // ← same key as routes!

                // Check if cache is already warm — skip generation if fresh
                if (!force) {
                    const cached = await cache.get(cacheKey);
                    if (cached?.hashtags?.length > 0) {
                        console.log(`  ✅ ${platform}: cache warm (${cached.hashtags.length} tags from slot ${slot})`);
                        sources[platform] = 'cached';
                        continue;  // do NOT regenerate!
                    }
                }

                let hashtags = null;

                // YouTube – live API
                if (platform === 'youtube' && isYouTubeAvailable()) {
                    hashtags = await fetchYouTubeTrending(100);
                    if (hashtags) sources[platform] = 'youtube-api';
                }

                // All other platforms – simulated (AI is handled on-demand per request)
                if (!hashtags || hashtags.length === 0) {
                    hashtags = getTopHashtags(platform, 100);
                    sources[platform] = 'simulated';
                }

                // Write to unified Firestore cache with 4-hour TTL
                await cache.set(cacheKey, { hashtags }, 4);
                const icon = sources[platform] === 'youtube-api' ? '▶️' : '📦';
                console.log(`  ${icon} ${platform}: ${hashtags.length} hashtags stored (${sources[platform]})`);

            } catch (err) {
                console.error(`  ❌ ${platform}: ${err.message}`);
                // Write simulated fallback
                const fallback = getTopHashtags(platform, 100);
                const cacheKey = `${platform}_top100_slot${slot}`;
                await cache.set(cacheKey, { hashtags: fallback }, 4);
                sources[platform] = 'simulated-fallback';
            }
        }

        // Broadcast to WebSocket clients
        if (io) {
            io.emit('hashtags:updated', {
                timestamp: new Date().toISOString(),
                refreshCount,
                sources,
                platforms: ALL_PLATFORMS
            });
        }

        console.log(`✅ Refresh #${refreshCount} complete\n`);
    } catch (error) {
        console.error('❌ Refresh failed:', error.message);
    }
}

export function getRefreshCount() {
    return refreshCount;
}

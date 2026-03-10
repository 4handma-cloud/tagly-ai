// Scheduler – 15-minute cron job with YouTube API + AI-powered refresh

import cron from 'node-cron';
import { refreshAllPlatforms, getTopHashtags } from './hashtagEngine.js';
import { generateLiveHashtags, isAIAvailable } from './aiScoring.js';
import { fetchYouTubeTrending, isYouTubeAvailable } from './youtubeFetcher.js';
import { getCache } from './cache.js';
import { initPrecacheCron } from '../lib/ai/precacheWorker.js';

let io = null;
let refreshCount = 0;

const ALL_PLATFORMS = ['youtube', 'instagram', 'facebook', 'tiktok', 'threads', 'x', 'pinterest', 'linkedin', 'snapchat'];

export function initScheduler(socketIo) {
    io = socketIo;

    // Run initial data load
    refreshData();
    initPrecacheCron();

    // Schedule refresh every 15 minutes
    cron.schedule('*/15 * * * *', () => {
        console.log('🔄 Scheduled refresh triggered');
        refreshData();
    });

    console.log('⏰ Scheduler initialized – refreshing every 15 minutes');
    console.log(`🤖 AI Mode: ${isAIAvailable() ? 'GPT-5.2 (LIVE DATA)' : 'Simulated Data'}`);
    console.log(`▶️ YouTube: ${isYouTubeAvailable() ? 'API Connected (LIVE)' : 'Not configured'}`);
}

async function refreshData() {
    try {
        refreshCount++;
        const cache = getCache();
        const sources = {};

        console.log(`\n🔄 Refresh #${refreshCount} starting...`);

        for (const platform of ALL_PLATFORMS) {
            try {
                let hashtags = null;

                // 1. Try platform-specific live API
                if (platform === 'youtube' && isYouTubeAvailable()) {
                    hashtags = await fetchYouTubeTrending(100);
                    if (hashtags) sources[platform] = 'youtube-api';
                }

                // 2. Try AI generation (DISABLED for background prefetching)
                // Hitting OpenAI every 15 minutes for 8 platforms = massive token burn.
                // We now strictly use simulated data for standard feeds to save costs.
                /*
                if (!hashtags && isAIAvailable()) {
                    hashtags = await generateLiveHashtags(platform, 100);
                    if (hashtags) sources[platform] = 'gpt-5.2';
                }
                */

                // 3. Fallback to simulated
                if (!hashtags) {
                    hashtags = getTopHashtags(platform, 100);
                    sources[platform] = 'simulated';
                }

                await cache.set(`hashtags:${platform}:100`, hashtags, 900);
                const icon = sources[platform] === 'youtube-api' ? '▶️' : sources[platform] === 'gpt-5.2' ? '🤖' : '📦';
                console.log(`  ${icon} ${platform}: ${hashtags.length} hashtags (${sources[platform]})`);
            } catch (err) {
                console.error(`  ❌ ${platform}: ${err.message}`);
                const fallback = getTopHashtags(platform, 100);
                await cache.set(`hashtags:${platform}:100`, fallback, 900);
                sources[platform] = 'simulated';
            }
        }

        // Broadcast to all connected WebSocket clients
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

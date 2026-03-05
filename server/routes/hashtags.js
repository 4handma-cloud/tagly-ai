// API Routes – Hashtag endpoints with AI-powered live data

import { Router } from 'express';
import multer from 'multer';
import { getTopHashtags, searchHashtags, getAllPlatforms } from '../services/hashtagEngine.js';
import { generateLiveHashtags, generateTopicHashtags, generateContentHashtags, enhanceWithAI, isAIAvailable } from '../services/aiScoring.js';
import { fetchYouTubeTrending, searchYouTubeHashtags, isYouTubeAvailable } from '../services/youtubeFetcher.js';
import { analyzeImage } from '../services/imageToTag.js';
import { getCache } from '../services/cache.js';
import { getRefreshCount } from '../services/scheduler.js';

const router = Router();

// File upload for image-to-tag
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// GET /api/platforms
router.get('/platforms', (req, res) => {
    const platforms = getAllPlatforms();
    res.json({
        success: true,
        data: platforms,
        count: platforms.length,
        aiEnabled: isAIAvailable(),
        youtubeEnabled: isYouTubeAvailable()
    });
});

// GET /api/hashtags/:platform – Top 100 hashtags
router.get('/hashtags/:platform', async (req, res) => {
    try {
        const { platform } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 100, 100);
        const cache = getCache();

        // Check cache first
        const cacheKey = `hashtags:${platform}:${limit}`;
        let hashtags = await cache.get(cacheKey);

        if (!hashtags) {
            // Priority chain: Platform API → AI → Simulated

            // 1. Try platform-specific live API
            if (platform === 'youtube' && isYouTubeAvailable()) {
                console.log('▶️ Fetching LIVE YouTube trending data...');
                hashtags = await fetchYouTubeTrending(limit);
            }

            // 2. Try AI-generated live data
            if (!hashtags && isAIAvailable()) {
                console.log(`🤖 Generating live hashtags for ${platform} via GPT-5.2...`);
                hashtags = await generateLiveHashtags(platform, limit);
            }

            // 3. Fall back to simulated engine
            if (!hashtags) {
                hashtags = getTopHashtags(platform, limit);
            }

            // Cache for 15 minutes
            await cache.set(cacheKey, hashtags, 900);
        }

        res.json({
            success: true,
            platform,
            data: hashtags,
            count: hashtags.length,
            source: hashtags[0]?.source || 'simulated',
            aiEnabled: isAIAvailable(),
            refreshCount: getRefreshCount(),
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/hashtags/:platform/search – Search/filter hashtags
router.get('/hashtags/:platform/search', async (req, res) => {
    try {
        const { platform } = req.params;
        const { q } = req.query;
        const limit = Math.min(parseInt(req.query.limit) || 100, 100);

        let hashtags;

        // 1. Try platform-specific search API
        if (q && platform === 'youtube' && isYouTubeAvailable()) {
            console.log(`▶️ Searching YouTube for "${q}"...`);
            hashtags = await searchYouTubeHashtags(q, limit);
        }

        // 2. Try AI topic generation
        if (!hashtags && q && isAIAvailable()) {
            console.log(`🤖 Generating topic hashtags: "${q}" for ${platform}...`);
            hashtags = await generateTopicHashtags(q, platform, limit);
        }

        // 3. Fall back to local search
        if (!hashtags) {
            hashtags = searchHashtags(platform, q, limit);
        }

        res.json({
            success: true,
            platform,
            query: q,
            data: hashtags,
            count: hashtags.length,
            source: hashtags[0]?.source || 'simulated',
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/hashtags/magic-search – Enhanced content-aware hashtag generation
router.post('/hashtags/magic-search', async (req, res) => {
    try {
        const { content, platform } = req.body;
        if (!content) {
            return res.status(400).json({ success: false, error: 'Content description is required' });
        }

        if (!isAIAvailable()) {
            return res.status(503).json({ success: false, error: 'AI not configured. Add OPENAI_API_KEY to .env' });
        }

        const result = await generateContentHashtags(content, platform || 'instagram', 30);

        if (!result) {
            return res.status(500).json({ success: false, error: 'AI generation failed' });
        }

        res.json({
            success: true,
            ...result,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Magic Search error:', error);

        // Handle specific OpenAI quota errors
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('billing')) {
            return res.status(429).json({
                success: false,
                error: 'OpenAI API quota exceeded. Please add billing details at platform.openai.com/account/billing'
            });
        }

        res.status(500).json({ success: false, error: 'Magic Search failed. Try a regular search instead.' });
    }
});

// POST /api/hashtags/image-to-tag – Upload image, get hashtags
router.post('/hashtags/image-to-tag', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image uploaded' });
        }

        const platform = req.body.platform || 'instagram';
        console.log(`📷 Analyzing image for ${platform}...`);
        const tags = await analyzeImage(req.file.buffer, platform);

        res.json({
            success: true,
            platform,
            data: tags,
            count: tags.length,
            source: tags[0]?.source || 'ai',
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/status
router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: 'operational',
        version: '1.0.0',
        aiEnabled: isAIAvailable(),
        aiModel: isAIAvailable() ? 'gpt-5.2' : 'none',
        refreshCount: getRefreshCount(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

export default router;

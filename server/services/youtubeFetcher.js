// YouTube Live Data Fetcher – Uses YouTube Data API v3
// Fetches trending videos and extracts real hashtags from titles, descriptions, and tags

import dotenv from 'dotenv';
dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_DATA_API_KEY || process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Fetch real trending hashtags from YouTube
 * Strategy: Get trending videos → extract hashtags from titles, descriptions, tags
 */
export async function fetchYouTubeTrending(limit = 100) {
    if (!YOUTUBE_API_KEY) {
        console.log('⚠️ YouTube API key not set, using fallback');
        return null;
    }

    try {
        console.log('▶️ Fetching YouTube trending videos...');

        // Fetch trending videos (max 50 per request, do 2 requests)
        const videos = [];
        let pageToken = '';

        for (let page = 0; page < 2; page++) {
            const url = new URL(`${BASE_URL}/videos`);
            url.searchParams.set('part', 'snippet,statistics');
            url.searchParams.set('chart', 'mostPopular');
            url.searchParams.set('regionCode', 'US');
            url.searchParams.set('maxResults', '50');
            url.searchParams.set('key', YOUTUBE_API_KEY);
            if (pageToken) url.searchParams.set('pageToken', pageToken);

            const response = await fetch(url.toString());
            if (!response.ok) {
                const err = await response.text();
                console.error('YouTube API error:', err);
                return null;
            }

            const data = await response.json();
            videos.push(...(data.items || []));
            pageToken = data.nextPageToken || '';
            if (!pageToken) break;
        }

        if (videos.length === 0) return null;

        // Extract hashtags from video titles, descriptions, and tags
        const hashtagMap = new Map();

        for (const video of videos) {
            const snippet = video.snippet || {};
            const stats = video.statistics || {};
            const viewCount = parseInt(stats.viewCount) || 0;
            const likeCount = parseInt(stats.likeCount) || 0;

            // Extract from title
            const titleTags = extractHashtags(snippet.title || '');
            // Extract from description (first 500 chars to avoid noise)
            const descTags = extractHashtags((snippet.description || '').slice(0, 500));
            // Use video tags directly
            const videoTags = (snippet.tags || []).slice(0, 10).map(t => t.toLowerCase().replace(/\s+/g, ''));

            const allTags = [...new Set([...titleTags, ...descTags, ...videoTags])];

            for (const tag of allTags) {
                if (tag.length < 2 || tag.length > 40) continue;
                const clean = tag.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                if (!clean || clean.length < 2) continue;

                if (hashtagMap.has(clean)) {
                    const existing = hashtagMap.get(clean);
                    existing.volume += viewCount;
                    existing.mentions += 1;
                    existing.engagement += likeCount;
                } else {
                    hashtagMap.set(clean, {
                        tag: clean,
                        volume: viewCount,
                        mentions: 1,
                        engagement: likeCount,
                        category: snippet.categoryId ? getCategoryName(snippet.categoryId) : 'general'
                    });
                }
            }
        }

        // Also extract common YouTube-specific trending keywords from titles
        for (const video of videos) {
            const title = (video.snippet?.title || '').toLowerCase();
            const stats = video.statistics || {};
            const viewCount = parseInt(stats.viewCount) || 0;

            // Common YouTube keywords that function as hashtags
            const keywords = extractKeywords(title);
            for (const kw of keywords) {
                if (kw.length < 3 || kw.length > 30) continue;
                if (!hashtagMap.has(kw)) {
                    hashtagMap.set(kw, {
                        tag: kw,
                        volume: viewCount,
                        mentions: 1,
                        engagement: parseInt(stats.likeCount) || 0,
                        category: 'trending'
                    });
                } else {
                    hashtagMap.get(kw).volume += viewCount;
                    hashtagMap.get(kw).mentions += 1;
                }
            }
        }

        // Convert to array, score, and rank
        const hashtags = Array.from(hashtagMap.values())
            .map(h => {
                const volumeScore = Math.min(h.volume / 50000000, 1) * 70;
                const competitionRaw = Math.min(h.mentions / 20, 1) * 100;
                const competition = Math.round(competitionRaw);
                const competitionScore = ((100 - competition) / 100) * 30;
                const aiScore = Math.round(Math.min(volumeScore + competitionScore, 100));
                const velocity = h.mentions >= 5 ? Math.floor(h.mentions * 50) : Math.floor(Math.random() * 150);

                return {
                    tag: `#${h.tag}`,
                    rawTag: h.tag,
                    volume: h.volume,
                    volumeFormatted: formatVolume(h.volume),
                    competition,
                    velocity,
                    isHot: velocity > 200 || h.mentions >= 8,
                    aiScore,
                    platform: 'youtube',
                    platformName: 'YouTube',
                    platformIcon: '▶️',
                    category: h.category,
                    mentions: h.mentions,
                    source: 'youtube-api',
                    lastUpdated: new Date().toISOString()
                };
            })
            .sort((a, b) => b.aiScore - a.aiScore || b.volume - a.volume)
            .slice(0, limit)
            .map((h, i) => ({ ...h, rank: i + 1 }));

        console.log(`▶️ YouTube: ${hashtags.length} real hashtags extracted from ${videos.length} trending videos`);
        return hashtags;
    } catch (error) {
        console.error('❌ YouTube fetch failed:', error.message);
        return null;
    }
}

/**
 * Search YouTube for videos related to a topic and extract hashtags
 */
export async function searchYouTubeHashtags(query, limit = 50) {
    if (!YOUTUBE_API_KEY) return null;

    try {
        // Search for videos
        const searchUrl = new URL(`${BASE_URL}/search`);
        searchUrl.searchParams.set('part', 'snippet');
        searchUrl.searchParams.set('q', query);
        searchUrl.searchParams.set('type', 'video');
        searchUrl.searchParams.set('order', 'viewCount');
        searchUrl.searchParams.set('maxResults', '25');
        searchUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const searchRes = await fetch(searchUrl.toString());
        if (!searchRes.ok) return null;

        const searchData = await searchRes.json();
        const videoIds = (searchData.items || []).map(i => i.id?.videoId).filter(Boolean);

        if (videoIds.length === 0) return null;

        // Get full video details with tags
        const detailUrl = new URL(`${BASE_URL}/videos`);
        detailUrl.searchParams.set('part', 'snippet,statistics');
        detailUrl.searchParams.set('id', videoIds.join(','));
        detailUrl.searchParams.set('key', YOUTUBE_API_KEY);

        const detailRes = await fetch(detailUrl.toString());
        if (!detailRes.ok) return null;

        const detailData = await detailRes.json();
        const hashtagMap = new Map();

        for (const video of (detailData.items || [])) {
            const snippet = video.snippet || {};
            const stats = video.statistics || {};
            const viewCount = parseInt(stats.viewCount) || 0;
            const tags = [...extractHashtags(snippet.title || ''), ...extractHashtags((snippet.description || '').slice(0, 500)), ...(snippet.tags || []).map(t => t.toLowerCase().replace(/\s+/g, ''))];

            for (const tag of [...new Set(tags)]) {
                const clean = tag.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                if (!clean || clean.length < 2 || clean.length > 40) continue;

                if (hashtagMap.has(clean)) {
                    hashtagMap.get(clean).volume += viewCount;
                    hashtagMap.get(clean).mentions += 1;
                } else {
                    hashtagMap.set(clean, { tag: clean, volume: viewCount, mentions: 1 });
                }
            }
        }

        return Array.from(hashtagMap.values())
            .sort((a, b) => b.volume - a.volume)
            .slice(0, limit)
            .map((h, i) => ({
                rank: i + 1,
                tag: `#${h.tag}`,
                rawTag: h.tag,
                volume: h.volume,
                volumeFormatted: formatVolume(h.volume),
                competition: Math.min(Math.round(h.mentions / 10 * 100), 100),
                velocity: h.mentions >= 3 ? 250 : 100,
                isHot: h.mentions >= 3,
                aiScore: Math.round(Math.min(h.volume / 50000000, 1) * 70 + 20),
                platform: 'youtube',
                category: query,
                source: 'youtube-api',
                lastUpdated: new Date().toISOString()
            }));
    } catch (error) {
        console.error('YouTube search failed:', error.message);
        return null;
    }
}

// ─── Helpers ───────────────────────────────────────────

function extractHashtags(text) {
    const hashtagRegex = /#(\w{2,30})/g;
    const matches = [];
    let match;
    while ((match = hashtagRegex.exec(text)) !== null) {
        matches.push(match[1].toLowerCase());
    }
    return matches;
}

function extractKeywords(title) {
    // Extract meaningful keywords from video titles
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'this', 'that', 'with', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'will', 'other', 'about', 'many', 'then', 'them', 'these', 'some', 'would', 'make', 'like', 'into', 'could', 'time', 'very', 'when', 'come', 'made', 'after', 'back', 'only', 'also', 'just', 'over', 'such', 'more', 'what', 'how', 'why', 'who', 'new', 'now', 'way', 'may', 'day', 'too', 'its', 'get', 'got', 'did', 'does', 'dont']);

    return title
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !stopWords.has(w))
        .map(w => w.toLowerCase());
}

function getCategoryName(categoryId) {
    const categories = {
        '1': 'film', '2': 'autos', '10': 'music', '15': 'pets',
        '17': 'sports', '19': 'travel', '20': 'gaming', '22': 'vlog',
        '23': 'comedy', '24': 'entertainment', '25': 'news', '26': 'howto',
        '27': 'education', '28': 'science', '29': 'activism', '43': 'shows'
    };
    return categories[categoryId] || 'general';
}

function formatVolume(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

export function isYouTubeAvailable() {
    return !!YOUTUBE_API_KEY;
}

import googleTrends from 'google-trends-api';

const PLATFORM_SUBREDDITS = {
    instagram: ['r/instagram', 'r/aesthetics', 'r/Photography'],
    tiktok: ['r/TikTok', 'r/viral', 'r/trends'],
    youtube: ['r/youtube', 'r/NewTubers', 'r/videography'],
    linkedin: ['r/linkedin', 'r/careerguidance', 'r/marketing'],
    twitter: ['r/twitter', 'r/socialmedia', 'r/news'],
    x: ['r/twitter', 'r/socialmedia', 'r/news'],
    pinterest: ['r/Pinterest', 'r/DIY', 'r/HomeDecor'],
    facebook: ['r/facebook', 'r/community', 'r/smallbusiness'],
    threads: ['r/Threads', 'r/socialmedia', 'r/conversations'],
    snapchat: ['r/snapchat', 'r/GrowYourChannel', 'r/teenagers']
};

export async function getRedditTrends(platform) {
    try {
        const subreddits = PLATFORM_SUBREDDITS[platform] || PLATFORM_SUBREDDITS['instagram'];
        // Fallback if platform not found
        if (!subreddits || !subreddits.length) return [];

        // Pick the primary subreddit
        const url = `https://www.reddit.com/${subreddits[0]}/hot.json?limit=10`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'TaglyAI/1.0 (Integration Test)' }
        });

        if (!response.ok) return [];

        const data = await response.json();
        if (!data.data || !data.data.children) return [];

        const titles = data.data.children.map(p => p.data.title);
        return titles.slice(0, 5); // Top 5 trending titles
    } catch (err) {
        console.warn('Reddit trend fetch failed:', err.message);
        return [];
    }
}

export async function getGoogleTrends(topic) {
    if (!topic || topic.trim() === '') return [];

    try {
        const results = await googleTrends.relatedQueries({ keyword: topic });
        const parsed = JSON.parse(results);
        const queries = parsed.default?.rankedList?.[0]?.rankedKeyword || [];
        return queries.slice(0, 5).map(q => q.query);
    } catch (err) {
        console.warn('Google Trends fetch failed:', err.message);
        return [];
    }
}

export async function getTrendContext(platform, topic) {
    if (process.env.DEV_MOCK_MODE === 'true' || process.env.AI_ENABLED === 'false') {
        return `[DEV MOCK TRENDS]`; // Avoid unneeded network calls in dev mock mode
    }

    const [redditTrends, googleTrendsData] = await Promise.all([
        getRedditTrends(platform),
        getGoogleTrends(topic || 'social media')
    ]);

    let contextStr = '';
    if (redditTrends.length > 0) {
        contextStr += `CURRENTLY TRENDING ON REDDIT (${platform}): ${redditTrends.join(', ')}\n`;
    }
    if (googleTrendsData.length > 0) {
        contextStr += `CURRENTLY TRENDING ON GOOGLE: ${googleTrendsData.join(', ')}\n`;
    }

    return contextStr.trim();
}

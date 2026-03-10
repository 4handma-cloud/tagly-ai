let googleTrends;
try {
    googleTrends = await import('google-trends-api');
    googleTrends = googleTrends.default || googleTrends;
} catch (e) {
    console.warn('[GoogleTrends] Package not installed');
    googleTrends = null;
}

const trendsCache = new Map();

export async function getGoogleTrends(topic, geo = 'IN') {
    if (!googleTrends) {
        return { success: false, trending: [], geo };
    }

    const cacheKey = `${topic}_${geo}`;
    const cached = trendsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 4 * 60 * 60 * 1000) {
        return cached.data;
    }

    try {
        const results = await googleTrends.relatedQueries({
            keyword: topic,
            geo: geo,
            startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        });

        const parsed = typeof results === 'string' ? JSON.parse(results) : results;
        const rising = parsed.default?.rankedList?.[0]?.rankedKeyword || [];
        const top = parsed.default?.rankedList?.[1]?.rankedKeyword || [];

        const trending = [
            ...rising.slice(0, 3).map(q => q.query),
            ...top.slice(0, 3).map(q => q.query)
        ].filter(Boolean);

        const data = { success: true, trending, geo };
        trendsCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;

    } catch (error) {
        console.warn('[GoogleTrends] Failed:', error.message);
        return { success: false, trending: [], geo };
    }
}

import { getRedditTrends } from './redditFetcher.js';
import { getGoogleTrends } from './googleTrendsFetcher.js';

export async function getTrendContext(platform, topic = null) {
    try {
        // Fetch both simultaneously for speed
        const [redditResult, googleResult] = await Promise.allSettled([
            getRedditTrends(platform, topic),
            getGoogleTrends(topic || platform, 'IN')
        ]);

        const reddit = redditResult.status === 'fulfilled'
            ? redditResult.value : null;
        const google = googleResult.status === 'fulfilled'
            ? googleResult.value : null;

        let context = '';

        if (reddit?.success && reddit.trending?.length > 0) {
            context += `REDDIT TRENDING`;
            if (reddit.subreddit) context += ` (r/${reddit.subreddit})`;
            context += `: ${reddit.trending.join(', ')}\n`;
        }

        if (google?.success && google.trending?.length > 0) {
            context += `GOOGLE TRENDING: ${google.trending.join(', ')}\n`;
        }

        return context.trim() ||
            'Use your training knowledge for current trends';

    } catch (error) {
        console.warn('[TrendAggregator] Failed:', error.message);
        return 'Trend data temporarily unavailable';
    }
}

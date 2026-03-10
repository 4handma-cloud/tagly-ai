const PLATFORM_SUBREDDITS = {
    instagram: ['instagram', 'InstagramMarketing', 'aesthetics', 'Photography'],
    tiktok: ['TikTok', 'tiktokgrowth', 'viral', 'ContentCreation'],
    youtube: ['youtube', 'NewTubers', 'videography', 'youtubers'],
    linkedin: ['linkedin', 'LinkedInTips', 'careerguidance', 'marketing'],
    twitter: ['Twitter', 'socialmedia', 'twittermarketing', 'GrowthHacking'],
    pinterest: ['Pinterest', 'DIY', 'HomeDecor', 'crafts'],
    facebook: ['facebook', 'FacebookAds', 'smallbusiness', 'community'],
    threads: ['Threads', 'socialmedia', 'Instagram', 'ContentCreators'],
    snapchat: ['snapchat', 'genz', 'teenagers', 'ContentCreation']
};

const TOPIC_SUBREDDITS = {
    fitness: ['fitness', 'workout', 'gym', 'bodybuilding', 'yoga'],
    food: ['food', 'recipes', 'cooking', 'FoodPorn', 'MealPrep'],
    travel: ['travel', 'solotravel', 'backpacking', 'digitalnomad'],
    fashion: ['femalefashionadvice', 'malefashionadvice', 'streetwear'],
    beauty: ['SkincareAddiction', 'MakeupAddiction', 'beauty'],
    tech: ['technology', 'gadgets', 'programming'],
    business: ['Entrepreneur', 'smallbusiness', 'startups', 'marketing'],
    gaming: ['gaming', 'pcgaming', 'indiegaming'],
    wedding: ['weddingplanning', 'wedding', 'bridetobe'],
    music: ['Music', 'WeAreTheMusicMakers', 'hiphop']
};

// In-memory cache - resets on server restart
const redditCache = new Map();

export async function getRedditTrends(platform, topic = null) {
    // Build cache key
    const cacheKey = `${platform}_${topic || 'general'}`;

    // Check cache - return if less than 4 hours old
    const cached = redditCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 4 * 60 * 60 * 1000) {
        return cached.data;
    }

    try {
        // Get subreddits for this platform
        let subreddits = PLATFORM_SUBREDDITS[platform?.toLowerCase()]
            || ['socialmedia', 'ContentCreation'];

        // Add topic-specific subreddits if topic provided
        if (topic) {
            const topicLower = topic.toLowerCase();
            for (const [key, subs] of Object.entries(TOPIC_SUBREDDITS)) {
                if (topicLower.includes(key)) {
                    subreddits = [...subs, ...subreddits];
                    break;
                }
            }
        }

        // Fetch from primary subreddit
        const subreddit = subreddits[0];
        const userAgent = process.env.REDDIT_USER_AGENT
            || 'TaglyAI/1.0';

        const response = await fetch(
            `https://www.reddit.com/r/${subreddit}/hot.json?limit=15`,
            {
                headers: { 'User-Agent': userAgent },
                signal: AbortSignal.timeout(5000) // 5 second timeout
            }
        );

        if (!response.ok) {
            throw new Error(`Reddit responded with ${response.status}`);
        }

        const data = await response.json();
        const posts = data?.data?.children || [];
        const titles = posts.map(p => p.data.title);
        const keywords = extractKeywords(titles);

        const result = {
            success: true,
            subreddit,
            trending: keywords.slice(0, 5),
            fetchedAt: new Date().toISOString()
        };

        // Save to cache
        redditCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        return result;

    } catch (error) {
        console.warn('[Reddit] Fetch failed, using fallback:', error.message);

        // Return fallback - app never breaks
        return {
            success: false,
            subreddit: null,
            trending: getTopicFallback(topic || platform),
            fetchedAt: new Date().toISOString()
        };
    }
}

function extractKeywords(titles) {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
        'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'this', 'that', 'these', 'those',
        'i', 'my', 'me', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
        'them', 'how', 'what', 'why', 'when', 'where', 'who', 'which', 'new',
        'just', 'like', 'get', 'got', 'about', 'after', 'before', 'any',
        'all', 'some', 'can', 'now', 'not', 'no', 'so', 'up', 'out', 'if',
        'its', 'than', 'then', 'she', 'he', 'been', 'more', 'also', 'into',
        'very', 'here', 'there', 'only', 'same', 'too', 'want', 'make'
    ]);

    const wordFreq = {};

    titles.forEach(title => {
        title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w))
            .forEach(word => {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            });
    });

    return Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);
}

function getTopicFallback(topic) {
    const fallbacks = {
        fitness: ['workout', 'training', 'health', 'wellness', 'exercise'],
        food: ['recipe', 'cooking', 'homemade', 'delicious', 'foodie'],
        travel: ['wanderlust', 'adventure', 'explore', 'journey', 'vacation'],
        fashion: ['style', 'outfit', 'trendy', 'fashion', 'look'],
        beauty: ['skincare', 'makeup', 'glow', 'beauty', 'selfcare'],
        tech: ['innovation', 'digital', 'software', 'startup', 'ai'],
        wedding: ['bride', 'wedding', 'ceremony', 'marriage', 'celebration'],
        default: ['trending', 'viral', 'popular', 'discover', 'explore']
    };

    const topicLower = (topic || '').toLowerCase();
    for (const [key, words] of Object.entries(fallbacks)) {
        if (topicLower.includes(key)) return words;
    }
    return fallbacks.default;
}

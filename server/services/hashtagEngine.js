// Hashtag Engine – Platform-specific hashtag data for 9 platforms
// Provides realistic, rotating simulated data that refreshes every 15 minutes

const PLATFORMS = {
    youtube: {
        name: 'YouTube',
        icon: '▶️',
        categories: ['vlogs', 'gaming', 'music', 'tech', 'beauty', 'fitness', 'cooking', 'education', 'travel', 'comedy', 'news', 'science', 'shorts', 'asmr', 'reaction'],
        prefix: '',
        hashtagSets: [
            ['viral', 'trending', 'fyp', 'subscribe', 'like', 'shorts', 'youtubeshorts', 'vlog', 'challenge', 'tutorial',
                'howto', 'review', 'unboxing', 'gaming', 'minecraft', 'fortnite', 'music', 'coversong', 'makeup', 'skincare',
                'fitness', 'workout', 'recipe', 'cooking', 'travel', 'wanderlust', 'comedy', 'funny', 'prank', 'storytime',
                'asmr', 'satisfying', 'diy', 'lifehack', 'motivation', 'education', 'science', 'tech', 'iphone', 'android',
                'fashion', 'ootd', 'grwm', 'haul', 'transformation', 'beforeandafter', 'reaction', 'commentary', 'podcast', 'interview',
                'animaton', 'art', 'drawing', 'photography', 'film', 'movie', 'netflix', 'booktube', 'studywithme', 'productivity',
                'meditation', 'yoga', 'running', 'gym', 'bodybuilding', 'vegan', 'healthy', 'weightloss', 'mentalhealth', 'selfcare',
                'pets', 'dogs', 'cats', 'nature', 'wildlife', 'space', 'history', 'geography', 'language', 'coding',
                'webdev', 'ai', 'machinelearning', 'crypto', 'investing', 'realestate', 'business', 'entrepreneur', 'marketing', 'socialmedia',
                'news', 'politics', 'sports', 'football', 'basketball', 'soccer', 'f1', 'cars', 'luxury', 'lifestyle']
        ]
    },
    instagram: {
        name: 'Instagram',
        icon: '📷',
        categories: ['fashion', 'beauty', 'travel', 'food', 'fitness', 'lifestyle', 'photography', 'art', 'business', 'motivation', 'reels', 'aesthetic', 'love', 'nature', 'pets'],
        prefix: '',
        hashtagSets: [
            ['instagood', 'photooftheday', 'love', 'fashion', 'beautiful', 'happy', 'cute', 'tbt', 'like4like', 'followme',
                'picoftheday', 'selfie', 'summer', 'art', 'instadaily', 'friends', 'repost', 'nature', 'girl', 'fun',
                'style', 'smile', 'food', 'instalike', 'likeforlike', 'family', 'travel', 'fitness', 'igers', 'tagsforlikes',
                'nofilter', 'life', 'beauty', 'amazing', 'instagram', 'photography', 'photo', 'sunset', 'beach', 'dog',
                'ootd', 'instamood', 'cat', 'motivation', 'makeup', 'reels', 'reelsinstagram', 'viral', 'trending', 'explore',
                'explorepage', 'skincare', 'aesthetic', 'grwm', 'influencer', 'contentcreator', 'collaboration', 'brandambassador', 'sponsored', 'ad',
                'fashionblogger', 'streetstyle', 'luxury', 'designer', 'vintage', 'handmade', 'smallbusiness', 'shoplocal', 'etsy', 'entrepreneur',
                'foodporn', 'foodie', 'healthyfood', 'recipe', 'homemade', 'vegan', 'plantbased', 'brunch', 'coffee', 'dessert',
                'travelphotography', 'wanderlust', 'travelgram', 'instatravel', 'vacation', 'adventure', 'roadtrip', 'backpacking', 'solotravel', 'digitalnomad',
                'fitnessmotivation', 'gymlife', 'yoga', 'running', 'crossfit', 'bodybuilding', 'workout', 'healthylifestyle', 'wellness', 'mindfulness']
        ]
    },
    facebook: {
        name: 'Facebook',
        icon: '📘',
        categories: ['community', 'family', 'news', 'business', 'entertainment', 'sports', 'technology', 'health', 'education', 'politics', 'local', 'events', 'marketplace', 'groups', 'reels'],
        prefix: '',
        hashtagSets: [
            ['love', 'instagood', 'happy', 'beautiful', 'photooftheday', 'fun', 'smile', 'friends', 'family', 'life',
                'motivation', 'inspiration', 'fitness', 'food', 'nature', 'travel', 'art', 'photography', 'fashion', 'music',
                'style', 'beauty', 'cute', 'health', 'wellness', 'mindfulness', 'selfcare', 'mentalhealth', 'positivity', 'grateful',
                'business', 'entrepreneur', 'marketing', 'success', 'leadership', 'innovation', 'startup', 'smallbusiness', 'branding', 'digitalmarketing',
                'news', 'breakingnews', 'worldnews', 'politics', 'election', 'climate', 'environment', 'sustainability', 'green', 'ecofriendly',
                'sports', 'football', 'soccer', 'basketball', 'cricket', 'tennis', 'f1', 'olympics', 'worldcup', 'nfl',
                'technology', 'ai', 'tech', 'coding', 'programming', 'datascience', 'cybersecurity', 'blockchain', 'metaverse', 'vr',
                'education', 'learning', 'students', 'teachers', 'university', 'school', 'onlinelearning', 'courses', 'study', 'knowledge',
                'entertainment', 'movies', 'netflix', 'gaming', 'music', 'concerts', 'festivals', 'comedy', 'memes', 'viral',
                'community', 'volunteer', 'charity', 'nonprofit', 'donate', 'socialgood', 'fundraiser', 'awareness', 'support', 'together']
        ]
    },
    tiktok: {
        name: 'TikTok',
        icon: '🎵',
        categories: ['dance', 'comedy', 'music', 'beauty', 'fashion', 'food', 'fitness', 'diy', 'education', 'pets', 'gaming', 'sports', 'travel', 'tech', 'asmr'],
        prefix: '',
        hashtagSets: [
            ['fyp', 'foryou', 'foryoupage', 'viral', 'trending', 'tiktok', 'xyzbca', 'fy', 'duet', 'trend',
                'dance', 'dancechallenge', 'choreography', 'dancer', 'moves', 'comedy', 'funny', 'humor', 'joke', 'skit',
                'music', 'song', 'singer', 'rap', 'hiphop', 'pop', 'edm', 'remix', 'soundcloud', 'newmusic',
                'beauty', 'makeup', 'skincare', 'grwm', 'haul', 'fashion', 'ootd', 'style', 'outfit', 'thrift',
                'food', 'recipe', 'cooking', 'foodtok', 'baking', 'asmr', 'satisfying', 'oddlysatisfying', 'slime', 'cleaning',
                'fitness', 'workout', 'gym', 'fittok', 'health', 'diy', 'lifehack', 'hack', 'tutorial', 'howto',
                'pets', 'dogsoftiktok', 'catsoftiktok', 'animals', 'puppy', 'gaming', 'gamer', 'fortnite', 'minecraft', 'roblox',
                'travel', 'adventure', 'wanderlust', 'explore', 'nature', 'education', 'learnontiktok', 'science', 'facts', 'history',
                'motivation', 'inspiration', 'quotes', 'mindset', 'success', 'entrepreneur', 'business', 'money', 'invest', 'crypto',
                'storytime', 'pov', 'relatable', 'couplegoals', 'love', 'relationship', 'family', 'mom', 'dad', 'baby']
        ]
    },
    threads: {
        name: 'Threads',
        icon: '🧵',
        categories: ['conversations', 'opinions', 'tech', 'culture', 'news', 'lifestyle', 'business', 'creativity', 'community', 'trends', 'humor', 'motivation', 'social', 'media', 'ideas'],
        prefix: '',
        hashtagSets: [
            ['threads', 'threadsapp', 'meta', 'newplatform', 'socialmedia', 'conversation', 'opinion', 'hotake', 'discussion', 'debate',
                'trending', 'viral', 'explore', 'fyp', 'foryou', 'tech', 'ai', 'chatgpt', 'innovation', 'startup',
                'culture', 'popculture', 'celebrity', 'entertainment', 'movies', 'music', 'books', 'art', 'creativity', 'design',
                'news', 'breakingnews', 'worldnews', 'politics', 'election', 'economy', 'finance', 'stocks', 'crypto', 'bitcoin',
                'lifestyle', 'wellness', 'mentalhealth', 'selfcare', 'fitness', 'nutrition', 'meditation', 'yoga', 'mindfulness', 'growth',
                'business', 'entrepreneur', 'marketing', 'branding', 'leadership', 'productivity', 'remote', 'freelance', 'sideproject', 'buildinpublic',
                'humor', 'memes', 'funny', 'relatable', 'sarcasm', 'jokes', 'comedy', 'lol', 'mood', 'vibes',
                'motivation', 'inspiration', 'quotes', 'success', 'grind', 'hustle', 'discipline', 'focus', 'goals', 'dream',
                'community', 'support', 'connect', 'network', 'collaborate', 'share', 'learn', 'teach', 'grow', 'evolve',
                'creators', 'contentcreator', 'influencer', 'writingcommunity', 'storytelling', 'blogging', 'podcast', 'youtube', 'tiktok', 'instagram']
        ]
    },
    x: {
        name: 'X (Twitter)',
        icon: '✖️',
        categories: ['news', 'politics', 'tech', 'sports', 'entertainment', 'business', 'science', 'gaming', 'crypto', 'memes', 'culture', 'media', 'breaking', 'opinion', 'space'],
        prefix: '',
        hashtagSets: [
            ['breaking', 'breakingnews', 'news', 'worldnews', 'politics', 'election', 'democracy', 'justice', 'freedom', 'rights',
                'tech', 'ai', 'chatgpt', 'openai', 'google', 'apple', 'microsoft', 'tesla', 'spacex', 'elonmusk',
                'crypto', 'bitcoin', 'ethereum', 'web3', 'nft', 'blockchain', 'defi', 'altcoin', 'trading', 'hodl',
                'sports', 'nba', 'nfl', 'premierleague', 'ucl', 'worldcup', 'formula1', 'tennis', 'cricket', 'olympics',
                'entertainment', 'movies', 'oscars', 'grammys', 'netflix', 'disney', 'marvel', 'starwars', 'gaming', 'xbox',
                'playstation', 'nintendo', 'esports', 'twitch', 'streaming', 'music', 'hiphop', 'kpop', 'taylorswift', 'beyonce',
                'business', 'stocks', 'investing', 'wallstreet', 'economy', 'inflation', 'fed', 'market', 'startup', 'vc',
                'science', 'space', 'nasa', 'climate', 'health', 'covid', 'vaccine', 'research', 'biology', 'physics',
                'culture', 'books', 'art', 'photography', 'film', 'fashion', 'design', 'architecture', 'history', 'philosophy',
                'memes', 'viral', 'trending', 'thread', 'opinion', 'debate', 'discussion', 'community', 'followback', 'retweet']
        ]
    },
    pinterest: {
        name: 'Pinterest',
        icon: '📌',
        categories: ['home', 'diy', 'fashion', 'wedding', 'food', 'travel', 'beauty', 'art', 'garden', 'fitness', 'kids', 'photography', 'quotes', 'crafts', 'design'],
        prefix: '',
        hashtagSets: [
            ['aesthetic', 'inspiration', 'ideas', 'diy', 'homedecor', 'interiordesign', 'decoration', 'minimalist', 'modern', 'cozy',
                'fashion', 'outfit', 'style', 'ootd', 'streetstyle', 'vintage', 'boho', 'chic', 'elegant', 'casual',
                'wedding', 'weddingideas', 'bride', 'weddingdress', 'bridalshower', 'weddingdecor', 'engaged', 'proposal', 'weddinginspiration', 'weddingplanning',
                'food', 'recipe', 'baking', 'dessert', 'healthyrecipes', 'mealprep', 'dinner', 'brunch', 'smoothie', 'cake',
                'travel', 'wanderlust', 'bucketlist', 'adventure', 'vacation', 'beach', 'mountains', 'europe', 'asia', 'paradise',
                'beauty', 'makeup', 'skincare', 'nails', 'hair', 'hairstyle', 'haircolor', 'naturalbeauty', 'beautyproducts', 'lipstick',
                'art', 'drawing', 'painting', 'illustration', 'watercolor', 'sketch', 'digitalart', 'prints', 'wallart', 'gallery',
                'garden', 'plants', 'flowers', 'gardening', 'succulent', 'indoor', 'outdoor', 'landscape', 'backyard', 'patio',
                'fitness', 'workout', 'yoga', 'pilates', 'healthy', 'wellness', 'selfcare', 'meditation', 'morning', 'routine',
                'quotes', 'motivation', 'inspirational', 'positive', 'mindset', 'goals', 'affirmations', 'journaling', 'planner', 'organization']
        ]
    },
    linkedin: {
        name: 'LinkedIn',
        icon: '💼',
        categories: ['leadership', 'career', 'hiring', 'marketing', 'technology', 'entrepreneurship', 'management', 'innovation', 'networking', 'education', 'hr', 'sales', 'strategy', 'growth', 'skills'],
        prefix: '',
        hashtagSets: [
            ['leadership', 'management', 'ceo', 'cto', 'founder', 'executive', 'director', 'vp', 'boardofdirectors', 'csuite',
                'career', 'jobs', 'hiring', 'recruiting', 'jobsearch', 'resume', 'interview', 'careeradvice', 'promotion', 'salary',
                'marketing', 'digitalmarketing', 'contentmarketing', 'socialmedia', 'seo', 'branding', 'advertising', 'copywriting', 'analytics', 'growth',
                'technology', 'ai', 'machinelearning', 'datascience', 'cloud', 'cybersecurity', 'saas', 'fintech', 'healthtech', 'edtech',
                'entrepreneurship', 'startup', 'venture', 'funding', 'seed', 'seriesa', 'pitch', 'mvp', 'scaleup', 'bootstrapped',
                'innovation', 'disruption', 'transformation', 'digital', 'automation', 'robotics', 'iot', 'blockchain', 'quantum', 'future',
                'networking', 'connections', 'mentoring', 'coaching', 'community', 'events', 'conferences', 'webinar', 'summit', 'meetup',
                'education', 'learning', 'upskilling', 'reskilling', 'certification', 'courses', 'training', 'workshop', 'elearning', 'mooc',
                'hr', 'humanresources', 'talent', 'culture', 'diversity', 'inclusion', 'equity', 'belonging', 'wellbeing', 'engagement',
                'sales', 'b2b', 'b2c', 'revenue', 'pipeline', 'crm', 'negotiation', 'closing', 'prospecting', 'accountmanagement']
        ]
    },
    snapchat: {
        name: 'Snapchat',
        icon: '👻',
        categories: ['stories', 'filters', 'lenses', 'friends', 'memories', 'spotlight', 'discover', 'streaks', 'snaps', 'chat', 'ar', 'fun', 'daily', 'moments', 'bitmoji'],
        prefix: '',
        hashtagSets: [
            ['snapchat', 'snap', 'snaps', 'snapchatfilter', 'snapchatlens', 'snapchatstories', 'spotlight', 'snapstar', 'snapchatspotlight', 'snapchatdiscover',
                'filter', 'lens', 'ar', 'arfilter', 'augmentedreality', 'selfie', 'selfiefilter', 'facetime', 'bitmoji', 'avatar',
                'stories', 'mystory', 'dailystory', 'behindthescenes', 'dayinmylife', 'vlog', 'routine', 'morning', 'night', 'weekend',
                'friends', 'bestfriends', 'squad', 'friendgroup', 'hangout', 'party', 'celebration', 'birthday', 'memories', 'throwback',
                'streaks', 'snapstreak', 'longest', 'daily', 'everyday', 'consistent', 'dedication', 'goals', 'challenge', 'streak100',
                'fun', 'funny', 'comedy', 'memes', 'jokes', 'prank', 'dare', 'trend', 'viral', 'challenge',
                'fashion', 'ootd', 'style', 'grwm', 'outfit', 'beauty', 'makeup', 'skincare', 'hair', 'nails',
                'food', 'foodie', 'cooking', 'recipe', 'eating', 'restaurant', 'cafe', 'dessert', 'snack', 'drink',
                'travel', 'adventure', 'explore', 'roadtrip', 'vacation', 'beach', 'nature', 'sunset', 'skyline', 'city',
                'music', 'dance', 'singing', 'concert', 'festival', 'dj', 'playlist', 'vibes', 'mood', 'aesthetic']
        ]
    }
};

// Seed-based pseudo-random for consistent but rotating data
function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getRotationSeed() {
    // Changes every 15 minutes
    return Math.floor(Date.now() / (15 * 60 * 1000));
}

function shuffleWithSeed(arr, seed) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(seed + i) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function generateHashtagData(platform, seed) {
    const config = PLATFORMS[platform];
    if (!config) return [];

    const allTags = config.hashtagSets[0];
    const shuffled = shuffleWithSeed(allTags, seed + platform.charCodeAt(0));

    return shuffled.slice(0, 100).map((tag, index) => {
        const tagSeed = seed + index + tag.charCodeAt(0);
        const volume = Math.floor(seededRandom(tagSeed) * 10000000) + 100000;
        const competition = Math.round(seededRandom(tagSeed + 1) * 100);
        const velocityRaw = seededRandom(tagSeed + 2);
        const isHot = velocityRaw > 0.75;
        const velocity = isHot ? Math.floor(velocityRaw * 500) : Math.floor(velocityRaw * 100);

        // AI Score: 70% volume (normalized) + 30% low competition
        const volumeScore = Math.min(volume / 10000000, 1) * 70;
        const competitionScore = ((100 - competition) / 100) * 30;
        const aiScore = Math.round(volumeScore + competitionScore);

        const categoryIndex = Math.floor(seededRandom(tagSeed + 3) * config.categories.length);

        return {
            rank: index + 1,
            tag: `#${tag}`,
            rawTag: tag,
            volume,
            volumeFormatted: formatVolume(volume),
            competition,
            velocity,
            isHot,
            aiScore: Math.min(aiScore, 100),
            platform,
            platformName: config.name,
            platformIcon: config.icon,
            category: config.categories[categoryIndex],
            lastUpdated: new Date().toISOString()
        };
    });
}

function formatVolume(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Main exports
export function getTopHashtags(platform, limit = 100) {
    const seed = getRotationSeed();
    const data = generateHashtagData(platform, seed);
    return data.slice(0, limit);
}

export function searchHashtags(platform, query, limit = 100) {
    const seed = getRotationSeed();
    const data = generateHashtagData(platform, seed);
    if (!query) return data.slice(0, limit);

    const q = query.toLowerCase().replace('#', '');
    return data
        .filter(h => h.rawTag.includes(q) || h.category.includes(q))
        .slice(0, limit);
}

export function getAllPlatforms() {
    return Object.entries(PLATFORMS).map(([key, val]) => ({
        id: key,
        name: val.name,
        icon: val.icon,
        categories: val.categories
    }));
}

export function refreshAllPlatforms() {
    const seed = getRotationSeed();
    const result = {};
    for (const platform of Object.keys(PLATFORMS)) {
        result[platform] = generateHashtagData(platform, seed);
    }
    return result;
}

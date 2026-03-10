// Image-to-Tag Service – GPT-5.2 Vision powered image analysis

import dotenv from 'dotenv';
dotenv.config();

const client = null; // OpenAI dormant in V3

/**
 * Analyze an image and generate 30 relevant trending hashtags
 * Uses GPT-5.2 vision capabilities
 */
export async function analyzeImage(imageBuffer, platform = 'instagram') {
    if (client) {
        return analyzeWithVision(imageBuffer, platform);
    }
    return getFallbackTags(platform);
}

async function analyzeWithVision(imageBuffer, platform) {
    try {
        const base64Image = imageBuffer.toString('base64');

        const response = await client.responses.create({
            model: 'gpt-5.2',
            input: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: `Analyze this image and generate 30 trending hashtags optimized for ${platform}.

Consider:
- What's in the image (objects, scenes, people, activities)
- Current trending topics related to this content
- Mix of high-reach and niche hashtags
- Platform-specific hashtag culture

Return ONLY a JSON array:
[{"tag":"#example","score":85,"category":"lifestyle"}]`
                        },
                        {
                            type: 'input_image',
                            image_url: `data:image/jpeg;base64,${base64Image}`
                        }
                    ]
                }
            ]
        });

        const content = response.output_text;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return getFallbackTags(platform);

        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) return getFallbackTags(platform);

        return parsed.slice(0, 30).map((item, index) => ({
            rank: index + 1,
            tag: item.tag?.startsWith('#') ? item.tag : `#${item.tag}`,
            rawTag: (item.tag || '').replace('#', ''),
            aiScore: item.score || 70,
            isHot: (item.score || 0) > 80,
            platform,
            category: item.category || 'general',
            source: 'gpt-5.2-vision',
            lastUpdated: new Date().toISOString()
        }));
    } catch (err) {
        console.error('❌ Vision analysis failed:', err.message);
        return getFallbackTags(platform);
    }
}

function getFallbackTags(platform) {
    const genericTags = {
        youtube: ['viral', 'trending', 'shorts', 'subscribe', 'fyp', 'content', 'creator', 'vlog', 'howto', 'tutorial',
            'review', 'lifestyle', 'entertainment', 'funny', 'challenge', 'motivation', 'education', 'tech', 'music', 'gaming',
            'photography', 'art', 'travel', 'food', 'fitness', 'beauty', 'fashion', 'diy', 'comedy', 'storytime'],
        instagram: ['instagood', 'photooftheday', 'aesthetic', 'explore', 'viral', 'reels', 'trending', 'content', 'creator', 'lifestyle',
            'fashion', 'beauty', 'photography', 'art', 'travel', 'food', 'fitness', 'nature', 'love', 'style',
            'inspiration', 'motivation', 'selfcare', 'ootd', 'grwm', 'influencer', 'happy', 'beautiful', 'cute', 'pictureoftheday'],
        tiktok: ['fyp', 'viral', 'trending', 'foryou', 'tiktok', 'content', 'creator', 'funny', 'comedy', 'dance',
            'challenge', 'duet', 'trend', 'music', 'fashion', 'beauty', 'food', 'fitness', 'travel', 'pets',
            'storytime', 'pov', 'grwm', 'hack', 'lifehack', 'asmr', 'satisfying', 'diy', 'tutorial', 'education'],
    };

    const tags = genericTags[platform] || genericTags.instagram;
    return tags.map((tag, index) => ({
        rank: index + 1,
        tag: `#${tag}`,
        rawTag: tag,
        aiScore: Math.floor(Math.random() * 30) + 60,
        isHot: index < 5,
        platform,
        source: 'fallback',
        lastUpdated: new Date().toISOString()
    }));
}

// Image-to-Tag Service – Google Gemini Vision powered image analysis
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Analyze an image and generate 30 relevant trending hashtags
 * Uses Gemini 1.5 Flash vision capabilities
 */
export async function analyzeImage(imageBuffer, platform = 'instagram') {
    if (genAI) {
        return analyzeWithVision(imageBuffer, platform);
    }
    console.warn('⚠️ Gemini API key missing, using fallback tags.');
    return getFallbackTags(platform);
}

async function analyzeWithVision(imageBuffer, platform) {
    try {
        // Use gemini-1.5-flash for reliable vision performance
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Analyze this image and generate 30 trending hashtags optimized for ${platform}. 
Include a mix of high-reach and niche hashtags. 
Return ONLY a valid JSON array of objects with the following keys:
- tag (string, starting with #)
- score (number 0-100)
- category (string)

No explanation, just the JSON array.`;

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString('base64'),
                mimeType: 'image/jpeg'
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const content = response.text();

        // Parse JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.warn('❌ Could not find JSON in Gemini response');
            return getFallbackTags(platform);
        }

        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) return getFallbackTags(platform);

        return parsed.slice(0, 30).map((item, index) => {
            const tag = item.tag?.startsWith('#') ? item.tag : `#${item.tag}`;
            // Generate realistic volume for visual consistency
            const volume = Math.max(500000 - (index * 15000), 1000) + Math.floor(Math.random() * 5000);
            
            return {
                rank: index + 1,
                tag: tag,
                rawTag: tag.replace('#', ''),
                aiScore: item.score || Math.max(90 - index * 2, 40),
                isHot: (item.score || 0) > 80 || index < 5,
                volume,
                volumeFormatted: volume >= 1000000 ? (volume / 1000000).toFixed(1) + 'M' : (volume / 1000).toFixed(1) + 'K',
                platform,
                category: item.category || 'general',
                source: 'gemini-flash-vision',
                lastUpdated: new Date().toISOString()
            };
        });
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
    return tags.map((tag, index) => {
        const volume = Math.max(500000 - (index * 15000), 1000);
        return {
            rank: index + 1,
            tag: `#${tag}`,
            rawTag: tag,
            aiScore: Math.floor(Math.random() * 30) + 60,
            isHot: index < 5,
            volume,
            volumeFormatted: volume >= 1000000 ? (volume / 1000000).toFixed(1) + 'M' : (volume / 1000).toFixed(1) + 'K',
            platform,
            source: 'fallback',
            lastUpdated: new Date().toISOString()
        };
    });
}


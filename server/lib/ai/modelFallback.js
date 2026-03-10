import { generateWithModel } from './modelRouter.js';

const FALLBACK_CHAIN = {
    'qwen3.5-122b': ['deepseek-r1', 'gemini-flash', 'llama-3.3'],
    'deepseek-r1': ['qwen3.5-122b', 'gemini-flash', 'llama-3.3'],
    'gemini-flash': ['qwen3.5-122b', 'llama-3.3', 'deepseek-r1'],
    'llama-3.3': ['qwen3.5-122b', 'gemini-flash', 'deepseek-r1']
};

function hasValidHashtags(result, taskType) {
    if (!result || !result.hashtags) return false;

    // For Magic Search, enforce the presence of ARIA structured fields
    if (taskType === 'magic_search_strategy') {
        if (!Array.isArray(result.keywords) || result.keywords.length < 3) return false;
        if (!Array.isArray(result.titles) || result.titles.length < 2) return false;
        if (!Array.isArray(result.postingTimes) || result.postingTimes.length < 1) return false;
        if (!Array.isArray(result.descriptions) || result.descriptions.length < 1) return false;

        if (typeof result.hashtags !== 'object' || Array.isArray(result.hashtags)) return false;
        if (!Array.isArray(result.hashtags.highReach) || result.hashtags.highReach.length === 0) return false;

        return true;
    }

    // Flat array of hashtags for normal search
    if (Array.isArray(result.hashtags) && result.hashtags.length > 0) return true;

    // Fallback for structured format
    if (typeof result.hashtags === 'object' && !Array.isArray(result.hashtags)) {
        return !!(result.hashtags.highReach || result.hashtags.mediumNiche || result.hashtags.microNiche);
    }
    return false;
}

export async function generateWithFallback(primaryModel, platform, topic, taskType, trendContext) {
    const modelsToTry = [primaryModel, ...(FALLBACK_CHAIN[primaryModel] || [])];

    for (const model of modelsToTry) {
        try {
            const result = await generateWithModel(model, platform, topic, taskType, trendContext);
            if (hasValidHashtags(result, taskType)) {
                return result;
            }
        } catch (error) {
            console.warn(`Model ${model} failed, trying next. Error: ${error.message}`);
            continue;
        }
    }

    // Last resort throw
    throw new Error('All models failed - serve from backup cache');
}

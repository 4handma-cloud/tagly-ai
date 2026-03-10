import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

import { getSystemPrompt, buildUserPrompt } from './promptEngine.js';
import { guardedLLMCall } from './devGuard.js';
import { fetchYouTubeTrending, searchYouTubeHashtags, isYouTubeAvailable } from '../../services/youtubeFetcher.js';

let genAI, groq;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const COST_PER_1K_TOKENS = {
    'deepseek-r1': { input: 0.00055, output: 0.00219 },
    'gemini-flash': { input: 0, output: 0 },
    'qwen3.5-122b': { input: 0, output: 0 },
    'llama-3.3': { input: 0, output: 0 }
};

async function trackAPICost(modelKey, tokensUsed) {
    const rates = COST_PER_1K_TOKENS[modelKey] || { input: 0, output: 0 };
    const cost = (tokensUsed.input || 0) / 1000 * rates.input + (tokensUsed.output || 0) / 1000 * rates.output;
    if (cost > 0) {
        console.log(`💰 API Cost for ${modelKey}: $${cost.toFixed(5)}`);
        // Ideally store tracking data in FB here when integrated
    }
}

async function extractJSON(text) {
    try {
        let cleaned = text;
        const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) {
            cleaned = fenceMatch[1].trim();
        }
        try {
            return JSON.parse(cleaned);
        } catch { }

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('extractJSON: No JSON object found in response');
            return null;
        }
        return JSON.parse(jsonMatch[0]);
    } catch (err) {
        console.warn('extractJSON: Failed to parse:', err.message, '| First 200 chars:', text?.substring(0, 200));
        return null;
    }
}

async function executeGroq(modelKey, prompt, systemPrompt) {
    if (!groq) throw new Error('Groq client not initialized');
    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]
    });

    const text = response.choices[0].message.content;
    await trackAPICost(modelKey, { input: response.usage.prompt_tokens, output: response.usage.completion_tokens });
    return extractJSON(text);
}

async function executeGemini(modelKey, prompt, systemPrompt) {
    if (!genAI) throw new Error('Gemini client not initialized');
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt
    });

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    return extractJSON(text);
}

async function executeDeepSeek(modelKey, prompt, systemPrompt) {
    if (!process.env.DEEPSEEK_API_KEY) throw new Error('DeepSeek API Key missing');
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'deepseek-reasoner',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            max_tokens: 4000
        })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`DeepSeek Error: ${data.error?.message || response.statusText}`);

    if (data.usage) {
        await trackAPICost(modelKey, { input: data.usage.prompt_tokens, output: data.usage.completion_tokens });
    }
    return extractJSON(data.choices[0].message.content);
}

async function executeQwen(modelKey, prompt, systemPrompt) {
    if (!process.env.DASHSCOPE_API_KEY) throw new Error('DashScope API Key missing');
    const response = await fetch(`${process.env.QWEN_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: process.env.QWEN_TEXT_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            max_tokens: 4000
        })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Qwen Error: ${data.error?.message || data.message || response.statusText}`);

    return extractJSON(data.choices[0].message.content);
}

export async function generateWithModel(modelKey, platform, topic, taskType, trendContext) {
    if (platform === 'youtube' && taskType !== 'magic_search') {
        if (taskType === 'topic_search_30') return { hashtags: await searchYouTubeHashtags(topic, 30) };
        if (taskType === 'homepage_top100') return { hashtags: await fetchYouTubeTrending(100) };
    }

    const systemPrompt = getSystemPrompt(platform, taskType);
    const prompt = buildUserPrompt(platform, topic, trendContext, taskType);

    return await guardedLLMCall(modelKey, prompt, systemPrompt, async (mKey, p, s) => {
        let result = null;

        switch (mKey) {
            case 'llama-3.3':
                result = await executeGroq(mKey, p, s);
                break;
            case 'gemini-flash':
                result = await executeGemini(mKey, p, s);
                break;
            case 'deepseek-r1':
                result = await executeDeepSeek(mKey, p, s);
                break;
            case 'qwen3.5-122b':
            case 'qwen-2.5':
                result = await executeQwen(mKey, p, s);
                break;
            default:
                throw new Error(`Unknown model key: ${mKey}`);
        }

        if (!result) {
            throw new Error(`Failed to extract valid JSON from ${mKey}`);
        }

        const hasFlat = Array.isArray(result.hashtags) && result.hashtags.length > 0;
        const hasStructured = result.hashtags && typeof result.hashtags === 'object' && !Array.isArray(result.hashtags) && result.hashtags.highReach;

        if (!hasFlat && !hasStructured) {
            throw new Error(`No hashtags found in ${mKey} response`);
        }

        result.modelUsed = mKey;
        return result;
    });
}

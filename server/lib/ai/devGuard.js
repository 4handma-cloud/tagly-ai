import dotenv from 'dotenv';
dotenv.config();

export async function guardedLLMCall(modelKey, prompt, systemPrompt, actualLLMCall) {
    // Block all LLM calls if DEV_MOCK_MODE is true
    if (process.env.DEV_MOCK_MODE === 'true' || process.env.AI_ENABLED === 'false') {
        console.log(`[DEV GUARD] Blocked LLM call to ${modelKey}. Returning mock data.`);
        return getMockHashtags(modelKey);
    }

    return await actualLLMCall(modelKey, prompt, systemPrompt);
}

function getMockHashtags(modelKey) {
    return {
        hashtags: [
            '#mockhashtag1', '#mockhashtag2', '#mockhashtag3',
            '#devmode', '#testdata', '#taglyai'
        ],
        strategyTip: 'DEV MODE: This is mock data. Set DEV_MOCK_MODE=false to use real AI.',
        modelUsed: `MOCK_${modelKey}`
    };
}

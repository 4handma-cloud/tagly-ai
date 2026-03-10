import { generateWithModel } from './server/lib/ai/modelRouter.js';

async function testAll() {
    console.log("Testing Llama-3.3...");
    try {
        const r1 = await generateWithModel('llama-3.3', 'instagram', 'test', 'topic_search_30');
        console.log("Llama Success");
    } catch (e) {
        console.log("Llama Failed:", e.message);
    }

    console.log("\nTesting Gemini-Flash...");
    try {
        const r2 = await generateWithModel('gemini-flash', 'instagram', 'test', 'topic_search_30');
        console.log("Gemini Success");
    } catch (e) {
        console.log("Gemini Failed:", e.message);
    }

    console.log("\nTesting Qwen...");
    try {
        const r3 = await generateWithModel('qwen3.5-122b', 'instagram', 'test', 'topic_search_30');
        console.log("Qwen Success");
    } catch (e) {
        console.log("Qwen Failed:", e.message);
    }

    console.log("\nTesting DeepSeek-R1...");
    try {
        const r4 = await generateWithModel('deepseek-r1', 'instagram', 'test', 'topic_search_30');
        console.log("DeepSeek Success");
    } catch (e) {
        console.log("DeepSeek Failed:", e.message);
    }

    console.log("\nAll tests complete!");
    process.exit(0);
}

testAll();

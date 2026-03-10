import { fetchYouTubeTrending } from './server/services/youtubeFetcher.js';

console.log("Testing YouTube API Key...");
try {
    const hashtags = await fetchYouTubeTrending(10);
    if (hashtags && hashtags.length > 0) {
        console.log("✅ YouTube Success! Found", hashtags.length, "hashtags.");
        console.log("Sample:", hashtags.slice(0, 5));
    } else {
        console.log("❌ YouTube returned no hashtags (could be quota or key issues).");
    }
} catch (e) {
    console.error("❌ YouTube Test Failed:", e.message);
}

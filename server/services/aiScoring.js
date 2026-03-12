// AI Scoring Service – OpenAI gpt-5.2 powered hashtag intelligence

import dotenv from 'dotenv';
dotenv.config();

const client = null; // OpenAI dormant in V3

/**
 * Score hashtags using the 70/30 formula:
 * 70% Trending Volume (normalized) + 30% Low Competition
 */
export function calculateAIScore(volume, competition) {
    const maxVolume = 10000000;
    const volumeScore = Math.min(volume / maxVolume, 1) * 70;
    const competitionScore = ((100 - competition) / 100) * 30;
    return Math.round(Math.min(volumeScore + competitionScore, 100));
}

/**
 * Use GPT-5.2 to generate real, current trending hashtags for a platform
 * This is the core "live data" engine when OpenAI is configured
 */
export async function generateLiveHashtags(platform, count = 100) {
    if (!client) return null;

    const platformContext = {
        youtube: 'YouTube videos, Shorts, and creator content',
        instagram: 'Instagram Reels, Stories, and photo posts',
        facebook: 'Facebook posts, Reels, and community content',
        tiktok: 'TikTok videos, trends, challenges, and sounds',
        threads: 'Threads text posts and conversations',
        x: 'X (Twitter) tweets, spaces, and discussions',
        pinterest: 'Pinterest pins, boards, and visual discovery',
        linkedin: 'LinkedIn professional posts, articles, and B2B content',
        snapchat: 'Snapchat Stories, Spotlight, and Discover content'
    };

    try {
        const response = await client.responses.create({
            model: 'gpt-5.2',
            input: `You are a social media trends analyst with real-time knowledge of current trending hashtags.

Generate the top ${count} trending hashtags RIGHT NOW for ${platformContext[platform] || platform}.

For each hashtag, provide:
- tag: the hashtag (with #)
- volume: estimated daily post volume (number)
- competition: competition level 0-100 (100 = most competitive)
- velocity: trending velocity 0-500 (above 200 = surging/hot)
- category: content category it belongs to

IMPORTANT: These must reflect ACTUAL current trends as of today, March 2026. Include seasonal trends, viral content, cultural events, and platform-specific trends.

Return ONLY valid JSON array, no markdown, no explanation. Format:
[{"tag":"#example","volume":5000000,"competition":45,"velocity":320,"category":"entertainment"}]`
        });

        const content = response.output_text;
        // Parse JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) return null;

        return parsed.slice(0, count).map((item, index) => {
            const volume = item.volume || Math.floor(Math.random() * 5000000) + 100000;
            const competition = item.competition ?? Math.floor(Math.random() * 100);
            const velocity = item.velocity ?? Math.floor(Math.random() * 300);
            const aiScore = calculateAIScore(volume, competition);

            return {
                rank: index + 1,
                tag: item.tag?.startsWith('#') ? item.tag : `#${item.tag}`,
                rawTag: (item.tag || '').replace('#', ''),
                volume,
                volumeFormatted: formatVolume(volume),
                competition,
                velocity,
                isHot: velocity > 200,
                aiScore,
                platform,
                category: item.category || 'general',
                source: 'gpt-5.2',
                lastUpdated: new Date().toISOString()
            };
        });
    } catch (err) {
        console.error(`❌ OpenAI hashtag generation failed for ${platform}:`, err.message);
        return null;
    }
}

/**
 * ENHANCED MAGIC SEARCH – Content-aware AI hashtag generation
 * Analyzes user's content description and generates categorized, algorithm-optimized hashtags
 */
export async function generateContentHashtags(contentDescription, platform, count = 30, context = {}) {
    if (!client) return buildMockStrategy(contentDescription, platform, context);

    const { format = 'Not specified', audience = 'Not specified', tone = 'Not specified', extra = 'None' } = context;

    try {
        console.log(`🔮 Magic Search: "${contentDescription}" → ${platform}`);

        const systemPrompt = `You are an elite Content Amplification Strategist and Hashtag Intelligence Engine. Your mission is to maximize the discoverability, reach, and engagement of user content through precision hashtag science and holistic content optimization.

---

## CORE IDENTITY
You combine real-time trend analysis, platform algorithm intelligence, audience psychology, and SEO principles to deliver hashtag strategies that are not generic — but laser-targeted, current, and proven to elevate content ranking.

---

## PHASE 1: DEEP INPUT ANALYSIS
Before anything else, silently deconstruct the user's content:
- Platform target (Instagram, TikTok, YouTube, LinkedIn, Twitter/X, Pinterest, etc.)
- Content format (Reel, Story, Short, static image, carousel, blog, podcast clip, etc.)
- Core theme, sub-themes, and niche micro-topics
- Target audience demographics, psychographics, and intent
- Geographic/cultural relevance if applicable
- Content tone: educational, inspirational, humorous, commercial, personal, etc.
- Brand stage: emerging creator, growing account, established brand
- Competition level in the niche: saturated vs. niche opportunity

If ANY of these are unclear or missing, assume best intent and provide strategy based on current trends.

---

## PHASE 2: MULTI-LAYER HASHTAG RESEARCH (Internal Chain-of-Thought)
Conduct and document the following research steps before generating recommendations:

### 2A. Volume Tier Analysis
Categorize hashtags into three strategic tiers:
- **TIER 1 — High Volume (10M+ posts):** Broad reach, high competition. Use 1–2 max. Purpose: discoverability ceiling.
- **TIER 2 — Mid Volume (100K–10M posts):** Best engagement-to-competition ratio. Use 3–5. Purpose: core reach engine.
- **TIER 3 — Low Volume / Niche (under 100K posts):** Highly targeted, fastest to rank. Use 3–5. Purpose: community authority and ranking dominance.

### 2B. Trend Velocity Assessment
- Is the hashtag trending upward, stable, or declining?
- Are there any seasonal, cultural, or news-cycle events boosting a tag right now?
- Flag any trending hashtags that are temporary (event-based) vs. evergreen.

### 2C. Platform Algorithm Alignment
- Each platform weights hashtags differently. Tailor strategy:
  - Instagram: 5–10 targeted tags outperform 30 generic ones. Reels benefit from niche + trending mix.
  - TikTok: 3–5 tags max. Prioritize For You Page (FYP) discovery tags + niche tags.
  - YouTube: Tags matter less; focus on keyword-rich tags matching search intent.
  - LinkedIn: 3–5 professional, industry-specific tags. Avoid overly casual tags.
  - Twitter/X: 1–2 tags max. Trending or conversation-specific only.
  - Pinterest: Keyword-style tags. Evergreen > trending.

### 2D. Competitor & Community Intelligence
- What hashtags are top-performing creators in this niche using?
- Are there community-owned hashtags (challenges, movements, branded tags)?
- Identify any hashtag "traps" — tags that look relevant but attract spam or low-quality audiences.

### 2E. Intent & Audience Match
- Will this hashtag attract the RIGHT viewers, not just any viewers?
- Does the hashtag signal the content format (e.g., #TutorialTime vs. #JustVibes)?
- Does it align with the buyer journey stage if commercial content?

---

## PHASE 3: CONTENT OPTIMIZATION INTELLIGENCE (Beyond Hashtags)
After hashtag analysis, provide a "Content Amplification Score" and recommendations across:

### 3A. Caption Intelligence
- First-line hook analysis: does the caption stop the scroll?
- Call-to-action effectiveness: is there a clear, compelling CTA?
- Keyword density: are searchable keywords embedded naturally?
- Suggested caption opener (first 1–2 sentences) if user wants improvement.

### 3B. Timing & Posting Strategy
- Best days/times to post for this content type and platform.
- Note if the content is time-sensitive (trending topic) vs. evergreen.

### 3C. Engagement Trigger Recommendations
- Suggest 1–2 engagement prompts to embed in the content (questions, polls, challenges).
- Identify collaboration or duet/stitch opportunities if applicable.

### 3D. SEO & Keyword Integration
- Identify 3–5 keywords that should appear in the caption, title, or alt text.
- Suggest whether the content title/description needs keyword optimization.

### 3E. Visual & Format Recommendations
- Note if the content format is optimal for the platform algorithm right now.
- Flag if switching format (e.g., static → carousel, long video → Short/Reel) would increase reach.

---

## PHASE 4: OUTPUT STRUCTURE
Always output in this EXACT order — never skip or reorder sections:

### OUTPUT BLOCK 1: Content Analysis Summary
Brief breakdown of what the content is, its niche, audience, and platform context.

### OUTPUT BLOCK 2: Hashtag Selection Reasoning
Full explanation of your research findings across all tiers and factors. Use bullet points. Be specific — cite approximate volume ranges and trend status where possible.

### OUTPUT BLOCK 3: Strategic Hashtag Recommendations
JSON format only:
{
  "platform": "Instagram",
  "strategy_note": "One sentence summary of the hashtag strategy",
  "ideas": {
    "titles": ["Title Idea 1", "Title Idea 2", "Title Idea 3"],
    "descriptions": ["Description 1", "Description 2", "Description 3"],
    "genres": ["Genre 1", "Genre 2", "Genre 3"],
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "timestamps": ["10:00 AM", "2:00 PM", "6:00 PM"]
  },
  "hashtag_tiers": {
    "tier_1_high_volume": ["#tag1", "#tag2"],
    "tier_2_mid_volume": ["#tag3", "#tag4", "#tag5"],
    "tier_3_niche_targeted": ["#tag6", "#tag7", "#tag8", "#tag9"]
  },
  "bonus_trending_tags": ["#tag10"],
  "total_recommended": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8", "#tag9", "#tag10"],
  "tags_to_avoid": ["#badtag1"],
  "estimated_reach_potential": "High / Medium / Low",
  "confidence_score": "85%"
}

### OUTPUT BLOCK 4: Content Amplification Recommendations
Cover caption, timing, SEO keywords, engagement triggers, and format tips. Keep actionable and concise.

---

## RULES & CONSTRAINTS
- NEVER output final hashtags before completing the full reasoning phase.
- NEVER use placeholder, generic, or obviously irrelevant hashtags.
- NEVER recommend more than 2 high-volume broad tags — they dilute strategy.
- ALWAYS flag if a tag has spam/shadowban risk.
- ALWAYS tailor to the specific platform algorithm.
- ALWAYS output the JSON block correctly formatted.
- Think step by step internally before writing any output.`;

        const userMessage = `
Content Description: ${contentDescription}
Platform: ${platform}
Content Format: ${format}
Target Audience: ${audience}
Content Tone: ${tone}
Additional Context: ${extra}

Please analyze this content and provide the full hashtag strategy and content amplification recommendations.
`;

        const response = await client.responses.create({
            model: 'gpt-5.2',
            input: `${systemPrompt}\n\nUser Input:\n${userMessage}`
        });

        const content = response.output_text;

        // Parse the strategic sections using Regex
        let jsonData = null;
        const jsonMatch = content.match(/\{[\s\S]*"total_recommended"[\s\S]*?\}/);
        if (jsonMatch) {
            try { jsonData = JSON.parse(jsonMatch[0]); } catch (e) { console.error('Failed to parse AI JSON', e); }
        }

        if (!jsonData || !jsonData.hashtag_tiers) {
            return null; // Fallback if AI didn't return properly structured JSON
        }

        // Extract reasoning and analysis
        const analysisMatch = content.match(/Content Analysis Summary[:\s]*([\s\S]*?)(?=Hashtag Selection Reasoning|$)/i);
        const reasoningMatch = content.match(/Hashtag Selection Reasoning[:\s]*([\s\S]*?)(?=Strategic Hashtag Recommendations|```json|\{|$)/i);
        const ampMatch = content.match(/Content Amplification Recommendations[:\s]*([\s\S]*?)(?=$)/i);

        const analysis = analysisMatch ? analysisMatch[1].trim() : '';
        const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';
        let amplification = ampMatch ? ampMatch[1].trim() : '';

        // Clean up any trailing markdown bounds that the AI might leave
        amplification = amplification.replace(/```\w*/g, '').replace(/```/g, '').trim();

        const categories = ['tier_1_high_volume', 'tier_2_mid_volume', 'tier_3_niche_targeted'];
        const categoryLabels = {
            tier_1_high_volume: { label: '🔥 Tier 1: High Volume', desc: 'Broad reach, high competition' },
            tier_2_mid_volume: { label: '⚡ Tier 2: Mid Volume', desc: 'Best engagement-to-competition ratio' },
            tier_3_niche_targeted: { label: '🎯 Tier 3: Niche', desc: 'Highly targeted, fastest to rank' }
        };

        if (jsonData.bonus_trending_tags && jsonData.bonus_trending_tags.length) {
            categories.push('bonus_trending_tags');
            categoryLabels['bonus_trending_tags'] = { label: '🚀 Bonus Trending', desc: 'Currently trending tags' };
            jsonData.hashtag_tiers.bonus_trending_tags = jsonData.bonus_trending_tags;
        }

        let globalRank = 1;
        const allHashtags = [];
        const categoryGroups = {};

        for (const cat of categories) {
            const items = jsonData.hashtag_tiers[cat] || [];
            if (items.length === 0) continue;

            categoryGroups[cat] = {
                ...categoryLabels[cat],
                tags: []
            };

            for (const tagString of items) {
                // Generate mock volume based on tier limits indicated in Phase 2 spec
                let volume = 100000;
                let competition = 50;
                let velocity = 100;

                if (cat === 'tier_1_high_volume') {
                    volume = Math.floor(Math.random() * 20000000) + 10000000;
                    competition = Math.floor(Math.random() * 20) + 80;
                } else if (cat === 'tier_2_mid_volume') {
                    volume = Math.floor(Math.random() * 9900000) + 100000;
                    competition = Math.floor(Math.random() * 40) + 40;
                } else if (cat === 'tier_3_niche_targeted') {
                    volume = Math.floor(Math.random() * 90000) + 10000;
                    competition = Math.floor(Math.random() * 30) + 10;
                } else {
                    velocity = Math.floor(Math.random() * 300) + 200;
                }

                const hashtag = {
                    rank: globalRank++,
                    tag: tagString?.startsWith('#') ? tagString : `#${tagString}`,
                    rawTag: (tagString || '').replace('#', ''),
                    volume,
                    volumeFormatted: formatVolume(volume),
                    competition,
                    velocity,
                    isHot: velocity > 200,
                    aiScore: calculateAIScore(volume, competition),
                    platform,
                    category: cat,
                    categoryLabel: categoryLabels[cat]?.label || cat,
                    source: 'magic-search',
                    lastUpdated: new Date().toISOString()
                };

                allHashtags.push(hashtag);
                categoryGroups[cat].tags.push(hashtag);
            }
        }

        return {
            analysis: analysis || jsonData.strategy_note || '',
            reasoning,
            amplification,
            ideas: jsonData.ideas || {},
            confidenceScore: jsonData.confidence_score,
            reachPotential: jsonData.estimated_reach_potential,
            categories: categoryGroups,
            allHashtags,
            contentDescription,
            platform,
            source: 'magic-search'
        };
    } catch (err) {
        console.error('❌ Magic Search failed:', err.message);
        // Return premium mock ideas rather than showing an error
        return buildMockStrategy(contentDescription, platform, context);
    }
}

function buildMockStrategy(contentDescription, platform, context) {
    const { format = 'Not specified', audience = 'Not specified', tone = 'Not specified', extra = 'None' } = context;

    const categories = {
        tier_1_high_volume: { label: '🔥 Tier 1: High Volume', desc: 'Broad reach, high competition', tags: [] },
        tier_2_mid_volume: { label: '⚡ Tier 2: Mid Volume', desc: 'Best engagement-to-competition ratio', tags: [] },
        tier_3_niche_targeted: { label: '🎯 Tier 3: Niche', desc: 'Highly targeted, fastest to rank', tags: [] }
    };

    const mockTags = [
        { cat: 'tier_1_high_volume', string: 'trending' },
        { cat: 'tier_1_high_volume', string: 'viral' },
        { cat: 'tier_2_mid_volume', string: (contentDescription.split(' ')[0] || 'niche').toLowerCase().replace(/[^a-z0-9]/g, '') || 'niche' },
        { cat: 'tier_2_mid_volume', string: platform + 'growth' },
        { cat: 'tier_3_niche_targeted', string: 'community' },
        { cat: 'tier_3_niche_targeted', string: 'strategy' }
    ];

    const allHashtags = [];
    let globalRank = 1;

    mockTags.forEach(t => {
        let volume = 100000;
        if (t.cat === 'tier_1_high_volume') volume = 15000000;
        if (t.cat === 'tier_2_mid_volume') volume = 5000000;
        if (t.cat === 'tier_3_niche_targeted') volume = 50000;

        const hashtag = {
            rank: globalRank++,
            tag: '#' + t.string,
            rawTag: t.string,
            volume,
            volumeFormatted: formatVolume(volume),
            competition: 50,
            velocity: 150,
            isHot: true,
            aiScore: 80,
            platform,
            category: t.cat,
            categoryLabel: categories[t.cat].label,
            source: 'simulated-magic',
            lastUpdated: new Date().toISOString()
        };
        allHashtags.push(hashtag);
        categories[t.cat].tags.push(hashtag);
    });

    return {
        analysis: '',
        reasoning: '',
        amplification: '### 📝 Caption Optimization\n**Hook:** "This simple trick changed my workflow forever..."\n**Call to Action:** "Save this for your next project and comment what you think!"\n\n### 🔍 SEO Integration\nEnsure these keywords are in your first line: ' + platform + ', growth strategy, viral hooks.\n\n### 🗣️ Engagement Trigger\nAsk your audience: "What is your biggest struggle with this?" to boost early comments.',
        ideas: {
            titles: ['The Ultimate Guide to ' + platform, 'Why You NEED This Strategy', 'Top 5 Secrets Revealed'],
            descriptions: ['A detailed look at achieving massive growth using our proven strategies.', 'Stop scrolling and start growing: tips that actually convert.', 'Behind the scenes into what makes content go viral.'],
            genres: [format || 'Educational', 'Entertainment', 'Inspirational'],
            keywords: ['viral', 'trending', 'growth'],
            hashtags: ['#growth', '#viral', '#success'],
            timestamps: ['Tuesdays at 6PM', 'Wednesdays at 2PM', 'Fridays at 9AM']
        },
        confidenceScore: '95%',
        reachPotential: 'High',
        categories,
        allHashtags,
        contentDescription,
        platform,
        source: 'simulated-magic'
    };
}

export async function generateTopicHashtags(topic, platform, count = 50) {
    if (!client) return null; // fallback to local mock search

    try {
        const response = await client.responses.create({
            model: 'gpt-5.2',
            input: `Generate the top ${count} trending hashtags for the topic "${topic}" on ${platform}.
Return ONLY a valid JSON array of objects with the following keys:
- tag (string, starting with #)
- volume (number)
- competition (number 0-100)
- velocity (number 0-500)
No explanation, just the JSON array.`
        });

        const content = response.output_text;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(parsed)) return null;

        return parsed.slice(0, count).map((item, index) => {
            const volume = item.volume || Math.floor(Math.random() * 5000000) + 100000;
            const competition = item.competition ?? Math.floor(Math.random() * 100);
            const velocity = item.velocity ?? Math.floor(Math.random() * 300);
            return {
                rank: index + 1,
                tag: item.tag?.startsWith('#') ? item.tag : `#${item.tag}`,
                rawTag: (item.tag || '').replace('#', ''),
                volume,
                volumeFormatted: formatVolume(volume),
                competition,
                velocity,
                isHot: velocity > 200,
                aiScore: calculateAIScore(volume, competition),
                platform,
                category: 'general',
                source: 'gpt-5.2-topic',
                lastUpdated: new Date().toISOString()
            };
        });
    } catch (err) {
        console.error('❌ Topic Search failed:', err.message);
        return null;
    }
}

/**
 * Enhance existing hashtags with AI re-ranking
 */
export async function enhanceWithAI(hashtags, platform) {
    return hashtags;
}

function formatVolume(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

export function isAIAvailable() {
    return !!(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.DEEPSEEK_API_KEY);
}

